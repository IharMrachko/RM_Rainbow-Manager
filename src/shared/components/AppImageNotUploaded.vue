<template>
  <div class="image-placeholder" role="button" tabindex="0" aria-label="Загрузить фото">
    <div class="placeholder-inner">
      <svg class="placeholder-icon" width="48" height="48" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M5 20h14V8l-4-4H5v16zm2-9l2.5 3 3.5-4.5L17 17H7l0-6z" />
      </svg>
      <div class="placeholder-text">{{ t('photoNotUploaded') }}</div>
      <app-file-uploader :is-show-sign="false" @select="onFileSelected"></app-file-uploader>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: { AppFileUploader },
  emits: ['onFileSelected'],
  setup(_, { emit }) {
    const { t } = useI18n();
    const onFileSelected = (file: File) => {
      emit('onFileSelected', file);
    };
    return {
      t,
      onFileSelected,
    };
  },
});
</script>

<style scoped lang="scss">
.image-placeholder {
  width: 400px;
  height: 500px;
  border-radius: 10px;
  border: 2px solid var(--active-doing);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.04));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ddd;
  cursor: pointer;
  padding: 18px;
  text-align: center;

  @media (max-width: 600px) {
    width: 340px;
    height: 400px;
  }
}

.placeholder-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
}
.placeholder-icon {
  color: #cfcfcf;
  opacity: 1;
}
.placeholder-text {
  font-size: 18px;
}
</style>
