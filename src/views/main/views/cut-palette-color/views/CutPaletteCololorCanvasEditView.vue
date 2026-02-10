<template>
  <div class="canvas-editor">
    <section v-if="isMobile" class="mobile-helpers">
      <div class="goBack">
        <router-link :to="{ name: 'cut-palette-color-view' }">
          <font-awesome-icon size="sm" :icon="['fas', 'arrow-left']" />
          {{ t('goBack') }}
        </router-link>
      </div>
      <app-button
        severity="secondary"
        raised
        :icon="['fas', 'gear']"
        @click="toggleVisibleSettingsMobile"
      ></app-button>
    </section>
    <teleport to="body">
      <section
        v-if="isMobile && visibleSettingsMobile"
        class="settings-mobile"
        @click.self="toggleVisibleSettingsMobile"
      >
        <section>
          <div v-if="step === 1" class="layout-settings">
            <div class="mobile-first-step">
              <h3>{{ t('shapeOfElements') }}</h3>
              <div class="shape-buttons">
                <div class="icon">
                  <font-awesome-icon
                    size="2xl"
                    :icon="['fas', 'square']"
                    :class="{ active: selectedShape === 'square' }"
                    @click="selectedShape = 'square'"
                  />
                </div>
                <div class="icon">
                  <font-awesome-icon
                    size="2xl"
                    :icon="['fas', 'circle']"
                    :class="{ active: selectedShape === 'circle' }"
                    @click="selectedShape = 'circle'"
                  />
                </div>
                <div class="icon">
                  <font-awesome-icon
                    size="2xl"
                    :icon="['fas', 'play']"
                    :class="{ active: selectedShape === 'triangle' }"
                    @click="selectedShape = 'triangle'"
                  />
                </div>
              </div>
              <h3>{{ t('transformation') }}</h3>
              <div class="transform-icon">
                <font-awesome-icon size="xl" :icon="['fas', 'undo']" @click="rotateCanvas" />
              </div>
            </div>
          </div>
          <div v-if="step === 2" class="layout-settings">
            <h3>{{ t('shadowSettings') }}</h3>
            <div class="shadow-controls">
              <div>
                <label class="mobile-label">{{ t('intensity') }}: {{ shadowBlur }}px</label>
                <app-slider v-model="shadowBlur" :min="0" :max="20"></app-slider>
              </div>
              <div>
                <label class="mobile-label">{{ t('yOffset') }}: {{ shadowOffsetY }}px</label>
                <app-slider v-model="shadowOffsetY" :min="0" :max="10"></app-slider>
              </div>
              <div>
                <label class="mobile-label">{{ t('transparency') }}: {{ shadowOpacity }}%</label>
                <app-slider v-model="shadowOpacity" :min="0" :max="100"></app-slider>
              </div>
            </div>
          </div>
          <div v-if="step === 3" class="layout-settings">
            <h3>{{ t('arrangementElements') }}</h3>

            <div>
              <label class="mobile-label">{{ t('columns') }}: {{ columns }} </label>
              <app-slider v-model="columns" :min="1" :max="20"></app-slider>
            </div>

            <div>
              <label class="mobile-label">{{ t('rows') }}: {{ rows }}</label>
              <app-slider v-model="rows" :min="1" :max="20"></app-slider>
            </div>
            <div class="mobile-auto-layout">
              <AppCheckbox v-model="autoLayout" label="autoSelection"></AppCheckbox>
              <div v-if="autoLayout" class="info-item auto-layout">
                <span class="info-badge">{{ t('auto') }}</span>
              </div>
            </div>
            <div v-if="displayColors.length > 0" class="grid-info">
              <div class="info-item">
                <span class="info-label">{{ t('colors') }}:</span>
                <span class="info-value">{{ visibleCount }} {{ t('of') }} {{ totalCount }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('grid') }}:</span>
                <span class="info-value"
                  >{{ actualLayout.columns }} ×
                  {{
                    Math.min(actualLayout.rows, Math.ceil(totalCount / actualLayout.columns))
                  }}</span
                >
              </div>
            </div>
          </div>

          <div v-if="step === 4" class="layout-settings">
            <h3>{{ t('sizingSettings') }}</h3>
            <div>
              <label class="mobile-label">{{ t('elementSize') }}: {{ elementSize }}px</label>
              <app-slider v-model="elementSize" :min="10" :max="100"></app-slider>
            </div>

            <div>
              <label class="mobile-label">{{ t('spaceBetweenElements') }}: {{ spacing }}px</label>
              <app-slider v-model="spacing" :min="0" :max="50"></app-slider>
            </div>
          </div>
          <div class="arrows">
            <font-awesome-icon
              class="arrow left"
              :size="isMobile ? 'sm' : '2xl'"
              :icon="['fas', 'arrow-left']"
              @click="nextSection(1)"
            />
            <font-awesome-icon
              class="arrow right"
              :size="isMobile ? 'sm' : '2xl'"
              :icon="['fas', 'arrow-right']"
              @click="nextSection(-1)"
            />
          </div>
        </section>
      </section>
    </teleport>
    <div ref="containerRef" class="canvas-container">
      <canvas ref="canvasRef" class="high-quality-canvas"></canvas>
    </div>

    <div v-if="!isMobile" class="controls">
      <div class="goBack">
        <router-link :to="{ name: 'cut-palette-color-view' }">
          <font-awesome-icon size="sm" :icon="['fas', 'arrow-left']" />
          {{ t('goBack') }}
        </router-link>
      </div>

      <div class="layout-settings">
        <div class="shape-selector">
          <section>
            <h3>{{ t('shapeOfElements') }}</h3>
            <div class="shape-buttons">
              <div class="icon">
                <font-awesome-icon
                  size="2xl"
                  :icon="['fas', 'square']"
                  :class="{ active: selectedShape === 'square' }"
                  @click="selectedShape = 'square'"
                />
              </div>
              <div class="icon">
                <font-awesome-icon
                  size="2xl"
                  :icon="['fas', 'circle']"
                  :class="{ active: selectedShape === 'circle' }"
                  @click="selectedShape = 'circle'"
                />
              </div>
              <div class="icon">
                <font-awesome-icon
                  size="2xl"
                  :icon="['fas', 'play']"
                  :class="{ active: selectedShape === 'triangle' }"
                  @click="selectedShape = 'triangle'"
                />
              </div>
            </div>
          </section>
          <section>
            <h3 class="transform-title">{{ t('transformation') }}</h3>
            <div class="transform-wrapper">
              <div class="transform-icon">
                <font-awesome-icon size="xl" :icon="['fas', 'undo']" @click="rotateCanvas" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="layout-settings">
        <h3>{{ t('shadowSettings') }}</h3>
        <div class="setting-item">
          <AppCheckbox v-model="enableShadow" label="enableShadow"></AppCheckbox>
        </div>
        <div v-if="enableShadow" class="shadow-controls">
          <div class="setting-item">
            <label>{{ t('intensity') }}:</label>
            <app-slider v-model="shadowBlur" :min="0" :max="20"></app-slider>
            <span>{{ shadowBlur }}px</span>
          </div>
          <div class="setting-item">
            <label>{{ t('yOffset') }}:</label>
            <app-slider v-model="shadowOffsetY" :min="0" :max="10"></app-slider>
            <span>{{ shadowOffsetY }}px</span>
          </div>
          <div class="setting-item">
            <label>{{ t('transparency') }}:</label>
            <app-slider v-model="shadowOpacity" :min="0" :max="100"></app-slider>
            <span>{{ shadowOpacity }}%</span>
          </div>
        </div>
      </div>

      <div class="layout-settings">
        <h3>{{ t('arrangementElements') }}</h3>
        <div v-if="displayColors.length > 0" class="grid-info">
          <div class="info-item">
            <span class="info-label">{{ t('colors') }}:</span>
            <span class="info-value">{{ visibleCount }} {{ t('of') }} {{ totalCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t('grid') }}:</span>
            <span class="info-value"
              >{{ actualLayout.columns }} ×
              {{ Math.min(actualLayout.rows, Math.ceil(totalCount / actualLayout.columns)) }}</span
            >
          </div>
          <div v-if="autoLayout" class="info-item auto-layout">
            <span class="info-badge">{{ t('auto') }}</span>
          </div>
        </div>
        <div>
          <div class="setting-item">
            <label>{{ t('columns') }}: </label>
            <app-slider v-model="columns" :min="1" :max="20"></app-slider>
            <span>{{ columns }}</span>
          </div>

          <div class="setting-item">
            <label>{{ t('rows') }}: </label>
            <app-slider v-model="rows" :min="1" :max="20"></app-slider>
            <span>{{ rows }}</span>
          </div>

          <div class="setting-item">
            <AppCheckbox v-model="autoLayout" label="autoSelection"></AppCheckbox>
          </div>
        </div>
      </div>

      <div class="layout-settings">
        <h3>{{ t('sizingSettings') }}</h3>
        <div class="setting-item">
          <label>{{ t('elementSize') }}:</label>
          <app-slider v-model="elementSize" :min="10" :max="100"></app-slider>
          <span>{{ elementSize }}px</span>
        </div>

        <div class="setting-item">
          <label>{{ t('spaceBetweenElements') }}:</label>
          <app-slider v-model="spacing" :min="0" :max="50"></app-slider>
          <span>{{ spacing }}px</span>
        </div>
      </div>
      <section class="action-buttons">
        <div class="btn">
          <app-button severity="success" title="download" @click="saveToDevice"></app-button>
        </div>
        <div class="btn">
          <app-button
            severity="warning"
            title="saveToGallery"
            :loading="isSaveToGallery"
            @click="saveToGallery"
          ></app-button>
        </div>
        <div class="btn">
          <app-button severity="info" title="addSign" @click="openImageModal"></app-button>
        </div>
      </section>
    </div>
    <section class="buttons">
      <font-awesome-icon
        v-if="isMobile"
        :icon="['fas', 'ellipsis-h']"
        size="xl"
        @click.stop="openPopover"
      />
    </section>
  </div>
  <app-popover v-model:visible="visiblePopover">
    <app-popover-wrapper>
      <app-popover-item @click="saveToDevice">
        <font-awesome-icon size="xl" :icon="['fas', 'download']" />
        <span>{{ t('download') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
    <app-popover-wrapper>
      <app-popover-item @click="saveToGallery">
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </app-popover-item>
      <app-popover-item @click="openImageModal">
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import AppButton from '@/shared/components/AppButton.vue';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import AppSlider from '@/shared/components/AppSlider.vue';
import { useI18n } from 'vue-i18n';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/characteristic-colors/components/AppImageSignInModal.vue';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';

export default defineComponent({
  name: 'CanvasColorsEditor',
  components: { AppPopover, AppPopoverWrapper, AppPopoverItem, AppSlider, AppCheckbox, AppButton },

  setup() {
    const { t } = useI18n();
    const store = useStore();
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const containerRef = ref<HTMLElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const resizeObserver = ref<ResizeObserver | null>(null);
    const step = ref(1);
    const visibleSettingsMobile = ref(false);
    const isSaveToGallery = ref(false);
    const visiblePopover = ref(false);
    // Настройки формы
    const selectedShape = ref<'square' | 'circle' | 'triangle'>('square');
    const elementSize = ref(40);
    const spacing = ref(10);
    const centerElements = ref(true);

    // Настройки расположения
    const columns = ref(5);
    const rows = ref(4);
    const autoLayout = ref(false);

    // Настройки тени
    const enableShadow = ref(true);
    const shadowBlur = ref(10);
    const shadowOffsetY = ref(4);
    const shadowOpacity = ref(20);

    // Настройки четкости
    const imageSmoothingEnabled = ref(false);
    const pixelRatio = ref(1);

    // Трансформации
    const flipHorizontal = ref(false);
    const flipVertical = ref(false);
    const rotationAngle = ref(0);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    // Получаем выбранные цвета
    const selectedColors = computed(() => {
      const colorsSet = store.getters['cutPaletteColors/getSelectedColors'];
      return Array.from(colorsSet || []);
    });

    const displayColors = computed(() => {
      return [...selectedColors.value];
    });

    // Информация для отображения
    const totalCount = computed(() => displayColors.value.length);
    const visibleCount = computed(() => {
      const maxVisible = actualLayout.value.columns * actualLayout.value.rows;
      return Math.min(totalCount.value, maxVisible);
    });

    // Получаем размеры контейнера
    const getContainerSize = () => {
      if (!containerRef.value) {
        return { width: 0, height: 0 };
      }

      const container = containerRef.value;
      const computedStyle = window.getComputedStyle(container);

      const containerWidth =
        container.clientWidth -
        parseFloat(computedStyle.paddingLeft) -
        parseFloat(computedStyle.paddingRight);

      const containerHeight =
        container.clientHeight -
        parseFloat(computedStyle.paddingTop) -
        parseFloat(computedStyle.paddingBottom);

      return {
        width: Math.max(1, containerWidth),
        height: Math.max(1, containerHeight),
      };
    };

    // Вычисляем оптимальное количество колонок и рядов
    const calculateOptimalLayout = () => {
      if (!containerRef.value || autoLayout.value === false) {
        return { columns: columns.value, rows: rows.value };
      }

      const containerSize = getContainerSize();
      const size = elementSize.value;
      const gap = spacing.value;

      // Вычисляем сколько элементов поместится
      const maxColumns = Math.max(1, Math.floor((containerSize.width + gap) / (size + gap)));
      const maxRows = Math.max(1, Math.floor((containerSize.height + gap) / (size + gap)));

      // Оптимизируем под количество цветов
      const totalColors = displayColors.value.length;

      let optimalColumns = maxColumns;
      let optimalRows = maxRows;

      if (totalColors > 0) {
        // Стараемся сделать сетку близкой к квадрату
        const aspectRatio = containerSize.width / containerSize.height;

        if (totalColors <= maxColumns * maxRows) {
          // Если все цвета помещаются, оптимизируем форму
          optimalRows = Math.ceil(Math.sqrt(totalColors / aspectRatio));
          optimalColumns = Math.ceil(totalColors / optimalRows);

          // Ограничиваем максимальными значениями
          optimalColumns = Math.min(optimalColumns, maxColumns);
          optimalRows = Math.min(optimalRows, maxRows);

          // Подгоняем чтобы все поместилось
          while (
            optimalColumns * optimalRows < totalColors &&
            (optimalColumns < maxColumns || optimalRows < maxRows)
          ) {
            if (
              optimalColumns < maxColumns &&
              (optimalColumns <= optimalRows || optimalRows >= maxRows)
            ) {
              optimalColumns++;
            } else if (optimalRows < maxRows) {
              optimalRows++;
            }
          }
        } else {
          // Если цвета не помещаются, используем максимальные размеры
          optimalColumns = maxColumns;
          optimalRows = maxRows;
        }
      }

      return {
        columns: Math.max(1, optimalColumns),
        rows: Math.max(1, optimalRows),
      };
    };

    // Актуальные колонки и ряды
    const actualLayout = computed(() => {
      if (autoLayout.value) {
        return calculateOptimalLayout();
      }
      return { columns: columns.value, rows: rows.value };
    });

    // Обновление настроек сглаживания
    const updateImageSmoothing = () => {
      if (ctx.value) {
        ctx.value.imageSmoothingEnabled = imageSmoothingEnabled.value;
        ctx.value.imageSmoothingQuality = 'high';
        renderCanvas();
      }
    };

    // Функция отрисовки с центрированием
    const renderCanvas = () => {
      if (!canvasRef.value || !containerRef.value || displayColors.value.length === 0) {
        return;
      }

      const containerSize = getContainerSize();
      const canvas = canvasRef.value;

      // Получаем контекст
      ctx.value = canvas.getContext('2d', {
        alpha: true,
        desynchronized: false,
      });

      if (!ctx.value) return;

      // Определяем реальный pixel ratio (с ограничением для производительности)
      pixelRatio.value = Math.min(window.devicePixelRatio || 1, 2); // Максимум 2x для баланса качества/производительности

      const canvasWidth = containerSize.width;
      const canvasHeight = containerSize.height;

      // Устанавливаем размеры канваса с учетом pixel ratio
      canvas.width = Math.floor(canvasWidth * pixelRatio.value);
      canvas.height = Math.floor(canvasHeight * pixelRatio.value);
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      // Настраиваем сглаживание
      ctx.value.imageSmoothingEnabled = imageSmoothingEnabled.value;
      ctx.value.imageSmoothingQuality = imageSmoothingEnabled.value ? 'high' : 'low';

      // Очищаем канвас
      ctx.value.clearRect(0, 0, canvas.width, canvas.height);

      // Сохраняем состояние контекста
      ctx.value.save();

      // Масштабируем контекст для pixel ratio
      ctx.value.scale(pixelRatio.value, pixelRatio.value);

      // Применяем трансформации
      applyTransformations(ctx.value, canvasWidth, canvasHeight);

      // Настройки для отрисовки
      const size = elementSize.value;
      const gap = spacing.value;

      // Используем актуальные колонки и ряды
      const elementsPerRow = actualLayout.value.columns;
      const maxRows = actualLayout.value.rows;
      const totalElements = Math.min(displayColors.value.length, elementsPerRow * maxRows);

      // Рассчитываем стартовые позиции
      let startX = gap / 2;
      let startY = gap / 2;

      if (centerElements.value) {
        // Центрирование по горизонтали
        const maxRowWidth = elementsPerRow * size + (elementsPerRow - 1) * gap;
        startX = (canvasWidth - maxRowWidth) / 2;
        startX = Math.max(gap / 2, startX);

        // Центрирование по вертикали
        const actualRows = Math.min(Math.ceil(totalElements / elementsPerRow), maxRows);
        const totalHeight = actualRows * size + (actualRows - 1) * gap;
        startY = (canvasHeight - totalHeight) / 2;
        startY = Math.max(gap / 2, startY);
      }

      // Рисуем элементы
      for (let i = 0; i < totalElements; i++) {
        const color = displayColors.value[i];
        const row = Math.floor(i / elementsPerRow);
        const col = i % elementsPerRow;

        // Базовая позиция
        let x = Math.round(startX + col * (size + gap));
        let y = Math.round(startY + row * (size + gap));

        // Если это последняя неполная строка и центрирование включено
        const elementsInThisRow = Math.min(elementsPerRow, totalElements - row * elementsPerRow);
        if (centerElements.value && elementsInThisRow < elementsPerRow) {
          // Дополнительное центрирование для неполной строки
          const rowWidth = elementsInThisRow * size + (elementsInThisRow - 1) * gap;
          x = Math.round((canvasWidth - rowWidth) / 2 + col * (size + gap));
        }

        // Если перевернуто по горизонтали
        if (flipHorizontal.value) {
          x = Math.round(canvasWidth - x - size);
        }

        // Если перевернуто по вертикали
        if (flipVertical.value) {
          y = Math.round(canvasHeight - y - size);
        }

        ctx.value.fillStyle = color as string;
        ctx.value.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.value.lineWidth = 1;

        // Применяем тень если включена
        if (enableShadow.value) {
          const opacity = shadowOpacity.value / 100;
          ctx.value.shadowColor = `rgba(0, 0, 0, ${opacity})`;
          ctx.value.shadowBlur = shadowBlur.value * pixelRatio.value; // Умножаем на pixel ratio для правильного отображения
          ctx.value.shadowOffsetX = 0;
          ctx.value.shadowOffsetY = shadowOffsetY.value * pixelRatio.value;
        } else {
          ctx.value.shadowColor = 'transparent';
          ctx.value.shadowBlur = 0;
          ctx.value.shadowOffsetX = 0;
          ctx.value.shadowOffsetY = 0;
        }

        // Рисуем выбранную форму с учетом pixel ratio
        const drawSize = Math.round(size);
        switch (selectedShape.value) {
          case 'square':
            drawSquare(ctx.value, x, y, drawSize);
            break;
          case 'circle':
            drawCircle(ctx.value, x, y, drawSize);
            break;
          case 'triangle':
            drawTriangle(ctx.value, x, y, drawSize);
            break;
        }

        // Сбрасываем тень для контура
        ctx.value.shadowColor = 'transparent';
        ctx.value.shadowBlur = 0;
        ctx.value.shadowOffsetX = 0;
        ctx.value.shadowOffsetY = 0;
      }

      // Восстанавливаем состояние контекста
      ctx.value.restore();
    };

    // Применение трансформаций к контексту
    const applyTransformations = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      // Переносим начало координат в центр для вращения
      ctx.translate(width / 2, height / 2);

      // Применяем вращение
      ctx.rotate((rotationAngle.value * Math.PI) / 180);

      // Применяем отражение
      if (flipHorizontal.value) {
        ctx.scale(-1, 1);
      }
      if (flipVertical.value) {
        ctx.scale(1, -1);
      }

      // Возвращаем начало координат
      ctx.translate(-width / 2, -height / 2);
    };

    // Функции рисования фигур с четкими границами
    const drawSquare = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // Используем целочисленные координаты для четкости
      const intX = Math.round(x);
      const intY = Math.round(y);
      const intSize = Math.round(size);

      ctx.beginPath();
      ctx.rect(intX, intY, intSize, intSize);
      ctx.fill();
      ctx.stroke();
    };

    const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // Центр окружности с четкими координатами
      const centerX = Math.round(x + size / 2);
      const centerY = Math.round(y + size / 2);
      const radius = Math.round(size / 2);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    const drawTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const centerX = Math.round(x + size / 2);
      const height = size * (Math.sqrt(3) / 2);

      ctx.beginPath();
      ctx.moveTo(centerX, Math.round(y + (size - height) / 2));
      ctx.lineTo(Math.round(x), Math.round(y + size - (size - height) / 2));
      ctx.lineTo(Math.round(x + size), Math.round(y + size - (size - height) / 2));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Функции управления трансформациями
    const rotateCanvas = () => {
      rotationAngle.value = (rotationAngle.value + 90) % 360;
    };

    const resetTransformations = () => {
      flipHorizontal.value = false;
      flipVertical.value = false;
      rotationAngle.value = 0;
    };

    // Инициализация ResizeObserver
    const initResizeObserver = () => {
      if (!containerRef.value || typeof ResizeObserver === 'undefined') return;

      resizeObserver.value = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          renderCanvas();
        });
      });

      resizeObserver.value.observe(containerRef.value);
    };

    // Следим за изменениями
    watch(
      [
        selectedShape,
        elementSize,
        spacing,
        flipHorizontal,
        flipVertical,
        rotationAngle,
        centerElements,
        columns,
        rows,
        autoLayout,
        displayColors,
        enableShadow,
        shadowBlur,
        shadowOffsetY,
        shadowOpacity,
        imageSmoothingEnabled,
      ],
      () => {
        renderCanvas();
      }
    );

    onMounted(() => {
      initResizeObserver();

      // Начальная отрисовка
      setTimeout(() => {
        renderCanvas();
      }, 100);
    });

    onUnmounted(() => {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect();
      }
    });

    const saveToDevice = () => {
      if (!canvasRef.value) return;
      const url = canvasRef.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'colors';
      link.click();
    };

    const nextSection = (nextStep: number) => {
      if (step.value === 1 && nextStep === -1) {
        step.value = 4;
        return;
      }
      if (step.value === 4 && nextStep === 1) {
        step.value = 1;
        return;
      }

      step.value = step.value + nextStep;
    };

    const toggleVisibleSettingsMobile = () => {
      visibleSettingsMobile.value = !visibleSettingsMobile.value;
    };

    const saveToGallery = async () => {
      isSaveToGallery.value = true;
      visiblePopover.value = false;

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: canvasRef.value,
          title: '',
          coloristicType: '',
          maskType: '',
          userId: currentUser.value?.uid,
          paletteType: '',
        });
      } finally {
        isSaveToGallery.value = false;
      }
    };

    const openImageModal = async () => {
      const url = canvasRef.value ? canvasRef.value.toDataURL('image/png') : '';
      await openDialog(AppImageSignInModal, {
        url,
        coloristicType: '',
        maskType: '',
        currentUserId: currentUser.value?.uid,
        canvas: canvasRef.value,
        imageUrl: url,
      });
    };

    const openPopover = () => {
      visiblePopover.value = true;
    };

    return {
      containerRef,
      canvasRef,
      selectedShape,
      elementSize,
      spacing,
      centerElements,
      columns,
      rows,
      autoLayout,
      flipHorizontal,
      flipVertical,
      enableShadow,
      shadowBlur,
      shadowOffsetY,
      shadowOpacity,
      imageSmoothingEnabled,
      displayColors,
      totalCount,
      visibleCount,
      rotateCanvas,
      resetTransformations,
      updateImageSmoothing,
      actualLayout,
      saveToDevice,
      t,
      isMobile,
      nextSection,
      step,
      visibleSettingsMobile,
      toggleVisibleSettingsMobile,
      saveToGallery,
      visiblePopover,
      isSaveToGallery,
      openImageModal,
      openPopover,
    };
  },
});
</script>

