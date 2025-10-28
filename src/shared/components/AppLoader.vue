<template>
  <div class="loader-container">
    <div class="loader"></div>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped lang="scss">
/* Лоадер */
.loader-container {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
}

.loader {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(256, 256, 256, 0.5);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
