<template>
  <div class="card" :class="{ cardSelected: isSelected }" @click="selected">
    <div class="card-number">{{ card.id }}</div>
    <div class="segments">
      <div
        v-for="item in card.segments"
        :key="item"
        class="segment"
        :style="{ backgroundColor: item.color }"
      ></div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ColorCard } from '@/views/main/views/color-view/components/color-card.constanst';

export default defineComponent({
  props: {
    card: {
      type: Object as PropType<ColorCard>,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['selected'],
  setup(props, { emit }) {
    const selected = () => {
      emit('selected', props.card);
    };
    return {
      selected,
    };
  },
});
</script>
<style scoped lang="scss">
.card {
  position: relative;
  width: 100px;
  height: 150px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px); /* лёгкий blur */
  cursor: pointer;
  transition: all 0.2s ease;
}

/* выделение */
.card.cardSelected {
  outline: 4px solid #4caf50; /* зелёная рамка */
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
}

/* планшеты */
@media (max-width: 1024px) {
  .card {
    width: 60px;
    height: 120px;
  }
}

/* телефоны */
@media (max-width: 600px) {
  .card {
    width: 80px;
    height: 50px;
  }
}

.segments {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.segment {
  flex: 1; /* все 11 равные по высоте */
  opacity: 0.8; /* лёгкая прозрачность для эффекта */
}

.card-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 72px; /* крупнее */
  font-weight: 900; /* максимально жирный */
  color: #fff; /* чисто белый */
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), /* мягкое свечение */ 0 2px 6px rgba(0, 0, 0, 0.7),
    /* глубокая тень */ 0 0 12px rgba(0, 0, 0, 0.9); /* дополнительная чёткость */
  letter-spacing: 2px; /* чуть больше воздуха */
  pointer-events: none;

  @media (max-width: 768px) {
    font-size: 30px;
  }
}
</style>
