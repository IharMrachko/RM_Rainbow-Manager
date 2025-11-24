<template>
  <div class="chroma-wrapper">
    <div class="photo-picker">
      <app-image-not-uploaded v-if="!imageUrl" @on-file-selected="onFileSelected">
      </app-image-not-uploaded>
      <div v-if="imageUrl" class="viewer-wrap">
        <div
          ref="imageFrame"
          class="image-frame"
          @pointermove.prevent="onPointerMove"
          @pointerdown.prevent="onPointerDown"
          @pointerup.prevent="onPointerUp"
          @pointerleave="onPointerLeave"
          @touchstart.prevent="onTouchStart"
          @touchmove.prevent="onTouchMove"
          @touchend.prevent="onTouchEnd"
          @pointerdown.capture.prevent="onImageClick"
        >
          <img ref="imgEl" :src="imageUrl" alt="uploaded" draggable="false" />
          <!-- crosshair -->
          <div
            v-if="showCursor"
            class="cursor"
            :style="{ left: cursorX + 'px', top: cursorY + 'px' }"
            aria-hidden="true"
          />
        </div>

        <div class="info-row">
          <section>
            <div class="swatch" :style="{ background: currentHex }"></div>
            <div class="values">
              <div><strong>RGB:</strong> {{ currentRgb.join(', ') }}</div>
              <div><strong>Luminance:</strong> {{ luminance }}</div>
              <div><strong>HEX:</strong> {{ currentHex }}</div>
            </div>
          </section>

          <div v-if="imageUrl" class="upload-btn">
            <app-file-uploader
              :is-show-sign="false"
              :is-title="false"
              @select="onFileSelected"
            ></app-file-uploader>
          </div>
        </div>
      </div>

      <!-- скрытый canvas для чтения пикселей -->
      <canvas ref="hiddenCanvas" class="hidden-canvas" aria-hidden="true"></canvas>
    </div>
    <app-color-picker :hex-p="selectedHex"></app-color-picker>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref } from 'vue';
import chroma from 'chroma-js';
import AppColorPicker from '@/shared/components/AppColorPicker.vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppImageNotUploaded from '@/shared/components/AppImageNotUploaded.vue';

