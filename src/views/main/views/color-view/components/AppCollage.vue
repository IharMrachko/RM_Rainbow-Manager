<template>
  <div class="collage-container">
    <canvas ref="canvas"></canvas>
  </div>
  <div class="actions">
    <app-button
      severity="secondary"
      raised
      :icon="['fas', 'undo']"
      @click="resetImage"
    ></app-button>
    <app-button severity="secondary" raised :icon="['fas', 'plus']" @click="zoomPlus"></app-button>
    <app-button
      severity="secondary"
      raised
      :icon="['fas', 'minus']"
      @click="zoomMinus"
    ></app-button>
    <app-button severity="secondary" raised :icon="['fas', 'save']" @click="saveImage"></app-button>
  </div>
</template>

<script lang="ts">
import {defineComponent, nextTick, onMounted, ref, watch} from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import {colorCards} from '@/views/main/views/color-view/components/color-card.constanst';
import {useStore} from 'vuex';

const mobileHeight = 410;
const mobileWidth = 330;
const desktopHeight = 489;
const desktopWidth = 860;
export default defineComponent({
  components: { AppButton },
  props: {
    thickness: { type: Number, default: 6 }, // толщина рамки
    imageUrl: { type: String, required: true }, // одна фотография
    rowGap: { type: Number, default: 1 }, // расстояние между рядами
    photoScale: { type: Number, default: 1 }, // масштаб фото относительно ячейки (0.8 = 80%)
  },
  setup(props) {
    const store = useStore();
    const canvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const width = ref(desktopWidth);
    const height = ref(desktopHeight);
    function loadImage(url: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    }

    async function render() {
      if (!canvas.value) return;
      const ctx = canvas.value.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;

      // Retina‑поддержка
      canvas.value.width = width.value * dpr;
      canvas.value.height = height.value * dpr;
      canvas.value.style.width = width.value + 'px';
      canvas.value.style.height = height.value + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width.value, height.value);

      if (!imageRef.value && props.imageUrl) {
        imageRef.value = await loadImage(props.imageUrl).catch(() => null);
      }

      const isMobile = width.value === mobileWidth;
      const cols = isMobile ? 2 : 3;
      const rows = isMobile ? 3 : 2;
      const gap = 10;

      // динамический rowGap и photoScale
      const rowGap = isMobile ? props.rowGap * 0.6 : props.rowGap;
      const photoScale = isMobile ? props.photoScale * 1.2 : props.photoScale;

      const totalGapX = gap * (cols - 1);
      const cellW = (width.value - totalGapX) / cols;

      let radius = (cellW / 2) * photoScale - props.thickness;
      if (radius < 1) radius = 1;

      const totalGapY = rowGap * (rows - 1);
      const cellH = (height.value - totalGapY) / rows;

      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * (cellW + gap) + cellW / 2;
          const cy = row * (cellH + rowGap) + cellH / 2;

          const card = colorCards[idx % colorCards.length];
          drawImageWithFrame(ctx, imageRef.value, cx, cy, radius, card.segments);

          idx++;
        }
      }
    }

    function drawImageWithFrame(
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement | null,
      cx: number,
      cy: number,
      radius: number,
      segmentsArr: { color: string }[]
    ) {
      const thickness = width.value === mobileWidth ? 20 : props.thickness;

      // если есть картинка — рисуем её
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        // вычисляем квадратную область из центра исходного изображения
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        // итоговый размер (с учётом толщины рамки)
        const targetSize = radius * 2 - thickness * 2; // можно добавить zoom, если нужно

        // рисуем квадратную область по центру круга
        ctx.drawImage(
          img,
          sx,
          sy,
          minSide,
          minSide, // обрезка по центру
          cx - targetSize / 2, // x на канвасе
          cy - targetSize / 2, // y на канвасе
          targetSize,
          targetSize // размер на канвасе
        );

        ctx.restore();
      }
      // рамка из 12 сегментов
      const segments = segmentsArr.length;
      const step = (2 * Math.PI) / segments;

      ctx.lineWidth = thickness;
      for (let i = 0; i < segments; i++) {
        const start = i * step - Math.PI / 2; // сдвиг на 90° вверх
        const end = (i + 1) * step - Math.PI / 2;
        ctx.beginPath();
        ctx.strokeStyle = segmentsArr[i].color;
        ctx.arc(cx, cy, radius - thickness / 2, start, end);
        ctx.stroke();
      }
    }

    onMounted(render);
    watch(
      () => props.imageUrl,
      () => render()
    );

    watch(
      () => store.getters['mobile/clientWidth'],
      (value) => {
        if (value < 600) {
          width.value = mobileWidth;
          height.value = mobileHeight;
        }

        if (value > 1024) {
          width.value = desktopWidth;
          height.value = desktopHeight;
        }
        render();
      },
      { immediate: true }
    );

    watch(
      () => [props.thickness],
      () => {
        nextTick(() => render());
      }
    );
    function saveImage() {
      if (!canvas.value) return;
      const url = canvas.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'collage.png';
      link.click();
    }

    return { canvas, saveImage };
  },
});
</script>
<style scoped>
.collage-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 20px;
}
</style>
