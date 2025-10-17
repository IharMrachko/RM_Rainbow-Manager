<template>
  <div class="container">
    <app-header>
      <section class="header-section">
        <img src="../../assets/rainbow.svg" alt="App Logo" width="32" height="32" />
        <section>
          <app-toggle v-model="isDark" variant="theme" @toggled="toggled"></app-toggle>
          <div class="app-dropdown">
            <app-dropdown v-model="language" label="name">
              <app-option v-for="item in languages" :key="item" :value="item"
                >{{ item }}
              </app-option>
            </app-dropdown>
          </div>
          <app-burger-menu v-if="isMobile"></app-burger-menu>
        </section>
      </section>
    </app-header>
    <section>
      <app-sidebar></app-sidebar>
      <main class="main">
        <router-view />
      </main>
    </section>
  </div>
</template>

<script lang="ts">
import AppToggle from '@/shared/components/AppToggle.vue';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import AppOption from '@/shared/components/dropdown/AppOption.vue';
import AppHeader from '@/shared/components/AppHeader.vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';
import AppSidebar from '@/shared/components/AppSidebar.vue';
import AppBurgerMenu from '@/shared/components/AppBurgerMenu.vue';

export default defineComponent({
  components: {
    AppBurgerMenu,
    AppSidebar,
    AppOption,
    AppDropdown,
    AppHeader,
    AppToggle,
  },
  setup() {
    const store = useStore();
    const containerRef = ref<HTMLElement | null>(null);
    const isVisible = ref(true);
    const languages = ref(['en', 'ru']);
    const language = ref(store.getters['language/language']);
    const isDark = ref(store.getters['theme/isDark']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const toggled = (isDark: boolean) => {
      store.dispatch('theme/setTheme', isDark);
    };

    watch(language, (newValue) => {
      store.dispatch('language/setLanguage', { language: newValue });
    });

    return {
      toggled,
      isDark,
      containerRef,
      isVisible,
      language,
      languages,
      isMobile,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  & section {
    display: flex;
  }

  & .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    & section {
      display: flex;
      align-items: center;
    }

    & .app-dropdown {
      width: 100px;
      margin-left: 15px;
      margin-right: 15px;
    }
  }

  .main {
    width: 100%;
  }
}
</style>
