<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="fileName" @close="close"></app-modal-header>

    <div class="wrapper">
      <div class="pdf-viewer">
        <!-- Используем embed вместо iframe -->
        <embed
          :src="pdfUrl"
          type="application/pdf"
          class="pdf-embed"
          :title="`Просмотр ${fileName}`"
        />

        <!-- Fallback для браузеров без поддержки embed -->
        <iframe
          v-if="!supportsEmbed"
          :src="pdfUrl"
          class="pdf-iframe"
          :title="`Просмотр ${fileName}`"
        ></iframe>
      </div>

      <div class="pdf-controls">
        <div class="controls-left">
          <button class="control-button" title="Скачать" @click="downloadPdf">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>

        <div class="controls-right">
          <app-button raised severity="gradient" title="close" @click="close">Закрыть</app-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';

export default defineComponent({
  components: { AppModalHeader, AppButton },
  props: {
    fileName: {
      type: String,
      default: 'lookbook.pdf',
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const supportsEmbed = ref(true);

    // Ключевое изменение: добавляем #page=1 в конец URL
    const pdfUrl = computed(() => {
      const baseUrl = require(`@/assets/${props.fileName}`);

      // Для iOS Safari PDF viewer
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // ЭТО САМОЕ ВАЖНОЕ: добавляем якорь #page=1
        return `${baseUrl}#page=1&view=FitH&scrollbar=1&toolbar=0&navpanes=0&zoom=page-width`;
      }

      // Для других браузеров
      return `${baseUrl}#view=FitH&zoom=page-width`;
    });

    onMounted(() => {
      // Проверяем поддержку embed
      const embed = document.createElement('embed');
      supportsEmbed.value = 'type' in embed;
    });

    const downloadPdf = () => {
      const link = document.createElement('a');
      link.href = `/${props.fileName}`;
      link.download = props.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const close = () => {
      emit('close');
    };

    return {
      pdfUrl,
      supportsEmbed,
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
@media (max-width: 768px) {
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
  justify-content: space-between;
  flex-shrink: 0;
  min-height: 70px;
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
</style>
