<template>
  <teleport to="body">
    <div v-if="visible" ref="overlayRef" class="overlay" :style="overlayStyle">
      <slot></slot>
    </div>
  </teleport>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
} from 'vue';
import { PositionPanelType } from '@/types/position-panel.type';
import { PositionYType } from '@/types/positionY.type';
import { PositionXType } from '@/types/positionX.type';

const MARGIN_TOP = 3;
function getAnchorX(rect: DOMRect, x: PositionXType): number {
  switch (x) {
    case 'left':
      return rect.left;
    case 'right':
      return rect.right;
    case 'center':
      return rect.left + rect.width / 2;
  }
}

function getAnchorY(rect: DOMRect, y: PositionYType): number {
  switch (y) {
    case 'top':
      return rect.top;
    case 'bottom':
      return rect.bottom;
    case 'center':
      return rect.top + rect.height / 2;
  }
}

function resolveX(
  x: PositionXType,
  rect: DOMRect,
  panelW: number,
  viewportW: number
): PositionXType {
  const anchor = getAnchorX(rect, x);
  const fitsLeft = anchor - panelW >= 0;
  const fitsRight = anchor + panelW <= viewportW;
  const fitsCenter = anchor - panelW / 2 >= 0 && anchor + panelW / 2 <= viewportW;
  if (x === 'left') return fitsLeft ? 'left' : fitsCenter ? 'center' : 'right';
  if (x === 'right') return fitsRight ? 'right' : fitsCenter ? 'center' : 'left';
  return 'center';
}

function resolveY(
  y: PositionYType,
  rect: DOMRect,
  panelH: number,
  viewportH: number
): PositionYType {
  const anchor = getAnchorY(rect, y);
  const fitsTop = anchor - panelH >= 0;
  const fitsBottom = anchor + panelH <= viewportH;
  const fitsCenter = anchor - panelH / 2 >= 0 && anchor + panelH / 2 <= viewportH;

  if (y === 'top') return fitsTop ? 'top' : fitsCenter ? 'center' : 'bottom';
  if (y === 'bottom') return fitsBottom ? 'bottom' : fitsCenter ? 'center' : 'top';
  return fitsCenter ? 'center' : fitsTop ? 'top' : 'bottom';
}

function getWidthPanel(rect: DOMRect, propsWidth: number | string | null): string {
  let width: string;
  if (propsWidth !== null) {
    width = typeof propsWidth === 'number' ? `${propsWidth}px` : String(propsWidth);
  } else {
    width = `${Math.round(rect.width)}px`;
  }
  return width;
}

function getBestPlacement(
  rect: DOMRect,
  panelW: number,
  panelH: number,
  x: PositionXType,
  y: PositionYType
): PositionPanelType {
  const viewportW = document.documentElement.clientWidth;
  const viewportH = document.documentElement.clientHeight;
  return {
    x: resolveX(x, rect, panelW, viewportW),
    y: resolveY(y, rect, panelH, viewportH),
  };
}

export default defineComponent({
  props: {
    target: { type: Object as PropType<HTMLElement | null>, required: true },
    visible: { type: Boolean, default: true },
    zIndex: { type: Number, default: 1010 },
    position: {
      type: Object as PropType<PositionPanelType>,
      default: () => ({
        x: 'center',
        y: 'bottom',
      }),
    },
    width: { type: [Number, String], default: null },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const overlayRef = ref<HTMLElement | null>(null);
    const positionTrigger = ref(0);

    const overlayStyle = computed(() => {
      positionTrigger.value;
      if (!props.target) return {};
      const rect = props.target.getBoundingClientRect();
      const el = overlayRef.value;

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      // Ширина и высота overlayPanel
      const panelW = el?.offsetWidth ?? 0;
      const panelH = el?.offsetHeight ?? 0;

      const { x, y } = getBestPlacement(rect, panelW, panelH, props.position.x, props.position.y);

      const positionY = y;
      const positionX = x;

      // Базовые координаты — левый верх таргета в координатах страницы
      let top = rect.top + scrollY;
      let left = rect.left + scrollX;

      // Сброс трансформа — будем добавлять только то, что нужно для центрирования
      let translateX = 0;
      let translateY = 0;

      // --- Вертикаль (y)
      switch (positionY) {
        case 'top':
          top = rect.top + scrollY - panelH;
          break;
        case 'bottom':
          top = rect.top + scrollY + rect.height + MARGIN_TOP;
          break;
        case 'center':
          top = rect.top + scrollY + rect.height / 2;
          translateY = -50; // центр без зависимости от panelH
          break;
      }

      // --- Горизонталь (x)
      switch (positionX) {
        case 'left':
          left = rect.left + scrollX - panelW;
          break;
        case 'right':
          left = rect.left + scrollX + rect.width;
          break;
        case 'center':
          left = rect.left + rect.width / 2;
          translateX = -50; // центр без зависимости от panelW
          break;
      }

      // Собираем transform только при необходимости
      const transforms: string[] = [];
      if (translateX) transforms.push(`translateX(${translateX}%)`);
      if (translateY) transforms.push(`translateY(${translateY}%)`);

      return {
        position: 'fixed',
        top: `${Math.round(top)}px`,
        left: `${Math.round(left)}px`,
        transform: transforms.length ? transforms.join(' ') : undefined,
        zIndex: props.zIndex,
        width: getWidthPanel(rect, props.width),
      };
    });

    const updatePosition = () => {
      positionTrigger.value = Date.now();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const overlayEl = overlayRef.value;
      const targetEl = props.target;
      const clickedNode = e.target as Node;

      if (
        overlayEl &&
        !overlayEl.contains(clickedNode) &&
        targetEl &&
        !targetEl.contains(clickedNode)
      ) {
        emit('update:visible', false);
      }
    };

    onMounted(() => {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      document.addEventListener('click', handleClickOutside);

      nextTick(updatePosition);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      overlayStyle,
      overlayRef,
    };
  },
});
</script>

<style scoped lang="scss">
.overlay {
  background: #fff;
  border-radius: 15px;
  min-height: 20px;
  color: #111111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
