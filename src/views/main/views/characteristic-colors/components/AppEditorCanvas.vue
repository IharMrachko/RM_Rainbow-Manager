<template>
  <div>
    <canvas ref="canvasRef" :width="sizeRef" :height="sizeRef" @click="handleCanvasClick"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';
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
  },
  emits: ['update:imageUrl', 'selected-segment'],
  setup(props, { emit }) {
    const store = useStore();
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const originalUrlRef = ref<string | null>(null);
    const thicknessRef = ref(90);
    const sizeRef = ref(480);
    const rotationRef = ref(0); // поворот изображения
    const startAngleRef = ref<number | null>(null); // начало отрисовки сегментов, например, начало по часовой стрелке с 12 часов
    const offsetXRef = ref(0); // смещение изображения по оси X
    const offsetYRef = ref(0); // смещение изображения по оси Y

    let isLoadImage = false;
    const render = async () => {
      if (!canvasRef.value) return;

      const ctx = canvasRef.value.getContext('2d')!;
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
      const radius = sizeRef.value / 2; // Вычисляем радиус круга, исходя из размера компонента
      const thickness = thicknessRef.value; // Толщина рамки (обводка вокруг изображения)
      const img = imageRef.value;
      if (!img) return;

      ctx.save(); // Сохраняем текущие настройки канваса
      ctx.beginPath(); // Начинаем путь для вырезания круглой области
      // Рисуем круг с центром в середине канваса и радиусом, уменьшенным на толщину
      ctx.arc(radius, radius, radius - thickness, 0, 2 * Math.PI);
      ctx.closePath(); // Закрываем путь
      ctx.clip(); // Ограничиваем область рисования кругом (всё вне круга будет обрезано)
      // Перемещаем начало координат в центр круга + возможные смещения
      ctx.translate(radius + (offsetXRef.value ?? 0), radius + (offsetYRef.value ?? 0));
      ctx.rotate((rotationRef.value * Math.PI) / 180); // Поворачиваем канвас на заданный угол (в градусах → радианы)

      const baseSize = sizeRef.value - thickness * 2; // Вычисляем базовый размер изображения (с учётом толщины рамки)
      const minSide = Math.min(img.width, img.height); // Находим меньшую сторону изображения (для обрезки по центру)
      const targetSize = baseSize * zoom.value; // Итоговый размер изображения после масштабирования
      // Рисуем изображение:
      // - обрезаем его по центру до квадратной области minSide × minSide
      // - размещаем его по центру канваса
      // - масштабируем до targetSize × targetSize
      ctx.drawImage(
        img,
        (img.width - minSide) / 2, // x-координата обрезки
        (img.height - minSide) / 2, // y-координата обрезки
        minSide, // ширина обрезки
        minSide, // высота обрезки
        -targetSize / 2, // x-координата на канвасе
        -targetSize / 2, // y-координата на канвасе
        targetSize, // ширина на канвасе
        targetSize // высота на канвасе
      );
      // Восстанавливаем сохранённое состояние канваса
      ctx.restore();
    };

    const drawFrame = (ctx: CanvasRenderingContext2D) => {
      const radius = sizeRef.value / 2; // Вычисляем радиус круга (половина размера компонента)
      const thickness = thicknessRef.value; // Толщина линии, которая будет использоваться для рисования дуг
      const step = (2 * Math.PI) / props.segments.length; // Угол одного сегмента (в радианах), равный 2π / количество сегментов
      // Начальный угол смещения (если не задан — по умолчанию вверх, то есть -π/2)
      const startOffset = startAngleRef.value ?? -Math.PI / 2;
      ctx.lineWidth = thickness; // Устанавливаем толщину линии для всех дуг
      // Перебираем все сегменты и рисуем каждый как дугу

      props.segments.forEach((seg, i) => {
        ctx.beginPath(); // Начинаем новый путь для текущего сегмента
        ctx.strokeStyle = seg.color; // Устанавливаем цвет обводки для текущего сегмента
        const start = i * step + startOffset + props.gapBetweenSegments; // Вычисляем начальный угол дуги для сегмента i
        const end = (i + 1) * step + startOffset - props.gapBetweenSegments; // Вычисляем конечный угол дуги для сегмента i
        // Рисуем дугу по окружности с заданным радиусом и углами
        // Центр круга: (radius, radius)
        // Радиус: radius - thickness / 2 (чтобы линия была по центру толщины)
        ctx.arc(radius, radius, radius - thickness / 2, start, end);
        ctx.stroke(); // Отрисовываем дугу на канвасе
      });
    };

    // Функция для определения сегмента по координатам клика
    const handleCanvasClick = (event: MouseEvent) => {
      if (!props.isMarkSegment) return;
      if (!canvasRef.value) return;

      // Получаем координаты клика относительно canvas
      const rect = canvasRef.value.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Вычисляем расстояние от центра
      const centerX = sizeRef.value / 2;
      const centerY = sizeRef.value / 2;
      const radius = sizeRef.value / 2;

      // Вычисляем расстояние от точки клика до центра
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      // Проверяем, находится ли клик в пределах рамки (сегментов)
      const innerRadius = radius - thicknessRef.value;
      const outerRadius = radius;

      if (distance >= innerRadius && distance <= outerRadius) {
        // Клик в пределах рамки - вычисляем угол
        const clickAngle = Math.atan2(y - centerY, x - centerX);

        // Нормализуем угол от 0 до 2π
        let normalizedAngle = clickAngle;
        if (normalizedAngle < 0) {
          normalizedAngle += 2 * Math.PI;
        }

        // Учитываем начальное смещение
        const startOffset = startAngleRef.value ?? -Math.PI / 2;
        let adjustedAngle = normalizedAngle - startOffset;
        if (adjustedAngle < 0) {
          adjustedAngle += 2 * Math.PI;
        }
        if (adjustedAngle >= 2 * Math.PI) {
          adjustedAngle -= 2 * Math.PI;
        }

        // Вычисляем индекс сегмента
        const step = (2 * Math.PI) / props.segments.length;
        let segmentIndex = Math.floor(adjustedAngle / step);

        // Корректируем индекс, если он выходит за границы
        if (segmentIndex >= props.segments.length) {
          segmentIndex = props.segments.length - 1;
        } else if (segmentIndex < 0) {
          segmentIndex = 0;
        }

        emit('selected-segment', segmentIndex);
        highlightSegment(segmentIndex);
      } else {
        // Клик вне рамки
        render();
      }
    };

    // Функция для визуального выделения сегмента (опционально)
    const highlightSegment = (segmentIndex: number) => {
      if (!canvasRef.value) return;
      render();
      const ctx = canvasRef.value.getContext('2d')!;
      const radius = sizeRef.value / 2;
      const thickness = thicknessRef.value;
      const step = (2 * Math.PI) / props.segments.length;
      const startOffset = startAngleRef.value ?? -Math.PI / 2;

      // Сохраняем текущее состояние канваса
      ctx.save();

      // Рисуем подсветку поверх сегмента
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      const start = segmentIndex * step + startOffset + props.gapBetweenSegments;
      const end = (segmentIndex + 1) * step + startOffset - props.gapBetweenSegments;

      ctx.arc(radius, radius, radius - thickness / 2, start, end);
      ctx.stroke();

      // Восстанавливаем состояние
      ctx.restore();
    };

    onMounted(render);
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
      (value) => {
        if (value < 600) {
          thicknessRef.value = 70;
          sizeRef.value = 340;
          nextTick(() => render());
          return;
        }

        if (value < 1024) {
          thicknessRef.value = 70;
          sizeRef.value = 400;
          nextTick(() => render());
          return;
        }

        if (value > 1024) {
          thicknessRef.value = 90;
          sizeRef.value = 520;
          nextTick(() => render());
          return;
        }
      },
      { immediate: true }
    );

    watch(
      () => props.segments,
      () => {
        nextTick(() => render());
      }
    );

    return {
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
<style scoped></style>
