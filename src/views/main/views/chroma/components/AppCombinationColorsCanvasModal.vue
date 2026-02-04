<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <div ref="targetRef" class="ellipsis-vertical" @click="toggleImageOverlayPanel">
      <font-awesome-icon size="lg" :icon="['fas', 'fa-ellipsis-vertical']" />
    </div>
    <app-overlay-panel
      v-if="targetRef"
      v-model:visible="visible"
      :width="250"
      :target="targetRef"
      :position="{
        x: 'left',
        y: 'center',
      }"
    >
      <div class="overlay-image">
        <div class="overlay-image-item" @click="openFolderModal">
          <font-awesome-icon size="sm" :icon="['fas', 'fa-folder']" />
          {{ t('addFolder') }}
        </div>
        <div class="overlay-image-item" @click="downloadCollage">
          <font-awesome-icon size="sm" :icon="['fas', 'download']" />
          {{ t('download') }}
        </div>
      </div>
    </app-overlay-panel>
    <div ref="containerRef" class="color-harmony-canvas">
      <AppLoader v-if="isLoading" />
      <canvas
        ref="canvasRef"
        class="high-quality-canvas"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </div>
    <footer class="footer">
      <div class="info-section-wrapper">
        <div class="badge-wrapper">
          <span v-if="folder" class="badge darkBadge">{{ folder?.name }}</span>
        </div>
        <app-input
          v-model="signIn"
          :icon="['fas', 'fa-pencil']"
          :is-label="false"
          @focus="focusInput"
          @blur="focusOutInput"
        ></app-input>

        <div class="actions">
          <div class="btn">
            <app-button
              :loading="isSaveGallery"
              severity="warning"
              title="saveToGallery"
              @click="saveToGallery"
            ></app-button>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppLoader from '@/shared/components/AppLoader.vue';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppFolderModal from '@/shared/components/folder-modal/AppFolderModal.vue';
import { Folder } from '@/store/modules/folder';
// @ts-ignore
import iNoBounce from 'inobounce';

export interface ColorHarmonyItem {
  label: string;
  color: string;
}

