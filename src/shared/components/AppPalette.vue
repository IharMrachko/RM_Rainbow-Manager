<template>
  <div class="palette">
    <div class="palette-left" :style="{ gap: gap, width: width }">
      <app-palette-item
        v-for="value in item.segments.slice(0, 35)"
        :key="value"
        :color="value.color"
        :selected-mode="selectedMode"
        :selected-colors="selectedColors"
        @selected-color="selectedColor($event)"
      ></app-palette-item>
    </div>
    <div
      v-if="item.segments.slice(35, 65).length > 0"
      class="palette-right"
      :style="{ gap: gap, width: width }"
    >
      <app-palette-item
        v-for="value in item.segments.slice(35, 65)"
        :key="value"
        :color="value.color"
        :selected-mode="selectedMode"
        :selected-colors="selectedColors"
        @selected-color="selectedColor($event)"
      ></app-palette-item>
    </div>
    <div v-if="paletteCards.length" class="my-color">
      <app-palette-item
        v-for="value in paletteCards"
        :key="value"
        :color="value.color"
      ></app-palette-item>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import AppPaletteItem from '@/shared/components/AppPaletteItem.vue';

export default defineComponent({
  components: { AppPaletteItem },
  props: {
    paletteCards: {
      type: Array as PropType<{ id: number; color: string }[]>,
      default: () => [],
    },
    item: {
      type: Object as PropType<{ segments: { color: string }[] }>,
      required: true,
    },
    gap: {
      type: String,
      default: '2px',
    },
    width: {
      type: String,
      default: '160px',
    },
    selectedMode: {
      type: Boolean,
      default: false,
    },
    selectedColors: {
      type: Set as PropType<Set<string>>,
      default: () => new Set(),
    },
  },
  emits: ['selectedColor'],
  setup(_, { emit }) {
    const selectedColor = (item: { color: string; selected: boolean }) => {
      emit('selectedColor', item);
    };

    return {
      selectedColor,
    };
  },
});
</script>
<style scoped lang="scss">
.palette {
  position: relative;
  display: flex;

  @media (max-width: 600px) {
    margin: 12px auto;
  }

  & .palette-left {
    display: flex;
    flex-wrap: wrap;
    /* Выравниваем элементы по верхнему краю */
    align-items: flex-start;
    /* Или растягиваем строки */
    align-content: flex-start;
  }

  & .palette-right {
    display: flex;
    flex-wrap: wrap;
    height: 187px;
    /* Выравниваем элементы по верхнему краю */
    align-items: flex-start;
    /* Или растягиваем строки */
    align-content: flex-start;
  }
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
