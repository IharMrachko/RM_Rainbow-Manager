<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="fileName" @close="close">
      <template #left>
        <button v-if="showBackButton" class="back-button" @click="backToViewer">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Назад к просмотру
        </button>
      </template>
    </app-modal-header>

    <div class="wrapper">
      <!-- Режим 1: Встроенный просмотрщик -->
      <div v-if="!isFullScreen" class="pdf-viewer">
        <iframe
          ref="pdfIframe"
          :src="pdfPathWithParams"
          class="pdf-iframe"
          :title="`Просмотр ${fileName}`"
        ></iframe>

        <!-- Кнопка "Развернуть" для мобильных -->
        <button v-if="isMobile" class="fullscreen-button" @click="openFullScreen">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
            />
          </svg>
          Открыть в полном экране
        </button>
      </div>

      <!-- Режим 2: Полноэкранный просмотр -->
      <div v-else class="fullscreen-viewer">
        <iframe
          :src="pdfFullScreenPath"
          class="fullscreen-iframe"
          :title="`Просмотр ${fileName}`"
        ></iframe>
      </div>

      <!-- Панель управления (только в обычном режиме) -->
      <div v-if="!isFullScreen" class="pdf-controls">
        <div class="controls-left">
          <button class="control-button" title="Скачать" @click="downloadPdf">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            v-if="!isMobile"
            class="control-button"
            title="Открыть в новой вкладке"
            @click="openInNewTab"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <button
            v-if="isMobile"
            class="control-button"
            title="Полноэкранный режим"
            @click="openFullScreen"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
              />
            </svg>
          </button>
        </div>

        <div class="controls-right">
          <span v-if="fileSize" class="file-size">{{ fileSize }}</span>
          <app-button raised severity="gradient" title="close" @click="close"></app-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import { useStore } from 'vuex';

export default defineComponent({
  components: { AppModalHeader, AppButton },
  props: {
    fileName: {
      type: String,
      default: 'lookbook.pdf',
    },
    buttonText: {
      type: String,
      default: 'Предпросмотр PDF',
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const store = useStore();
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const isFullScreen = ref(false);
    const showBackButton = ref(false);
    const fileSize = ref('');

    const pdfIframe = ref<HTMLIFrameElement>();

    // Путь для встроенного просмотра (с параметрами масштабирования)
    const pdfPathWithParams = computed(() => {
      const basePath = require(`@/assets/${props.fileName}`);
      const params = new URLSearchParams({
        view: 'FitH',
        zoom: 'page-width',
        scrollbar: '0',
        toolbar: '0',
        navpanes: '0',
      });
      return `${basePath}?${params.toString()}`;
    });

    // Путь для полноэкранного режима (без ограничений)
    const pdfFullScreenPath = computed(() => {
      return require(`@/assets/${props.fileName}`);
    });

    const downloadPdf = () => {
      const link = document.createElement('a');
      link.href = pdfPathWithParams.value;
      link.download = props.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Открыть в новой вкладке (только для десктопа)
    const openInNewTab = () => {
      if (!isMobile.value) {
        window.open(pdfFullScreenPath.value, '_blank');
      }
    };

    // Переключить полноэкранный режим
    const openFullScreen = () => {
      isFullScreen.value = true;
      showBackButton.value = true;
    };

    // Вернуться к встроенному просмотрщику
    const backToViewer = () => {
      isFullScreen.value = false;
      showBackButton.value = false;
    };

    // Получить размер файла
    const initFileSize = async () => {
      try {
        const response = await fetch(pdfPathWithParams.value, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        if (size) {
          const sizeInMb = (parseInt(size) / (1024 * 1024)).toFixed(2);
          fileSize.value = `${sizeInMb} MB`;
        }
      } catch (error) {
        console.error('Не удалось получить размер файла:', error);
      }
    };

    onMounted(() => {
      initFileSize();
    });

    const close = () => {
      emit('close');
    };

    return {
      pdfIframe,
      openInNewTab,
      downloadPdf,
      pdfPathWithParams,
      pdfFullScreenPath,
      fileSize,
      close,
      isMobile,
      isFullScreen,
      showBackButton,
      openFullScreen,
      backToViewer,
    };
  },
});
</script>

<style scoped>
.modal-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;
  overflow: hidden;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }
}

.wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* PDF просмотрщик */
.pdf-viewer {
  flex: 1;
  position: relative;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
  background: white;
}

/* Кнопка "Развернуть" для мобильных */
.fullscreen-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 10px 15px;
  background: rgba(102, 126, 234, 0.9);
  color: white;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.fullscreen-button svg {
  width: 18px;
  height: 18px;
}

.fullscreen-button:hover {
  background: #667eea;
}

/* Полноэкранный режим */
.fullscreen-viewer {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.fullscreen-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* Кнопка "Назад" в хедере */
.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.back-button svg {
  width: 18px;
  height: 18px;
}

/* iOS специфичные стили */
@supports (-webkit-touch-callout: none) {
  .pdf-iframe,
  .fullscreen-iframe {
    -webkit-overflow-scrolling: touch;
  }

  .pdf-viewer {
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* Панель управления */
.pdf-controls {
  padding: 15px 20px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-shrink: 0;
  min-height: 70px;

  @media (max-width: 600px) {
    padding: 12px 15px;
    min-height: 60px;
  }
}

/* Остальные стили остаются такими же */
.controls-left {
  display: flex;
  gap: 10px;
}

.control-button {
  width: 40px;
  height: 40px;
  border: none;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #4a5568;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.control-button:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.control-button svg {
  width: 18px;
  height: 18px;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 600px) {
    display: none;
  }
}

.file-size {
  color: #718096;
  font-size: 14px;
  font-weight: 500;
}
</style>
