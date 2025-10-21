<template>
  <div class="tabs">
    <nav class="tab-headers">
      <ul>
        <li
          v-for="tab in tabs"
          :key="tab.index"
          :class="{ active: activeIndex === tab.index, disabled: tab.disabled }"
          @click="setActive(tab.index)"
        >
          <a>
            {{ tab.title }}
          </a>
        </li>
      </ul>
    </nav>
    <div class="tab-content">
      <slot />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, provide, reactive, ref, watch } from 'vue';

export default defineComponent({
  props: {
    modelValue: { type: Number, default: 2 },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const activeIndex = ref(props.modelValue);

    const tabs = reactive<{ title: string; index: number; disabled: boolean }[]>([]);

    const register = (title: string, disabled: boolean) => {
      const index = tabs.length;
      tabs.push({ title, index, disabled });
      return index;
    };

    const setActive = (i: number) => {
      const tab = tabs[i];
      if (!tab || tab.disabled) return; // не переключаемся на disabled
      activeIndex.value = i;
      emit('update:modelValue', i);
      emit('change', i);
    };

    provide('registerTab', register);
    provide('activeIndex', activeIndex);

    // следим за внешним v-model
    watch(
      () => props.modelValue,
      (val) => {
        const tab = tabs[val];
        if (tab && !tab.disabled) {
          activeIndex.value = val;
        } else {
          // если disabled — ищем первую доступную
          const firstEnabled = tabs.find((t) => !t.disabled);
          if (firstEnabled) {
            activeIndex.value = firstEnabled.index;
            emit('update:modelValue', firstEnabled.index);
          }
        }
      }
    );

    // инициализация: если default указывает на disabled
    watch(
      tabs,
      () => {
        const current = tabs[activeIndex.value];
        if (!current || current.disabled) {
          const firstEnabled = tabs.find((t) => !t.disabled);
          if (firstEnabled) {
            activeIndex.value = firstEnabled.index;
            emit('update:modelValue', firstEnabled.index);
          }
        }
      },
      { immediate: true }
    );

    return { tabs, activeIndex, setActive };
  },
});
</script>
<style scoped lang="scss">
@import '@/styles/style';
.tabs {
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  width: 100%;
  font-weight: 300;
  font-size: 1.25em;
  background: var(--color-wrap-bg);
}

.tabs nav ul {
  position: relative;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: -moz-flex;
  display: -ms-flex;
  display: flex;
  margin: 0 auto;
  padding: 0;
  max-width: 1200px;
  list-style: none;
  -ms-box-orient: horizontal;
  -ms-box-pack: center;
  -webkit-flex-flow: row wrap;
  -moz-flex-flow: row wrap;
  -ms-flex-flow: row wrap;
  flex-flow: row wrap;
  -webkit-justify-content: center;
  -moz-justify-content: center;
  -ms-justify-content: center;
  justify-content: center;
}
.tabs nav ul li {
  position: relative;
  z-index: 1;
  display: block;
  margin: 0;
  text-align: center;
  -webkit-flex: 1;
  -moz-flex: 1;
  -ms-flex: 1;
  flex: 1;
}

.tabs nav ul li.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tabs nav li.active a {
  color: map-get($type-colors, success);
  -webkit-transform: translate3d(0, 8px, 0);
  transform: translate3d(0, 8px, 0);
}

.tabs nav {
  text-align: center;
}

.tabs nav li::before {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: map-get($type-colors, success);
  content: '';
  transform: scaleX(0); /* изначально скрыт */
  transform-origin: left center; /* анимация слева направо */
  transition: transform 0.2s ease; /* плавный переход */
}

.tabs nav li.active::before {
  transform: scaleX(1); /* при активном табе линия разворачивается */
}
.tabs nav a {
  padding: 10px;
  color: #74777b;
  -webkit-transition: color 0.3s, -webkit-transform 0.3s;
  transition: color 0.3s, transform 0.3s;
  position: relative;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  height: 45px;
}
</style>
