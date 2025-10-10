<template>
  <div>
    <canvas
      ref="canvas"
      :width="size"
      :height="size"
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
import { FrameColorSegment } from '@/types/frame-color-segment';
import AppButton from '@/shared/components/AppButton.vue';

export default defineComponent({
  name: 'AppEditorCanvas',
  components: { AppButton },
  props: {
    size: { type: Number, required: true },
    thickness: { type: Number, required: true },
    segments: { type: Array as () => FrameColorSegment[], required: true },
    startAngle: { type: [Number, null], default: null },
    imageUrl: { type: [String, null], default: null },
    rotation: { type: Number, required: true },
    offsetX: { type: Number, required: true },
    offsetY: { type: Number, required: true },
  },
  emits: ['update:imageUrl'],
  setup(props, { emit }) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const originalUrl = ref<string | null>(null);
    // --- Crop selection ---
    let isSelecting = false;
    let startX = 0,
      startY = 0,
      currentX = 0,
      currentY = 0;
    let zoom = 1;
    function loadImage(url: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    }

    async function render() {
      if (!canvas.value) return;
      const ctx = canvas.value.getContext('2d')!;
      ctx.clearRect(0, 0, props.size, props.size);

      if (props.imageUrl) {
        imageRef.value = await loadImage(props.imageUrl);
      }
      drawBaseImage(ctx);
      drawFrame(ctx);
    }

    function startSelection(e: MouseEvent) {
      if (!canvas.value) return;
      isSelecting = true;
      const rect = canvas.value.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      currentX = startX;
      currentY = startY;
      draw();
    }

    function moveSelection(e: MouseEvent) {
      if (!isSelecting || !canvas.value) return;
      const rect = canvas.value.getBoundingClientRect();
      currentX = e.clientX - rect.left;
      currentY = e.clientY - rect.top;
      draw();
    }

    function endSelection() {
      if (!canvas.value) return;
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

      cropCtx.drawImage(canvas.value, x, y, w, h, 0, 0, w, h);

      const croppedUrl = cropCanvas.toDataURL('image/png');
      emit('update:imageUrl', croppedUrl);
    }

    function draw() {
      if (!canvas.value) return;
      const ctx = canvas.value.getContext('2d')!;
      ctx.clearRect(0, 0, props.size, props.size);
      drawBaseImage(ctx);
      drawFrame(ctx);

      if (isSelecting) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
      }
    }

    function drawBaseImage(ctx: CanvasRenderingContext2D) {
      const radius = props.size / 2; // Вычисляем радиус круга, исходя из размера компонента
      const thickness = props.thickness; // Толщина рамки (обводка вокруг изображения)
      const img = imageRef.value;
      if (!img) return;

      ctx.save(); // Сохраняем текущие настройки канваса
      ctx.beginPath(); // Начинаем путь для вырезания круглой области
      // Рисуем круг с центром в середине канваса и радиусом, уменьшенным на толщину
      ctx.arc(radius, radius, radius - thickness, 0, 2 * Math.PI);
      ctx.closePath(); // Закрываем путь
      ctx.clip(); // Ограничиваем область рисования кругом (всё вне круга будет обрезано)
      // Перемещаем начало координат в центр круга + возможные смещения
      ctx.translate(radius + (props.offsetX ?? 0), radius + (props.offsetY ?? 0));
      ctx.rotate((props.rotation * Math.PI) / 180); // Поворачиваем канвас на заданный угол (в градусах → радианы)

      const baseSize = props.size - thickness * 2; // Вычисляем базовый размер изображения (с учётом толщины рамки)
      const minSide = Math.min(img.width, img.height); // Находим меньшую сторону изображения (для обрезки по центру)
      const targetSize = baseSize * zoom; // Итоговый размер изображения после масштабирования
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
    }

    function drawFrame(ctx: CanvasRenderingContext2D) {
      const radius = props.size / 2; // Вычисляем радиус круга (половина размера компонента)
      const thickness = props.thickness; // Толщина линии, которая будет использоваться для рисования дуг
      const step = (2 * Math.PI) / props.segments.length; // Угол одного сегмента (в радианах), равный 2π / количество сегментов
      // Начальный угол смещения (если не задан — по умолчанию вверх, то есть -π/2)
      const startOffset = props.startAngle ?? -Math.PI / 2;

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
    }

    onMounted(render);
    watch(
      () => props.imageUrl,
      (url) => {
        if (url && !originalUrl.value) {
          originalUrl.value = url;
        }
        render();
      }
    );

    watch(
      () => [props.size, props.thickness],
      () => {
        nextTick(() => render());
      }
    );

    watch(
      () => props.segments,
      () => {
        nextTick(() => render());
      }
    );

    function resetImage() {
      if (originalUrl.value) {
        emit('update:imageUrl', originalUrl.value);
        zoom = 1;
        render();
      } else {
        zoom = 1;
        render();
      }
    }

    function saveImage() {
      if (!canvas.value) return;
      const url = canvas.value.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = 'avatar.png';
      link.click();
    }

    function zoomPlus() {
      zoom++;
      render();
    }

    function zoomMinus() {
      if (zoom === 1) {
        return;
      }
      zoom--;
      render();
    }

    return {
      canvas,
      startSelection,
      moveSelection,
      endSelection,
      resetImage,
      saveImage,
      zoomPlus,
      zoomMinus,
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