export default defineComponent({
  components: { AppOverlayPanel, AppLoader, AppInput, AppButton, AppModalHeader },
  props: {
    // Верхняя секция: основной цвет
    mainColor: {
      type: Object as () => ColorHarmonyItem,
      default: () => ({ label: 'Основной цвет', color: '#4A90E2' }),
    },

    // Первая секция: сочетания
    colorItems: {
      type: Array as () => ColorHarmonyItem[],
      required: true,
      default: () => [],
    },

    // Вторая секция: комбинации
    scaleItems: {
      type: Array as () => ColorHarmonyItem[],
      default: () => [],
    },

    // Размер квадратов для нижних секций
    squareSize: {
      type: Number,
      default: 100,
    },

    // Размер главного квадрата
    mainSquareSize: {
      type: Number,
      default: 120,
    },

    // Отступы
    padding: {
      type: Number,
      default: 20,
    },

    // Настройки текста
    textColor: {
      type: String,
      default: 'auto',
    },

    fontSize: {
      type: Number,
      default: 14,
    },

    fontWeight: {
      type: String,
      default: 'normal',
    },

    // Показывать ли разделительные линии
    showDividers: {
      type: Boolean,
      default: true,
    },

    // Цвета заголовков
    mainTitleColor: {
      type: String,
      default: '#333333',
    },

    combinationTitleColor: {
      type: String,
      default: '#333333',
    },

    compositionTitleColor: {
      type: String,
      default: '#333333',
    },

    // Стиль главного квадрата
    mainSquareBorderRadius: {
      type: Number,
      default: 12,
    },

    mainSquareShadow: {
      type: Boolean,
      default: true,
    },

    // Минимальная ширина канваса
    minWidth: {
      type: Number,
      default: 320,
    },

    // Минимальная высота канваса
    minHeight: {
      type: Number,
      default: 400,
    },

    // Максимальная ширина канваса
    maxWidth: {
      type: [Number, String],
      default: 800,
    },

    // Расстояние между квадратами
    spacing: {
      type: Number,
      default: 20,
    },

    // Отступ между секциями
    sectionSpacing: {
      type: Number,
      default: 40,
    },
  },
  emits: ['resolve', 'reject', 'close'],

  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const targetRef = ref<HTMLElement | null>(null);
    const isLoading = ref(false);
    const visible = ref(false);
    const isSaveGallery = ref(false);
    const folder = ref<Folder | null>(null);
    const signIn = ref('');
    // Динамически вычисляемые размеры
    const containerWidth = ref(0);
    const contentWidth = ref(0);
    const contentHeight = ref(0);

    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const device = computed(() => store.getters['mobile/getDevice']);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    // Получаем реальный pixel ratio устройства
    const getDevicePixelRatio = (): number => {
      return window.devicePixelRatio || 1;
    };

    // Вычисляем ширину на основе родительского контейнера
    const calculateContainerWidth = (): number => {
      if (!containerRef.value) return props.minWidth;

      // Получаем ширину родительского элемента
      const parent = containerRef.value.parentElement;
      const parentWidth = parent ? parent.clientWidth : window.innerWidth;

      // Применяем ограничения maxWidth
      let maxWidthValue = props.maxWidth;

      if (typeof maxWidthValue === 'string') {
        if (maxWidthValue.endsWith('%')) {
          // Процент от ширины родителя
          const percent = parseFloat(maxWidthValue) / 100;
          maxWidthValue = parentWidth * percent;
        } else {
          // Конвертируем строку в число
          maxWidthValue = parseFloat(maxWidthValue) || parentWidth;
        }
      }

      // Вычисляем фактическую ширину
      let width = Math.min(parentWidth, maxWidthValue);

      // Не меньше минимальной ширины
      width = Math.max(width, props.minWidth);

      return Math.floor(width);
    };

    // Вычисляем ширину содержимого (без padding)
    const calculateContentWidth = (): number => {
      const containerW = containerWidth.value;
      const padding = props.padding;
      return Math.max(containerW - padding * 2, 100);
    };

    // Вычисляем необходимую высоту содержимого
    const calculateContentHeight = (): number => {
      let height = 0;
      const headerSize = 20;
      const spacing = props.spacing;
      const sectionSpacing = props.sectionSpacing;

      // 1. Секция основного цвета
      height += props.padding; // отступ сверху
      height += headerSize; // заголовок "Основной цвет"
      height += spacing; // отступ после заголовка
      height += props.mainSquareSize; // главный квадрат
      height += sectionSpacing; // отступ после квадрата

      // Разделитель
      if (props.showDividers) height += 10;

      // 2. Секция сочетаний
      if (props.colorItems.length > 0) {
        height += headerSize; // заголовок "Сочетание"
        height += spacing; // отступ
        height += props.squareSize; // квадраты
        height += sectionSpacing; // отступ после квадратов

        // Разделитель
        if (props.showDividers && props.scaleItems.length > 0) {
          height += 10;
        }
      }

      // 3. Секция комбинаций
      if (props.scaleItems.length > 0) {
        height += headerSize; // заголовок "Комбинация"
        height += spacing; // отступ
        height += props.squareSize; // квадраты
        height += sectionSpacing; // отступ после квадратов
      }

      height += props.padding; // отступ снизу

      // Не меньше минимальной высоты
      return Math.max(height, props.minHeight);
    };

    // Обновляем все размеры
    const updateDimensions = (): void => {
      containerWidth.value = calculateContainerWidth();
      contentWidth.value = calculateContentWidth();
      contentHeight.value = calculateContentHeight();
    };

    // Вычисляемые размеры канваса
    const canvasWidth = computed(() => {
      const baseWidth = containerWidth.value > 0 ? containerWidth.value : props.minWidth;
      return Math.round(baseWidth * getDevicePixelRatio());
    });

    const canvasHeight = computed(() => {
      const totalHeight = contentHeight.value;
      const baseHeight = Math.max(totalHeight, props.minHeight);
      return Math.round(baseHeight * getDevicePixelRatio());
    });

    // Яркость цвета для определения цвета текста
    const getColorBrightness = (hex: string): number => {
      const cleanHex = hex.replace('#', '');
      let r: number, g: number, b: number;

      if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
      } else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
      } else {
        return 128;
      }

      return (r * 299 + g * 587 + b * 114) / 1000;
    };

    const getTextColor = (backgroundColor: string): string => {
      const brightness = getColorBrightness(backgroundColor);
      return brightness > 140 ? '#000000' : '#FFFFFF';
    };

    // Отрисовка заголовка секции
    const drawSectionHeader = (
      title: string,
      x: number,
      y: number, // уже в физических пикселях
      color: string = '#333333'
    ): number => {
      if (!ctx.value) return y;

      const ratio = getDevicePixelRatio();
      const fontSize = 20 * ratio;

      ctx.value.save();
      ctx.value.fillStyle = color;
      ctx.value.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.value.textAlign = 'center';
      ctx.value.textBaseline = 'top';
      ctx.value.fillText(title, x, y);
      ctx.value.restore();

      return y + fontSize;
    };

    // Отрисовка разделительной линии
    const drawDivider = (y: number): void => {
      if (!ctx.value || !canvasRef.value || !props.showDividers) return;

      const ratio = getDevicePixelRatio();
      const padding = props.padding * ratio;

      ctx.value.save();
      ctx.value.strokeStyle = '#E0E0E0';
      ctx.value.lineWidth = ratio;
      ctx.value.setLineDash([5 * ratio, 3 * ratio]);

      ctx.value.beginPath();
      ctx.value.moveTo(padding, y);
      ctx.value.lineTo(canvasRef.value.width - padding, y);
      ctx.value.stroke();

      ctx.value.restore();
    };

    // Отрисовка главного квадрата с цветом
    const drawMainColorSquare = (startY: number): number => {
      if (!ctx.value || !canvasRef.value || !props.mainColor) return startY;

      const ratio = getDevicePixelRatio();
      const centerX = canvasRef.value.width / 2;

      // Ограничиваем размер квадрата шириной контента
      const maxSquareSize = contentWidth.value * ratio * 0.8;
      const mainSquareSize = Math.min(props.mainSquareSize * ratio, maxSquareSize);

      const x = centerX - mainSquareSize / 2;
      const headerY = startY * ratio;

      // 1. Заголовок секции
      const afterHeaderY = drawSectionHeader(
        t('mainColor'),
        centerX,
        headerY,
        props.mainTitleColor
      );

      // Квадрат начинается после заголовка + отступ
      const squareY = afterHeaderY + 20 * ratio;

      // 2. Рисуем главный квадрат с эффектами
      ctx.value.save();

      // Тень
      if (props.mainSquareShadow) {
        ctx.value.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.value.shadowBlur = 10 * ratio;
        ctx.value.shadowOffsetX = 0;
        ctx.value.shadowOffsetY = 4 * ratio;
      }

      // Скругленные углы
      if (props.mainSquareBorderRadius > 0) {
        const radius = props.mainSquareBorderRadius * ratio;
        ctx.value.beginPath();
        ctx.value.moveTo(x + radius, squareY);
        ctx.value.lineTo(x + mainSquareSize - radius, squareY);
        ctx.value.quadraticCurveTo(
          x + mainSquareSize,
          squareY,
          x + mainSquareSize,
          squareY + radius
        );
        ctx.value.lineTo(x + mainSquareSize, squareY + mainSquareSize - radius);
        ctx.value.quadraticCurveTo(
          x + mainSquareSize,
          squareY + mainSquareSize,
          x + mainSquareSize - radius,
          squareY + mainSquareSize
        );
        ctx.value.lineTo(x + radius, squareY + mainSquareSize);
        ctx.value.quadraticCurveTo(
          x,
          squareY + mainSquareSize,
          x,
          squareY + mainSquareSize - radius
        );
        ctx.value.lineTo(x, squareY + radius);
        ctx.value.quadraticCurveTo(x, squareY, x + radius, squareY);
        ctx.value.closePath();
        ctx.value.fillStyle = props.mainColor.color;
        ctx.value.fill();
      } else {
        // Прямоугольник без скруглений
        ctx.value.fillStyle = props.mainColor.color;
        ctx.value.fillRect(x, squareY, mainSquareSize, mainSquareSize);
      }

      // Сбрасываем тень
      ctx.value.shadowColor = 'transparent';
      ctx.value.shadowBlur = 0;

      // Обводка
      ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.value.lineWidth = 2 * ratio;
      if (props.mainSquareBorderRadius > 0) {
        ctx.value.stroke();
      } else {
        ctx.value.strokeRect(x, squareY, mainSquareSize, mainSquareSize);
      }

      ctx.value.restore();

      // 3. Текст внутри квадрата
      const textColor = getTextColor(props.mainColor.color);
      const textX = centerX;
      const textY = squareY + mainSquareSize / 2;

      // Основной текст (HEX)
      ctx.value.save();
      ctx.value.fillStyle = textColor;
      ctx.value.font = `bold ${24 * ratio}px system-ui, sans-serif`;
      ctx.value.textAlign = 'center';
      ctx.value.textBaseline = 'middle';
      ctx.value.globalAlpha = 1;
      ctx.value.fillText(props.mainColor.color.toUpperCase(), textX, textY - 2 * ratio);

      // Название цвета (если есть)
      if (props.mainColor.label) {
        ctx.value.font = `${16 * ratio}px system-ui, sans-serif`;
        ctx.value.fillText(props.mainColor.label, textX, textY + 30 * ratio);
      }
      ctx.value.restore();

      // 4. Возвращаем Y позицию после секции (в логических пикселях)
      return (squareY + mainSquareSize + 40 * ratio) / ratio;
    };

    // Отрисовка секции с квадратами
    const drawSection = (
      items: ColorHarmonyItem[],
      startY: number, // логические пиксели
      title: string,
      titleColor: string
    ): number => {
      if (!ctx.value || !canvasRef.value || items.length === 0) return startY;

      const ratio = getDevicePixelRatio();
      const centerX = canvasRef.value.width / 2;

      // 1. Заголовок секции
      const headerY = startY * ratio;
      const afterHeaderY = drawSectionHeader(title, centerX, headerY, titleColor);

      // 2. Адаптивный размер квадратов
      const maxItemWidth = (contentWidth.value * ratio) / Math.max(items.length, 1) - 20 * ratio;
      const itemSize = Math.min(props.squareSize * ratio, maxItemWidth);
      const spacing = 20 * ratio;

      const itemsStartY = afterHeaderY + 15 * ratio;

      // 3. Центрирование
      const totalWidth = items.length * itemSize + (items.length - 1) * spacing;
      const itemsStartX = (canvasRef.value.width - totalWidth) / 2;

      // 4. Отрисовка квадратов с тенями и скруглениями
      items.forEach((item, index) => {
        const x = itemsStartX + index * (itemSize + spacing);

        // Рисуем квадрат с эффектами
        drawItemWithEffects(item, x, itemsStartY, itemSize);

        // Рисуем подпись под квадратом (если есть текст)
        if (item.label && item.label.trim() !== '') {
          drawLabelUnderSquare(item.label, x, itemsStartY, itemSize);
        }
      });

      // Возвращаем Y позицию после секции (квадраты + подписи + отступ)
      return (itemsStartY + itemSize + 70 * ratio) / ratio;
    };

    // Отрисовка квадрата с тенью и скругленными углами
    const drawItemWithEffects = (
      item: ColorHarmonyItem,
      x: number,
      y: number,
      size: number
    ): void => {
      if (!ctx.value) return;

      const ratio = getDevicePixelRatio();

      // Радиус скругления (зависит от размера квадрата)
      const borderRadius = Math.min(12, size / 10); // Максимум 12px, минимум size/10

      ctx.value.save();

      // === 1. ТЕНЬ ===
      ctx.value.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.value.shadowBlur = 8 * ratio;
      ctx.value.shadowOffsetX = 0;
      ctx.value.shadowOffsetY = 3 * ratio;

      // === 2. КВАДРАТ С СКРУГЛЕННЫМИ УГЛАМИ ===
      ctx.value.beginPath();

      // Верхняя левая → верхняя правая
      ctx.value.moveTo(x + borderRadius, y);
      ctx.value.lineTo(x + size - borderRadius, y);
      ctx.value.quadraticCurveTo(x + size, y, x + size, y + borderRadius);

      // Верхняя правая → нижняя правая
      ctx.value.lineTo(x + size, y + size - borderRadius);
      ctx.value.quadraticCurveTo(x + size, y + size, x + size - borderRadius, y + size);

      // Нижняя правая → нижняя левая
      ctx.value.lineTo(x + borderRadius, y + size);
      ctx.value.quadraticCurveTo(x, y + size, x, y + size - borderRadius);

      // Нижняя левая → верхняя левая
      ctx.value.lineTo(x, y + borderRadius);
      ctx.value.quadraticCurveTo(x, y, x + borderRadius, y);

      ctx.value.closePath();

      // Заливка цветом
      ctx.value.fillStyle = item.color;
      ctx.value.fill();

      // Сбрасываем тень для обводки
      ctx.value.shadowColor = 'transparent';
      ctx.value.shadowBlur = 0;

      // === 3. ОБВОДКА ===
      ctx.value.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Белая полупрозрачная обводка
      ctx.value.lineWidth = 1.5 * ratio;
      ctx.value.stroke();

      ctx.value.restore();

      // === 4. HEX КОД ВНУТРИ КВАДРАТА ===
      const hexColor = getTextColor(item.color);
      const hexText = item.color.toUpperCase();
      const hexX = x + size / 2;
      const hexY = y + size / 2;

      ctx.value.save();
      ctx.value.fillStyle = hexColor;

      // Адаптивный размер шрифта HEX кода
      const hexFontSize = Math.max(10 * ratio, Math.min(14 * ratio, size / 8));
      ctx.value.font = `bold ${hexFontSize}px system-ui, sans-serif`;

      ctx.value.textAlign = 'center';
      ctx.value.textBaseline = 'middle';
      ctx.value.globalAlpha = 0.9;

      // Добавляем небольшую тень для лучшей читаемости
      ctx.value.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.value.shadowBlur = 2 * ratio;
      ctx.value.shadowOffsetX = 0;
      ctx.value.shadowOffsetY = ratio;

      ctx.value.fillText(hexText, hexX, hexY);
      ctx.value.restore();
    };

    // Отрисовка подписи под квадратом
    const drawLabelUnderSquare = (
      label: string,
      squareX: number,
      squareY: number,
      squareSize: number
    ): void => {
      if (!ctx.value) return;

      const ratio = getDevicePixelRatio();

      // Позиция текста (под квадратом с отступом)
      const textY = squareY + squareSize + 12 * ratio;
      const textX = squareX + squareSize / 2;

      // Адаптивный размер шрифта
      const baseFontSize = isMobile.value ? 8 : 14;
      const fontSize = Math.max(8, Math.min(baseFontSize, squareSize / 8)) * ratio;

      ctx.value.save();

      // Стиль текста
      ctx.value.fillStyle = '#333333';
      ctx.value.font = `500 ${fontSize}px system-ui, sans-serif`;
      ctx.value.textAlign = 'center';
      ctx.value.textBaseline = 'top';

      // Ограничиваем длину текста шириной квадрата
      const maxTextWidth = squareSize * 0.95;
      let displayText = label;

      // Проверяем ширину текста
      const metrics = ctx.value.measureText(displayText);
      if (metrics.width > maxTextWidth) {
        // Подбираем максимальное количество символов
        const avgCharWidth = metrics.width / displayText.length;
        const maxChars = Math.floor(maxTextWidth / avgCharWidth);

        if (maxChars >= 4) {
          displayText = displayText.substring(0, maxChars - 1) + '…';
        } else {
          displayText = displayText.substring(0, Math.min(3, displayText.length)) + '…';
        }
      }

      // Рисуем текст с небольшой тенью для читаемости
      ctx.value.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.value.shadowBlur = 2 * ratio;
      ctx.value.shadowOffsetX = 0;
      ctx.value.shadowOffsetY = 0;

      ctx.value.fillText(displayText, textX, textY);

      ctx.value.restore();
    };

    // Отрисовка всего канваса с тремя секциями
    const drawAll = (): void => {
      if (!ctx.value || !canvasRef.value || canvasWidth.value === 0) return;

      // Очищаем канвас
      ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);

      // Белый фон
      ctx.value.fillStyle = '#FFFFFF';
      ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);

      const ratio = getDevicePixelRatio();
      const padding = props.padding;

      let currentY = padding;

      // ========== СЕКЦИЯ 1: ОСНОВНОЙ ЦВЕТ ==========
      currentY = drawMainColorSquare(currentY);

      // Разделительная линия
      if (props.showDividers) {
        const dividerY = currentY * ratio + 10 * ratio;
        drawDivider(dividerY);
        currentY += 30;
      }

      // ========== СЕКЦИЯ 2: СОЧЕТАНИЕ ==========
      if (props.colorItems.length > 0) {
        currentY = drawSection(
          props.colorItems,
          currentY,
          t('combinations'),
          props.combinationTitleColor
        );

        // Разделительная линия
        if (props.showDividers && props.scaleItems.length > 0) {
          const dividerY = currentY * ratio + 10 * ratio;
          drawDivider(dividerY);
          currentY += 30;
        }
      }

      // ========== СЕКЦИЯ 3: КОМБИНАЦИЯ ==========
      if (props.scaleItems.length > 0) {
        currentY = drawSection(props.scaleItems, currentY, t('scale'), props.compositionTitleColor);
      }

      // Обновляем рассчитанную высоту
      const finalHeight = Math.max(currentY + padding, props.minHeight);
      if (Math.abs(contentHeight.value - finalHeight) > 5) {
        contentHeight.value = finalHeight;
      }
    };

    // Инициализация канваса
    const initCanvas = () => {
      if (!canvasRef.value || !containerRef.value) return;

      // Обновляем размеры
      updateDimensions();

      ctx.value = canvasRef.value.getContext('2d', {
        alpha: true,
        desynchronized: false,
      });

      if (!ctx.value) return;

      ctx.value.imageSmoothingEnabled = true;
      ctx.value.imageSmoothingQuality = 'high';

      drawAll();
    };

    // Ресайз обработчик
    let resizeTimeout: number;
    const handleResize = (): void => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        updateDimensions();
        drawAll();
        isLoading.value = false;
      }, 100);
    };

    onMounted(async () => {
      isLoading.value = true;
      await nextTick();
      initCanvas();
      window.addEventListener('resize', handleResize);

      // Используем ResizeObserver для отслеживания изменений размеров контейнера
      if (containerRef.value && 'ResizeObserver' in window) {
        const observer = new ResizeObserver(() => {
          handleResize();
        });
        observer.observe(containerRef.value);

        onUnmounted(() => {
          observer.disconnect();
        });
      }
    });

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    });

    const downloadCollage = () => {
      toggleImageOverlayPanel();
      if (!canvasRef.value) return;
      const url = canvasRef.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'colors.png';
      link.click();
    };

    const toggleImageOverlayPanel = () => {
      visible.value = !visible.value;
    };

    const close = () => {
      emit('close');
    };

    const openFolderModal = async () => {
      toggleImageOverlayPanel();
      await openDialog(
        AppFolderModal,
        {},
        {
          transparent: true,
        }
      ).then((item: Folder) => {
        folder.value = item;
      });
    };

    const focusInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        iNoBounce.disable();
        setTimeout(() => window.scrollTo(0, 0), 50);
      }
    };

    const saveToGallery = async () => {
      isSaveGallery.value = true;
      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: canvasRef.value,
          title: signIn.value,
          coloristicType: '',
          maskType: '',
          userId: currentUser.value?.uid,
          paletteType: '',
          folderId: folder.value?.id ? folder.value?.id : '',
        });
      } finally {
        isSaveGallery.value = false;
      }
    };

    return {
      canvasRef,
      containerRef,
      canvasWidth,
      canvasHeight,
      downloadCollage,
      close,
      isLoading,
      toggleImageOverlayPanel,
      targetRef,
      visible,
      t,
      openFolderModal,
      folder,
      focusInput,
      focusOutInput,
      isSaveGallery,
      signIn,
      saveToGallery,
    };
  },
});
</script>

