<template>
  <div class="container">
    <app-header>
      <section class="header-section">
        <section>
          <app-toggle v-model="isDark" variant="theme" @toggled="toggled"></app-toggle>
          <div class="app-dropdown">
            <app-dropdown v-model="language" label="name">
              <app-option v-for="item in languages" :key="item" :value="item">{{
                item
              }}</app-option>
            </app-dropdown>
          </div>
        </section>

        <span class="logout" @click="logout">
          <font-awesome-icon size="xl" :icon="['fas', 'right-from-bracket']" />
        </span>
      </section>
    </app-header>

    <app-toaster></app-toaster>
    <router-view />
  </div>
</template>

<script lang="ts">
import AppToaster from '@/shared/components/AppToaster.vue';
import AppToggle from '@/shared/components/AppToggle.vue';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import AppOption from '@/shared/components/dropdown/AppOption.vue';
import AppHeader from '@/shared/components/AppHeader.vue';
import { defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
  components: { AppOption, AppDropdown, AppHeader, AppToggle, AppToaster },
  setup() {
    const router = useRouter();
    const store = useStore();
    const containerRef = ref<HTMLElement | null>(null);
    const isVisible = ref(true);
    const languages = ref(['en', 'ru']);
    const language = ref(store.getters['language/language']);
    const isDark = ref(store.getters['theme/isDark']);
    const toggled = (isDark: boolean) => {
      store.dispatch('theme/setTheme', isDark);
    };

    watch(language, (newValue) => {
      store.dispatch('language/setLanguage', { language: newValue });
    });

    const logout = async () => {
      await store.dispatch('authFirebase/logout');
      await router.push('/login');
    };

    return {
      toggled,
      isDark,
      containerRef,
      isVisible,
      language,
      languages,
      logout,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
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
    }

    & .logout {
      cursor: pointer;
    }
  }
}
</style>
