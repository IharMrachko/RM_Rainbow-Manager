<template>
  <div class="color-wrapper">
    <section class="selected">
      <app-color-card
        v-for="card in cards"
        :key="card.id"
        :card="card"
        :is-selected="selectedCard?.id === card?.id"
        @selected="selected"
      ></app-color-card>
    </section>
    <section class="editor">
      <app-editor-canvas
        ref="editorCanvasRef"
        v-model:image-url="imageUrl"
        :segments="frameColors"
      ></app-editor-canvas>
    </section>
    <section class="buttons" :class="{ isMobile: isMobile }">
      <div v-if="!isMobile" class="btn">
        <app-button
          raised
          title="pickPhoto"
          severity="secondary"
          :icon="['fas', 'sliders']"
          @click="openImageSettingsModal"
        ></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button
          raised
          :icon="['fas', 'camera']"
          severity="secondary"
          title="takePhoto"
          @click="openCameraModal"
        ></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button severity="success" title="download" @click="saveToDevice"></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button
          severity="warning"
          title="saveToGallery"
          :loading="isSaveToGallery"
          @click="saveToGallery"
        ></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button severity="info" title="addSign" @click="openImageModal"></app-button>
      </div>
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="sharedWithCollage" label="shareImageWithCollage"></AppCheckbox>
      </div>
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="rememberChoose" label="rememberChoose"></AppCheckbox>
      </div>
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
      <app-popover-item @click="openImageSettingsModal">
        <font-awesome-icon size="xl" :icon="['fas', 'sliders']" />
        <span>{{ t('pickPhoto') }}</span>
      </app-popover-item>
      <app-popover-item @click="openCameraModal">
        <font-awesome-icon size="xl" :icon="['fas', 'camera']" />
        <span>{{ t('takePhoto') }}</span>
      </app-popover-item>
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
    <app-popover-wrapper>
      <app-popover-item>
        <AppCheckbox v-model="sharedWithCollage"></AppCheckbox>
        <span>{{ t('shareImageWithCollage') }}</span>
      </app-popover-item>
      <app-popover-item>
        <AppCheckbox v-model="rememberChoose"></AppCheckbox>
        <span>{{ t('rememberChoose') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>
<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref, watch } from 'vue';
import AppColorCard from '@/views/main/views/characteristic-colors/components/AppColorCard.vue';
import AppEditorCanvas from '@/views/main/views/characteristic-colors/components/AppEditorCanvas.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { colorCards } from '@/views/main/views/characteristic-colors/components/color-card.constanst';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import { readFileAsDataURL } from '@/helpers/read-file-as-data-url';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/characteristic-colors/components/AppImageSignInModal.vue';
import AppImageSettingsModal from '@/shared/components/AppImageSettingsModal.vue';
import AppCameraModal from '@/shared/components/AppCameraModal.vue';
import { EditorCanvasRef } from '@/interfaces/editor-canvas-ref.interface';
import { MaskCard } from '@/types/mask-card.type';

export default defineComponent({
  components: {
    AppCheckbox,
    AppPopoverItem,
    AppPopoverWrapper,
    AppPopover,
    AppButton,
    AppEditorCanvas,
    AppColorCard,
  },
  emits: ['fileOnLoad', 'isLoading'],
  setup(_, { emit }) {
    const editorCanvasRef = ref<EditorCanvasRef | null>(null);
    const { t } = useI18n();
    const uploader = ref();
    const store = useStore();
    const visiblePopover = ref(false);
    const cards: MaskCard[] = colorCards;
    const selectedCard = ref<null | MaskCard>(null);
    const frameColors = ref();
    const imageUrl = ref<string | null>(null);
    const isSaveToGallery = ref(false);
    const sharedWithCollage = ref(store.getters['imageColor/shareImgCollage']);
    const rememberChoose = ref(store.getters['imageColor/rememberImgMask']);
    const imgCollage = computed(() => store.getters['imageColor/imgCollage']);
    const imgMask = computed(() => store.getters['imageColor/imgMask']);
    const originalImgMask = computed(() => store.getters['imageColor/getOriginalImgMask']);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');

    onBeforeMount(() => {
      const [first] = cards;
      selectedCard.value = first;
      frameColors.value = first.segments;
    });

    onMounted(() => {
      if (sharedWithCollage.value) {
        const file = imgMask.value;
        if (file) {
          onFileSelected(file);
        }
      }
    });
    const onFileSelected = async (file: File) => {
      imageUrl.value = await readFileAsDataURL(file);
      await store.dispatch('imageColor/uploadImgMask', { file });
    };

    const saveToGallery = async () => {
      if (!imageUrl.value) {
        await store.dispatch('toast/addToast', {
          message: 'uploadImage',
          severity: 'warning',
        });
        return;
      }
      isSaveToGallery.value = true;
      visiblePopover.value = false;
      if (isMobile.value) emit('isLoading', true);

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: editorCanvasRef.value?.getCanvasValue(),
          title: '',
          coloristicType: 'mask',
          maskType: selectedCard.value?.type,
          userId: currentUser.value?.uid,
          paletteType: '',
        }); // вернет URL
      } finally {
        isSaveToGallery.value = false;
        if (isMobile.value) emit('isLoading', false);
      }
    };

    const selected = (item: MaskCard) => {
      selectedCard.value = item;
      frameColors.value = item.segments;
    };

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const openImageModal = async () => {
      const url = editorCanvasRef.value?.getImageSrc();
      await openDialog(AppImageSignInModal, {
        url,
        coloristicType: 'mask',
        maskType: selectedCard.value?.type,
        currentUserId: currentUser.value?.uid,
        canvas: editorCanvasRef.value?.getCanvasValue(),
        imageUrl: imageUrl.value,
      });
    };
    const openImageSettingsModal = async () => {
      visiblePopover.value = false;
      const originalFile = originalImgMask.value;
      let url = null;
      if (originalFile) {
        url = await readFileAsDataURL(originalFile);
      }

      await openDialog(AppImageSettingsModal, {
        imageUrl: url,
      }).then((value) => {
        if (value.originalFile) {
          store.dispatch('imageColor/setOriginalImgMask', { file: value.originalFile });
        }
        store.dispatch('imageColor/uploadImgMask', { file: value.file });
        onFileSelected(value.file);
      });
    };

    watch(sharedWithCollage, (value: boolean) => {
      store.dispatch('imageColor/setShareImgCollage', {
        share: value,
      });
    });

    watch(rememberChoose, (value: boolean) => {
      store.dispatch('imageColor/setRememberImgMask', {
        remember: value,
      });
    });

    watch(imgCollage, async (file: File) => {
      if (store.getters['imageColor/shareImgMask']) {
        imageUrl.value = await readFileAsDataURL(file);
      }
    });

    const saveToDevice = () => {
      editorCanvasRef.value?.triggerSaveImage();
    };

    const openCameraModal = async () => {
      await openDialog(AppCameraModal, {}).then((value) => {
        store.dispatch('imageColor/uploadImgMask', { file: value.file });
        onFileSelected(value.file);
        selected(value.selectedCard);
      });
    };
    return {
      frameColors,
      imageUrl,
      onFileSelected,
      cards,
      selected,
      selectedCard,
      visiblePopover,
      isMobile,
      openPopover,
      uploader,
      t,
      saveToGallery,
      isSaveToGallery,
      editorCanvasRef,
      sharedWithCollage,
      rememberChoose,
      openImageModal,
      openImageSettingsModal,
      saveToDevice,
      openCameraModal,
    };
  },
});
</script>
<style scoped lang="scss">
.color-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  background: var(--color-wrap-bg);
  height: calc(100dvh - var(--tabs-height-with-padding) - var(--header-height));
  gap: 20px;

  & .selected {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-content: flex-start;
    align-items: flex-start; /* вместо center */
    justify-content: center; /* оставляем центрирование по горизонтали */
  }

  & .editor {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 2;
  }

  & .buttons:not(.isMobile) {
    width: 301px;
    display: flex;
    gap: 12px;
    flex-direction: column;
    align-items: end;

    .btn {
      width: 230px;
    }

    .checkbox {
      width: 230px;
      display: flex;
      padding-left: 20px;
    }
  }
}

@media (max-width: 600px) {
  .color-wrapper .buttons {
    justify-content: center;
    display: flex;
  }

  .color-container .color-wrapper {
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex-wrap: nowrap;
    overflow: auto;
  }
  .color-container .color-wrapper .selected {
    flex: 0 1 auto;
    align-self: flex-start; // не тянется вниз
  }
}
</style>
