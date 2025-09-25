<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  setup() {
    const store = useStore();
    store.dispatch('theme/initTheme');
  },
});
</script>
<style lang="scss"></style>
