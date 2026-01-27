<script setup lang="ts"></script>

<template>
  <div class="popover-item">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.popover-item {
  padding: 15px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #444;
  position: relative;
}
</style>
