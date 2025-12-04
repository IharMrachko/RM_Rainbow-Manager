<template>
  <div class="chroma-wrapper">
    <div class="photo-picker" :class="{ hiddenOverflow: isHiddenOverflow }">
      <app-image-not-uploaded v-if="!imgEl" @on-file-selected="onFileSelected">
      </app-image-not-uploaded>

      <app-image-color-picker
        v-if="imgEl"
        :image-element="imgEl"
        @selected-hex="selectedHex = $event"
        @is-hidden-overflow="isHiddenOverflow = $event"
      ></app-image-color-picker>
    </div>
    <app-color-picker :hex-p="selectedHex"></app-color-picker>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import AppColorPicker from '@/shared/components/AppColorPicker.vue';
import AppImageNotUploaded from '@/shared/components/AppImageNotUploaded.vue';
import AppImageColorPicker from '@/shared/components/AppImageColorPicker.vue';

export default defineComponent({
  components: {
    AppImageColorPicker,
    AppImageNotUploaded,
    AppColorPicker,
  },
  setup() {
    const selectedHex = ref<string>('#D4F880');
    const imgEl = ref<HTMLImageElement | null>(null);
    const isHiddenOverflow = ref(false);

    const onFileSelected = (file: File) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      loadImage(url);
    };

    const loadImage = async (src: string) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load error'));
        img.src = src;
      });
      imgEl.value = img;
    };

    return {
      imgEl,
      selectedHex,
      onFileSelected,
      isHiddenOverflow,
    };
  },
});
</script>

<style scoped>
.chroma-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  background: var(--color-wrap-bg);
  height: calc(100dvh - var(--header-height));
  gap: 20px;
  overflow: hidden;

  /* Скрыть скроллбар в разных браузерах */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
  overscroll-behavior: contain; /* или none */

  &::-webkit-scrollbar {
    /* Chrome, Safari, Opera */
    display: none;
  }

  @media (max-width: 600px) {
    overflow: auto;
  }
}
.photo-picker {
  margin: 12px auto;
}

.hiddenOverflow {
  overflow: hidden;
}
</style>
