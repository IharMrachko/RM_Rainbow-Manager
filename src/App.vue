<template>
  <div class="container">
    <app-toaster></app-toaster>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import AppToaster from '@/components/shared/AppToaster.vue';
</script>
<style lang="scss">
.container {
  height: 100vh;
  background: linear-gradient(-135deg, #c850c0, #4158d0);
}
</style>
