<template>
  <div ref="containerRef">
    <canvas ref="canvasRef" class="high-quality-canvas" @click="handleCanvasClick"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { FrameColorSegmentType } from '@/types/frame-color-segment.type';
import { useCanvasSaver } from '@/composables/useCanvasSaver';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'AppEditorCanvas',
  props: {
    segments: { type: Array as () => FrameColorSegmentType[], required: true },
    imageUrl: { type: [String, null], default: null },
    gapBetweenSegments: { type: Number, default: 0 },
    isMarkSegment: { type: Boolean, default: false },
    frameThicknessPercent: { type: Number, default: 16 }, // Новый пропс для настройки толщины в процентах
  },
  emits: ['update:imageUrl', 'selected-segment'],
  setup(props, { emit }) {
    const store = useStore();
    const containerRef = ref<HTMLElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const originalUrlRef = ref<string | null>(null);
    const sizeRef = ref(480);
    const rotationRef = ref(0);
    const startAngleRef = ref<number | null>(null);
    const offsetXRef = ref(0);
    const offsetYRef = ref(0);
    const pixelRatio = ref(1);
    const resizeObserver = ref<ResizeObserver | null>(null);
    let isLoadImage = false;

    const initResizeObserver = () => {
      if (!containerRef.value || typeof ResizeObserver === 'undefined') return;
      resizeObserver.value = new ResizeObserver(render);
      resizeObserver.value.observe(containerRef.value);
    };

    const getPixelRatio = () => {
      return window.devicePixelRatio || 1;
    };

    // Функция для вычисления толщины рамки в пикселях
    const getThickness = () => {
      return (sizeRef.value * props.frameThicknessPercent) / 100;
    };

    // Функция для получения размера контейнера
    const getContainerSize = () => {
      if (!containerRef.value) return 480;

      const container = containerRef.value;
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Берем меньшую сторону для квадратного канваса
      const minSize = Math.min(width, height);

      // Ограничиваем минимальный и максимальный размер
      const clampedSize = Math.max(200, Math.min(minSize, 800));

      return clampedSize;
    };

    // Обновляем размер на основе контейнера
    const updateSizeFromContainer = () => {
      const newSize = getContainerSize();
      sizeRef.value = newSize;
      return newSize;
    };

    const render = async () => {
      if (!canvasRef.value) return;
      // Обновляем размер из контейнера
      updateSizeFromContainer();

      const canvas = canvasRef.value;
      const ctx = canvas.getContext('2d')!;
      const ratio = getPixelRatio();
      pixelRatio.value = ratio;

      // Устанавливаем внутренний размер
      canvas.width = sizeRef.value * ratio;
      canvas.height = sizeRef.value * ratio;

      // Устанавливаем CSS размер
      canvas.style.width = `${sizeRef.value}px`;
      canvas.style.height = `${sizeRef.value}px`;

      // Масштабируем контекст
      ctx.scale(ratio, ratio);

      // Включаем сглаживание
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, sizeRef.value, sizeRef.value);

      if (props.imageUrl && !isLoadImage) {
        imageRef.value = await loadImage(props.imageUrl);
        isLoadImage = true;
      }

      drawBaseImage(ctx);
      drawFrame(ctx);
    };

    const { getCanvasSrc, saveImage, loadImage, zoom } = useCanvasSaver(canvasRef, render, emit);

    const getCanvasValue = () => {
      return canvasRef.value;
    };

    const getImageSrc = () => {
      return getCanvasSrc();
    };

    const triggerSaveImage = () => {
      saveImage();
    };

    const drawBaseImage = (ctx: CanvasRenderingContext2D) => {
      const radius = sizeRef.value / 2;
      const thickness = getThickness();
      const img = imageRef.value;
      if (!img) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(radius, radius, radius - thickness, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();
      ctx.translate(radius + (offsetXRef.value ?? 0), radius + (offsetYRef.value ?? 0));
      ctx.rotate((rotationRef.value * Math.PI) / 180);

      const baseSize = sizeRef.value - thickness * 2;
      const minSide = Math.min(img.width, img.height);
      const targetSize = baseSize * zoom.value;

      ctx.drawImage(
        img,
        (img.width - minSide) / 2,
        (img.height - minSide) / 2,
        minSide,
        minSide,
        -targetSize / 2,
        -targetSize / 2,
        targetSize,
        targetSize
      );
      ctx.restore();
    };

    const drawFrame = (ctx: CanvasRenderingContext2D) => {
      const radius = sizeRef.value / 2;
      const thickness = getThickness();
      const step = (2 * Math.PI) / props.segments.length;
      const startOffset = startAngleRef.value ?? -Math.PI / 2;
      ctx.lineWidth = thickness;

      ctx.imageSmoothingEnabled = true;
      props.segments.forEach((seg, i) => {
        ctx.beginPath();
        ctx.strokeStyle = seg.color;
        const start = i * step + startOffset + props.gapBetweenSegments;
        const end = (i + 1) * step + startOffset - props.gapBetweenSegments;
        ctx.arc(radius, radius, radius - thickness / 2, start, end);
        ctx.stroke();
      });
    };

    const handleCanvasClick = (event: MouseEvent) => {
      if (!props.isMarkSegment) return;
      if (!canvasRef.value) return;

      const rect = canvasRef.value.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = sizeRef.value / 2;
      const centerY = sizeRef.value / 2;
      const radius = sizeRef.value / 2;
      const thickness = getThickness();

      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      const innerRadius = radius - thickness;
      const outerRadius = radius;

      if (distance >= innerRadius && distance <= outerRadius) {
        const clickAngle = Math.atan2(y - centerY, x - centerX);

        let normalizedAngle = clickAngle;
        if (normalizedAngle < 0) {
          normalizedAngle += 2 * Math.PI;
        }

        const startOffset = startAngleRef.value ?? -Math.PI / 2;
        let adjustedAngle = normalizedAngle - startOffset;
        if (adjustedAngle < 0) {
          adjustedAngle += 2 * Math.PI;
        }
        if (adjustedAngle >= 2 * Math.PI) {
          adjustedAngle -= 2 * Math.PI;
        }

        const step = (2 * Math.PI) / props.segments.length;
        let segmentIndex = Math.floor(adjustedAngle / step);

        if (segmentIndex >= props.segments.length) {
          segmentIndex = props.segments.length - 1;
        } else if (segmentIndex < 0) {
          segmentIndex = 0;
        }

        emit('selected-segment', segmentIndex);
        highlightSegment(segmentIndex);
      } else {
        render();
      }
    };

    const highlightSegment = (segmentIndex: number) => {
      if (!canvasRef.value) return;
      render();
      const ctx = canvasRef.value.getContext('2d')!;
      const radius = sizeRef.value / 2;
      const thickness = getThickness();
      const step = (2 * Math.PI) / props.segments.length;
      const startOffset = startAngleRef.value ?? -Math.PI / 2;

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      const start = segmentIndex * step + startOffset + props.gapBetweenSegments;
      const end = (segmentIndex + 1) * step + startOffset - props.gapBetweenSegments;

      ctx.arc(radius, radius, radius - thickness / 2, start, end);
      ctx.stroke();
      ctx.restore();
    };

    onMounted(() => {
      // Инициализируем ResizeObserver
      initResizeObserver();

      // Первоначальный рендер
      nextTick(() => {
        render();
      });
    });

    onUnmounted(() => {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect();
      }
    });

    watch(
      () => props.imageUrl,
      (url) => {
        if (url && !originalUrlRef.value) {
          originalUrlRef.value = url;
        }

        if (url && originalUrlRef.value) {
          isLoadImage = false;
          zoom.value = 1;
          originalUrlRef.value = url;
        }
        render();
      }
    );

    watch(
      () => store.getters['mobile/clientWidth'],
      () => {
        render();
      },
      { immediate: true }
    );

    watch(
      () => props.segments,
      () => {
        nextTick(() => render());
      }
    );

    // Добавляем watch для изменения процента толщины
    watch(
      () => props.frameThicknessPercent,
      () => {
        render();
      }
    );

    return {
      containerRef,
      canvasRef,
      triggerSaveImage,
      sizeRef,
      getCanvasValue,
      getImageSrc,
      handleCanvasClick,
    };
  },
});
</script>

<style scoped>
/* Контейнер должен занимать всю доступную ширину/высоту */
div {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
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
</style>
