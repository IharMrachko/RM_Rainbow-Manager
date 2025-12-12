<template>
  <header class="header">
    <slot></slot>
  </header>
</template>
<script lang="ts"></script>
<style scoped lang="scss">
.header {
  height: var(--header-height);
  padding: 1rem 20px 1rem 15px;

  /* матовое стекло */
  background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
