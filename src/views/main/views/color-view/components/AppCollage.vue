<template>
  <div class="collage-wrapper">
    <div class="collage-container">
      <canvas ref="canvas"></canvas>
      <div class="actions">
        <app-button
          severity="secondary"
          raised
          :icon="['fas', 'undo']"
          @click="resetImage"
        ></app-button>
        <app-button
          severity="secondary"
          raised
          :icon="['fas', 'plus']"
          @click="zoomPlus"
        ></app-button>
        <app-button
          severity="secondary"
          raised
          :icon="['fas', 'minus']"
          @click="zoomMinus"
        ></app-button>
        <app-button
          severity="secondary"
          raised
          :icon="['fas', 'save']"
          @click="saveImage('collage')"
        ></app-button>
      </div>
    </div>

    <section class="buttons">
      <app-button v-if="!isMobile" severity="warning" title="saveToGallery"></app-button>
      <app-button v-if="!isMobile" severity="info" title="addSign"></app-button>
      <font-awesome-icon
        v-if="isMobile"
        :icon="['fas', 'ellipsis-h']"
        size="lg"
        @click.stop="openPopover"
      />
    </section>
  </div>

  <app-popover v-model:visible="visiblePopover">
    <app-popover-wrapper>
      <app-popover-item>
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </app-popover-item>
      <app-popover-item>
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import { colorCards } from '@/views/main/views/color-view/components/color-card.constanst';
import { useStore } from 'vuex';
import { useCanvasSaver } from '@/composables/useCanvasSaver';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import { useI18n } from 'vue-i18n';

const mobileHeight = 410;
const mobileWidth = 330;
const desktopHeight = 489;
const desktopWidth = 860;
const desktopThickness = 30;
const mobileThickness = 20;
export default defineComponent({
  components: { AppPopover, AppPopoverWrapper, AppPopoverItem, AppButton },
  props: {
    imageUrl: { type: String, required: true }, // одна фотография
  },
  emits: ['update:imageUrl'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const visiblePopover = ref(false);
    const store = useStore();
    const canvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const width = ref(desktopWidth);
    const height = ref(desktopHeight);
    const photoScaleRef = ref(1);
    const originalUrlRef = ref<string | null>(null);
    let isLoadImage = false;
    const render = async () => {
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

      if (props.imageUrl && !isLoadImage) {
        imageRef.value = await loadImage(props.imageUrl);
        isLoadImage = true;
      }

      const isMobile = width.value === mobileWidth;
      const cols = isMobile ? 2 : 3;
      const rows = isMobile ? 3 : 2;
      const gap = 10;
      const rowGap = 8;
      const photoScale = isMobile ? photoScaleRef.value * 1.2 : photoScaleRef.value;

      const totalGapX = gap * (cols - 1);
      const cellW = (width.value - totalGapX) / cols;

      let radius = (cellW / 2) * photoScale - desktopThickness;
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
    };

    const { saveImage, loadImage, resetImage, zoomPlus, zoomMinus, zoom } = useCanvasSaver(
      canvas,
      render,
      emit,
      originalUrlRef
    );

    const drawImageWithFrame = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement | null,
      cx: number,
      cy: number,
      radius: number,
      segmentsArr: { color: string }[]
    ) => {
      const thickness = width.value === mobileWidth ? mobileThickness : desktopThickness;

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
        const targetSize = (radius * 2 - thickness * 2) * zoom.value; // можно добавить zoom, если нужно

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
    };

    onMounted(render);

    watch(
      () => props.imageUrl,
      (url) => {
        if (url && !originalUrlRef.value) {
          originalUrlRef.value = url;
        }

        if (url && originalUrlRef.value) {
          isLoadImage = false;
          zoom.value = 1;
          originalUrlRef.value = url;
        }

        render();
      }
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
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const openPopover = () => {
      visiblePopover.value = true;
    };
    return {
      canvas,
      saveImage,
      resetImage,
      zoomPlus,
      zoomMinus,
      isMobile,
      openPopover,
      visiblePopover,
      t,
    };
  },
});
</script>
<style scoped>
.collage-wrapper {
  height: calc(100vh - var(--header-height) - var(--tabs-height-with-padding));
  width: 100%;
  background: var(--color-wrap-bg);
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 10px 5px 5px 5px;
    overflow: auto;
    height: auto;
  }
}

.collage-container {
  flex: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 280px;
  @media (max-width: 600px) {
    margin-left: 0;
  }
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin: 10px;
  @media (max-width: 600px) {
    margin: 20px;
  }
}

.buttons {
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 600px) {
  .buttons {
    flex-direction: row;
    justify-content: center;
    align-items: start;
    width: 100%;
  }
}
</style>
