<template>
  <div
    :class="{ cardSelected: isSelected }"
    class="preview"
    :style="{ background: selectedHex.color }"
    aria-hidden="true"
    @click="selected"
  ></div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  props: {
    selectedHex: {
      type: Object as PropType<{ id: number; color: string }>,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['selected'],
  setup(props, { emit }) {
    const selected = () => {
      emit('selected', props.selectedHex);
    };
    return {
      selected,
    };
  },
});
</script>
<style scoped lang="scss">
.preview.cardSelected {
  transform: scale(1.2);
}

.preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
}
</style>
