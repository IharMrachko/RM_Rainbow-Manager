<template>
  <div data-burger-test-id class="burger" :class="{ open: isOpen }" @click="toggle">
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  setup() {
    const store = useStore();
    const isOpen = ref(false);
    const toggle = () => {
      isOpen.value = !isOpen.value;
      store.dispatch('burgerMenu/setBurger', { isOpen: isOpen.value });
    };
    return {
      isOpen,
      toggle,
    };
  },
});
</script>
<style scoped lang="scss">
.burger {
  position: relative;
  width: 30px;
  height: 24px;
  cursor: pointer;
}

.burger span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 4px;
  background: #fff;
  border-radius: 2px;
  transition: 0.3s;
}

/* три линии */
.burger span:nth-child(1) {
  top: 0;
}
.burger span:nth-child(2) {
  top: 10px;
}
.burger span:nth-child(3) {
  top: 20px;
}

/* анимация в крест */
.burger.open span:nth-child(1) {
  transform: rotate(45deg);
  top: 10px;
}
.burger.open span:nth-child(2) {
  opacity: 0;
}
.burger.open span:nth-child(3) {
  transform: rotate(-45deg);
  top: 10px;
}
</style>
