<template>
  <div class="file-uploader">
    <!-- Скрытый input -->
    <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />

    <!-- Кастомная кнопка -->
    <button type="button" class="upload-btn" @click="triggerInput">
      <font-awesome-icon size="lg" :icon="['fas', 'file-upload']" />
      <span v-if="isTitle" class="upload-btn-title">{{ t('upload') }}</span>
    </button>

    <!-- Отображение выбранного файла -->
    <div v-if="fileName && isShowSign" class="file-name">{{ fileName }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'FileUploader',
  props: {
    isTitle: {
      type: Boolean,
      default: true,
    },
    isShowSign: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['select'],
  setup(_, { emit }) {
    const { t } = useI18n();
    const fileInput = ref<HTMLInputElement | null>(null);
    const fileName = ref<string>('');

    const triggerInput = () => {
      fileInput.value?.click();
    };

    const onFileChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        fileName.value = file.name;
        emit('select', file);
      }
      target.value = '';
    };

    return {
      fileInput,
      fileName,
      triggerInput,
      onFileChange,
      t,
    };
  },
});
</script>

<style scoped>
.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: linear-gradient(145deg, #f0f0f0, #d9d9d9);
  color: #444;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  height: 50px;
}

.upload-btn:active {
  box-shadow: inset 2px 2px 6px #c5c5c5, inset -2px -2px 6px #ffffff;
}

.file-uploader {
  width: auto;
}

.file-input {
  display: none; /* скрываем стандартный input */
}

.file-name {
  font-size: 14px;
  margin-top: 5px;
  color: var(--color-text);
  display: flex;
  justify-content: center;
}
</style>
