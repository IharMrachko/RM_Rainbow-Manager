<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="t('top3')" @close="close"></app-modal-header>
    <div class="wrapper">
      <section v-for="(item, index) in results.slice(0, end)" :key="item" class="wrapper-item">
        <div class="canvas-item">
          <span class="rating">{{ index + 1 }}. {{ t(item.name) }}</span>
          <app-editor-canvas
            :ref="(el: InstanceType<typeof AppEditorCanvas> | null) => (editorCanvasRefs[index] = el)"
            :image-url="uniqueImageUrls(index)"
            :segments="item.segments"
          ></app-editor-canvas>
        </div>
        <section class="palette-wrap">
          <app-palette :item="item" :palette-cards="paletteCards"></app-palette>
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
        <app-button severity="gradient" gradient title="seeMore" @click="end = 12"></app-button>
      </div>
      <div v-if="end === 12" class="text-center" @click="close">
        <router-link class="txt2" :to="{ name: 'main-consultation' }">
          {{ t('remainingInquiries') }}
        </router-link>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import AppEditorCanvas from '@/views/main/views/characteristic-colors/components/AppEditorCanvas.vue';
import { computed, defineComponent, PropType, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/shared/components/AppButton.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/characteristic-colors/components/AppImageSignInModal.vue';
import { useStore } from 'vuex';
import { EditorCanvasRef } from '@/interfaces/editor-canvas-ref.interface';
import { Palette } from '@/types/palette.type';
import AppPalette from '@/shared/components/AppPalette.vue';

export default defineComponent({
  components: { AppPalette, AppButton, AppModalHeader, AppEditorCanvas },
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

    // исходный URL

    // Создаем computed для уникальных URL
    const uniqueImageUrls = (index: number): string => {
      const baseUrl = props.imageUrl;

      if (!baseUrl) return '';

      // Проверяем тип URL
      if (baseUrl.startsWith('data:') || baseUrl.startsWith('blob:')) {
        // Data или Blob URL - возвращаем как есть (они уже уникальны)
        return baseUrl;
      }

      // Для обычных URL добавляем параметры
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const separator = baseUrl.includes('?') ? '&' : '?';

      return `${baseUrl}${separator}t=${timestamp}&i=${index}&r=${random}`;
    };

    const saveToDevice = (editorCanvasRef: EditorCanvasRef) => {
      editorCanvasRef.triggerSaveImage();
    };

    const openImageModal = async (editorCanvasRef: EditorCanvasRef, palette: Palette) => {
      const url = editorCanvasRef.getImageSrc();
      await openDialog(
        AppImageSignInModal,
        {
          url,
          coloristicType: 'mask',
          currentUserId: currentUser.value?.uid,
          canvas: editorCanvasRef.getCanvasValue(),
          imageUrl: props.imageUrl,
          paletteType: palette,
        },
        { transparent: true }
      );
    };

    const saveToGallery = async (editorCanvasRef: EditorCanvasRef, palette: Palette) => {
      isSaveToGallery.value = true;

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: editorCanvasRef.getCanvasValue(),
          title: '',
          coloristicType: 'mask',
          maskType: '',
          paletteType: palette,
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
      uniqueImageUrls,
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
  min-height: 550px;

  @media (max-width: 600px) {
    min-height: 400px;
  }
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
  margin-top: 60px;
  @media (max-width: 600px) {
    margin: 12px auto;
  }

  & .buttons {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  width: 250px;
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

.text-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
