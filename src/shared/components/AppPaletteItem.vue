<template>
  <div
    class="palette-item"
    :style="{ backgroundColor: color }"
    :class="{ selected: selected }"
    @click="selectedColor(color)"
  >
    <font-awesome-icon
      v-if="selected"
      class="check-icon"
      :icon="['fas', 'check']"
      :style="{ color: checkIconColor }"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  components: {
    FontAwesomeIcon,
  },
  props: {
    color: {
      type: String,
      default: '',
    },
    selectedMode: {
      type: Boolean,
      default: false,
    },
    selectedColors: {
      type: Set as PropType<Set<string>>,
      default: () => new Set(),
    },
  },
  emits: ['selectedColor'],
  setup(props, { emit }) {
    const selected = ref(false);
    const selectedColorsArray = computed(() => Array.from(props.selectedColors || []));
    // Функция для определения темный или светлый цвет
    const isDarkColor = computed(() => {
      if (!props.color) return true; // по умолчанию считаем темным

      try {
        let r, g, b;

        // Обработка hex формата (#ffffff или ffffff)
        if (props.color.startsWith('#')) {
          const hex = props.color.substring(1);
          if (hex.length === 3) {
            // #fff format
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
          } else if (hex.length === 6) {
            // #ffffff format
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
          } else {
            return true; // невалидный hex
          }
        }
        // Обработка rgb/rgba формата
        else if (props.color.startsWith('rgb')) {
          const match = props.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            r = parseInt(match[1], 10);
            g = parseInt(match[2], 10);
            b = parseInt(match[3], 10);
          } else {
            return true;
          }
        }
        // Обработка названий цветов (basic)
        else if (
          ['white', '#fff', '#ffffff', 'rgb(255,255,255)', 'rgba(255,255,255'].some((c) =>
            props.color.toLowerCase().includes(c.toLowerCase())
          )
        ) {
          return false; // белый цвет - светлый
        } else {
          return true; // другие названия считаем темными
        }

        // Формула восприятия яркости (стандартная)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Если яркость меньше 128 - цвет считается темным
        return brightness < 128;
      } catch (error) {
        console.warn('Error calculating color brightness:', error);
        return true; // по умолчанию темный
      }
    });

    // Цвет галочки зависит от фона
    const checkIconColor = computed(() => {
      return isDarkColor.value ? '#ffffff' : '#000000';
    });

    // Тень для галочки зависит от фона
    const checkIconShadow = computed(() => {
      return isDarkColor.value
        ? '0 1px 2px rgba(0, 0, 0, 0.7)'
        : '0 1px 2px rgba(255, 255, 255, 0.7)';
    });

    const toggle = () => {
      if (props.selectedMode) {
        selected.value = !selected.value;
      }
    };

    const selectedColor = (color: string) => {
      toggle();
      emit('selectedColor', { color: color, selected: selected.value });
    };

    watch(
      selectedColorsArray,
      (value) => {
        if (props.selectedMode) {
          selected.value = value.includes(props.color);
        }
      },
      { immediate: true }
    );
    return {
      selected,
      checkIconColor,
      checkIconShadow,
      selectedColor,
    };
  },
});
</script>

<style scoped lang="scss">
.palette-item {
  width: 30px;
  height: 30px;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.selected {
  transform: scale(1.2);

  .check-icon {
    opacity: 1;
  }
}

.check-icon {
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s ease;
  filter: drop-shadow(v-bind(checkIconShadow));
}
</style>
