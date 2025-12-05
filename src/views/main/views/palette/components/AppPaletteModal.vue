<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="t('top3')" @close="close"></app-modal-header>
    <div class="wrapper">
      <section v-for="(item, index) in results.slice(0, end)" :key="item" class="wrapper-item">
        <div class="canvas-item">
          <span class="rating">{{ index + 1 }}. {{ t(item.name) }}</span>
          <app-editor-canvas
            :ref="(el: InstanceType<typeof AppEditorCanvas> | null) => (editorCanvasRefs[index] = el)"
            :image-url="imageUrl"
            :segments="item.segments"
          ></app-editor-canvas>
        </div>
        <section class="palette-wrap">
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
          <div class="buttons">
            <app-button
              severity="success"
              title="download"
              @click="saveToDevice(editorCanvasRefs[index])"
            ></app-button>
            <app-button
              severity="info"
              title="addSign"
              @click="openImageModal(editorCanvasRefs[index], item.name)"
            ></app-button>
            <app-button
              severity="warning"
              title="saveToGallery"
              :loading="isSaveToGallery"
              @click="saveToGallery(editorCanvasRefs[index], item.name)"
            ></app-button>
          </div>
        </section>
      </section>
      <div v-if="end === 3" class="see-more">
        <a @click="end = 12">{{ t('seeMore') }}</a>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import AppEditorCanvas from '@/views/main/views/color-view/components/AppEditorCanvas.vue';
import { computed, defineComponent, PropType, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/shared/components/AppButton.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/color-view/components/AppImageSignInModal.vue';
import { useStore } from 'vuex';
import { EditorCanvasRef } from '@/interfaces/editor-canvas-ref.interface';

export default defineComponent({
  components: { AppButton, AppModalHeader, AppEditorCanvas },
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
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const end = ref(3);
    const editorCanvasRefs = ref<EditorCanvasRef[]>([]);
    const isSaveToGallery = ref(false);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);

    const close = () => {
      emit('close');
    };

    const saveToDevice = (editorCanvasRef: EditorCanvasRef) => {
      editorCanvasRef.triggerSaveImage();
    };

    const openImageModal = async (editorCanvasRef: EditorCanvasRef, paletteName: string) => {
      const url = editorCanvasRef.getImageSrc();
      await openDialog(
        AppImageSignInModal,
        {
          url,
          coloristicType: 'mask',
          currentUserId: currentUser.value?.uid,
          canvas: editorCanvasRef.getCanvasValue(),
          imageUrl: props.imageUrl,
          paletteType: paletteName,
        },
        { transparent: true }
      );
    };

    const saveToGallery = async (editorCanvasRef: EditorCanvasRef, paletteName: string) => {
      isSaveToGallery.value = true;

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: editorCanvasRef.getCanvasValue(),
          title: '',
          coloristicType: 'mask',
          maskType: '',
          paletteType: paletteName,
          userId: currentUser.value?.uid,
        });
      } finally {
        isSaveToGallery.value = false;
      }
    };

    return {
      close,
      t,
      saveToDevice,
      editorCanvasRefs,
      openImageModal,
      isSaveToGallery,
      saveToGallery,
      end,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  position: relative;
  width: 90vw;
  height: 90vh;
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
    height: calc(100% - 65px);
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

.palette-wrap {
  @media (max-width: 600px) {
    margin: 12px auto;
  }

  & .palette {
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

  & .buttons {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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

.see-more {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
</style>
