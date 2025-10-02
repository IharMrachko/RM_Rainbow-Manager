<template>
  <div class="container">
    <app-header>
      <section class="header-section">
        <app-toggle v-model="isDark" variant="theme" @toggled="toggled"></app-toggle>
        <div class="app-dropdown">
          <app-dropdown v-model="language" label="name">
            <app-option v-for="item in languages" :key="item" :value="item">{{ item }}</app-option>
          </app-dropdown>
        </div>
      </section>
    </app-header>

    <app-toaster></app-toaster>
    <router-view />
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import AppToaster from '@/shared/components/AppToaster.vue';
import AppToggle from '@/shared/components/AppToggle.vue';
import AppHeader from '@/shared/components/AppHeader.vue';
import { useStore } from 'vuex';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import AppOption from '@/shared/components/dropdown/AppOption.vue';

export default defineComponent({
  components: { AppOption, AppDropdown, AppHeader, AppToggle, AppToaster },
  setup() {
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

    return {
      toggled,
      isDark,
      containerRef,
      isVisible,
      language,
      languages,
    };
  },
});
</script>
<style lang="scss">
.container {
  height: calc(100vh - var(--header-height));

  & .header-section {
    display: flex;

    & .app-dropdown {
      width: 100px;
      margin-left: 15px;
    }
  }
}
</style>
