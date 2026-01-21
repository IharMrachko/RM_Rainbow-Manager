<template>
  <div class="card" :class="{ cardSelected: isSelected }" @click="selected">
    <div class="card-number">{{ card?.type ? t(card.type) : index + 1 }}</div>
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
import { MaskCard } from '@/types/mask-card.type';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  props: {
    card: {
      type: Object as PropType<MaskCard>,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  emits: ['selected'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const selected = () => {
      emit('selected', props.card);
    };
    return {
      selected,
      t,
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
  font-size: 14px;
  font-weight: 900;
  color: #000;
  letter-spacing: 2px; /* чуть больше воздуха */
  pointer-events: none;
  text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.8), -1px -1px 0px rgba(0, 0, 0, 0.3);

  @media (max-width: 600px) {
    font-size: 11px;
  }
}
</style>
