<template>
  <div
    class="stepper"
    :class="['stepper--' + orientation]"
    role="tablist"
    :aria-orientation="orientation"
  >
    <template v-for="(step, i) in steps" :key="step.id ?? i">
      <button
        :id="tabId(i)"
        class="stepper__item"
        :class="itemClass(i)"
        role="tab"
        :aria-selected="i === internalIndex"
        :aria-controls="panelId(i)"
        :disabled="isStepDisabled(i)"
        @click="onStepClick(i)"
        @keydown="onKey(i, $event)"
      >
        <span class="stepper__marker">
          <slot name="marker" :index="i" :state="stateOf(i)">
            <span class="stepper__index">{{ i + 1 }}</span>
          </slot>
        </span>

        <span class="stepper__content">
          <slot name="label" :index="i" :state="stateOf(i)">
            <div class="stepper__title">{{ t(step.title) }}</div>
            <div v-if="step.subtitle" class="stepper__subtitle">
              {{ t(step.subtitle) }}
            </div>
          </slot>
        </span>
      </button>

      <div
        v-if="i < steps.length - 1"
        class="stepper__connector"
        :class="connectorClass(i)"
        aria-hidden="true"
      />
    </template>

    <div
      v-if="showPanel"
      :id="panelId(internalIndex)"
      class="stepper__panel"
      role="tabpanel"
      :aria-labelledby="tabId(internalIndex)"
    >
      <slot name="panel" :index="internalIndex" :step="steps[internalIndex]" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type StepItem = { id?: string | number; title: string; subtitle?: string; disabled?: boolean };

export default defineComponent({
  name: 'AppStepper',
  props: {
    steps: { type: Array as () => StepItem[], required: true },
    activeIndex: { type: Number, default: 0 },
    orientation: { type: String as () => 'horizontal' | 'vertical', default: 'horizontal' },
    linear: { type: Boolean, default: false },
    clickable: { type: Boolean, default: true },
    showPanel: { type: Boolean, default: true },
  },
  emits: ['update:activeIndex', 'change', 'next', 'prev'],
  setup(props, { emit, expose }) {
    const { t } = useI18n();
    const orientation = computed(() => props.orientation ?? 'horizontal');
    const clickable = computed(() => props.clickable ?? true);
    const linear = computed(() => props.linear ?? false);

    const internalIndex = ref(props.activeIndex ?? 0);
    watch(
      () => props.activeIndex,
      (v) => {
        if (v >= 0 && v < props.steps.length) internalIndex.value = v;
      }
    );

    const completedUntil = ref(internalIndex.value);

    const isStepDisabled = (): boolean => false;

    const stateOf = (i: number): string => {
      if (i < internalIndex.value) return 'completed';
      if (i === internalIndex.value) return 'active';
      return 'pending';
    };

    const itemClass = (i: number): string[] => [
      `is-${stateOf(i)}`,
      props.steps[i]?.disabled ? 'is-disabled' : '',
    ];

    const connectorClass = (i: number): string[] => {
      const completed = i < internalIndex.value;
      return [completed ? 'is-completed' : 'is-pending', `connector--${orientation.value}`];
    };

    const setActive = (next: number): void => {
      const prev = internalIndex.value;
      if (next === prev) return;
      internalIndex.value = next;
      if (linear.value) completedUntil.value = Math.max(completedUntil.value, next);
      emit('update:activeIndex', next);
      emit('change', next, prev);
    };

    const onStepClick = (i: number): void => {
      if (!clickable.value) return;
      setActive(i);
    };

    const next = (): void => {
      const nextIndex = Math.min(props.steps.length - 1, internalIndex.value + 1);
      setActive(nextIndex);
      emit('next', nextIndex);
    };

    const prev = (): void => {
      const prevIndex = Math.max(0, internalIndex.value - 1);
      setActive(prevIndex);
      emit('prev', prevIndex);
    };

    const tabId = (i: number): string => {
      const base = props.steps[i]?.id ?? i;
      return `stepper-tab-${base}`;
    };

    const panelId = (i: number): string => {
      const base = props.steps[i]?.id ?? i;
      return `stepper-panel-${base}`;
    };

    const onKey = (i: number, e: KeyboardEvent): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStepClick(i);
        return;
      }
      if (orientation.value === 'horizontal') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prev();
        }
      } else {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          next();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          prev();
        }
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setActive(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        setActive(props.steps.length - 1);
      }
    };

    expose({ next, prev, setActive });

    return {
      internalIndex,
      completedUntil,
      isStepDisabled,
      stateOf,
      itemClass,
      connectorClass,
      setActive,
      onStepClick,
      next,
      prev,
      tabId,
      panelId,
      onKey,
      t,
    };
  },
});
</script>

<style scoped>
.stepper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  flex-wrap: wrap;
}
.stepper--horizontal {
  flex-direction: row;
}
.stepper--vertical {
  flex-direction: column;
}

.stepper__item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-align: left;
  color: var(--color-text);
}
.stepper__item.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stepper__marker {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 2px solid #ddd;
  font-size: 0.85rem;
}
.stepper__item.is-active .stepper__marker {
  border-color: var(--active-doing);
  color: var(--color-text);
}
.stepper__item.is-completed .stepper__marker {
  background: var(--active-doing);
  border-color: var(--active-doing);
  color: #000;
}

.stepper__content {
  display: flex;
  flex-direction: column;
}
.stepper__title {
  font-size: 0.95rem;
  color: var(--color-text);
}
.stepper__subtitle {
  font-size: 0.8rem;
  color: var(--color-text);
}

.stepper__connector {
  align-self: center;
}
.connector--horizontal {
  width: 200px;
  height: 2px;
  background: #ddd;

  @media (max-width: 600px) {
    width: 20px;
  }
}
.connector--vertical {
  width: 2px;
  height: 24px;
  background: #ddd;
}
.stepper__connector.is-completed {
  background: var(--active-doing);
}

.stepper__panel {
  flex: 1 1 100%;
  padding-top: 0.75rem;
}
</style>
