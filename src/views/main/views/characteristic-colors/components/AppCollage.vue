<template>
  <div class="collage-wrapper">
    <div ref="containerRef" class="collage-container">
      <canvas ref="canvas"></canvas>
    </div>

    <section class="buttons" :class="{ isMobile: isMobile }">
      <div v-if="!isMobile" class="btn">
        <app-button
          raised
          title="pickPhoto"
          severity="secondary"
          :icon="['fas', 'sliders']"
          @click="openImageSettingsModal"
        ></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button severity="success" title="download" @click="saveImage('collage')"></app-button>
      </div>
      <app-button
        v-if="!isMobile"
        severity="warning"
        title="saveToGallery"
        :loading="isSaveToGallery"
        @click="saveToGallery"
      ></app-button>
      <app-button
        v-if="!isMobile"
        severity="info"
        title="addSign"
        @click="openImageModal"
      ></app-button>
      <font-awesome-icon
        v-if="isMobile"
        :icon="['fas', 'ellipsis-h']"
        size="xl"
        @click.stop="openPopover"
      />
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="sharedWithMask" label="shareImageWithMask"></AppCheckbox>
      </div>
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="rememberChoose" label="rememberChoose"></AppCheckbox>
      </div>
    </section>
  </div>

  <app-popover v-model:visible="visiblePopover">
    <app-popover-wrapper>
      <app-popover-item @click="openImageSettingsModal">
        <font-awesome-icon size="xl" :icon="['fas', 'sliders']" />
        <span>{{ t('pickPhoto') }}</span>
      </app-popover-item>
      <app-popover-item @click="saveImage('collage')">
        <font-awesome-icon size="xl" :icon="['fas', 'download']" />
        <span>{{ t('download') }}</span>
      </app-popover-item>
      <app-popover-item @click="saveToGallery">
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </app-popover-item>
      <app-popover-item @click="openImageModal">
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
    <app-popover-wrapper>
      <app-popover-item>
        <AppCheckbox v-model="sharedWithMask"></AppCheckbox>
        <span>{{ t('shareImageWithMask') }}</span>
      </app-popover-item>
      <app-popover-item>
        <AppCheckbox v-model="rememberChoose"></AppCheckbox>
        <span>{{ t('rememberChoose') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import { colorCards } from '@/views/main/views/characteristic-colors/components/color-card.constanst';
import { useStore } from 'vuex';
import { useCanvasSaver } from '@/composables/useCanvasSaver';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import { useI18n } from 'vue-i18n';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import { readFileAsDataURL } from '@/helpers/read-file-as-data-url';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/characteristic-colors/components/AppImageSignInModal.vue';
import AppImageSettingsModal from '@/shared/components/AppImageSettingsModal.vue';

export default defineComponent({
  components: {
    AppCheckbox,
    AppPopover,
    AppPopoverWrapper,
    AppPopoverItem,
    AppButton,
  },

  emits: ['update:imageUrl', 'isLoading'],

  setup(_, { emit }) {
    const { t } = useI18n();
    const visiblePopover = ref(false);
    const store = useStore();
    const containerRef = ref<HTMLElement | null>(null);
    const canvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const originalUrlRef = ref<string | null>(null);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    const imageUrl = ref<string | null>(null);
    const uploader = ref();
    const isSaveToGallery = ref(false);
    const sharedWithMask = ref(store.getters['imageColor/shareImgMask']);
    const rememberChoose = ref(store.getters['imageColor/rememberImgCollage']);
    const resizeObserver = ref<ResizeObserver | null>(null);
    let isLoadImage = false;

    // Функция для получения размеров контейнера
    const getContainerSize = () => {
      if (!containerRef.value) {
        return { width: 0, height: 0 };
      }

      const container = containerRef.value;
      const computedStyle = window.getComputedStyle(container);

      // Получаем внутренние размеры с учетом padding
      const containerWidth =
        container.clientWidth -
        parseFloat(computedStyle.paddingLeft) -
        parseFloat(computedStyle.paddingRight);

      const containerHeight =
        container.clientHeight -
        parseFloat(computedStyle.paddingTop) -
        parseFloat(computedStyle.paddingBottom);

      return {
        width: Math.max(1, Math.floor(containerWidth)),
        height: Math.max(1, Math.floor(containerHeight)),
      };
    };

    // Функция для вычисления толщины рамки на основе радиуса
    const calculateThickness = (radius: number): number => {
      const thickness = Math.max(4, radius * 0.35); // минимум 4px, максимум 35% от радиуса
      return Math.floor(thickness);
    };

    const onFileSelected = async (file: File) => {
      isLoadImage = false;
      imageUrl.value = await readFileAsDataURL(file);
      await store.dispatch('imageColor/uploadImgCollage', { file });
      await render();
    };

    const render = async () => {
      if (!canvas.value || !containerRef.value) return;

      const containerSize = getContainerSize();
      const containerWidth = containerSize.width;
      const containerHeight = containerSize.height;

      if (containerWidth === 0 || containerHeight === 0) return;

      const ctx = canvas.value.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;

      // Устанавливаем размеры канваса
      canvas.value.width = containerWidth * dpr;
      canvas.value.height = containerHeight * dpr;
      canvas.value.style.width = containerWidth + 'px';
      canvas.value.style.height = containerHeight + 'px';

      // Сбрасываем трансформации и масштабируем для Retina
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Очищаем канвас
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // Загружаем изображение если нужно
      if (imageUrl.value && !isLoadImage) {
        imageRef.value = await loadImage(imageUrl.value);
        isLoadImage = true;
      }

      // Определяем количество колонок и строк
      let cols = 3; // десктоп: 3 колонки
      let rows = 2; // десктоп: 2 строки

      // Мобильная версия или маленький контейнер
      if (containerWidth < 600 || isMobile.value) {
        cols = 2;
        rows = 3;
      }

      // Фиксированные отступы
      const gap = 15; // отступ между колонками
      const rowGap = 10; // отступ между строками

      // Вычисляем размер ячейки
      const totalGapX = gap * (cols - 1);
      const cellWidth = Math.floor((containerWidth - totalGapX) / cols);

      const totalGapY = rowGap * (rows - 1);
      const cellHeight = Math.floor((containerHeight - totalGapY) / rows);

      // Вычисляем радиус круга (90% от меньшей стороны ячейки, минимум 20px)
      const maxRadius = Math.min(cellWidth, cellHeight) / 2;
      const radius = Math.max(20, maxRadius * 0.9);

      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Центр круга в центре ячейки
          const centerX = Math.floor(col * (cellWidth + gap) + cellWidth / 2);
          const centerY = Math.floor(row * (cellHeight + rowGap) + cellHeight / 2);

          const card = colorCards[idx % colorCards.length];
          drawImageWithFrame(ctx, imageRef.value, centerX, centerY, radius, card.segments);

          idx++;
        }
      }
    };

    const { getCanvasSrc, saveImage, loadImage, zoom } = useCanvasSaver(
      canvas,
      render,
      emit,
      originalUrlRef
    );

    const drawImageWithFrame = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement | null,
      centerX: number,
      centerY: number,
      radius: number,
      segmentsArr: { color: string }[]
    ) => {
      const thickness = calculateThickness(radius);

      // Рисуем изображение если есть
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        const targetSize = (radius * 2 - thickness * 2) * zoom.value;

        ctx.drawImage(
          img,
          sx,
          sy,
          minSide,
          minSide,
          centerX - targetSize / 2,
          centerY - targetSize / 2,
          targetSize,
          targetSize
        );

        ctx.restore();
      }

      // Рисуем рамку из сегментов
      const segments = segmentsArr.length;
      const step = (2 * Math.PI) / segments;

      ctx.lineWidth = thickness;
      for (let i = 0; i < segments; i++) {
        const start = i * step - Math.PI / 2;
        const end = (i + 1) * step - Math.PI / 2;
        ctx.beginPath();
        ctx.strokeStyle = segmentsArr[i].color;
        ctx.arc(centerX, centerY, radius - thickness / 2, start, end);
        ctx.stroke();
      }
    };

    // Инициализация ResizeObserver
    const initResizeObserver = () => {
      if (!containerRef.value || typeof ResizeObserver === 'undefined') return;

      resizeObserver.value = new ResizeObserver(() => {
        render();
      });

      resizeObserver.value.observe(containerRef.value);
    };

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const saveToGallery = async () => {
      if (!isLoadImage) {
        await store.dispatch('toast/addToast', {
          message: 'uploadImage',
          severity: 'warning',
        });
        return;
      }
      isSaveToGallery.value = true;
      visiblePopover.value = false;
      if (isMobile.value) {
        emit('isLoading', true);
      }
      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: canvas.value,
          title: '',
          coloristicType: 'collage',
          maskType: '',
          userId: currentUser.value?.uid,
          paletteType: '',
        });
      } finally {
        isSaveToGallery.value = false;
        if (isMobile.value) emit('isLoading', false);
      }
    };

    watch(
      () => sharedWithMask.value,
      (value: boolean) => {
        store.dispatch('imageColor/setShareImgMask', {
          share: value,
        });
      }
    );

    watch(
      () => rememberChoose.value,
      (value: boolean) => {
        store.dispatch('imageColor/setRememberImgCollage', {
          remember: value,
        });
      }
    );

    watch(
      () => store.getters['imageColor/imgMask'],
      (file: File) => {
        if (store.getters['imageColor/shareImgCollage']) {
          onFileSelected(file);
        }
      }
    );

    onMounted(() => {
      initResizeObserver();

      nextTick(render);

      if (store.getters['imageColor/rememberImgCollage']) {
        const file = store.getters['imageColor/imgCollage'];
        if (file) {
          onFileSelected(file);
        }
      }
    });

    onUnmounted(() => {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect();
      }
    });

    // Обработчик изменения размера окна
    watch(
      () => store.getters['mobile/clientWidth'],
      () => {
        setTimeout(() => {
          render();
        }, 50);
      },
      { immediate: true }
    );

    const openImageModal = async () => {
      const url = getCanvasSrc();

      await openDialog(AppImageSignInModal, {
        url,
        coloristicType: 'collage',
        currentUserId: currentUser.value?.uid,
        canvas: canvas.value,
        imageUrl: imageUrl.value,
      });
    };

    const openImageSettingsModal = async () => {
      visiblePopover.value = false;
      const originalFile = store.getters['imageColor/getOriginalImgCollage'];
      let url = null;
      if (originalFile) {
        url = await readFileAsDataURL(originalFile);
      }

      await openDialog(AppImageSettingsModal, {
        imageUrl: url,
      }).then((value) => {
        if (value.originalFile) {
          store.dispatch('imageColor/setOriginalImgCollage', { file: value.originalFile });
        }
        store.dispatch('imageColor/uploadImgCollage', { file: value.file });
        onFileSelected(value.file);
      });
    };

    return {
      containerRef,
      canvas,
      saveImage,
      isMobile,
      openPopover,
      visiblePopover,
      t,
      isSaveToGallery,
      saveToGallery,
      sharedWithMask,
      rememberChoose,
      onFileSelected,
      uploader,
      openImageModal,
      openImageSettingsModal,
    };
  },
});
</script>

<style scoped>
.collage-wrapper {
  position: relative;
  height: calc(100dvh - var(--tabs-height-with-padding) - var(--header-height));
  width: 100%;
  background: var(--color-wrap-bg);
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 20px;
    overflow: auto;
    align-content: flex-start;
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex-wrap: nowrap;
  }
}

.collage-container {
  flex: 5;
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 300px;
  max-width: 800px;
  margin: 0 auto;
}

/* Канвас должен заполнять контейнер */
.collage-container canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.buttons:not(.isMobile) {
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .checkbox {
    width: 230px;
    display: flex;
    padding-left: 20px;
  }
}

@media (max-width: 600px) {
  .buttons {
    justify-content: center;
    display: flex;
  }

  .collage-container {
    min-height: 400px;
  }
}
</style>
