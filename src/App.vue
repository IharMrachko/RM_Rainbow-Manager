<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  setup() {
    const store = useStore();
    const { locale } = useI18n();
    store.dispatch('theme/initTheme');
    store.dispatch('language/initLanguage');
    watch(
      () => store.getters['language/language'],
      (lang) => {
        locale.value = lang;
      },
      { immediate: true }
    );
  },
});
</script>
<style lang="scss"></style>
