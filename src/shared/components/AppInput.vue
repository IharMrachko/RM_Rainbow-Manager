<template>
  <section>
    <label v-if="isLabel" class="label" :for="type"> {{ t(label) }}</label>

    <div ref="wrapperRef" class="wrap-input validate-input">
      <input
        :id="type"
        ref="inputRef"
        :value="modelValue"
        class="input100"
        :class="{ pr: icon }"
        :type="type"
        :placeholder="t(placeholder)"
        :disabled="disabled"
        :readonly="readonly"
        :style="{ height }"
        @input="handleInput"
        @blur="handleBlur"
        @focus="showErrorToggle"
      />

      <span class="focus-input100"></span>
      <span v-if="icon" class="symbol-input100">
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
import { defineComponent, onMounted, PropType, ref, watch } from 'vue';
import { InputType } from '@/types/input.type';
import AppInputErrorOverlay from '@/shared/components/AppInputErrorOverlay.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: { AppInputErrorOverlay },
  props: {
    modelValue: { type: String, default: '' }, // для v-model
    error: { type: [String, Boolean], default: '' }, // ошибка извне (vee-validate)
    isLabel: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
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
      default: '',
    },
    zIndexTooltip: { type: Number, default: 1010 },
    height: {
      type: String as PropType<string>,
      default: '50px',
    },
    isFocused: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'blur', 'change', 'focus'],
  setup(props, { emit }) {
    const value = ref('');
    const { t } = useI18n();
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

    onMounted(() => {
      if (props.isFocused) {
        inputRef.value?.focus();
      }
    });

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
      t,
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
  border-radius: 25px;
  padding: 0 30px 0 20px;
  position: relative;
  z-index: 1;
}
.input100.pr {
  padding: 0 30px 0 68px;
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

.input100:disabled {
  background-color: #f0f0f0;
  color: #999;
  opacity: 0.5;
}

.input100::placeholder {
  text-transform: lowercase;
}
</style>
