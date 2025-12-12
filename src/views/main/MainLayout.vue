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
      <app-sidebar>
        <template #main="{ isShort }">
          <router-link to="/main/color" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'rainbow']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('masks') }}</div>
            </div>
          </router-link>

          <router-link to="/main/chroma" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'eye-dropper']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('characteristicColor') }}</div>
            </div>
          </router-link>
          <router-link to="/main/palette" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'palette']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('palette') }}</div>
            </div>
          </router-link>

          <router-link to="/main/ai-agent" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'microchip']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('aiAgent') }}</div>
            </div>
          </router-link>

          <router-link to="/main/gallery" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'images']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('gallery') }}</div>
            </div>
          </router-link>
        </template>

        <template #additional="{ isShort, toggle }">
          <div class="sidebar-item logout" @click="logout">
            <div class="icon">
              <font-awesome-icon size="xl" :icon="['fas', 'right-from-bracket']" />
            </div>
            <div v-if="!isShort" class="title">{{ t('logout') }}</div>
          </div>

          <div v-if="!isMobile" class="sidebar-item" @click="toggle">
            <font-awesome-icon
              size="xl"
              :icon="isShort ? ['fas', 'arrow-left'] : ['fas', 'arrow-right']"
            />
          </div>
        </template>
      </app-sidebar>
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
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

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
    const { t } = useI18n();
    const store = useStore();
    const router = useRouter();
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

    const logout = async () => {
      await store.dispatch('authFirebase/logout');
      await store.dispatch('burgerMenu/setBurger', { isOpen: false });
      await router.push('/signIn');
    };

    return {
      toggled,
      logout,
      t,
      isDark,
      language,
      languages,
      isMobile,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  min-height: 100dvh;
  overflow: auto;
  //overscroll-behavior: contain;
  //will-change: transform;
  //backface-visibility: hidden;
  //transform: translateZ(0);
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

@media (max-width: 600px) {
  .logout {
    margin-bottom: 75px;
  }
}
</style>
