<template>
  <div>
    <canvas
      ref="canvasRef"
      :width="sizeRef"
      :height="sizeRef"
      @mousedown="startSelection"
      @mousemove="moveSelection"
      @mouseup="endSelection"
    ></canvas>
  </div>
  <div class="actions">
    <app-button
      severity="secondary"
      raised
      :icon="['fas', 'undo']"
      @click="resetImage"
    ></app-button>
    <app-button severity="secondary" raised :icon="['fas', 'plus']" @click="zoomPlus"></app-button>
    <app-button
      severity="secondary"
      raised
      :icon="['fas', 'minus']"
      @click="zoomMinus"
    ></app-button>
    <app-button severity="secondary" raised :icon="['fas', 'save']" @click="saveImage"></app-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';
import { FrameColorSegmentType } from '@/types/frame-color-segment.type';
import AppButton from '@/shared/components/AppButton.vue';
import { useCanvasSaver } from '@/composables/useCanvasSaver';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'AppEditorCanvas',
  components: { AppButton },
  props: {
    segments: { type: Array as () => FrameColorSegmentType[], required: true },
    imageUrl: { type: [String, null], default: null },
  },
  emits: ['update:imageUrl'],
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
    // --- Crop selection ---
    let isSelecting = false;
    let startX = 0,
      startY = 0,
      currentX = 0,
      currentY = 0;
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

    const { saveToStorage, saveImage, loadImage, resetImage, zoomPlus, zoomMinus, zoom } =
      useCanvasSaver(canvasRef, render, emit, originalUrlRef);

    const saveToGallery = async () => {
      return await saveToStorage(`avatar/${Math.random()}.png`);
    };

    const startSelection = (e: MouseEvent) => {
      if (!canvasRef.value) return;
      isSelecting = true;
      const rect = canvasRef.value.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      currentX = startX;
      currentY = startY;
      draw();
    };

    const moveSelection = (e: MouseEvent) => {
      if (!isSelecting || !canvasRef.value) return;
      const rect = canvasRef.value.getBoundingClientRect();
      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      draw();
    };

    const endSelection = () => {
      if (!canvasRef.value) return;
      isSelecting = false;
      draw();

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);

      if (w < 2 || h < 2) return;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = w;
      cropCanvas.height = h;
      const cropCtx = cropCanvas.getContext('2d')!;

      cropCtx.drawImage(canvasRef.value, x, y, w, h, 0, 0, w, h);

      const croppedUrl = cropCanvas.toDataURL('image/png');
      emit('update:imageUrl', croppedUrl);
    };

    const draw = () => {
      if (!canvasRef.value) return;
      const ctx = canvasRef.value.getContext('2d')!;
      ctx.clearRect(0, 0, sizeRef.value, sizeRef.value);
      drawBaseImage(ctx);
      drawFrame(ctx);

      if (isSelecting) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
      }
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
        const start = i * step + startOffset; // Вычисляем начальный угол дуги для сегмента i
        const end = (i + 1) * step + startOffset; // Вычисляем конечный угол дуги для сегмента i
        // Рисуем дугу по окружности с заданным радиусом и углами
        // Центр круга: (radius, radius)
        // Радиус: radius - thickness / 2 (чтобы линия была по центру толщины)
        ctx.arc(radius, radius, radius - thickness / 2, start, end);
        ctx.stroke(); // Отрисовываем дугу на канвасе
      });
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
          thicknessRef.value = 40;
          sizeRef.value = 280;
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
          sizeRef.value = 480;
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
      startSelection,
      moveSelection,
      endSelection,
      resetImage,
      saveImage,
      zoomPlus,
      zoomMinus,
      sizeRef,
      saveToGallery,
    };
  },
});
</script>
<style scoped>
.actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}
</style>
