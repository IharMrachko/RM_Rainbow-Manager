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
    <button class="btn btn-reset" @click="resetImage">
      <font-awesome-icon size="lg" :icon="['fas', 'undo']" />
    </button>

    <button class="btn btn-save" @click="saveImage">
      <font-awesome-icon size="lg" :icon="['fas', 'save']" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';

type FrameSegment = { color: string };

export default defineComponent({
  name: 'AppEditorCanvas',
  props: {
    size: { type: Number, required: true },
    thickness: { type: Number, required: true },
    segments: { type: Array as () => FrameSegment[], required: true },
    startAngle: { type: [Number, null], default: null },
    imageUrl: { type: [String, null], default: null },
    zoom: { type: Number, required: true },
    rotation: { type: Number, required: true },
    offsetX: { type: Number, required: true },
    offsetY: { type: Number, required: true },
  },
  emits: ['update:imageUrl'],
  setup(props, { emit }) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const originalUrl = ref<string | null>(null);

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

    // --- Crop selection ---
    let isSelecting = false;
    let startX = 0,
      startY = 0,
      currentX = 0,
      currentY = 0;

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
      const radius = props.size / 2;
      const thickness = props.thickness;
      const img = imageRef.value;
      if (!img) return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(radius, radius, radius - thickness, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.clip();

      ctx.translate(radius + (props.offsetX ?? 0), radius + (props.offsetY ?? 0));
      ctx.rotate((props.rotation * Math.PI) / 180);

      const baseSize = props.size - thickness * 2;
      const scale = props.zoom ?? 1;
      const minSide = Math.min(img.width, img.height);
      const targetSize = baseSize * scale;

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
    }

    function drawFrame(ctx: CanvasRenderingContext2D) {
      const radius = props.size / 2;
      const thickness = props.thickness;
      const step = (2 * Math.PI) / props.segments.length;
      const startOffset = props.startAngle ?? -Math.PI / 2;

      ctx.lineWidth = thickness;
      props.segments.forEach((seg, i) => {
        ctx.beginPath();
        ctx.strokeStyle = seg.color;
        const start = i * step + startOffset;
        const end = (i + 1) * step + startOffset;
        ctx.arc(radius, radius, radius - thickness / 2, start, end);
        ctx.stroke();
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
      async () => {
        await nextTick();
        render();
      }
    );

    function resetImage() {
      if (originalUrl.value) {
        emit('update:imageUrl', originalUrl.value);
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

    return {
      canvas,
      startSelection,
      moveSelection,
      endSelection,
      resetImage,
      saveImage,
    };
  },
});
</script>
<style scoped>
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 2px 2px 6px #c5c5c5, -2px -2px 6px #ffffff;
}

/* Общий эффект нажатия */
.btn:active {
  box-shadow: inset 2px 2px 6px #c5c5c5, inset -2px -2px 6px #ffffff;
}

/* Серый вариант для "Вернуть" */
.btn-reset {
  background: linear-gradient(145deg, #f0f0f0, #d9d9d9);
  color: #444;
}

/* Зелёный вариант для "Сохранить" */
.btn-save {
  background: linear-gradient(145deg, #4caf50, #43a047);
  color: #fff;
}

/* Контейнер */
.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
</style>
