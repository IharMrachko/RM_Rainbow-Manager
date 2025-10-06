<template>
  <div class="file-uploader">
    <!-- Скрытый input -->
    <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />

    <!-- Кастомная кнопка -->
    <button type="button" class="upload-btn" @click="triggerInput">
      <font-awesome-icon size="lg" :icon="['fas', 'file-upload']" />
      <span class="title">Upload</span>
    </button>

    <!-- Отображение выбранного файла -->
    <div v-if="fileName" class="file-name">{{ fileName }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'FileUploader',
  emits: ['select'],
  setup(_, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    const fileName = ref<string>('');

    function triggerInput() {
      fileInput.value?.click();
    }

    function onFileChange(e: Event) {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        fileName.value = file.name;
        emit('select', file);
      }
    }

    return {
      fileInput,
      fileName,
      triggerInput,
      onFileChange,
    };
  },
});
</script>

<style scoped>
.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
  background: linear-gradient(145deg, #f0f0f0, #d9d9d9);
  color: #444;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;

  /* выпуклый эффект */
  box-shadow: 2px 2px 6px #c5c5c5, -2px -2px 6px #ffffff;
  transition: all 0.2s ease;
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
