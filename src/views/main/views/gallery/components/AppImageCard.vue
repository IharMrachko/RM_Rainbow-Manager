<template>
  <div class="image-card">
    <div class="checkbox" @click.stop="selected">
      <AppCheckbox v-if="isSelectedMode" v-model="selectedImage"></AppCheckbox>
    </div>
    <img
      v-if="!error"
      :src="src"
      :alt="alt"
      :style="{ objectFit: fit }"
      loading="lazy"
      :class="{ 'fade-in': loaded }"
      @error="onError"
      @load="onLoad"
    />
    <div v-else class="fallback">
      <slot name="fallback">⚠️ Ошибка загрузки</slot>
    </div>

    <div class="overlay">
      <slot />
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import { useStore } from 'vuex';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import { Image } from '@/store/modules/gallery';

export default defineComponent({
  components: { AppCheckbox },
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    fit: { type: String, default: 'cover' }, // cover | contain
    rounded: { type: Boolean, default: true },
    image: { type: Object as PropType<Image>, required: true },
  },
  setup(props) {
    const store = useStore();
    const error = ref(false);
    const loaded = ref(false);
    const isSelectedMode = computed(() => store.getters['gallery/getSelectedMode']);
    const selectedImage = computed(() => store.getters['gallery/isSelected'](props.image.id));
    const selected = () => {
      store.dispatch('gallery/setSelected', props.image);
    };
    const onError = () => {
      error.value = true;
    };
    const onLoad = () => {
      loaded.value = true;
    };

    return { error, loaded, onError, onLoad, isSelectedMode, selected, selectedImage };
  },
});
</script>
<style scoped>
.image-card {
  position: relative;
  overflow: hidden;
  background: #f3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 250px;
  height: 300px;

  & .checkbox {
    position: absolute;
    bottom: -2px;
    right: 10px;
    z-index: 5;
    cursor: pointer;
  }

  @media (max-width: 600px) {
    width: 100%;
    height: 150px;
  }
}
.image-card.rounded {
  border-radius: 8px;
}
.image-card img {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.image-card img.fade-in {
  opacity: 1;
}
.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  color: white;
  font-size: 13px;
}
</style>
