<template>
  <div class="container">
    <app-header>
      <section class="header-section">
        <img src="../../assets/rainbow.svg" alt="App Logo" width="32" height="32" />
        <section>
          <app-toggle v-model="isDark" variant="theme" @toggled="toggled"></app-toggle>
          <app-dropdown v-model="language" label="name">
            <app-option v-for="item in languages" :key="item" :value="item">{{ item }} </app-option>
          </app-dropdown>
          <app-burger-menu v-if="isMobile"></app-burger-menu>
        </section>
      </section>
    </app-header>

    <section class="open-layout">
      <app-sidebar>
        <template #main="{ isShort }">
          <router-link to="/home" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'home']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('home') }}</div>
            </div>
          </router-link>
          <router-link to="/FAQ" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'question-circle']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('FAQ') }}</div>
            </div>
          </router-link>
          <router-link to="/contacts" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'contact-card']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('contacts') }}</div>
            </div>
          </router-link>
          <router-link to="/signIn" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'sign-in']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('login') }}</div>
            </div>
          </router-link>

          <router-link to="/signUp" active-class="active-link">
            <div class="sidebar-item">
              <div class="icon">
                <font-awesome-icon size="xl" :icon="['fas', 'user-plus']" />
              </div>
              <div v-if="!isShort" class="title">{{ t('signUp') }}</div>
            </div>
          </router-link>
        </template>

        <template #additional="{ isShort, toggle }">
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
import { computed, defineComponent, ref, watch } from 'vue';

import { useStore } from 'vuex';
import AppSidebar from '@/shared/components/AppSidebar.vue';
import AppOption from '@/shared/components/dropdown/AppOption.vue';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import AppHeader from '@/shared/components/AppHeader.vue';
import AppToggle from '@/shared/components/AppToggle.vue';
import { useI18n } from 'vue-i18n';
import AppBurgerMenu from '@/shared/components/AppBurgerMenu.vue';

export default defineComponent({
  components: { AppBurgerMenu, AppSidebar, AppOption, AppDropdown, AppHeader, AppToggle },
  setup() {
    const { t } = useI18n();
    const store = useStore();
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
      language,
      languages,
      isMobile,
      t,
    };
  },
});
</script>
<style lang="scss">
.container {
  min-height: 100dvh;
  overflow: auto;
  overscroll-behavior: contain;
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);

  & .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    & section {
      display: flex;
      align-items: center;
      gap: 14px;
    }
  }

  & .open-layout {
    display: flex;

    & .main {
      width: 100%;
    }
  }
}
</style>
