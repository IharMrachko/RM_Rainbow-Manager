<template>
  <div class="container">
    <div ref="containerRef">
      <app-header>
        <app-toggle v-model="isDark" variant="theme" @toggled="toggled"></app-toggle>
        <app-overlay-panel :target="containerRef"></app-overlay-panel>
      </app-header>
    </div>
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
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';

export default defineComponent({
  components: { AppOverlayPanel, AppHeader, AppToggle, AppToaster },
  setup() {
    const containerRef = ref<HTMLElement | null>(null);
    const store = useStore();
    const isDark = ref(store.getters['theme/isDark']);
    const toggled = (isDark: boolean) => {
      store.dispatch('theme/setTheme', isDark);
    };
    return {
      toggled,
      isDark,
      containerRef,
    };
  },
});
</script>
<style lang="scss">
.container {
  height: calc(100vh - var(--header-height));
}
</style>
