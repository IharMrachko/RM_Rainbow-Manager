<template>
  <teleport to="body">
    <div v-if="visible" class="popover-container">
      <div ref="popoverContentRef" class="popover-content">
        <section class="popover-toggle-container" @click="toggle">
          <div class="popover-toggle"></div>
        </section>

        <slot></slot>
      </div>
    </div>
  </teleport>
</template>
<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';

export default defineComponent({
  props: {
    visible: { type: Boolean, default: false },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const popoverContentRef = ref<HTMLElement | null>(null);

    const handleClickOutside = (e: MouseEvent) => {
      const targetEl = popoverContentRef.value;
      const clickedNode = e.target as Node;
      if (targetEl && !targetEl.contains(clickedNode)) {
        emit('update:visible', false);
      }
    };

    const toggle = () => {
      emit('update:visible', false);
    };
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside);
    });
    return {
      popoverContentRef,
      toggle,
    };
  },
});
</script>
<style scoped lang="scss">
.popover-container {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 120;
  background-color: rgba(0, 0, 0, 0.5);
  top: 0;
  & .popover-content {
    position: fixed;
    background: #f2f4f7;
    width: 100%;
    bottom: 0;
    height: 65dvh;
    border-radius: 20px 20px 0 0;
    padding: 15px;

    & .popover-toggle-container {
      padding-bottom: 20px;
      & .popover-toggle {
        width: 100px;
        height: 10px;
        border-radius: 20px;
        background-color: grey;
        margin: 0 auto;
      }
    }
  }
}
</style>
