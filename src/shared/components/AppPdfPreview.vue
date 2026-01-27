<template>
  <div class="modal-content neon">
    <app-modal-header :title="fileName" @close="close"></app-modal-header>

    <div class="wrapper">
      <AppLoader v-if="isLoading"></AppLoader>

      <div v-if="!isLoading" class="pdf-viewer">
        <!-- Для Android используем iframe с data: URL -->
        <iframe
          v-if="device === 'android' && pdfBlobUrl"
          :src="pdfBlobUrl"
          class="pdf-iframe"
          :title="`Просмотр ${fileName}`"
        ></iframe>

        <!-- Для iOS используем embed с прямым URL -->
        <embed
          v-else-if="device === 'ios'"
          :src="pdfDirectUrl"
          type="application/pdf"
          class="pdf-embed"
          :title="`Просмотр ${fileName}`"
        />

        <!-- Для других устройств -->
        <iframe
          v-else
          :src="pdfDirectUrl"
          class="pdf-iframe"
          :title="`Просмотр ${fileName}`"
        ></iframe>
      </div>

      <div class="pdf-controls">
        <div class="btn-download">
          <app-button severity="success" title="download" @click="downloadPdf"></app-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppLoader from '@/shared/components/AppLoader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useStore } from 'vuex';
import { Device } from '@/store/modules/mobile-view';

export default defineComponent({
  components: { AppButton, AppLoader, AppModalHeader },
  props: {
    fileName: {
      type: String,
      default: 'lookbook.pdf',
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const store = useStore();
    const device = ref<Device>(store.getters['mobile/getDevice']);
    const isLoading = ref(true);
    const pdfBlobUrl = ref<string>('');

    // Прямой URL для iOS (самый стабильный)
    const pdfDirectUrl = computed(() => {
      const baseUrl = require(`@/assets/${props.fileName}?v=1.0`); // Фиксированная версия для кэширования

      if (device.value === 'ios') {
        return `${baseUrl}#page=1&view=FitH&scrollbar=1&toolbar=0&navpanes=0&zoom=page-width`;
      }

      return `${baseUrl}#view=FitH&zoom=page-width`;
    });

    // Загрузка PDF как Blob (для Android)
    const loadPdfAsBlob = async () => {
      try {
        const response = await fetch(`/${props.fileName}`);
        if (!response.ok) throw new Error('Ошибка загрузки PDF');

        const blob = await response.blob();
        pdfBlobUrl.value = URL.createObjectURL(blob);

        isLoading.value = false;
      } catch (error) {
        console.error('Ошибка загрузки Blob:', error);
        // Используем прямой URL как fallback
        isLoading.value = false;
      }
    };

    const downloadPdf = async () => {
      const pdfUrl = require(`@/assets/${props.fileName}`);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // Для iOS: загружаем и меняем MIME type
        await downloadForIOS(pdfUrl, props.fileName);
      } else {
        // Для Android/Desktop
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = props.fileName;
        link.click();
      }
    };

    const downloadForIOS = async (url: string, filename: string) => {
      try {
        // Загружаем файл
        const response = await fetch(url);
        const blob = await response.blob();

        // Меняем MIME type на force-download
        const forceBlob = new Blob([blob], {
          type: 'application/octet-stream', // Это заставляет скачивать, а не открывать
        });

        const blobUrl = URL.createObjectURL(forceBlob);

        // Создаем iframe (иногда работает на iOS)
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        // И ссылку
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.cssText = 'position: fixed; left: -9999px;';
        document.body.appendChild(link);

        // Пробуем все методы
        link.click();

        // Очистка
        setTimeout(() => {
          document.body.removeChild(iframe);
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 5000);
      } catch (error) {
        console.error('iOS download failed:', error);
        // Fallback - открываем в новой вкладке
        window.open(url, '_blank');
      }
    };

    const close = () => {
      // Очищаем Blob URL
      if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
      }
      emit('close');
    };

    onMounted(() => {
      // Для Android загружаем как Blob
      if (device.value === 'android') {
        loadPdfAsBlob();
      } else {
        // Для iOS и других используем прямой URL
        isLoading.value = false;
      }

      // Таймаут на случай если PDF не загрузится
      setTimeout(() => {
        if (isLoading.value) {
          isLoading.value = false;
        }
      }, 10000);
    });

    onUnmounted(() => {
      // Очищаем ресурсы
      if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value);
      }
    });

    return {
      isLoading,
      pdfBlobUrl,
      pdfDirectUrl,
      device,
      downloadPdf,
      close,
    };
  },
});
</script>

<style scoped>
.modal-content {
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
  background: var(--color-bg);

  @media (max-width: 600px) {
    width: 100vw;
    height: 100%;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }
}

.wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* PDF viewer */
.pdf-viewer {
  flex: 1;
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* EMBED - основной способ */
.pdf-embed {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
  display: block;
}

/* IFRAME - fallback */
.pdf-iframe {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
}

/* iOS специфичные исправления */
@supports (-webkit-touch-callout: none) {
  .pdf-viewer {
    /* Разрешаем скролл */
    overflow-y: auto;
    overflow-x: hidden;

    /* Safe areas */
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .pdf-embed,
  .pdf-iframe {
    /* Фиксируем ширину */
    max-width: 100vw;

    /* Принудительно адаптируем */
    width: 100% !important;

    /* Включаем скролл */
    overflow: auto !important;
  }
}

/* Особые стили для мобильных */
@media (max-width: 600px) {
  .pdf-viewer {
    height: calc(100vh - 140px);
  }

  .pdf-embed,
  .pdf-iframe {
    /* На мобильных - полная ширина */
    width: 100vw !important;
    max-width: 100vw !important;
  }
}

/* Панель управления */
.pdf-controls {
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: end;
  flex-shrink: 0;
  min-height: 70px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(256, 256, 256, 0.2);

  & .btn-download {
    width: 200px;
  }
  @media (max-width: 600px) {
    justify-content: center;
  }
}
</style>
