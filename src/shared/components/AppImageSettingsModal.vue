<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <div
      ref="wrap"
      class="canvas-wrap"
      @pointerdown="startPan"
      @wheel.prevent="onWheel"
      @pointermove="onPointerMove"
      @pointerup="endPan"
      @pointercancel="endPan"
      @pointerleave="endPan"
    >
      <canvas ref="canvas"></canvas>
    </div>
    <div class="actions">
      <app-button severity="secondary" raised :icon="['fas', 'undo']" @click="reset"></app-button>
      <app-button severity="secondary" raised :icon="['fas', 'plus']" @click="zoomIn"></app-button>
      <app-button
        severity="secondary"
        raised
        :icon="['fas', 'minus']"
        @click="zoomOut"
      ></app-button>
      <app-button
        severity="secondary"
        raised
        :icon="['fas', 'share']"
        @click="exportImage"
      ></app-button>

      <app-file-uploader
        :is-show-sign="false"
        :is-title="false"
        @select="onFileSelected"
      ></app-file-uploader>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';

export default defineComponent({
  components: { AppButton, AppModalHeader, AppFileUploader },
  props: {
    imageUrl: {
      type: String,
      required: false,
      default: '',
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const MARGIN = 12;
    let size = 360;
    const originalUrlRef = ref<string>(props.imageUrl);
    const originalFileRef = ref<File | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const canvas = ref<HTMLCanvasElement | null>(null);
    const wrap = ref<HTMLElement | null>(null);
    const ctxRef = ref<CanvasRenderingContext2D | null>(null);
    let clientW = 0;
    let clientH = 0;
    const dprCap = 2;
    const ZOOM_STEP = 1.15;
    // cached canvas center client coords
    let canvasCenterClient = { x: 0, y: 0 };
    const image = ref<string>(props.imageUrl);
    const imgObj = ref<HTMLImageElement | null>(null);
    const exportedImageUrl = ref<string | null>(null); // <- сюда сохраняется результат (dataURL)
    const state = reactive<any>({
      scale: 1,
      minScale: 0.5,
      maxScale: 4,
      x: 0,
      y: 0,
      dragging: false,
      lastPointer: null,
      pointers: new Map<number, any>(),
      naturalW: 0,
      naturalH: 0,
      _pinchStartDist: null as number | null,
      _pinchStartScale: null as number | null,
    });
    const updateCanvasSize = () => {
      if (!canvas.value) return;
      const rect = canvas.value.getBoundingClientRect();
      clientW = rect.width;
      clientH = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      // установка пиксельного backing с учётом DPR
      canvas.value.width = Math.round(clientW * dpr);
      canvas.value.height = Math.round(clientH * dpr);
      canvas.value.style.width = `${clientW}px`;
      canvas.value.style.height = `${clientH}px`;
      const ctx = canvas.value.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // сбрасываем и масштабируем
      ctxRef.value = ctx;
    };
    // общий загрузчик: принимает либо File, либо URL
    const loadImage = async (src: string) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load error'));
        img.src = src;
      });
      imgObj.value = img;
      state.naturalW = img.naturalWidth;
      state.naturalH = img.naturalHeight;
      fitImage();
      draw();
    };

    // метод для uploader
    const onFileSelected = async (file: File) => {
      if (!file) return;
      originalFileRef.value = file; // сохраняем исходный файл
      const url = URL.createObjectURL(file);
      originalUrlRef.value = url;
      await loadImage(url);
      URL.revokeObjectURL(url);
    };

    const fitImage = () => {
      if (!imgObj.value) return;
      const img = imgObj.value;
      const area = size;
      const scaleX = area / img.naturalWidth;
      const scaleY = area / img.naturalHeight;
      state.scale = Math.max(scaleX, scaleY);
      state.minScale = state.scale;
      state.maxScale = state.scale * 4;
      state.x = 0;
      state.y = 0;
      constrainPosition();
    };

    const draw = () => {
      const ctx = ctxRef.value;
      if (!ctx || !canvas.value) return;
      ctx.clearRect(0, 0, clientW, clientH);

      const cx = clientW / 2;
      const cy = clientH / 2;
      const radius = Math.min(clientW, clientH) / 2 - MARGIN;

      if (!imgObj.value) {
        ctx.fillStyle = '#efefef';
        ctx.fillRect(0, 0, clientW, clientH);
        drawMaskOutline(ctx, radius, cx, cy);
        return;
      }

      // вычисляем drawW/drawH на основе natural sizes и текущего state.scale
      const img = imgObj.value;
      const drawW = img.naturalWidth * state.scale;
      const drawH = img.naturalHeight * state.scale;

      // state.x/state.y должны быть в «logical» координатах, соответствующих clientW/clientH
      const drawX = cx - drawW / 2 + state.x;
      const drawY = cy - drawH / 2 + state.y;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // затемнение вне круга с учётом margin
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.rect(0, 0, clientW, clientH);
      ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      // использования fill('evenodd') поддерживается; альтернативно — globalCompositeOperation
      try {
        // некоторые браузеры поддерживают fill('evenodd')
        // @ts-ignore
        ctx.fill('evenodd');
      } catch {
        // fallback: вычитающая маска
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();

      drawMaskOutline(ctx, radius, cx, cy);
    };

    const drawMaskOutline = (
      ctx: CanvasRenderingContext2D,
      radius: number,
      cx: number,
      cy: number
    ) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,215,0,1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const startPan = (e: PointerEvent) => {
      wrap.value?.setPointerCapture(e.pointerId);
      state.pointers.set(e.pointerId, copyPointer(e));
      if (state.pointers.size === 1) {
        state.dragging = true;
        state.lastPointer = copyPointer(e);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!imgObj.value) return;

      if (state.pointers.has(e.pointerId)) state.pointers.set(e.pointerId, copyPointer(e));

      if (state.pointers.size === 2) {
        const pts: any = Array.from(state.pointers.values());
        const curDist = distance(pts[0], pts[1]);
        if (state._pinchStartDist == null) {
          state._pinchStartDist = curDist;
          state._pinchStartScale = state.scale;
        } else {
          const k = curDist / state._pinchStartDist;
          setScale(state._pinchStartScale! * k, {
            x: (pts[0].clientX + pts[1].clientX) / 2,
            y: (pts[0].clientY + pts[1].clientY) / 2,
          });
        }
      } else if (state.pointers.size === 1 && state.dragging && state.lastPointer) {
        const pt = state.pointers.values().next().value;
        const dx = pt.clientX - state.lastPointer.clientX;
        const dy = pt.clientY - state.lastPointer.clientY;
        panBy(dx, dy);
        state.lastPointer = copyPointer(pt);
      } else if (state.dragging && state.lastPointer) {
        const dx = e.clientX - state.lastPointer.clientX;
        const dy = e.clientY - state.lastPointer.clientY;
        panBy(dx, dy);
        state.lastPointer = copyPointer(e);
      }

      draw();
    };

    const endPan = (e: PointerEvent) => {
      wrap.value?.releasePointerCapture?.(e.pointerId);
      state.pointers.delete(e.pointerId);
      if (state.pointers.size < 2) {
        state._pinchStartDist = null;
        state._pinchStartScale = null;
      }
      if (state.pointers.size === 0) {
        state.dragging = false;
        state.lastPointer = null;
      }
      constrainPosition();
      draw();
    };

    const copyPointer = (e: PointerEvent) => {
      return { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
    };

    const distance = (a: any, b: any) => {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const panBy = (dx: number, dy: number) => {
      if (!canvas.value) return;
      const rect = canvas.value.getBoundingClientRect();
      const ratioX = size / rect.width;
      const ratioY = size / rect.height;
      state.x += dx * ratioX;
      state.y += dy * ratioY;
      constrainPosition();
    };

    const setScale = (newScale: number, focalPoint: { x: number; y: number } | null = null) => {
      const prev = state.scale;
      newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
      if (!focalPoint) {
        state.scale = newScale;
        constrainPosition();
        return;
      }

      const rect = canvas.value!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const fx = (focalPoint.x - cx) * (size / rect.width);
      const fy = (focalPoint.y - cy) * (size / rect.height);

      state.x = fx + (state.x - fx) * (newScale / prev);
      state.y = fy + (state.y - fy) * (newScale / prev);
      state.scale = newScale;
      constrainPosition();
    };

    const onWheel = (e: WheelEvent) => {
      if (!imgObj.value) return;
      const delta = -e.deltaY;
      const zoomFactor = Math.exp(delta * 0.0012);
      setScale(state.scale * zoomFactor, { x: e.clientX, y: e.clientY });
      draw();
    };

    const constrainPosition = () => {
      if (!imgObj.value) return;
      const img = imgObj.value;
      const drawW = img.naturalWidth * state.scale;
      const drawH = img.naturalHeight * state.scale;

      const radius = size / 2;
      const squareSide = radius * Math.SQRT2; // квадрат, вписанный в круг
      const half = squareSide / 2;

      const minX = -(drawW / 2 - half);
      const maxX = drawW / 2 - half;
      const minY = -(drawH / 2 - half);
      const maxY = drawH / 2 - half;

      if (minX > maxX) state.x = 0;
      else state.x = Math.max(minX, Math.min(maxX, state.x));
      if (minY > maxY) state.y = 0;
      else state.y = Math.max(minY, Math.min(maxY, state.y));
    };

    // export: сохраняет base64 dataURL в exportedImageUrl и возвращает Blob через Promise если нужно
    const exportImage = async () => {
      if (!imgObj.value || !canvas.value) return Promise.resolve(null);

      const out = document.createElement('canvas');
      out.width = size;
      out.height = size;
      const ctx = out.getContext('2d')!;

      const cx = size / 2;
      const cy = size / 2;

      const img = imgObj.value;
      const drawW = img.naturalWidth * state.scale;
      const drawH = img.naturalHeight * state.scale;
      const drawX = cx - drawW / 2 + state.x;
      const drawY = cy - drawH / 2 + state.y;

      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // apply circular mask: outside becomes transparent
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // set dataURL for immediate preview / storage
      exportedImageUrl.value = out.toDataURL('image/png');
      // also return blob for uploading
      const blob = await new Promise<Blob | null>((resolve) => {
        out.toBlob((b) => resolve(b), 'image/png');
      });
      if (!blob) return null;
      const file = new File([blob], 'avatar.png', { type: 'image/png', lastModified: Date.now() });
      emit('resolve', {
        file,
        originalFile: originalFileRef.value,
      });
    };

    const reset = async () => {
      if (originalFileRef.value) {
        const url = URL.createObjectURL(originalFileRef.value);
        await loadImage(url);
        URL.revokeObjectURL(url);
        return;
      }

      if (props.imageUrl) {
        await loadImage(props.imageUrl); // если картинка пришла через проп
      }
    };
    let ro: ResizeObserver | null = null;
    let rafId = 0;
    let dirty = false;

    const scheduleDraw = () => {
      if (dirty) return;
      dirty = true;
      rafId = requestAnimationFrame(() => {
        dirty = false;
        draw();
      });
    };

    onMounted(() => {
      updateCanvasSize();
      scheduleDraw();

      ro = new ResizeObserver(() => {
        updateCanvasSize();
        scheduleDraw();
      });
      if (canvas.value?.parentElement) ro.observe(canvas.value.parentElement);
      if (image.value) {
        loadImage(image.value);
      }

      window.addEventListener('orientationchange', () => {
        updateCanvasSize();
        scheduleDraw();
      });

      wrap.value?.addEventListener('pointerdown', (e: PointerEvent) => {
        wrap.value?.setPointerCapture?.(e.pointerId);
      });
    });

    onBeforeUnmount(() => {
      if (ro && canvas.value?.parentElement) ro.unobserve(canvas.value.parentElement);
      ro = null;
      cancelAnimationFrame(rafId);
      state.pointers.clear();
    });

    const zoomIn = () => {
      updateCanvasCenterClient();
      setScale(state.scale * ZOOM_STEP, { x: canvasCenterClient.x, y: canvasCenterClient.y });
      draw();
    };

    const zoomOut = () => {
      updateCanvasCenterClient();
      setScale(state.scale / ZOOM_STEP, { x: canvasCenterClient.x, y: canvasCenterClient.y });
      draw();
    };

    const updateCanvasCenterClient = () => {
      if (!canvas.value) return;
      const rect = canvas.value.getBoundingClientRect();
      canvasCenterClient = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const close = () => {
      emit('close');
    };
    return {
      fileInput,
      canvas,
      wrap,
      image,
      imgObj,
      onFileSelected,
      reset,
      exportImage,
      startPan,
      onPointerMove,
      endPan,
      onWheel,
      zoomIn,
      zoomOut,
      close,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 400px;
  height: 75vh;
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;

  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;
  padding-bottom: var(--kb, 0px); /* «подушка» под клавиатуру */
  @supports (-webkit-touch-callout: none) {
    /* iOS-специфика, помогает с высотой */
    height: -webkit-fill-available;
  }
  @media (max-width: 600px) {
    width: 100vw;
    flex-direction: column; /* вертикально */
    justify-content: flex-start;
    border-radius: 0;
    box-shadow: none;
    border: none;
    overflow: hidden;
    height: 100%;
  }

  & .canvas-wrap {
    touch-action: none;
    overflow: hidden;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 6;
    @media (max-width: 600px) {
      flex: 6;
      background: #efefef;
    }
  }

  & .actions {
    flex: 1;
    display: flex;
    gap: 12px;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* для Safari */
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(256, 256, 256, 0.2);
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    @media (max-width: 600px) {
      border-radius: 0;
    }
  }
}

.canvas-wrap canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
