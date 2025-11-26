import { computed, ref } from 'vue';

export function usePasswordToggle(initialType: 'password' | 'text' = 'password') {
  const typeInput = ref<'password' | 'text'>(initialType);

  const eyeIcon = computed(() =>
    typeInput.value === 'password' ? ['fas', 'eye-slash'] : ['fas', 'eye']
  );

  const toggleEye = () => {
    typeInput.value = typeInput.value === 'password' ? 'text' : 'password';
  };

  return {
    typeInput,
    eyeIcon,
    toggleEye,
  };
}
