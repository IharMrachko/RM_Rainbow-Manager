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
import { Folder } from '@/store/modules/firebase-folder';

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
      default: 'cover', // По умолчанию cover для максимального заполнения
    },
    containerScale: {
      type: Number,
      default: 0.95, // Какую часть контейнера занимает canvas (0-1)
    },
    minCellSize: {
      type: Number,
      default: 50, // Минимальный размер ячейки в пикселях
    },
    maintainAspectRatio: {
      type: Boolean,
      default: true, // Сохранять соотношение сторон canvas
    },
    canvasAspectRatio: {
      type: Number,
      default: null as unknown as number, // Фиксированное соотношение сторон canvas
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
    const columns = computed(() => {
      return isMobile.value ? 2 : 3;
    });
    const rows = computed(() => {
      return isMobile.value ? 3 : 2;
    });
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    let resizeObserver: ResizeObserver | null = null;

    // Расчет оптимального соотношения сторон canvas на основе ячеек
    const calculateOptimalAspectRatio = () => {
      return window.devicePixelRatio || 1;
    };

    // Расчет размеров canvas, чтобы изображения максимально заполняли ячейки
    const calculateCanvasSize = () => {
      if (!containerRef.value) {
        currentWidth.value = 800;
        currentHeight.value = 600;
        return;
      }

      const containerWidth = containerRef.value.clientWidth;
      const containerHeight = containerRef.value.clientHeight;

      // Определяем соотношение сторон
      const aspectRatio = calculateOptimalAspectRatio();

      if (props.maintainAspectRatio) {
        // Сохраняем соотношение сторон
        const maxWidth = containerWidth * props.containerScale;
        const maxHeight = containerHeight * props.containerScale;

        let width, height;

        // Проверяем, какое ограничение сработает первым
        if (maxWidth / aspectRatio <= maxHeight) {
          width = maxWidth;
          height = maxWidth / aspectRatio;
        } else {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }

        // Проверяем минимальный размер ячеек
        const cellWidth = width / columns.value;
        const cellHeight = height / rows.value;

        if (cellWidth < props.minCellSize || cellHeight < props.minCellSize) {
          // Пересчитываем с учетом минимальных размеров ячеек
          const minCanvasWidth = props.minCellSize * columns.value;
          const minCanvasHeight = props.minCellSize * rows.value;

          if (minCanvasWidth / aspectRatio <= minCanvasHeight) {
            width = minCanvasWidth;
            height = minCanvasWidth / aspectRatio;
          } else {
            height = minCanvasHeight;
            width = minCanvasHeight * aspectRatio;
          }

          // Не превышаем размеры контейнера
          width = Math.min(width, maxWidth);
          height = Math.min(height, maxHeight);
        }

        currentWidth.value = Math.round(width);
        currentHeight.value = Math.round(height);
      } else {
        // Занимаем всю доступную область
        currentWidth.value = Math.round(containerWidth * props.containerScale);
        currentHeight.value = Math.round(containerHeight * props.containerScale);
      }
    };

    // Альтернативный алгоритм: подгон под среднее соотношение сторон изображений
    const calculateSizeBasedOnImages = async (imagesData: ImageData[]) => {
      if (!containerRef.value || imagesData.length === 0) {
        calculateCanvasSize();
        return;
      }

      const containerWidth = containerRef.value.clientWidth;
      const containerHeight = containerRef.value.clientHeight;

      // Вычисляем среднее соотношение сторон всех изображений
      const totalAspectRatio = imagesData.reduce((sum, img) => sum + img.aspectRatio, 0);
      const avgAspectRatio = totalAspectRatio / imagesData.length;

      // Оптимальное соотношение сторон canvas
      const canvasAspectRatio =
        props.canvasAspectRatio ||
        Math.max(0.5, Math.min(2, avgAspectRatio * (columns.value / rows.value)));

      const maxWidth = containerWidth * props.containerScale;
      const maxHeight = containerHeight * props.containerScale;

      let width, height;

      if (maxWidth / canvasAspectRatio <= maxHeight) {
        width = maxWidth;
        height = maxWidth / canvasAspectRatio;
      } else {
        height = maxHeight;
        width = maxHeight * canvasAspectRatio;
      }

      currentWidth.value = Math.round(width);
      currentHeight.value = Math.round(height);
    };

    const initResizeObserver = () => {
      if (!containerRef.value) return;

      resizeObserver = new ResizeObserver(() => {
        calculateCanvasSize();
        createCollage();
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

    // Улучшенный расчет размеров изображения для максимального заполнения
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
        // Заполняем всю ячейку, обрезая если нужно
        if (imageAspectRatio > cellAspectRatio) {
          // Ширина изображения больше, подгоняем по ширине
          width = cellWidth;
          height = cellWidth / imageAspectRatio;
          x = 0;
          y = (cellHeight - height) / 2;
        } else {
          // Высота изображения больше, подгоняем по высоте
          height = cellHeight;
          width = cellHeight * imageAspectRatio;
          x = (cellWidth - width) / 2;
          y = 0;
        }
      } else {
        // contain - помещаем целиком
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

        // Загружаем изображения сначала
        const imagesData = await loadAllImagesData(
          props.images.slice(0, columns.value * rows.value)
        );

        if (imagesData.length === 0) return;

        // Рассчитываем размеры canvas с учетом изображений
        await calculateSizeBasedOnImages(imagesData);

        canvas.width = currentWidth.value;
        canvas.height = currentHeight.value;

        // Очищаем canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Рисуем фон
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Расчет размеров ячеек
        const cellWidth = canvas.width / columns.value;
        const cellHeight = canvas.height / rows.value;

        // Рисуем изображения
        for (let row = 0; row < rows.value; row++) {
          for (let col = 0; col < columns.value; col++) {
            const imageIndex = row * columns.value + col;
            if (imageIndex >= imagesData.length) break;

            const imageData = imagesData[imageIndex];
            const cellX = col * cellWidth;
            const cellY = row * cellHeight;

            // Учитываем padding внутри ячейки
            const paddedWidth = cellWidth - props.padding * 2;
            const paddedHeight = cellHeight - props.padding * 2;
            const paddedX = cellX + props.padding;
            const paddedY = cellY + props.padding;

            // Стандартное заполнение
            const { width, height, x, y } = calculateImageSize(
              imageData,
              paddedWidth,
              paddedHeight,
              props.fillMode
            );

            const drawX = paddedX + x;
            const drawY = paddedY + y;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(imageData.img, drawX, drawY, width, height);
          }
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Произошла ошибка при создании коллажа';
        console.error('Ошибка создания коллажа:', err);
      } finally {
        loading.value = false;
      }
    };

    const downloadCollage = (filename: string = 'collage.png') => {
      if (!canvasRef.value) return;
      const url = canvasRef.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
    };

    const handleResize = () => {
      calculateCanvasSize();
      createCollage();
    };

    onMounted(() => {
      nextTick(() => {
        calculateCanvasSize();
        createCollage();
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
        }); // вернет URL
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
  flex-direction: column; /* вертикально */
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

  /* Фиксированный header */
  .header {
    flex: 0 0 auto; /* Фиксированная высота */
    width: 100%;
  }

  /* Canvas занимает всё оставшееся пространство */
  .canvas-container {
    position: relative;
    flex: 1 1 auto; /* Занимает всё доступное пространство */
    width: 100%;
    overflow: hidden; /* Чтобы canvas не выходил за пределы */
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;

    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
  }

  /* Фиксированный footer */
  .footer {
    flex: 0 0 auto; /* Фиксированная высота */
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    width: 100%;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    /* матовое стекло */
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

/* Оптимизация для мобильных устройств */
.high-quality-canvas {
  /* Улучшение сглаживания на Android */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Предотвращение размытия при трансформациях */
  backface-visibility: hidden;
  transform: translateZ(0);

  /* Фиксированный размер для предотвращения масштабирования браузером */
  width: 100%;
  height: auto;
  max-width: 100%;
  display: block;
}

/* Медиа-запросы для Android */
@media screen and (-webkit-min-device-pixel-ratio: 1.5) {
  .high-quality-canvas {
    image-rendering: -webkit-optimize-contrast;
  }
}

/* Для очень плотных пикселей (Retina) */
@media screen and (-webkit-min-device-pixel-ratio: 2), screen and (min-resolution: 192dpi) {
  .high-quality-canvas {
    image-rendering: crisp-edges;
  }
}
</style>
