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
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import { colorCards } from '@/views/main/views/color-view/components/color-card.constanst';
import { useStore } from 'vuex';

const mobileHeight = 330;
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

      // параметры сетки
      const cols = isMobile ? 2 : 3;
      const rows = isMobile ? 3 : 2;
      const gap = 10;

      // ширина ячейки
      const totalGapX = gap * (cols - 1);
      const cellW = (width.value - totalGapX) / cols;

      // радиус
      let radius = (cellW / 2) * props.photoScale - props.thickness;
      if (radius < 1) radius = 1;

      // высота ячейки
      const totalGapY = props.rowGap * (rows - 1);
      const cellH = (height.value - totalGapY) / rows;

      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * (cellW + gap) + cellW / 2;
          const cy = row * (cellH + props.rowGap) + cellH / 2;

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
      const thickness = width.value === mobileWidth ? 15 : props.thickness;

      // если есть картинка — рисуем её
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
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
