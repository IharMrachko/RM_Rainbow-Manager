<template>
  <section>
    <span v-if="title" class="title">{{ title }}</span>
    <div ref="targetRef" class="dropdown-container" @click="toggle">
      <div class="dropdown-value" :style="{ height }">
        <span>
          {{ valueRef }}
        </span>
      </div>
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
            @focus="focusInput"
            @blur="focusOutInput"
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
  emits: ['update:modelValue', 'search', 'focusInput', 'focusOutInput'],
  setup(props, { emit }) {
    const modelValueRef = computed(() => props.modelValue);
    const valueRef = ref<unknown>(null);
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const searchValue = ref('');

    const toggle = () => {
      visible.value = !visible.value;
      if (!visible.value) {
        emit('focusOutInput');
      }

      if (!visible.value) {
        searchValue.value = '';
        emit('search', '');
      }
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
      searchValue.value = '';
      emit('search', '');
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

    const focusInput = () => {
      emit('focusInput');
    };

    const focusOutInput = () => {
      emit('focusOutInput');
    };
    return {
      targetRef,
      visible,
      toggle,
      valueRef,
      searchValue,
      focusInput,
      focusOutInput,
    };
  },
});
</script>
<style scoped lang="scss">
.dropdown-container {
  position: relative;
  cursor: pointer;
  width: 100%;
  min-width: 90px;

  & .dropdown-value {
    width: 100%;
    border-radius: 25px;
    padding: 0 30px 0 20px;
    position: relative;
    background: #e6e6e6;
    font-size: 17px;
    line-height: 1.5;
    color: #666;
    display: flex;
    align-items: center;
    & span {
      /* добавляем для обрезки текста */
      white-space: nowrap; /* запрет переноса строк */
      overflow: hidden; /* скрыть лишний текст */
      text-overflow: ellipsis; /* показать "…" */
    }
  }
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
  top: 50%;
}

.search {
  padding: 20px;
}
.title {
  display: block;
  text-align: left;
  padding: 0 1rem 0.3rem 1rem;
  font-weight: bold;
  font-size: 14px;
}
</style>
