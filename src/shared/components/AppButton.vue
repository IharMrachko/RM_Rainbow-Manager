<template>
  <div class="container-btn">
    <button :disabled="disabled || loading" class="btn" :class="typeBtn">
      <span v-if="!loading">{{ title }}</span>
      <span v-else class="loader"></span>
    </button>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ColorType } from '@/types/color.type';

export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    typeBtn: {
      type: String as PropType<ColorType>,
      default: 'success',
    },
  },
});
</script>
<style scoped lang="scss">
@import '@/styles/style';
button {
  outline: none !important;
  border: none;
  background: transparent;
}

.btn {
  font-weight: bold;
  font-size: 15px;
  line-height: 1.5;
  color: #fff;
  text-transform: uppercase;
  width: 100%;
  height: 50px;
  border-radius: 25px;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 25px;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
  transition: all 0.4s;

  &.success {
    background-color: map-get($type-colors, success);
  }
  &.error {
    background-color: map-get($type-colors, error);
  }
  &.info {
    background-color: map-get($type-colors, info);
  }
  &.warning {
    background-color: map-get($type-colors, warning);
  }
}

.btn:hover {
  cursor: pointer;
  background: #333333;
}

.btn:disabled {
  background-color: #ccc; // тусклый фон
  color: #666; // тусклый текст
  cursor: not-allowed; // курсор "запрещено"
  opacity: 0.7; // лёгкая прозрачность
  pointer-events: none; // полностью убираем кликабельность
}

/* Лоадер */
.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
