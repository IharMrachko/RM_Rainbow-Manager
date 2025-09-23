<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          <span class="toast-icon">
            <font-awesome-icon :icon="iconClass(toast.type)" />
          </span>
          <span class="toast-message">{{ toast.message }}</span>
          <div class="toast-progress" :style="{ animationDuration: toast.duration + 'ms' }"></div>
          <!-- Кнопка удаления -->
          <div class="toast-delete" @click="deleteToast(toast.id)">
            <font-awesome-icon :icon="['fas', 'times-circle']" />
          </div>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { ToastType } from '@/store/modules/toast';

export default defineComponent({
  setup() {
    const store = useStore();
    const toasts = computed(() => store.state.toast.toasts);
    const deleteToast = (id: number) => {
      store.dispatch('toast/deleteToast', {
        id,
      });
    };
    const iconClass = (type: ToastType) => {
      switch (type) {
        case 'success':
          return ['fas', 'check-circle'];
        case 'error':
          return ['fas', 'times-circle'];
        case 'info':
          return ['fas', 'info-circle'];
        case 'warning':
          return ['fas', 'exclamation-triangle'];
        default:
          return ['fas', 'times-circle'];
      }
    };
    return {
      toasts,
      iconClass,
      deleteToast,
    };
  },
});
</script>

<style scoped lang="scss">
$toast-colors: (
  success: #57b846,
  error: #f44336,
  info: #2196f3,
  warning: #ff9800,
);

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
}

.toast {
  min-width: 280px;
  max-width: 360px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 3px 6px 18px rgba(0, 0, 0, 0.45);
  background-color: rgba(0, 0, 0, 0.8);
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  &.success {
    .toast-icon {
      color: map-get($toast-colors, success);
    }
    .toast-progress {
      background-color: map-get($toast-colors, success);
    }
  }
  &.error {
    .toast-icon {
      color: map-get($toast-colors, error);
    }
    .toast-progress {
      background-color: map-get($toast-colors, error);
    }
  }
  &.info {
    .toast-icon {
      color: map-get($toast-colors, info);
    }
    .toast-progress {
      background-color: map-get($toast-colors, info);
    }
  }
  &.warning {
    .toast-icon {
      color: map-get($toast-colors, warning);
    }
    .toast-progress {
      background-color: map-get($toast-colors, warning);
    }
  }

  .toast-icon {
    font-size: 1.2rem;
    flex-shrink: 0;
    opacity: 0.9;
  }

  .toast-message {
    flex: 1;
    color: #e6e6e6;
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.7);
    animation-name: progress;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  .toast-delete {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
    pointer-events: auto; // чтобы клик работал

    svg {
      color: #fff;
    }
  }
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0;
  }
}

/* Анимация появления/исчезновения */
.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.toast-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.toast-enter-active {
  transition: all 0.4s ease-out;
}

.toast-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.toast-leave-active {
  transition: all 0.4s ease-in;
}
</style>
