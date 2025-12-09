<template>
  <app-toaster></app-toaster>
  <app-dialog></app-dialog>
  <router-view />
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import AppToaster from '@/shared/components/AppToaster.vue';
import AppDialog from '@/shared/components/dialog/AppDialog.vue';
// @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: { AppDialog, AppToaster },
  setup() {
    const windowWidth = ref(document.documentElement.clientWidth);
    const store = useStore();
    const { locale } = useI18n();
    store.dispatch('theme/initTheme');
    store.dispatch('language/initLanguage');

    onMounted(() => {
      iNoBounce.enable();
      document.addEventListener('focusout', () => {
        setTimeout(() => window.scrollTo(0, 0), 50);
      });
    });
    watch(
      () => store.getters['language/language'],
      (lang) => {
        locale.value = lang;
      },
      { immediate: true }
    );
    const updateWidth = () => {
      windowWidth.value = document.documentElement.clientWidth;
      store.dispatch('mobile/setClientWidth', { clientWidth: windowWidth.value });
    };

    onMounted(() => {
      store.dispatch('mobile/setClientWidth', { clientWidth: windowWidth.value });
      window.addEventListener('resize', updateWidth);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateWidth);
    });
  },
});
</script>
<style lang="scss"></style>
