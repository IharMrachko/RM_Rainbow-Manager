<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="overlayRef"
      class="error-overlay"
      :style="overlayStyle"
      @click="onClick"
    >
      <section>
        <div class="error-message">{{ message }}</div>
        <div class="exclamation-mark">!</div>
      </section>
    </div>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, PropType, ref } from 'vue';

const MARGIN_LEFT = 90;
const MARGIN_TOP = 7.5;
const INCREASE_WITH_BY = 1.5;
let globalZIndex = 2000;
export default defineComponent({
  props: {
    target: { type: Object as PropType<HTMLElement | null>, required: true },
    message: { type: String, default: 'Ошибка' },
    visible: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const overlayRef = ref<HTMLElement | null>(null);
    const positionTrigger = ref(0);
    const zIndex = ref(++globalZIndex);

    const overlayStyle = computed(() => {
      positionTrigger.value;
      zIndex.value;
      if (!props.target) return {};
      const rect = props.target.getBoundingClientRect();
      return {
        position: 'absolute',
        top: `${rect.top + window.scrollY + MARGIN_TOP}px`, // совпадает с верхом элемента
        left: `${rect.left + window.scrollX + MARGIN_LEFT}px`, // совпадает с левым краем
        width: `${rect.width / INCREASE_WITH_BY}px`,
        zIndex: zIndex.value, // выше инпута
      };
    });

    const updatePosition = () => {
      positionTrigger.value = Date.now();
      zIndex.value = zIndex.value;
    };

    const onClick = () => {
      zIndex.value = ++globalZIndex;
      emit('click');
    };

    onMounted(() => {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    });

    return { overlayRef, overlayStyle, onClick };
  },
});
</script>

<style scoped lang="scss">
.error-overlay {
  background: #fff;
  border-radius: 25px;
  border: 1px solid red;
}

.error-overlay section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px 5px 15px;
  height: inherit;
}

.error-message {
  color: rgb(200, 0, 0);
  font-size: 13px;
  font-weight: bold;
  flex: 2;
}
.exclamation-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  background: rgb(200, 0, 0);
  width: 25px;
  height: 25px;
  color: #fff;
}
</style>
