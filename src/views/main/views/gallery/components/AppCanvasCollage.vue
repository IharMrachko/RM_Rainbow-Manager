<template>
  <div class="modal-content neon">
    <app-modal-header class="header" @close="close"></app-modal-header>
    <div ref="targetRef" class="ellipsis-vertical" @click="toggleImageOverlayPanel">
      <font-awesome-icon size="lg" :icon="['fas', 'fa-ellipsis-vertical']" />
    </div>
    <app-overlay-panel
      v-if="targetRef"
      v-model:visible="visible"
      :width="250"
      :target="targetRef"
      :position="{
        x: 'left',
        y: 'center',
      }"
    >
      <div class="overlay-image">
        <div class="overlay-image-item" @click="openFolderModal">
          <font-awesome-icon size="sm" :icon="['fas', 'fa-folder']" />
          {{ t('addFolder') }}
        </div>
        <div class="overlay-image-item" @click="downloadCollage">
          <font-awesome-icon size="sm" :icon="['fas', 'download']" />
          {{ t('download') }}
        </div>
      </div>
    </app-overlay-panel>
    <div ref="containerRef" class="canvas-container">
      <canvas ref="canvasRef" class="high-quality-canvas"></canvas>
      <AppLoader v-if="loading" />
    </div>

    <footer class="footer">
      <div class="footer-wrapper">
        <div class="badge-wrapper">
          <span v-if="folder" class="badge darkBadge">{{ folder?.name }}</span>
          <span class="badge darkBadge">{{ t('collage') }}</span>
        </div>
        <app-input
          v-model="signIn"
          :icon="['fas', 'fa-pencil']"
          :is-label="false"
          @focus="focusInput"
          @blur="focusOutInput"
        ></app-input>
        <div class="btn">
          <app-button
            :loading="isSaveGallery"
            severity="warning"
            title="saveToGallery"
            @click="saveToGallery"
          ></app-button>
        </div>
        <div class="btn-group"></div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppLoader from '@/shared/components/AppLoader.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
// @ts-ignore
import iNoBounce from 'inobounce';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppFolderModal from '@/shared/components/folder-modal/AppFolderModal.vue';
import { Folder } from '@/store/modules/folder';

interface ImageData {
  img: HTMLImageElement;
  width: number;
  height: number;
  aspectRatio: number;
}

