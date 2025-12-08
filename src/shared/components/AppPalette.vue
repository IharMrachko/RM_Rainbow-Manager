<template>
  <div class="palette">
    <div class="palette-left">
      <div
        v-for="value in item.segments.slice(0, 35)"
        :key="value"
        class="palette-item"
        :style="{ backgroundColor: value.color }"
      ></div>
    </div>
    <div class="palette-right">
      <div
        v-for="value in item.segments.slice(35, 65)"
        :key="value"
        class="palette-item"
        :style="{ backgroundColor: value.color }"
      ></div>
    </div>
    <div v-if="paletteCards.length" class="my-color">
      <div
        v-for="value in paletteCards"
        :key="value"
        class="palette-item"
        :style="{ backgroundColor: value.color }"
      ></div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    paletteCards: {
      type: Array as PropType<{ id: number; color: string }[]>,
      default: () => [],
    },
    item: {
      type: Object as PropType<{ segments: { color: string }[] }>,
      required: true,
    },
  },
});
</script>
<style scoped lang="scss">
.palette {
  position: relative;
  display: flex;
  height: 220px;
  margin-top: 60px;

  @media (max-width: 600px) {
    margin: 12px auto;
  }

  & .palette-left {
    display: flex;
    flex-wrap: wrap;
    width: 160px;
    gap: 2px;
  }

  & .palette-right {
    display: flex;
    flex-wrap: wrap;
    width: 160px;
    gap: 2px;
    height: 187px;
  }
}

.palette-item {
  width: 30px;
  height: 30px;
}

.my-color {
  width: 200px;
  background: white;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  gap: 5px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 12px;
  /* лёгкая тень */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  /* анимация парения */
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-8px);
  }
  100% {
    transform: translate(-50%, -50%) translateY(0);
  }
}
</style>
