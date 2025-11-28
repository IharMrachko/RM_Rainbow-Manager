<template>
  <section>
    <div ref="targetRef" class="dropdown-container" @click="toggle">
      <app-input
        v-model="valueRef"
        :height="height"
        :is-label="isTitle"
        :readonly="true"
        :disabled="disabled"
        :label="title"
      ></app-input>
      <button :disabled="disabled" type="button" class="toggle-btn" :class="{ withTitle: isTitle }">
        ▼
      </button>
      <app-overlay-panel v-if="targetRef" v-model:visible="visible" :target="targetRef">
        <div v-if="isSearch" class="search">
          <app-input
            v-model="searchValue"
            placeholder="search"
            :icon="['fas', 'search']"
            :is-label="false"
          ></app-input>
        </div>

        <slot></slot>
      </app-overlay-panel>
    </div>
  </section>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, provide, ref, watch } from 'vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';

export default defineComponent({
  components: { AppOverlayPanel, AppInput },
  props: {
    modelValue: {
      type: [String, Number, Object] as PropType<string | number | Record<string, unknown>>,
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
    height: {
      type: String,
      default: '32px',
    },
    isSearch: {
      type: Boolean,
      default: false,
    },
    isTitle: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'search'],
  setup(props, { emit }) {
    const modelValueRef = computed(() => props.modelValue);
    const valueRef = ref<unknown>(null);
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const searchValue = ref('');
    const toggle = () => {
      visible.value = !visible.value;
    };

    // функция выбора, которую будут вызывать AppOption
    const select = (value: unknown) => {
      if (typeof value === 'string') {
        valueRef.value = value;
      }
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
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
        const obj = props.modelValue as Record<string, unknown>;
        valueRef.value = obj[props.label] as string;
      }
    });

    provide('select', select);
    provide('selected', modelValueRef);
    watch(searchValue, (value) => {
      emit('search', value);
    });

    watch(
      () => props.modelValue,
      (newVal) => {
        if (typeof newVal === 'string') {
          valueRef.value = newVal;
        } else if (typeof newVal === 'object' && newVal !== null) {
          valueRef.value = (newVal as Record<string, unknown>)[props.label] as string;
        } else {
          valueRef.value = null;
        }
      },
      { immediate: true }
    );
    return {
      targetRef,
      visible,
      toggle,
      valueRef,
      searchValue,
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

.withTitle {
  top: 70%;
}

.search {
  padding: 20px;
}
</style>
