<template>
  <div class="pdf-preview-container">
    <!-- Кнопка для открытия предпросмотра -->
    <app-button
      :severity="'secondary'"
      raised
      :icon="['fas', 'eye']"
      :title="buttonText"
      @click="openModal"
    >
    </app-button>

    <!-- Модальное окно -->
    <transition name="modal">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <!-- Заголовок модального окна -->
          <div class="modal-header">
            <div class="modal-title">
              <svg class="modal-pdf-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                <path d="M14 2v6h6" />
              </svg>
              <h3>{{ fileName }}</h3>
            </div>
            <div class="modal-close" @click="closeModal">
              <font-awesome-icon size="lg" :icon="['fas', 'fa-times']" />
            </div>
          </div>

          <!-- Контент модального окна -->
          <div class="modal-content">
            <!-- PDF просмотрщик -->
            <div class="pdf-viewer">
              <iframe
                :src="pdfPath"
                class="pdf-iframe"
                :title="`Просмотр ${fileName}`"
                @load="onPdfLoad"
              ></iframe>

              <!-- Индикатор загрузки -->
              <div v-if="isLoading" class="pdf-loading">
                <div class="spinner"></div>
                <p>Загрузка документа...</p>
              </div>
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
                <button class="control-button" title="Печать" @click="printPdf">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 9V2h12v7" />
                    <path
                      d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                    />
                    <path d="M6 14h12v8H6z" />
                  </svg>
                </button>
                <button
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
              </div>

              <div class="controls-right">
                <span v-if="fileSize" class="file-size">{{ fileSize }}</span>
                <app-button
                  raised
                  severity="gradient"
                  title="close"
                  @click="closeModal"
                ></app-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';

export default defineComponent({
  components: { AppButton },
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
  setup(props) {
    const isModalOpen = ref(false);
    const isLoading = ref(true);
    const fileSize = ref('');

    const pdfPath = computed(() => `/${props.fileName}`);

    // Открытие модального окна
    const openModal = () => {
      isModalOpen.value = true;
      isLoading.value = true;
      document.body.style.overflow = 'hidden'; // Блокируем скролл страницы
    };

    // Закрытие модального окна
    const closeModal = () => {
      isModalOpen.value = false;
      document.body.style.overflow = ''; // Возвращаем скролл
    };

    // Загрузка PDF завершена
    const onPdfLoad = () => {
      isLoading.value = false;
    };

    // Скачать PDF
    const downloadPdf = () => {
      const link = document.createElement('a');
      link.href = pdfPath.value;
      link.download = props.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Печать PDF
    const printPdf = () => {
      const printWindow = window.open(pdfPath.value, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    };

    // Открыть в новой вкладке
    const openInNewTab = () => {
      window.open(pdfPath.value, '_blank');
    };

    // Получить размер файла
    const getFileSize = async () => {
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

    // Закрытие по ESC
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen.value) {
        closeModal();
      }
    };

    // Добавляем обработчик ESC
    onMounted(() => {
      window.addEventListener('keydown', onKeydown);
      getFileSize();
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = '';
    });
    return {
      openInNewTab,
      printPdf,
      downloadPdf,
      onPdfLoad,
      closeModal,
      openModal,
      pdfPath,
      fileSize,
      isLoading,
      isModalOpen,
    };
  },
});
</script>

<style scoped>
.pdf-preview-container {
  display: inline-block;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  @media (max-width: 600px) {
    padding: 0;
  }
}

.modal-container {
  width: 90%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }
}

/* Заголовок модального окна */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
}

.modal-pdf-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.modal-close {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-close svg {
  width: 20px;
  height: 20px;
  color: #4a5568;
}

/* Контент модального окна */
.modal-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* PDF просмотрщик */
.pdf-viewer {
  flex: 1;
  position: relative;
  min-height: 500px;
}

.pdf-iframe {
  width: 100%;
  height: 500px;
  border: none;
}

.pdf-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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
}

.file-size {
  color: #718096;
  font-size: 14px;
  font-weight: 500;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .modal-header {
    padding: 15px 20px;
  }

  .modal-title h3 {
    font-size: 16px;
  }

  .pdf-controls {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
  }

  .controls-left {
    width: 100%;
    justify-content: center;
  }

  .controls-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