export default defineComponent({
  name: 'ImageCollage',
  components: { AppOverlayPanel, AppLoader, AppInput, AppButton, AppModalHeader },
  props: {
    images: {
      type: Array as () => string[],
      required: true,
      default: () => [],
    },
    padding: {
      type: Number,
      default: 5,
    },
    fillMode: {
      type: String as () => 'contain' | 'cover' | 'stretch',
      default: 'cover',
    },
    containerScale: {
      type: Number,
      default: 1,
    },
    minCellSize: {
      type: Number,
      default: 50,
    },
    maintainAspectRatio: {
      type: Boolean,
      default: true,
    },
    canvasAspectRatio: {
      type: Number,
      default: null as unknown as number,
    },
    maxImages: {
      type: Number,
      default: 9,
    },
    targetCanvasRatio: {
      type: Number,
      default: 4 / 3,
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const store = useStore();
    const { t } = useI18n();
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLElement | null>(null);
    const loading = ref(false);
    const isSaveGallery = ref(false);
    const error = ref('');
    const currentWidth = ref(0);
    const currentHeight = ref(0);
    const visible = ref(false);
    const targetRef = ref<HTMLElement | null>(null);
    const signIn = ref('');
    const folder = ref<Folder | null>(null);
    const device = computed(() => store.getters['mobile/getDevice']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);

    const columns = ref(3);
    const rows = ref(2);

    let resizeObserver: ResizeObserver | null = null;

    // Функция для вычисления оптимальной сетки на основе количества изображений
    // ПРАВИЛЬНАЯ ФУНКЦИЯ РАСЧЕТА СЕТКИ
    const calculateOptimalGrid = (imageCount: number) => {
      if (imageCount <= 0) return { columns: 1, rows: 1 };

      const displayCount = Math.min(imageCount, props.maxImages);

      // ОСНОВНОЕ ПРАВИЛО: для малого количества фото используем столько колонок, сколько фото
      if (displayCount <= 3 && !isMobile.value) {
        // 1-3 фото: одна строка, столько колонок сколько фото
        return { columns: displayCount, rows: 1 };
      }

      // Для мобильных: максимум 2 колонки
      if (isMobile.value) {
        const columns = Math.min(2, displayCount);
        const rows = Math.ceil(displayCount / columns);
        return { columns, rows };
      }

      // Для десктопа: для 4+ фото используем 3 колонки
      const columns = 3;
      const rows = Math.ceil(displayCount / columns);

      return { columns, rows };
    };

    // Расчет соотношения сторон canvas на основе сетки и среднего соотношения изображений
    // Новая функция: расчет размеров canvas на основе контейнера
    const calculateCanvasSizeFromContainer = () => {
      if (!containerRef.value) return;

      // Получаем реальные размеры контейнера
      const containerRect = containerRef.value.getBoundingClientRect();
      const containerWidth = Math.floor(containerRect.width);
      const containerHeight = Math.floor(containerRect.height);

      // Определяем соотношение сторон canvas (ширина сетки / высота сетки)
      const aspectRatio = columns.value / rows.value;

      // Максимальные размеры с учетом масштаба (95% от контейнера)
      const maxWidth = containerWidth * props.containerScale;
      const maxHeight = containerHeight * props.containerScale;

      let width, height;

      // ПРОСТАЯ ЛОГИКА: начинаем с максимальной ширины
      width = maxWidth;
      height = width / aspectRatio;

      // Если не помещается по высоте, пересчитываем по высоте
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Проверяем минимальный размер ячеек
      const cellWidth = width / columns.value;
      const cellHeight = height / rows.value;

      // Если ячейки слишком маленькие, увеличиваем canvas
      if (cellWidth < props.minCellSize || cellHeight < props.minCellSize) {
        // Вычисляем минимально необходимые размеры
        const neededWidth = props.minCellSize * columns.value;
        const neededHeight = props.minCellSize * rows.value;

        // Проверяем, помещаются ли минимальные размеры в контейнер
        if (neededWidth <= maxWidth && neededHeight <= maxHeight) {
          // Помещаются - используем минимально необходимые размеры
          width = neededWidth;
          height = neededHeight;

          // Корректируем соотношение сторон
          const currentAspectRatio = width / height;
          if (Math.abs(currentAspectRatio - aspectRatio) > 0.01) {
            if (currentAspectRatio > aspectRatio) {
              // Слишком широко, уменьшаем ширину
              width = height * aspectRatio;
            } else {
              // Слишком узко, уменьшаем высоту
              height = width / aspectRatio;
            }
          }
        } else {
          // Не помещаются, масштабируем
          const scaleX = maxWidth / neededWidth;
          const scaleY = maxHeight / neededHeight;
          const scale = Math.min(scaleX, scaleY);

          width = neededWidth * scale;
          height = neededHeight * scale;

          // Корректируем соотношение сторон
          const currentAspectRatio = width / height;
          if (Math.abs(currentAspectRatio - aspectRatio) > 0.01) {
            if (currentAspectRatio > aspectRatio) {
              width = height * aspectRatio;
            } else {
              height = width / aspectRatio;
            }
          }
        }
      }

      // Убедимся, что не превышаем максимальные размеры (двойная проверка)
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      // Округляем до четных чисел для предотвращения размытия
      currentWidth.value = Math.floor(width);
      currentHeight.value = Math.floor(height);
    };

    const initResizeObserver = () => {
      if (!containerRef.value) return;

      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === containerRef.value) {
            createCollage();
          }
        }
      });

      resizeObserver.observe(containerRef.value);
    };

    const loadImageData = (url: string): Promise<ImageData> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          resolve({
            img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight,
          });
        };

        img.onerror = () => reject(new Error(`Не удалось загрузить изображение: ${url}`));
        img.src = url;
      });
    };

    const loadAllImagesData = async (urls: string[]): Promise<ImageData[]> => {
      const imagePromises = urls.map((url) => loadImageData(url));
      return Promise.all(imagePromises);
    };

    const calculateImageSize = (
      image: ImageData,
      cellWidth: number,
      cellHeight: number,
      fillMode: 'contain' | 'cover' | 'stretch' = 'cover'
    ) => {
      if (fillMode === 'stretch') {
        return {
          width: cellWidth,
          height: cellHeight,
          x: 0,
          y: 0,
        };
      }

      const cellAspectRatio = cellWidth / cellHeight;
      const imageAspectRatio = image.aspectRatio;

      let width, height, x, y;

      if (fillMode === 'cover') {
        if (imageAspectRatio > cellAspectRatio) {
          width = cellWidth;
          height = cellWidth / imageAspectRatio;
          x = 0;
          y = (cellHeight - height) / 2;
        } else {
          height = cellHeight;
          width = cellHeight * imageAspectRatio;
          x = (cellWidth - width) / 2;
          y = 0;
        }
      } else {
        if (imageAspectRatio > cellAspectRatio) {
          width = cellWidth;
          height = cellWidth / imageAspectRatio;
        } else {
          height = cellHeight;
          width = cellHeight * imageAspectRatio;
        }
        x = (cellWidth - width) / 2;
        y = (cellHeight - height) / 2;
      }

      return { width, height, x, y };
    };

    const createCollage = async () => {
      if (!canvasRef.value || !containerRef.value || props.images.length === 0) return;

      loading.value = true;
      error.value = '';

      try {
        const canvas = canvasRef.value;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Загружаем изображения
        const imagesToDisplay = props.images.slice(0, props.maxImages);
        const imagesData = await loadAllImagesData(imagesToDisplay);

        if (imagesData.length === 0) return;

        // Рассчитываем оптимальную сетку
        const grid = calculateOptimalGrid(imagesData.length);
        columns.value = grid.columns;
        rows.value = grid.rows;

        // Рассчитываем размер canvas на основе контейнера
        calculateCanvasSizeFromContainer();

        // Умножаем на devicePixelRatio для высокого качества
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = currentWidth.value;
        const displayHeight = currentHeight.value;

        // Устанавливаем реальные размеры canvas
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;

        // Масштабируем отображение
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Масштабируем контекст
        ctx.scale(dpr, dpr);

        // Настраиваем сглаживание
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Очищаем canvas и рисуем белый фон
        ctx.clearRect(0, 0, displayWidth, displayHeight);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Расчет размеров ячеек
        const cellWidth = displayWidth / columns.value;
        const cellHeight = displayHeight / rows.value;

        // Рисуем изображения
        for (let row = 0; row < rows.value; row++) {
          for (let col = 0; col < columns.value; col++) {
            const imageIndex = row * columns.value + col;
            if (imageIndex >= imagesData.length) break;

            const imageData = imagesData[imageIndex];
            const cellX = col * cellWidth;
            const cellY = row * cellHeight;

            // Учитываем padding
            const paddedWidth = cellWidth - props.padding * 2;
            const paddedHeight = cellHeight - props.padding * 2;
            const paddedX = cellX + props.padding;
            const paddedY = cellY + props.padding;

            const { width, height, x, y } = calculateImageSize(
              imageData,
              paddedWidth,
              paddedHeight,
              props.fillMode
            );

            const drawX = paddedX + x;
            const drawY = paddedY + y;

            // Рисуем изображение
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(
              imageData.img,
              0,
              0,
              imageData.width,
              imageData.height,
              drawX,
              drawY,
              width,
              height
            );

            ctx.restore();
          }
        }
      } catch (err) {
        console.error('Ошибка создания коллажа:', err);
        error.value = 'Ошибка при создании коллажа';
      } finally {
        loading.value = false;
      }
    };

    const downloadCollage = () => {
      toggleImageOverlayPanel();
      if (!canvasRef.value) return;
      const url = canvasRef.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'collage.png';
      link.click();
    };

    const handleResize = () => {
      createCollage();
    };

    onMounted(() => {
      nextTick(() => {
        // Небольшая задержка для гарантированного получения размеров контейнера
        setTimeout(() => {
          createCollage();
        }, 100);

        initResizeObserver();
        window.addEventListener('resize', handleResize);
      });
    });

    onUnmounted(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    });

    const close = () => {
      emit('close');
    };

    const toggleImageOverlayPanel = () => {
      visible.value = !visible.value;
    };

    const saveToGallery = async () => {
      isSaveGallery.value = true;
      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: canvasRef.value,
          title: signIn.value,
          coloristicType: 'collage',
          maskType: '',
          userId: currentUser.value?.uid,
          paletteType: '',
          folderId: folder.value?.id ? folder.value?.id : '',
        });
        emit('resolve', { update: true });
      } finally {
        isSaveGallery.value = false;
      }
    };

    const focusInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        iNoBounce.disable();
        setTimeout(() => window.scrollTo(0, 0), 50);
      }
    };

    const openFolderModal = async () => {
      toggleImageOverlayPanel();
      await openDialog(
        AppFolderModal,
        {},
        {
          transparent: true,
        }
      ).then((item: Folder) => {
        folder.value = item;
      });
    };

    return {
      canvasRef,
      containerRef,
      loading,
      error,
      createCollage,
      downloadCollage,
      t,
      isMobile,
      close,
      toggleImageOverlayPanel,
      targetRef,
      visible,
      saveToGallery,
      isSaveGallery,
      signIn,
      focusInput,
      focusOutInput,
      openFolderModal,
      folder,
    };
  },
});
</script>

