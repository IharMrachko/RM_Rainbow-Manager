<template>
  <!-- десктоп -->
  <aside v-if="!isMobile" class="sidebar-container" :style="{ width: isShort ? '60px' : '300px' }">
    <section class="main-section" @click="setBurgerMenu">
      <slot name="main" :is-short="isShort" />
    </section>
    <section class="additional-section">
      <slot name="additional" :is-short="isShort" :toggle="toggle" />
    </section>
  </aside>

  <!-- мобильный -->
  <Teleport to="body">
    <aside
      v-if="isMobile && isBurgerMenuOpen"
      class="sidebar-container mobile-view"
      :style="{ width: isShort ? '60px' : '220px' }"
    >
      <section class="main-section" @click="setBurgerMenu">
        <slot name="main" :is-short="isShort" />
      </section>
      <section class="additional-section">
        <slot name="additional" :is-short="isShort" :toggle="toggle" />
      </section>
    </aside>
  </Teleport>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  setup() {
    const store = useStore();
    const isShort = ref(true);

    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const isBurgerMenuOpen = computed(() => store.getters['burgerMenu/isOpen']);
    const toggle = () => {
      isShort.value = !isShort.value;
    };

    const setBurgerMenu = () => {
      if (isMobile.value) {
        store.dispatch('burgerMenu/setBurger', { isOpen: false });
      }
    };

    watch(
      () => store.getters['mobile/breakPoint'],
      (breakPoint) => {
        isShort.value = breakPoint !== 'mobile';
      },
      { immediate: true }
    );

    return {
      isMobile,
      isShort,
      toggle,
      isBurgerMenuOpen,
      setBurgerMenu,
    };
  },
});
</script>
<style scoped lang="scss">
.sidebar-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: space-between;
  /* матовое стекло */
  background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px); /* для Safari */
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  padding: 15px;
  height: calc(100vh - var(--header-height));
  & .main-section {
    cursor: pointer;
    max-height: 70vh;
    overflow-y: auto;
    /* Скрыть скроллбар в разных браузерах */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE и Edge */

    &::-webkit-scrollbar {
      /* Chrome, Safari, Opera */
      display: none;
    }
  }

  & .additional-section {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2rem;
  }
}

.mobile-view {
  position: fixed;
  width: 100% !important;
  z-index: 9;
  backdrop-filter: blur(40px);
  bottom: 0;
  top: var(--header-height);
}
</style>