<style scoped lang="scss">
.canvas-editor {
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-wrap: wrap;
  overflow: auto;
  background: var(--color-wrap-bg);
  gap: 5px;
  position: relative;

  @media (max-width: 600px) {
    flex-direction: column;
    flex-wrap: nowrap;
  }
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;

  canvas {
    display: block;
    image-rendering: -moz-crisp-edges;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
}

.grid-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  background: #f5f7fa;
  border: 1px solid #e4e7eb;
  border-radius: 8px;
  margin: 10px;

  @media (max-width: 600px) {
    padding: 6px 10px;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-label {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: #334155;
      font-weight: 600;
    }
  }

  .auto-layout {
    margin-left: auto;
  }
}

.info-badge {
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.controls {
  flex: 0.5;
  padding: 20px;
  border-left: 1px solid #e0e0e0;
  height: calc(100dvh - var(--header-height));
  overflow: auto;
}

.shape-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  width: 100%;

  & section {
    width: 100%;
  }
}

h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;

  @media (max-width: 600px) {
    font-size: 14px;
  }
}

.shape-buttons {
  display: flex;
  gap: 10px;

  @media (max-width: 600px) {
    justify-content: center;
  }
}

.active {
  color: var(--active-doing);
  font-weight: 500;
}

.shape-icon {
  font-size: 18px;
}

