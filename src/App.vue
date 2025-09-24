<template>
  <div class="container">
    <app-header>
      <app-toggle v-model="isDarkMode" variant="theme" @toggled="toggled"></app-toggle>
    </app-header>
    <app-toaster></app-toaster>
    <router-view />
  </div>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import AppToaster from '@/components/shared/AppToaster.vue';
import AppToggle from '@/components/shared/AppToggle.vue';
import AppHeader from '@/components/shared/AppHeader.vue';

export default defineComponent({
  components: { AppHeader, AppToggle, AppToaster },
  setup() {
    const isDarkMode = ref(false);
    const toggled = (val: boolean) => {
      document.documentElement.classList.toggle('dark', val);
    };
    return {
      isDarkMode,
      toggled,
    };
  },
});
</script>
<style lang="scss">
.container {
  height: calc(100vh - 76px);
}
</style>
