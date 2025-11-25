<template>
  <div class="chroma-wrapper">
    <div class="photo-picker" :class="{ hiddenOverflow: isHiddenOverflow }">
      <app-image-not-uploaded v-if="!imgEl" @on-file-selected="onFileSelected">
      </app-image-not-uploaded>
      <div v-if="imgEl" class="viewer-wrap">
        <canvas ref="canvasEl"></canvas>
        <div class="info-row">
          <section>
            <div class="swatch" :style="{ background: currentHex }"></div>
            <div class="values">
              <div><strong>RGB:</strong> {{ currentRgb.join(', ') }}</div>
              <div><strong>HEX:</strong> {{ currentHex }}</div>
            </div>
          </section>
          <div class="actions">
            <app-button
              severity="secondary"
              raised
              :icon="['fas', 'undo']"
              @click="reset"
            ></app-button>
            <app-button
              severity="secondary"
              raised
              :icon="['fas', 'plus']"
              @click="zoomIn"
            ></app-button>
            <app-button
              severity="secondary"
              raised
              :icon="['fas', 'minus']"
              @click="zoomOut"
            ></app-button>

            <app-file-uploader
              :is-show-sign="false"
              :is-title="false"
              @select="onFileSelected"
            ></app-file-uploader>
          </div>
        </div>
      </div>
    </div>
    <app-color-picker :hex-p="selectedHex"></app-color-picker>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, ref } from 'vue';
import AppColorPicker from '@/shared/components/AppColorPicker.vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppImageNotUploaded from '@/shared/components/AppImageNotUploaded.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useStore } from 'vuex';

export default defineComponent({
  components: { AppButton, AppImageNotUploaded, AppColorPicker, AppFileUploader },
  setup() {
    const store = useStore();
    const imgEl = ref<HTMLImageElement | null>(null);
    const canvasEl = ref<HTMLCanvasElement | null>(null);
    const currentRgb = ref<[number, number, number]>([0, 0, 0]);
    const currentHex = ref<string>('#D4F880');
    const selectedHex = ref<string>('#D4F880');
    const scaleFactor = ref(1.4);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const CANVAS_W = isMobile.value ? 350 : 450;
    const CANVAS_H = isMobile.value ? 350 : 450;
    let cleanup: (() => void) | null = null;
    let isDrawing = false;
    const isHiddenOverflow = ref(false);

    const onFileSelected = (file: File) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      loadImage(url);
    };

    const initCanvasEvents = () => {
      const canvas = canvasEl.value!;
      const rect = canvas.getBoundingClientRect();
      pickColorAndDrawCircle(100, 100);
      const handleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        isDrawing = true;
        isHiddenOverflow.value = true;
        pickColorAndDrawCircle(e.clientX - rect.left, e.clientY - rect.top);
      };
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawing) return;
        isHiddenOverflow.value = true;
        pickColorAndDrawCircle(e.clientX - rect.left, e.clientY - rect.top);
      };
      const handleMouseUp = () => {
        isDrawing = false;
        isHiddenOverflow.value = false;
      };
      const handleMouseLeave = () => {
        isDrawing = false;
        isHiddenOverflow.value = false;
      };

      const handleTouchStart = (e: TouchEvent) => {
        isDrawing = true;
        isHiddenOverflow.value = true;
        const touch = e.touches[0];
        pickColorAndDrawCircle(touch.clientX - rect.left, touch.clientY - rect.top);
      };
      const handleTouchMove = (e: TouchEvent) => {
        if (!isDrawing) return;
        const touch = e.touches[0];
        isHiddenOverflow.value = true;
        pickColorAndDrawCircle(touch.clientX - rect.left, touch.clientY - rect.top);
      };
      const handleTouchEnd = () => {
        isDrawing = false;
        isHiddenOverflow.value = false;
      };

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseLeave);

      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);

      cleanup = () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseLeave);

        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      };
    };

    const pickColorAndDrawCircle = (xCss: number, yCss: number) => {
      const canvas = canvasEl.value!;
      const ctx = canvas.getContext('2d')!;
      const rect = canvas.getBoundingClientRect();

      if (xCss < 0 || yCss < 0 || xCss > rect.width || yCss > rect.height) return;

      const pixel = ctx.getImageData(xCss, yCss, 1, 1).data;
      const [r, g, b] = pixel;
      currentRgb.value = [r, g, b];
      currentHex.value = rgbToHex(r, g, b);
      selectedHex.value = currentHex.value;

      drawImage();

      ctx.beginPath();
      ctx.arc(xCss, yCss, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const loadImage = async (src: string) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load error'));
        img.src = src;
      });
      imgEl.value = img;
      await nextTick();
      drawImage();
      initCanvasEvents();
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

    onBeforeUnmount(() => {
      if (cleanup) cleanup();
    });

    const drawImage = () => {
      const canvas = canvasEl.value;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      if (!imgEl.value) return;
      const natW = imgEl.value.naturalWidth;
      const natH = imgEl.value.naturalHeight;
      const ratioImg = natW / natH;
      const ratioCanvas = CANVAS_W / CANVAS_H;

      let drawW, drawH;
      if (ratioImg > ratioCanvas) {
        drawW = CANVAS_W * scaleFactor.value;
        drawH = (CANVAS_W / ratioImg) * scaleFactor.value;
      } else {
        drawH = CANVAS_H * scaleFactor.value;
        drawW = CANVAS_H * ratioImg * scaleFactor.value;
      }

      const offsetX = (CANVAS_W - drawW) / 2;
      const offsetY = (CANVAS_H - drawH) / 2;

      ctx.drawImage(imgEl.value, 0, 0, natW, natH, offsetX, offsetY, drawW, drawH);
    };

    const zoomIn = () => {
      scaleFactor.value *= 1.2;
      drawImage();
    };

    const zoomOut = () => {
      if (scaleFactor.value > 1.4) {
        scaleFactor.value /= 1.2;
        drawImage();
      }
    };

    const reset = () => {
      scaleFactor.value = 1.4;
      drawImage();
    };

    return {
      imgEl,
      currentRgb,
      currentHex,
      selectedHex,
      onFileSelected,
      scaleFactor,
      zoomIn,
      canvasEl,
      zoomOut,
      reset,
      isHiddenOverflow,
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
  overflow: hidden;

  /* Скрыть скроллбар в разных браузерах */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
  overscroll-behavior: contain; /* или none */

  &::-webkit-scrollbar {
    /* Chrome, Safari, Opera */
    display: none;
  }

  @media (max-width: 600px) {
    overflow: auto;
  }
}
.photo-picker {
  margin: 12px auto;
}

.viewer-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  & section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  & .actions {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
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
  width: 130px;
}

/* mobile tweaks */
@media (max-width: 600px) {
  .swatch {
    width: 96px;
    height: 64px;
  }
}
canvas {
  border-radius: 8px;
}

.hiddenOverflow {
  overflow: hidden;
}
</style>