<style scoped lang="scss">
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100%;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  .header {
    flex: 0 0 auto;
    width: 100%;
  }

  .canvas-container {
    position: relative;
    flex: 1 1 auto; /* Занимает все доступное пространство */
    width: 100%;
    height: 100%; /* Важно: явно задаем высоту */
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    box-sizing: border-box; /* Учитываем padding и border в размерах */

    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      /* Убираем все внешние отступы и рамки */
      margin: 0;
      padding: 0;
      border: none;
    }
  }

  .footer {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    width: 100%;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    @media (max-width: 600px) {
      border-radius: 0;
    }
  }
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #444;
  color: #fff;
  min-width: 100px;
  text-align: center;
}

.footer-wrapper {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  gap: 12px;
}

.ellipsis-vertical {
  position: absolute;
  top: 100px;
  right: 20px;
  cursor: pointer;
  z-index: 1;

  @media (max-width: 600px) {
    top: 24px;
  }
}

.overlay-image {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  & .overlay-image-item {
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #eaeaeb;
    cursor: pointer;
  }
}

.high-quality-canvas {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  backface-visibility: hidden;
  transform: translateZ(0);
  width: auto;
  height: auto;
  display: block;
}

@media screen and (-webkit-min-device-pixel-ratio: 1.5) {
  .high-quality-canvas {
    image-rendering: -webkit-optimize-contrast;
  }
}

@media screen and (-webkit-min-device-pixel-ratio: 2), screen and (min-resolution: 192dpi) {
  .high-quality-canvas {
    image-rendering: crisp-edges;
  }
}
</style>
