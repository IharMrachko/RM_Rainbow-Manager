<template>
  <div class="dropdown-option" :class="{ 'is-selected': isSelected }" @click="onClick">
    <slot></slot>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, inject, PropType, Ref } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: [String, Number, Object] as PropType<string | number | Record<string, any>>,
      default: null,
    },
  },
  setup(props) {
    // eslint-disable-next-line no-unused-vars
    const select = inject<(value: unknown) => void>('select', () => {});
    const selected = inject<Ref<unknown>>('selected');
    const onClick = () => {
      if (select) {
        select(props.value);
      }
    };

    const isSelected = computed(() => {
      if (!selected) {
        return;
      }
      const current = selected.value;

      if (
        current &&
        typeof current === 'object' &&
        props.value &&
        typeof props.value === 'object'
      ) {
        const cur = current as Record<string, any>;
        const val = props.value as Record<string, any>;
        return cur.id === val.id;
      }

      return current === props.value;
    });

    return {
      onClick,
      isSelected,
    };
  },
});
</script>
<style scoped lang="scss">
.dropdown-option {
  cursor: pointer;
  padding: 5px 5px 5px 20px;
}

.dropdown-option.is-selected {
  background: #e6e6e6;
  font-weight: bold;
}
/* если выбран первый элемент */
.dropdown-option.is-selected:first-child {
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
}

/* если выбран последний элемент */
.dropdown-option.is-selected:last-child {
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
}
</style>
