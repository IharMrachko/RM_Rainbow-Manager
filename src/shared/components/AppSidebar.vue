<template>
  <aside
    v-if="!isMobile || (isMobile && isBurgerMenuOpen)"
    class="sidebar-container"
    :style="{ width: isShort ? '60px' : '220px' }"
    :class="{ 'mobile-view': isMobile }"
  >
    <section class="main-section">
      <router-link to="/main/color" active-class="active-link">
        <div class="sidebar-item">
          <div class="icon">
            <font-awesome-icon size="xl" :icon="['fas', 'rainbow']" />
          </div>
          <div v-if="!isShort" class="title">Color type</div>
        </div>
      </router-link>
      <router-link to="/main/gallery" active-class="active-link">
        <div class="sidebar-item">
          <div class="icon">
            <font-awesome-icon size="xl" :icon="['fas', 'images']" />
          </div>
          <div v-if="!isShort" class="title">Gallery</div>
        </div>
      </router-link>
    </section>
    <section class="additional-section">
      <div class="sidebar-item" @click="logout">
        <div class="icon">
          <font-awesome-icon size="xl" :icon="['fas', 'right-from-bracket']" />
        </div>
        <div v-if="!isShort" class="title">Logout</div>
      </div>

      <div v-if="!isMobile" class="sidebar-item" @click="toggle">
        <font-awesome-icon
          size="xl"
          :icon="isShort ? ['fas', 'arrow-left'] : ['fas', 'arrow-right']"
        />
      </div>
    </section>
  </aside>
</template>
<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  setup() {
    const router = useRouter();
    const store = useStore();
    const isShort = ref(true);

    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const isBurgerMenuOpen = computed(() => store.getters['burgerMenu/isOpen']);
    const toggle = () => {
      isShort.value = !isShort.value;
    };

    watch(
      () => store.getters['mobile/breakPoint'],
      (breakPoint) => {
        isShort.value = breakPoint !== 'mobile';
      },
      { immediate: true }
    );

    const logout = async () => {
      await store.dispatch('authFirebase/logout');
      await store.dispatch('burgerMenu/setBurger', { isOpen: false });
      await router.push('/login');
    };

    return {
      isMobile,
      isShort,
      toggle,
      logout,
      isBurgerMenuOpen,
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
  width: 300px;
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

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 15px;
  color: #ffffff;
}

.sidebar-item:hover {
  color: #00ffc6;
}

/* активная ссылка */
.active-link .sidebar-item {
  color: #ffd700; /* например, золотой акцент */
}

/* когда sidebar в режиме mobile-view */
.sidebar-container.mobile-view .sidebar-item {
  color: #000000; /* делаем чёрными */
}

.sidebar-container.mobile-view .active-link .sidebar-item {
  color: #42b983; /* например, зелёный акцент */
}
</style>