export default defineComponent({
  components: { AppImageNotUploaded, AppColorPicker, AppFileUploader },
  setup() {
    const fileInput = ref<HTMLInputElement | null>(null);
    const imgEl = ref<HTMLImageElement | null>(null);
    const imageFrame = ref<HTMLElement | null>(null);
    const hiddenCanvas = ref<HTMLCanvasElement | null>(null);

    const imageUrl = ref<string | null>(null);
    const imgNaturalW = ref(0);
    const imgNaturalH = ref(0);

    // cursor / preview
    const showCursor = ref(false);
    const cursorX = ref(0);
    const cursorY = ref(0);

    // sampled color
    const currentRgb = ref<[number, number, number]>([0, 0, 0]);
    const currentHex = ref<string>('#D4F880');
    const selectedHex = ref<string>('#D4F880');
    const luminance = ref<number>(0);
    const pointerDown = ref(false);
    // опции
    // фиксированный CSS размер canvas (в пикселях CSS)
    const CANVAS_CSS_W = 400;
    const CANVAS_CSS_H = 500;

    const onFileSelected = (file: File) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      loadImage(url);
    };

    const loadImage = (url: string) => {
      if (imageUrl.value) {
        URL.revokeObjectURL(imageUrl.value);
      }
      imageUrl.value = url;
      nextTick(() => {
        if (!imgEl.value) return;
        imgEl.value.onload = () => {
          imgNaturalW.value = imgEl.value!.naturalWidth;
          imgNaturalH.value = imgEl.value!.naturalHeight;
          prepareHiddenCanvas();
        };
        if (imgEl.value.complete) {
          imgNaturalW.value = imgEl.value.naturalWidth;
          imgNaturalH.value = imgEl.value.naturalHeight;
          prepareHiddenCanvas();
        }
      });
    };

    // prepareHiddenCanvas: рисует изображение в canvas 400x500 (contain)
    const prepareHiddenCanvas = () => {
      const img = imgEl.value;
      const canvas = hiddenCanvas.value;
      if (!img || !canvas) return;

      // device pixel ratio
      const dpr = window.devicePixelRatio || 1;

      // canvas физические пиксели
      const canvasPxW = Math.round(CANVAS_CSS_W * dpr);
      const canvasPxH = Math.round(CANVAS_CSS_H * dpr);

      // устанавливаем размеры canvas
      canvas.width = canvasPxW;
      canvas.height = canvasPxH;
      // CSS размеры (чтобы canvas overlay совпадал с видимым размером, если нужно)
      canvas.style.width = `${CANVAS_CSS_W}px`;
      canvas.style.height = `${CANVAS_CSS_H}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // масштабируем контекст под DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // очищаем canvas в CSS-пикселях
      ctx.clearRect(0, 0, CANVAS_CSS_W, CANVAS_CSS_H);

      // вычисляем размеры для drawImage с режимом contain (в CSS-пикселях)
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      if (!natW || !natH) return;

      const ratioImg = natW / natH;
      const ratioCanvas = CANVAS_CSS_W / CANVAS_CSS_H;

      let drawW;
      let drawH;
      if (ratioImg > ratioCanvas) {
        // изображение шире относительно canvas -> подгоняем по ширине
        drawW = CANVAS_CSS_W;
        drawH = Math.round(CANVAS_CSS_W / ratioImg);
      } else {
        // изображение выше относительно canvas -> подгоняем по высоте
        drawH = CANVAS_CSS_H;
        drawW = Math.round(CANVAS_CSS_H * ratioImg);
      }

      // центрируем изображение в canvas (CSS-пиксели)
      const offsetX = Math.round((CANVAS_CSS_W - drawW) / 2);
      const offsetY = Math.round((CANVAS_CSS_H - drawH) / 2);
      if (imageFrame.value) {
        imageFrame.value.style.width = `${drawW}px`;
        imageFrame.value.style.height = `${drawH}px`;
      }
      // drawImage: используем CSS-пиксели, контекст уже масштабирован под DPR
      ctx.drawImage(img, 0, 0, natW, natH, offsetX, offsetY, drawW, drawH);

      // сохраняем метаданные для маппинга
      (canvas as any).__meta = {
        mode: 'contain',
        cssW: CANVAS_CSS_W,
        cssH: CANVAS_CSS_H,
        drawW,
        drawH,
        offsetX,
        offsetY,
        dpr,
        natW,
        natH,
      };
    };

    // map pointer client coords to image natural pixel coords
    const clientToImagePixel = (clientX: number, clientY: number) => {
      const frame = imageFrame.value;
      const img = imgEl.value;
      const canvas = hiddenCanvas.value;
      if (!frame || !img || !canvas) return null;

      const rect = img.getBoundingClientRect();
      // if image is letterboxed inside frame, we use rect
      const xInImg = clientX - rect.left;
      const yInImg = clientY - rect.top;

      // clamp
      const clampedX = Math.min(Math.max(0, xInImg), rect.width);
      const clampedY = Math.min(Math.max(0, yInImg), rect.height);

      // map to natural pixels
      const px = Math.round((clampedX / rect.width) * canvas.width);
      const py = Math.round((clampedY / rect.height) * canvas.height);
      return { px, py, clientX: clampedX + rect.left, clientY: clampedY + rect.top };
    };

    const sampleAtClient = (clientX: number, clientY: number) => {
      const map = clientToImagePixel(clientX, clientY);
      if (!map) return;
      const canvas = hiddenCanvas.value!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { px, py } = map;
      // guard
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return;
      const data = ctx.getImageData(px, py, 1, 1).data;
      const r = data[0],
        g = data[1],
        b = data[2];
      currentRgb.value = [r, g, b];
      currentHex.value = rgbToHex(r, g, b);
      try {
        luminance.value = Number(chroma(currentHex.value).luminance().toFixed(3));
      } catch {
        luminance.value = 0;
      }
      return map;
    };

    const rgbToHex = (r: number, g: number, b: number) => {
      return (
        '#' +
        [r, g, b]
          .map((v) => {
            const s = v.toString(16);
            return s.length === 1 ? '0' + s : s;
          })
          .join('')
      ).toUpperCase();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!imageUrl.value) return;
      const map = sampleAtClient(e.clientX, e.clientY);
      if (!map) return;
      // position cursor relative to frame
      const frameRect = imageFrame.value!.getBoundingClientRect();
      cursorX.value = map.clientX - frameRect.left;
      cursorY.value = map.clientY - frameRect.top;
      showCursor.value = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDown.value = true;
      onPointerMove(e);
    };

    const onPointerUp = () => {
      pointerDown.value = false;
    };

    const onPointerLeave = () => {
      showCursor.value = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onPointerDown({ clientX: t.clientX, clientY: t.clientY } as PointerEvent);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      onPointerMove({ clientX: t.clientX, clientY: t.clientY } as PointerEvent);
    };

    const onTouchEnd = () => {
      onPointerUp();
    };

    // вызывается при pointerdown по image-frame — сразу снимаем цвет и копируем
    const onImageClick = (e: PointerEvent) => {
      if (!imageUrl.value) return;
      const map = sampleAtClient(e.clientX, e.clientY);
      if (!map) return;
      // обновляем позицию курсора визуально
      const frameRect = imageFrame.value!.getBoundingClientRect();
      cursorX.value = map.clientX - frameRect.left;
      cursorY.value = map.clientY - frameRect.top;
      showCursor.value = true;
      copyHexImmediate();
    };

    const copyHexImmediate = async () => {
      const text = currentHex.value;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          selectedHex.value = text;
        } catch (err) {
          console.warn('clipboard.writeText failed:', err);
        }
      }
    };

    return {
      fileInput,
      imgEl,
      imageFrame,
      hiddenCanvas,
      imageUrl,
      currentRgb,
      currentHex,
      luminance,
      showCursor,
      cursorX,
      cursorY,
      onPointerMove,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onImageClick,
      selectedHex,
      onFileSelected,
    };
  },
});
</script>

<style scoped>
.chroma-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  background: var(--color-wrap-bg);
  height: calc(100dvh - var(--header-height));
  gap: 20px;
  overflow: auto;
}
.photo-picker {
  margin: 12px auto;
}

.viewer-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.image-frame {
  position: relative;
  overflow: hidden; /* прячет выходящие части изображения */
  border-radius: 10px;
  display: flex;
  align-items: center; /* центрирует изображение по вертикали */
  justify-content: center; /* центрирует по горизонтали */
  touch-action: none;
  user-select: none;
  cursor: none;
}
.image-frame img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain; /* сохраняет пропорции, не обрезает */
  display: block;
  pointer-events: none; /* чтобы pointer события шли на контейнер */
}

.cursor {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
  transform: translate(-50%, -50%);
  pointer-events: none;
  mix-blend-mode: normal;
  background: rgba(255, 255, 255, 0.02);
}

.info-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;

  & section {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}
.swatch {
  width: 120px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #111;
  cursor: pointer;
}

.values {
  font-size: 14px;
}

.hidden-canvas {
  display: none;
}

/* mobile tweaks */
@media (max-width: 600px) {
  .cursor {
    width: 22px;
    height: 22px;
  }
  .swatch {
    width: 96px;
    height: 64px;
  }
}
</style>
