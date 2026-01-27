<template>
  <div class="modal-content">
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
        <app-button severity="success" title="download" @click="downloadPdf"></app-button>
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

    const downloadPdf = () => {
      const link = document.createElement('a');
      link.href = require(`@/assets/${props.fileName}`);
      link.download = props.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
  background: white;
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
  background: #f7fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: end;
  flex-shrink: 0;
  min-height: 70px;
}
</style>
