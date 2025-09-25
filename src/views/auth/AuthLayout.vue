<template>
  <div class="container">
    <app-header>
      <app-toggle v-model="isDark" variant="theme" @toggled="toggled"></app-toggle>
    </app-header>
    <app-toaster></app-toaster>
    <router-view />
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import AppToaster from '@/shared/components/AppToaster.vue';
import AppToggle from '@/shared/components/AppToggle.vue';
import AppHeader from '@/shared/components/AppHeader.vue';
import { useStore } from 'vuex';

export default defineComponent({
  components: { AppHeader, AppToggle, AppToaster },
  setup() {
    const store = useStore();
    const isDark = ref(store.getters['theme/isDark']);
    const toggled = (isDark: boolean) => {
      store.dispatch('theme/setTheme', isDark);
    };
    return {
      toggled,
      isDark,
    };
  },
});
</script>
<style lang="scss">
.container {
  height: calc(100vh - var(--header-height));
}
</style>
