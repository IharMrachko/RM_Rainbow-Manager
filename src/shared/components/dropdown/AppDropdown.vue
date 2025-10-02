<template>
  <section>
    <div ref="targetRef" class="dropdown-container" @click="toggle">
      <app-input
        v-model="valueRef"
        height="32px"
        :is-label="false"
        :readonly="true"
        :disabled="disabled"
      ></app-input>
      <button :disabled="disabled" type="button" class="toggle-btn">▼</button>
      <app-overlay-panel v-if="targetRef" v-model:visible="visible" :target="targetRef">
        <slot></slot>
      </app-overlay-panel>
    </div>
  </section>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, provide, ref } from 'vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';

export default defineComponent({
  components: { AppOverlayPanel, AppInput },
  props: {
    modelValue: {
      type: null as unknown as PropType<unknown>, // любой тип
      default: null,
    },
    label: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const modelValueRef = computed(() => props.modelValue);
    const valueRef = ref<any>(null);
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const toggle = () => {
      visible.value = !visible.value;
    };

    // функция выбора, которую будут вызывать AppOption
    const select = (value: unknown) => {
      if (typeof value === 'string') {
        valueRef.value = value;
      }
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, any>;
        valueRef.value = obj[props.label] as string;
      }
      emit('update:modelValue', value);
      visible.value = false;
    };

    onMounted(() => {
      if (typeof props.modelValue === 'string') {
        valueRef.value = props.modelValue;
      }
      if (typeof props.modelValue === 'object' && props.modelValue !== null) {
        const obj = props.modelValue as Record<string, any>;
        valueRef.value = obj[props.label] as string;
      }
    });

    provide('select', select);
    provide('selected', modelValueRef);

    return {
      targetRef,
      visible,
      toggle,
      valueRef,
    };
  },
});
</script>
<style scoped lang="scss">
.dropdown-container {
  position: relative;
}

.toggle-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: color 0.2s ease;
  z-index: 10;

  &:hover {
    color: #333;
  }
}
</style>