<style scoped>
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 800px;
  height: 95vh;
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;

  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100%;
    flex-direction: column; /* вертикально */
    justify-content: flex-start;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  & .footer {
    display: flex;
    align-content: center;
    justify-content: center;
    gap: 12px;
    padding: 10px;
    width: 100%;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    /* матовое стекло */
    background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* для Safari */

    @media (max-width: 600px) {
      border-radius: 0;
    }
  }
}
.color-harmony-canvas {
  overflow: hidden;
  flex: 6;
  width: 100%;
  position: relative;

  & canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.info-section-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.actions {
  width: 100%;
}

.ellipsis-vertical {
  position: absolute;
  top: 100px;
  right: 20px;
  cursor: pointer;
  z-index: 1;

  @media (max-width: 600px) {
    top: 24px;
  }
}

.overlay-image {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  & .overlay-image-item {
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #eaeaeb;
    cursor: pointer;
  }
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #444;
  color: #fff;
  min-width: 100px;
  text-align: center;
}

/* Оптимизация для мобильных устройств */
.high-quality-canvas {
  /* Улучшение сглаживания на Android */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Предотвращение размытия при трансформациях */
  backface-visibility: hidden;
  transform: translateZ(0);

  /* Фиксированный размер для предотвращения масштабирования браузером */
  width: 100%;
  height: auto;
  max-width: 100%;
  display: block;
}

/* Медиа-запросы для Android */
@media screen and (-webkit-min-device-pixel-ratio: 1.5) {
  .high-quality-canvas {
    image-rendering: -webkit-optimize-contrast;
  }
}

/* Для очень плотных пикселей (Retina) */
@media screen and (-webkit-min-device-pixel-ratio: 2), screen and (min-resolution: 192dpi) {
  .high-quality-canvas {
    image-rendering: crisp-edges;
  }
}
</style>
