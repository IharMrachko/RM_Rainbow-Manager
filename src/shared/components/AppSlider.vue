<template>
  <div class="slider-container" :class="{ disabled: props.disabled, vertical: props.vertical }">
    <div class="slider-wrapper" @click="handleSliderClick">
      <!-- Прогресс бар -->
      <div class="slider-track">
        <div
          class="slider-progress"
          :style="{ width: `${((normalizedValue - props.min) / (props.max - props.min)) * 100}%` }"
        ></div>
      </div>

      <!-- Ползунок -->
      <div
        ref="sliderThumb"
        class="slider-thumb"
        :style="{ left: `${((normalizedValue - props.min) / (props.max - props.min)) * 100}%` }"
        tabindex="0"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @keydown="handleKeydown"
        @click="focusThumb"
      >
        <!-- Tooltip с текущим значением -->
        <div v-if="props.showTooltip" class="slider-tooltip">
          {{ formatValue(normalizedValue) }}
        </div>
      </div>

      <!-- Деления (опционально) -->
      <div v-if="props.showMarks" class="slider-marks">
        <div
          v-for="(mark, index) in props.marks"
          :key="index"
          class="slider-mark"
          :style="{ left: `${((mark.value - props.min) / (props.max - props.min)) * 100}%` }"
          :class="{ active: normalizedValue >= mark.value }"
          @click="handleMarkClick(mark.value)"
        >
          <span class="mark-label">{{ mark.label }}</span>
        </div>
      </div>
    </div>

    <!-- Инпуты для точного значения (опционально) -->
    <div v-if="props.showInput" class="slider-input-container">
      <input
        v-model.number="inputValue"
        type="number"
        :min="props.min"
        :max="props.max"
        :step="props.step"
        class="slider-input"
        :disabled="props.disabled"
        @change="handleInputChange"
      />
      <span class="slider-input-suffix">{{ props.suffix }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue';

interface Mark {
  value: number;
  label: string;
}

export default defineComponent({
  name: 'AppSlider',

  props: {
    // Основные параметры
    modelValue: {
      type: Number,
      required: true,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },

    // Опции отображения
    showTooltip: {
      type: Boolean,
      default: true,
    },
    showMarks: {
      type: Boolean,
      default: false,
    },
    showInput: {
      type: Boolean,
      default: false,
    },
    marks: {
      type: Array as () => Mark[],
      default: () => [],
    },

    // Форматирование
    suffix: {
      type: String,
      default: '',
    },
    format: {
      type: Function as unknown as () => ((value: number) => string) | null,
      default: null,
    },

    // Стили
    vertical: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },

    // Цвета
    trackColor: {
      type: String,
      default: '#e0e0e0',
    },
    progressColor: {
      type: String,
      default: '#4CAF50',
    },
    thumbColor: {
      type: String,
      default: '#4CAF50',
    },
  },

  emits: ['update:modelValue', 'change', 'input', 'drag-start', 'drag-end'],

  setup(props, { emit }) {
    // Refs
    const sliderThumb = ref<HTMLElement | null>(null);
    const isDragging = ref(false);
    const inputValue = ref(props.modelValue);

    // Computed
    const normalizedValue = computed(() => {
      let value = props.modelValue;

      // Ограничиваем значение в пределах min/max
      if (value < props.min) value = props.min;
      if (value > props.max) value = props.max;

      // Округляем до ближайшего step
      const steps = Math.round((value - props.min) / props.step);
      return props.min + steps * props.step;
    });

    const focusThumb = (event: MouseEvent) => {
      event.stopPropagation();
      if (sliderThumb.value) {
        sliderThumb.value.focus();
      }
    };

    // Форматирование значения
    const formatValue = (value: number): string => {
      if (props.format && typeof props.format === 'function') {
        return props.format(value);
      }
      return value + props.suffix;
    };

    // Обработка начала перетаскивания
    const startDrag = (event: MouseEvent | TouchEvent): void => {
      if (props.disabled) return;

      isDragging.value = true;
      emit('drag-start', normalizedValue.value);

      // Предотвращаем выделение текста
      event.preventDefault();

      // Добавляем обработчики для всего документа
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('touchmove', handleDrag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      document.addEventListener('touchcancel', stopDrag);
    };

    // Обработка перетаскивания
    const handleDrag = (event: MouseEvent | TouchEvent): void => {
      if (!isDragging.value || props.disabled) return;

      event.preventDefault();

      const clientX = (event as MouseEvent).clientX || (event as TouchEvent).touches?.[0]?.clientX;
      if (!clientX) return;

      // Получаем позицию относительно слайдера
      const sliderRect = sliderThumb.value?.parentElement?.getBoundingClientRect();
      if (!sliderRect) return;

      const offsetX = clientX - sliderRect.left;
      const width = sliderRect.width;

      // Рассчитываем новое значение
      let percentage = offsetX / width;
      if (percentage < 0) percentage = 0;
      if (percentage > 1) percentage = 1;

      let newValue = props.min + percentage * (props.max - props.min);

      // Округляем до step
      const steps = Math.round((newValue - props.min) / props.step);
      newValue = props.min + steps * props.step;

      // Ограничиваем min/max
      newValue = Math.max(props.min, Math.min(props.max, newValue));

      // Обновляем значение
      updateValue(newValue);
    };

    // Остановка перетаскивания
    const stopDrag = (): void => {
      if (!isDragging.value) return;

      isDragging.value = false;
      emit('drag-end', normalizedValue.value);

      // Удаляем обработчики
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('touchmove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      document.removeEventListener('touchcancel', stopDrag);
    };

    // Обработка клика по слайдеру
    const handleSliderClick = (event: MouseEvent): void => {
      if (props.disabled) return;

      const sliderRect = sliderThumb.value?.parentElement?.getBoundingClientRect();
      if (!sliderRect) return;

      const offsetX = event.clientX - sliderRect.left;
      const width = sliderRect.width;

      let percentage = offsetX / width;
      if (percentage < 0) percentage = 0;
      if (percentage > 1) percentage = 1;

      let newValue = props.min + percentage * (props.max - props.min);

      // Округляем до step
      const steps = Math.round((newValue - props.min) / props.step);
      newValue = props.min + steps * props.step;

      updateValue(newValue);
    };

    // Обработка клика по метке
    const handleMarkClick = (value: number): void => {
      if (props.disabled) return;
      updateValue(value);
    };

    // Обработка клавиатуры
    const handleKeydown = (event: KeyboardEvent): void => {
      if (props.disabled) return;

      let newValue = normalizedValue.value;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          newValue -= props.step;
          event.preventDefault();
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          newValue += props.step;
          event.preventDefault();
          break;
        case 'Home':
          newValue = props.min;
          event.preventDefault();
          break;
        case 'End':
          newValue = props.max;
          event.preventDefault();
          break;
        case 'PageDown':
          newValue -= props.step * 10;
          event.preventDefault();
          break;
        case 'PageUp':
          newValue += props.step * 10;
          event.preventDefault();
          break;
        default:
          return;
      }

      // Ограничиваем значение
      newValue = Math.max(props.min, Math.min(props.max, newValue));

      updateValue(newValue);
    };

    // Обработка изменения через input
    const handleInputChange = (): void => {
      let value = parseFloat(String(inputValue.value));

      if (isNaN(value)) {
        inputValue.value = normalizedValue.value;
        return;
      }

      // Ограничиваем значение
      value = Math.max(props.min, Math.min(props.max, value));

      // Округляем до step
      const steps = Math.round((value - props.min) / props.step);
      value = props.min + steps * props.step;

      updateValue(value);
      inputValue.value = value;
    };

    // Обновление значения
    const updateValue = (newValue: number): void => {
      const oldValue = normalizedValue.value;

      if (newValue !== oldValue && !props.disabled) {
        emit('update:modelValue', newValue);
        emit('change', newValue, oldValue);
        emit('input', newValue);
        inputValue.value = newValue;
      }
    };

    // Синхронизация inputValue с modelValue
    watch(
      () => props.modelValue,
      (newValue: number) => {
        inputValue.value = newValue;
      },
      { immediate: true }
    );

    // Убираем слушатели при размонтировании
    onUnmounted(() => {
      stopDrag();
    });

    // Возвращаем все методы и значения для использования в шаблоне
    return {
      // refs
      sliderThumb,
      inputValue,

      // computed
      normalizedValue,

      // methods
      formatValue,
      startDrag,
      handleSliderClick,
      handleMarkClick,
      handleKeydown,
      handleInputChange,

      // props для использования в шаблоне
      props,
      focusThumb,
    };
  },
});
</script>

<style scoped>
.slider-container {
  position: relative;
  width: 100%;
  user-select: none;

  @media (max-width: 600px) {
    padding: 0;
  }
}

.slider-wrapper {
  position: relative;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.slider-track {
  position: absolute;
  width: 100%;
  height: 4px;
  background-color: v-bind('props.trackColor');
  border-radius: 2px;
}

.slider-progress {
  position: absolute;
  height: 100%;
  background-color: v-bind('props.progressColor');
  border-radius: 2px;
  transition: width 0.1s ease;
}

.slider-thumb {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: v-bind('props.thumbColor');
  border-radius: 50%;
  transform: translateX(-50%);
  cursor: grab;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  z-index: 2;
}

.slider-thumb:hover {
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.slider-thumb:active {
  cursor: grabbing;
  transform: translateX(-50%) scale(1.2);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.slider-thumb:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(v-bind('props.thumbColor'), 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-10px);
  background-color: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.slider-thumb:hover .slider-tooltip,
.slider-thumb:active .slider-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-15px);
}

.slider-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #333;
}

.slider-marks {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.slider-mark {
  position: absolute;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  width: 2px;
  height: 12px;
  background-color: #ccc;
  cursor: pointer;
  pointer-events: auto;
  transition: background-color 0.2s;
}

.slider-mark.active {
  background-color: v-bind('props.progressColor');
}

.slider-mark:hover {
  background-color: #999;
}

.mark-label {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.slider-input-container {
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 5px;
}

.slider-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.slider-input:focus {
  outline: none;
  border-color: v-bind('props.thumbColor');
}

.slider-input-suffix {
  font-size: 14px;
  color: #666;
}

/* Вертикальный слайдер */
.slider-container.vertical {
  width: auto;
  height: 100%;
  padding: 0 20px;
}

.slider-container.vertical .slider-wrapper {
  width: 40px;
  height: 100%;
}

.slider-container.vertical .slider-track {
  width: 4px;
  height: 100%;
  left: 50%;
  transform: translateX(-50%);
}

.slider-container.vertical .slider-progress {
  width: 100%;
  height: v-bind('`${((normalizedValue - props.min) / (props.max - props.min)) * 100}%`');
}

.slider-container.vertical .slider-thumb {
  left: 50%;
  top: v-bind('`${100 - ((normalizedValue - props.min) / (props.max - props.min)) * 100}%`');
  transform: translate(-50%, 50%);
}

.slider-container.vertical .slider-thumb:hover {
  transform: translate(-50%, 50%) scale(1.1);
}

/* Состояние disabled */
.slider-container.disabled .slider-wrapper {
  cursor: not-allowed;
}

.slider-container.disabled .slider-track,
.slider-container.disabled .slider-progress,
.slider-container.disabled .slider-thumb {
  opacity: 0.6;
}

.slider-container.disabled .slider-thumb {
  cursor: not-allowed;
}

.slider-container.disabled .slider-thumb:hover {
  transform: translateX(-50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider-container.disabled .slider-mark {
  cursor: not-allowed;
}
</style>
