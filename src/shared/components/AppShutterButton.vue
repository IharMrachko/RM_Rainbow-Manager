<template>
  <button
    ref="btn"
    class="shutter"
    :class="{ active: isActive, pressed: isPressed }"
    aria-label="Сделать снимок"
    type="button"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @pointerleave="onPointerCancel"
    @click="emitCapture"
    @keydown.space.prevent="onKeyPress"
    @keydown.enter.prevent="onKeyPress"
  >
    <span class="ring" aria-hidden="true"></span>
    <span class="inner" aria-hidden="true"></span>

    <!-- ripple element -->
    <span v-if="ripple.visible" class="ripple" :style="ripple.style" />
  </button>
</template>
<script lang="ts">
import { defineComponent, nextTick, ref } from 'vue';

export default defineComponent({
  emits: ['capture'],
  setup(_, { emit }) {
    const btn = ref<HTMLButtonElement | null>(null);
    const isActive = ref(false);
    const isPressed = ref(false);

    const ripple = ref<{ visible: boolean; style: Record<string, string> }>({
      visible: false,
      style: {},
    });

    const emitCapture = () => {
      emit('capture');
      animateFlash();
    };

    const animateFlash = () => {
      if (!btn.value) return;
      isActive.value = true;
      setTimeout(() => (isActive.value = false), 120);
    };

    const onPointerDown = () => {
      isPressed.value = true;
      createRipple();
    };

    const onPointerUp = () => {
      isPressed.value = false;
    };

    const onPointerCancel = () => {
      isPressed.value = false;
    };

    const onKeyPress = () => {
      isPressed.value = true;
      setTimeout(() => (isPressed.value = false), 150);
      emitCapture();
    };

    const createRipple = () => {
      const el = btn.value;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const size = Math.max(rect.width, rect.height) * 1.6;
      ripple.value.style = {
        width: `${size}px`,
        height: `${size}px`,
        left: `${cx - size / 2}px`,
        top: `${cy - size / 2}px`,
        transform: 'scale(0.1)',
        opacity: '0.28',
      };
      ripple.value.visible = true;

      nextTick(() => {
        requestAnimationFrame(() => {
          ripple.value.style = {
            ...ripple.value.style,
            transition: 'transform 420ms cubic-bezier(.2,.9,.2,1), opacity 420ms linear',
            transform: 'scale(1)',
            opacity: '0',
          };
          setTimeout(() => {
            ripple.value.visible = false;
            ripple.value.style = {};
          }, 450);
        });
      });
    };

    return {
      btn,
      isActive,
      isPressed,
      ripple,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onKeyPress,
      emitCapture,
    };
  },
});
</script>
<style scoped lang="scss">
/* Контейнерная кнопка — стилизована как круг */
.shutter {
  --size-mobile: 78px; /* диаметр на мобильных */
  --size-desktop: 64px; /* диаметр на десктопе */
  --ring-gap: 6px;
  --ring-color: rgba(255, 255, 255, 0.95);
  --inner-color: #fff;
  --inner-pressed-scale: 0.86;
  --ring-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  --active-ring-scale: 0.92;

  display: inline-grid;
  place-items: center;
  border: none;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;

  width: var(--size-mobile);
  height: var(--size-mobile);
  border-radius: 50%;
  position: relative;
}

/* адаптивный размер */
@media (min-width: 680px) {
  .shutter {
    width: var(--size-desktop);
    height: var(--size-desktop);
  }
}

/* кольцо вокруг (тонкая внешняя рамка) */
.shutter .ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: var(--ring-shadow);
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.12), transparent 25%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.06));
  /* внешний ободок — полупрозрачный белый */
  border: calc(var(--ring-gap)) solid rgba(255, 255, 255, 0.92);
  box-sizing: border-box;
  transform-origin: center;
  transition: transform 140ms ease, box-shadow 140ms ease;
  z-index: 1;
}

/* центральная кнопка */
.shutter .inner {
  position: absolute;
  width: calc(100% - (var(--ring-gap) * 2));
  height: calc(100% - (var(--ring-gap) * 2));
  background: var(--inner-color);
  border-radius: 50%;
  z-index: 2;
  transform-origin: center;
  transition: transform 140ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 140ms ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25), inset 0 -6px 14px rgba(0, 0, 0, 0.06);
}

/* активная подсветка (имитация затвора камеры) */
.shutter.active .ring {
  transform: scale(var(--active-ring-scale));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
}

/* эффект нажатия — сжимает внутреннюю кнопку */
.shutter.pressed .inner {
  transform: scale(var(--inner-pressed-scale));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22), inset 0 -4px 10px rgba(0, 0, 0, 0.04);
}

/* ripple элемент */
.shutter .ripple {
  position: absolute;
  border-radius: 50%;
  background: #000;
  pointer-events: none;
  z-index: 0;
  will-change: transform, opacity;
  /* initial style устанавливается динамически через JS */
}

/* focus-visible accessibility */
.shutter:focus-visible {
  box-shadow: 0 0 0 4px rgba(0, 120, 255, 0.12);
}

/* disabled state (опционально) */
.shutter:disabled {
  cursor: default;
  opacity: 0.6;
  filter: grayscale(0.15);
  pointer-events: none;
}
</style>
