<template>
  <label
    ref="switchEl"
    :class="[variant, { disabled }]"
    tabindex="0"
    :aria-disabled="disabled"
    class="switch"
    @keydown.space.prevent="onKeyToggle"
    @keydown.enter.prevent="onKeyToggle"
  >
    <input type="checkbox" :checked="modelValue" :disabled="disabled" @change="onToggle" />
    <span class="slider"> </span>
  </label>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { useToggle } from '@/composables/useToggle';

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    disabled: { type: Boolean, default: false },
    variant: { type: String as () => 'default' | 'theme', default: 'default' },
  },
  emits: ['update:modelValue', 'toggled'],
  setup(props, ctx) {
    return useToggle(props, ctx.emit);
  },
});
</script>
<style scoped lang="scss">
.switch {
  display: block;
  --width-of-switch: 3.5em;
  --height-of-switch: 2em;
  --size-of-icon: 1.4em;
  --slider-offset: 0.3em;
  position: relative;
  width: var(--width-of-switch);
  height: var(--height-of-switch);
  outline: none;

  input {
    position: absolute;
    opacity: 0;
    inset: 0;
    pointer-events: none;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    border-radius: 30px;
    transition: 0.4s;
  }

  .slider:before {
    content: '';
    position: absolute;
    height: var(--size-of-icon);
    width: var(--size-of-icon);
    border-radius: 20px;
    left: var(--slider-offset);
    top: 50%;
    transform: translateY(-50%);
    transition: 0.4s;
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* Тема по умолчанию */
.switch.default {
  .slider {
    background-color: #f4f4f5;
  }
  .slider:before {
    background: grey;
  }
  input:checked + .slider {
    background-color: #e6e6e6;
  }
  input:checked + .slider:before {
    background-color: red;
    left: calc(100% - (var(--size-of-icon) + var(--slider-offset)));
  }
}

/* Тёмная тема */
.switch.theme {
  .slider {
    background-color: #f4f4f5;
  }
  .slider:before {
    background: linear-gradient(40deg, #ff0080, #ff8c00 70%);
  }
  input:checked + .slider {
    background-color: #303136;
  }
  input:checked + .slider:before {
    background: #303136;
    box-shadow: inset -3px -2px 5px -2px #8983f7, inset -10px -4px 0 0 #a3dafb;
    left: calc(100% - (var(--size-of-icon) + var(--slider-offset)));
  }
}
</style>
