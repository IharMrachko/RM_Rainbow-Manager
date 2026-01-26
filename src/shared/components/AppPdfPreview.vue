<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="fileName" @close="close"></app-modal-header>

    <!-- PDF просмотрщик -->
    <div class="wrapper">
      <div class="pdf-viewer">
        <iframe :src="pdfPath" class="pdf-iframe" :title="`Просмотр ${fileName}`"></iframe>
      </div>

      <!-- Панель управления -->
      <div class="pdf-controls">
        <div class="controls-left">
          <button class="control-button" title="Скачать" @click="downloadPdf">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button class="control-button" title="Открыть в новой вкладке" @click="openInNewTab">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
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
    const fileSize = ref('');
    const pdfPath = computed(() => {
      const basePath = require(`@/assets/${props.fileName}`);

      if (isMobile.value) {
        // Параметры для мобильных устройств
        return `${basePath}#view=FitH&zoom=page-width&scrollbar=0&toolbar=0&navpanes=0`;
      }

      // Для десктопа
      return `${basePath}#view=FitH`;
    });

    const downloadPdf = () => {
      const link = document.createElement('a');
      link.href = pdfPath.value;
      link.download = props.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Открыть в новой вкладке
    const openInNewTab = () => {
      window.open(pdfPath.value, '_blank');
    };

    // Получить размер файла
    const initFileSize = async () => {
      try {
        const response = await fetch(pdfPath.value, { method: 'HEAD' });
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
      openInNewTab,
      downloadPdf,
      pdfPath,
      fileSize,
      close,
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
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;
  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100%;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  & .wrapper {
    background: var(--color-wrap-bg);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    height: calc(100% - 50px);
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    @media (max-width: 600px) {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
}

/* PDF просмотрщик */
.pdf-viewer {
  width: 100%;
  flex: 6;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  /* Для мобильных - предотвращаем масштабирование */
  @media (max-width: 600px) {
    -webkit-overflow-scrolling: touch;
    overflow: auto;

    /* Принудительно масштабируем содержимое */
    transform-origin: top left;
  }
}
/* Специальные стили для iOS */
@supports (-webkit-touch-callout: none) {
  .pdf-iframe {
    /* Отключаем возможность масштабирования пальцами */
    touch-action: pan-x pan-y;

    /* Фиксируем viewport */
    max-width: 100vw;

    /* Предотвращаем горизонтальный скролл */
    overflow-x: hidden !important;
    overflow-y: auto;
  }

  .pdf-viewer {
    /* Для iOS Safe Area */
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}
.pdf-loading p {
  margin: 0;
  color: #4a5568;
  font-size: 16px;
}

/* Панель управления */
.pdf-controls {
  padding: 20px 30px;
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  @media (max-width: 600px) {
    justify-content: center;
  }
}

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
