<template>
  <div v-show="isActive">
    <slot />
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, inject, onMounted, ref } from 'vue';

type RegisterFn = (title: string, disabled: boolean) => number;
export default defineComponent({
  props: {
    title: { type: String, required: true },
    disabled: { type: Boolean, default: false },
  },
  setup: function (props, { slots }) {
    const register = inject<RegisterFn>('registerTab');
    const activeIndex = inject<{ value: number }>('activeIndex');

    const index = ref(-1);

    onMounted(() => {
      if (register) {
        index.value = register(props.title, props.disabled);
      }
    });

    const isActive = computed(() => activeIndex?.value === index.value);

    return { isActive, slots };
  },
});
</script>
<style scoped lang="scss">
.active {
  font-weight: bold;
}
</style>
