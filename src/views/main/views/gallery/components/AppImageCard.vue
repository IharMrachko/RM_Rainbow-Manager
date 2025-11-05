<template>
  <div class="image-card" :class="{ rounded }">
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
<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: '' },
    fit: { type: String, default: 'cover' }, // cover | contain
    rounded: { type: Boolean, default: true },
  },
  setup() {
    const error = ref(false);
    const loaded = ref(false);

    function onError() {
      error.value = true;
    }
    function onLoad() {
      loaded.value = true;
    }

    return { error, loaded, onError, onLoad };
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