.transform-controls {
  margin-bottom: 20px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #333;
  }
}

// Настройки тени
.shadow-settings {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;

  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #333;
  }

  .shadow-controls {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
  }
}

.layout-settings {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;

  @media (max-width: 600px) {
    min-height: 280px;
    border-radius: 0;
  }
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    span {
      font-size: 14px;
      color: #ff9800;
      font-weight: 500;
      text-align: center;
    }
  }
}

.settings {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    min-width: 180px;
    font-size: 14px;
    color: #333;
  }

  span {
    min-width: 50px;
    text-align: right;
    font-size: 14px;
    color: #666;
  }
}

.icon {
  cursor: pointer;
  rotate: 270deg;
  color: black;
  transition: transform 0.2s;
}
.icon:hover {
  scale: 1.2;
}
.transform-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;

  & .transform-icon {
    cursor: pointer;
    width: 24px;
    rotate: 90deg;
    color: black;
  }
}

.transform-title {
  text-align: center;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Оптимизация для мобильных устройств */
.high-quality-canvas {
  /* Улучшение сглаживания на Android */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Предотвращение размытия при трансформациях */
  backface-visibility: hidden;
  transform: translateZ(0);

  /* Автоматическая адаптация размера */
  max-width: 100%;
  max-height: 100%;
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

a {
  font-size: 14px;
  line-height: 1.7;
  color: #666666;
  margin: 0;
  text-decoration: none;
  transition: all 0.4s;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
}

a:hover {
  color: #57b846;
}

.goBack {
  margin-bottom: 12px;
}
.arrows {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-helpers {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.settings-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 9999;
  padding: 20px;
}

.mobile-first-step {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mobile-label {
  font-size: 12px;
}
.transform-icon {
  @media (max-width: 600px) {
    display: flex;
    justify-content: center;
  }
}
.mobile-auto-layout {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

@media (max-width: 600px) {
  .buttons {
    display: flex;
    justify-content: center;
    font-size: 20px;
    flex: 0.25;
  }
}
</style>
