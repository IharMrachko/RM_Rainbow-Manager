import { onMounted, ref } from 'vue';

interface ToggleComposableEmit {
  (event: 'update:modelValue', value: boolean): void;
  (event: 'toggled', value: boolean): void;
}
export function useToggle(
  props: { modelValue: boolean; disabled: boolean },
  emit: ToggleComposableEmit
) {
  const switchEl = ref<HTMLElement | null>(null);
  const onToggle = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.checked);
    emit('toggled', target.checked);
  };

  const onKeyToggle = () => {
    if (props.disabled) return;
    emit('update:modelValue', !props.modelValue);
    emit('toggled', !props.modelValue);
  };

  onMounted(() => {
    if (!props.disabled && switchEl.value) {
      switchEl.value.focus();
    }
  });

  return { onToggle, onKeyToggle, switchEl };
}
