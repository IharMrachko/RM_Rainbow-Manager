<template>
  <section>
    <label v-if="isPlaceholder" class="label" :for="type">{{ label }}</label>

    <div ref="wrapperRef" class="wrap-input validate-input">
      <input
        :id="type"
        ref="inputRef"
        :value="modelValue"
        class="input100"
        :type="type"
        :placeholder="placeholder"
        @input="handleInput"
        @blur="handleBlur"
        @focus="showErrorToggle"
      />

      <span class="focus-input100"></span>
      <span class="symbol-input100">
        <font-awesome-icon :icon="icon" />
      </span>
    </div>
    <app-input-error-overlay
      v-if="wrapperRef"
      :target="wrapperRef"
      :message="error"
      :visible="showError"
      :z-index="zIndexTooltip"
      @click="showErrorToggle"
    ></app-input-error-overlay>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue';
import { InputType } from '@/types/input.type';
import AppInputErrorOverlay from '@/components/shared/AppInputErrorOverlay.vue';

export default defineComponent({
  components: { AppInputErrorOverlay },
  props: {
    modelValue: { type: String, default: '' }, // для v-model
    error: { type: [String, Boolean], default: '' }, // ошибка извне (vee-validate)
    isPlaceholder: {
      type: Boolean,
      default: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    type: {
      type: String as PropType<InputType>,
      default: 'text',
    },
    label: {
      type: String,
      default: 'text',
    },
    icon: {
      type: [Array, String],
      required: true,
    },
    zIndexTooltip: { type: Number, default: 1010 },
  },
  emits: ['update:modelValue', 'blur', 'change', 'focus'],
  setup(props, { emit }) {
    const value = ref('');
    const showError = ref(false);
    const isFocused = ref(false);
    const inputRef = ref<HTMLInputElement | null>(null);
    const wrapperRef = ref<HTMLElement | null>(null);

    const showErrorToggle = () => {
      emit('focus');
      isFocused.value = true;
      inputRef.value?.focus();
      updateErrorVisibility();
    };

    const handleBlur = () => {
      emit('blur');
      isFocused.value = false;
      updateErrorVisibility();
    };

    const handleInput = (e: Event) => {
      emit('update:modelValue', (e.target as HTMLInputElement).value);
      isFocused.value = true;
      updateErrorVisibility();
    };

    const updateErrorVisibility = () => {
      showError.value = !isFocused.value && Boolean(props.error);
    };

    watch(
      () => props.error, // реактивный геттер
      () => {
        updateErrorVisibility();
      },
      { immediate: true } // чтобы сработало и при первом монтировании
    );

    return {
      value,
      showError,
      showErrorToggle,
      inputRef,
      wrapperRef,
      handleInput,
      handleBlur,
    };
  },
});
</script>
<style scoped lang="scss">
.label {
  display: block;
  text-align: left;
  padding: 0 1rem 0.3rem 1rem;
  font-weight: bold;
  font-size: 14px;
}
.wrap-input {
  position: relative;
}

input {
  outline: none;
  border: none;
}

.input100 {
  font-family: Poppins-Medium, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: #666;
  display: block;
  width: 100%;
  background: #e6e6e6;
  height: 50px;
  border-radius: 25px;
  padding: 0 30px 0 68px;
  position: relative;
  z-index: 1;
}

/* Подложка для свечения */
.focus-input100 {
  display: block;
  position: absolute;
  border-radius: 25px;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.symbol-input100 {
  font-size: 15px;
  display: -webkit-box;
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  align-items: center;
  position: absolute;
  border-radius: 25px;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding-left: 35px;
  pointer-events: none;
  color: #666666;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
  transition: all 0.4s;
  z-index: 1;
}

/* Запуск анимации при фокусе */
:deep(.input100:focus + .focus-input100) {
  animation: glow-fade 0.8s ease-in-out forwards;
}

:deep(.input100:focus) ~ .symbol-input100 {
  color: #57b846;
}

/* Кадры анимации */
@keyframes glow-fade {
  0% {
    box-shadow: 0 0 0 0 rgba(87, 184, 70, 0);
  }
  10% {
    box-shadow: 0 0 25px 10px rgba(87, 184, 70, 1); /* пик яркости */
  }
  100% {
    box-shadow: 0 0 0 0 rgba(87, 184, 70, 0); /* полное затухание */
  }
}

/* Плавное исчезновение placeholder */
.input100:focus::placeholder {
  color: transparent;
  transition: color 0.3s ease;
}
.validate-input {
  position: relative;
}
</style>
