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
            <div class="stepper__title">{{ step.title }}</div>
            <div v-if="step.subtitle" class="stepper__subtitle">{{ step.subtitle }}</div>
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type StepItem = { id?: string | number; title: string; subtitle?: string; disabled?: boolean };

const props = defineProps<{
  steps: StepItem[];
  activeIndex?: number;
  orientation?: 'horizontal' | 'vertical';
  linear?: boolean;
  clickable?: boolean;
  showPanel?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:activeIndex', value: number): void;
  (e: 'change', value: number, prev: number): void;
  (e: 'next', value: number): void;
  (e: 'prev', value: number): void;
}>();

const orientation = computed(() => props.orientation ?? 'horizontal');
const showPanel = computed(() => props.showPanel ?? true);
const clickable = computed(() => props.clickable ?? true);
const linear = computed(() => props.linear ?? false);

const internalIndex = ref(props.activeIndex ?? 0);
watch(
  () => props.activeIndex,
  (v) => {
    if (typeof v === 'number' && v >= 0 && v < props.steps.length) internalIndex.value = v;
  }
);

const completedUntil = ref(internalIndex.value); // для linear режима

function isStepDisabled() {
  return false;
}

function stateOf(i: number) {
  if (i < internalIndex.value) return 'completed';
  if (i === internalIndex.value) return 'active';
  return 'pending';
}

function itemClass(i: number) {
  return [`is-${stateOf(i)}`, props.steps[i]?.disabled ? 'is-disabled' : ''];
}

function connectorClass(i: number) {
  const completed = i < internalIndex.value;
  return [completed ? 'is-completed' : 'is-pending', `connector--${orientation.value}`];
}

function setActive(next: number) {
  const prev = internalIndex.value;
  if (next === prev) return;
  internalIndex.value = next;
  if (linear.value) completedUntil.value = Math.max(completedUntil.value, next);
  emit('update:activeIndex', next);
  emit('change', next, prev);
}

function onStepClick(i: number) {
  if (!clickable.value) return;
  setActive(i);
}

function next() {
  const nextIndex = Math.min(props.steps.length - 1, internalIndex.value + 1);
  setActive(nextIndex);
  emit('next', nextIndex);
}

function prev() {
  const prevIndex = Math.max(0, internalIndex.value - 1);
  setActive(prevIndex);
  emit('prev', prevIndex);
}

function tabId(i: number) {
  const base = props.steps[i]?.id ?? i;
  return `stepper-tab-${base}`;
}
function panelId(i: number) {
  const base = props.steps[i]?.id ?? i;
  return `stepper-panel-${base}`;
}

function onKey(i: number, e: KeyboardEvent) {
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
}

defineExpose({ next, prev, setActive });
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
}
.stepper__item.is-completed .stepper__marker {
  background: var(--active-doing);
  border-color: var(--active-doing);
}

.stepper__content {
  display: flex;
  flex-direction: column;
}
.stepper__title {
  font-size: 0.95rem;
  color: #222;
}
.stepper__subtitle {
  font-size: 0.8rem;
  color: #666;
}

.stepper__connector {
  align-self: center;
}
.connector--horizontal {
  width: 200px;
  height: 2px;
  background: #ddd;

  @media (max-width: 600px) {
    width: 80px;
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
