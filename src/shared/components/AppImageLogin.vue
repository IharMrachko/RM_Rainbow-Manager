<template>
  <div class="login-pic" @mousemove="handleMouseMove" @mouseleave="resetTransform">
    <img ref="imageRef" src="../../assets/img-01.png" alt="" />
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const imageRef = ref<HTMLImageElement | null>(null);
    const handleMouseMove = (e: MouseEvent) => {
      const el = imageRef.value;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left; // позиция курсора внутри картинки
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // нормализуем в диапазон [-1, 1]
      const rotateY = ((x - centerX) / centerX) * 10; // 10° — максимальный поворот по Y
      const rotateX = -((y - centerY) / centerY) * 10; // по X инвертируем

      el.style.transform = `perspective(300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const resetTransform = () => {
      if (imageRef.value) {
        imageRef.value.style.transform = 'perspective(300px) rotateX(0deg) rotateY(0deg)';
      }
    };
    return {
      handleMouseMove,
      resetTransform,
      imageRef,
    };
  },
});
</script>
<style scoped lang="scss">
.login-pic {
  flex: 1 1 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 300px;

  img {
    max-width: 100%;
    height: auto;
    transition: transform 0.1s ease;
    will-change: transform;
  }

  @media (max-width: 600px) {
    flex: none;
    display: none;
  }
}
</style>
