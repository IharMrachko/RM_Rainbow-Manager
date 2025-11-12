<template>
  <label
    class="rc"
    :class="{
      'rc--checked': modelValue,
      'rc--indeterminate': indeterminate,
      'rc--disabled': disabled,
      'rc--error': error,
    }"
    :style="styles"
    :for="id || undefined"
  >
    <span
      class="rc__control"
      role="checkbox"
      :aria-checked="ariaChecked"
      :aria-disabled="disabled ? 'true' : 'false'"
      :aria-readonly="readonly ? 'true' : 'false'"
      tabindex="0"
      @keydown="onKeydown"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @click="toggle"
    >
      <!-- Внутренние слои: внешний круг, заполнение, символ -->
      <span class="rc__ring" />
      <span class="rc__fill" />
      <span class="rc__mark" />
    </span>

    <span v-if="label" class="rc__label">{{ t(label) }}</span>

    <!-- Нативный input для форм/автозаполнения, визуально скрыт -->
    <input
      v-if="id"
      :id="id"
      type="checkbox"
      class="rc__native"
      :checked="modelValue"
      :disabled="disabled"
      :readonly="readonly"
      @change="toggle"
    />
  </label>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
    label: { type: String, default: '' },
    size: { type: Number, default: 24 },
    error: { type: Boolean, default: false },
    id: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'change', 'focus', 'blur'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { modelValue, disabled, readonly, indeterminate, size } = toRefs(props);
    const ariaChecked = computed(() =>
      indeterminate.value ? 'mixed' : modelValue.value ? 'true' : 'false'
    );

    const toggle = () => {
      if (disabled.value || readonly.value) return;
      const next = !modelValue.value;
      emit('update:modelValue', next);
      emit('change', next);
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    };

    const styles = computed(() => ({
      '--rc-size': `${size.value}px`,
    }));

    return {
      toggle,
      onKeydown,
      ariaChecked,
      styles,
      t,
    };
  },
});
</script>
<style scoped lang="scss">
.rc {
  --rc-size: 20px;
  --rc-color: #42b983;
  --rc-stroke: #c9d1d9;

  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.rc__control {
  width: var(--rc-size);
  height: var(--rc-size);

  border-radius: 50%;
  outline: none;
  display: flex;
  justify-content: right;
  position: relative;
}

.rc__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 2px var(--rc-stroke);
  transition: box-shadow 120ms ease;
  background: transparent;
}

.rc__fill {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: transparent;
  transform: scale(0);
  transition: transform 120ms ease, background-color 120ms ease;
}

.rc__mark {
  position: absolute;
  width: calc(var(--rc-size) * 0.9); /* больше круга */
  height: calc(var(--rc-size) * 0.45);
  border-left: 3px solid var(--active-doing);
  border-bottom: 3px solid var(--active-doing);
  transform: rotate(-45deg) scale(0);
  transform-origin: center;
  transition: transform 150ms ease;
  display: block;
}

/* Checked: основной цвет и метка */
.rc--checked .rc__fill {
  transform: scale(1);
}

.rc--checked .rc__ring {
  box-shadow: inset 0 0 0 2px var(--rc-color);
}

/* Маркер — либо “галочка”, либо “точка” внутри круга
   Здесь — точка, чтобы подчеркнуть круглую форму */
.rc--checked .rc__mark {
  transform: rotate(-45deg) scale(1);
}

/* Indeterminate: горизонтальная черта */
.rc--indeterminate .rc__fill {
  background: var(--rc-color);
  transform: scale(1);
}

.rc--indeterminate .rc__mark {
  width: calc(var(--rc-size) * 0.5);
  height: 2px;
  border-radius: 1px;
  background: white;
  transform: scale(1);
}

/* Фокус */
.rc__control:focus-visible .rc__ring {
  box-shadow: 0 0 0 3px rgba(47, 128, 237, 0.25), inset 0 0 0 2px var(--rc-color);
}

/* Disabled */
.rc--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.rc__label {
  font-size: 0.95rem;
}

/* Визуально скрытый, но доступный input для форм */
.rc__native {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}

/* Ошибка: красный акцент обводки */
.rc--error .rc__ring {
  box-shadow: inset 0 0 0 2px #e74c3c;
}
.rc--error.rc--checked .rc__ring {
  box-shadow: 0 0 0 0 transparent, inset 0 0 0 2px #e74c3c;
}
</style>
