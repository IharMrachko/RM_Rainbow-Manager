<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="t('top3')" @close="close"></app-modal-header>
    <div class="wrapper">
      <section v-for="(item, index) in results" :key="item" class="wrapper-item">
        <div class="canvas-item">
          <span class="rating">{{ index + 1 }}. {{ t(item.name) }}</span>
          <app-editor-canvas
            ref="editorCanvasRef"
            :image-url="imageUrl"
            :segments="item.segments"
          ></app-editor-canvas>
        </div>
        <div class="palette">
          <div class="palette-left">
            <div
              v-for="color in item.segments.slice(0, 35)"
              :key="color"
              class="palette-item"
              :style="{ backgroundColor: color.color }"
            ></div>
          </div>

          <div class="palette-right">
            <div
              v-for="color in item.segments.slice(35, 65)"
              :key="color"
              class="palette-item"
              :style="{ backgroundColor: color.color }"
            ></div>
          </div>
          <div class="my-color">
            <div
              v-for="color in paletteCards"
              :key="color"
              class="palette-item"
              :style="{ backgroundColor: color.color }"
            ></div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<script lang="ts">
import AppEditorCanvas from '@/views/main/views/color-view/components/AppEditorCanvas.vue';
import { defineComponent, PropType } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: { AppModalHeader, AppEditorCanvas },
  props: {
    results: {
      type: Array as PropType<{ name: string; segments: { color: string }[] }[]>,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    paletteCards: {
      type: Array as PropType<{ id: number; color: string }[]>,
      required: true,
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(_, { emit }) {
    const { t } = useI18n();
    const close = () => {
      emit('close');
    };
    return {
      close,
      t,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  position: relative;
  width: 90vw;
  height: 95vh;
  background: var(--color-bg);
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
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  & .wrapper {
    background: var(--color-wrap-bg);
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    align-items: center;
    gap: 20px;
    height: calc(100% - 76px);
  }
}

.canvas-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.wrapper-item {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
  border-bottom: 1px solid #c5c5c5;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
}

.palette {
  position: relative;
  display: flex;
  height: 220px;
  margin-top: 60px;

  @media (max-width: 600px) {
    margin: 12px auto;
  }

  & .palette-left {
    display: flex;
    flex-wrap: wrap;
    width: 160px;
    gap: 2px;
  }

  & .palette-right {
    display: flex;
    flex-wrap: wrap;
    width: 160px;
    gap: 2px;
    height: 187px;
  }
}

.palette-item {
  width: 30px;
  height: 30px;
}

.my-color {
  width: 200px;
  background: white;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  gap: 5px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 12px;
  /* лёгкая тень */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  /* анимация парения */
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-8px);
  }
  100% {
    transform: translate(-50%, -50%) translateY(0);
  }
}

.rating {
  font-size: 26px;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    font-size: 16px;
  }
}
</style>
