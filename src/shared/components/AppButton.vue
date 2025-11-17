<template>
  <div class="container-btn">
    <button :disabled="disabled || loading" :class="classes">
      <span v-if="icon" class="btn-icon">
        <font-awesome-icon size="lg" :icon="icon" />
      </span>
      <span v-if="title && !loading" class="btn-title">{{ t(title) }}</span>
      <span v-else-if="loading" class="loader"></span>
    </button>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { Severity } from '@/types/color.type';
import { useI18n } from 'vue-i18n';

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
    severity: {
      type: String as PropType<Severity>,
      default: 'success',
    },
    raised: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: [Array, String],
      default: '',
    },
  },
  setup(props) {
    const { t } = useI18n();
    const classes = computed(() => ['btn', `${props.severity}`, { raised: props.raised }]);
    return { t, classes };
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
  &.secondary {
    background-color: map-get($type-colors, secondary);
    color: #111111;
  }

  &.raised {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 2px 2px 6px #c5c5c5, -2px -2px 6px #ffffff;
    color: #444;
    gap: 8px;

    & .btn-icon {
      color: #444;
    }

    & .btn-title {
      margin-left: 10px;
      font-weight: 600;
      font-size: 20px;
    }
  }
}

.btn:not(.raised):hover {
  cursor: pointer;
  background: #333333;
}

.btn.raised:active {
  box-shadow: inset 2px 2px 6px #c5c5c5, inset -2px -2px 6px #ffffff;
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
