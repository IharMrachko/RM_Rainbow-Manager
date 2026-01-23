<template>
  <div class="color-container">
    <div class="color-wrapper">
      <section class="selected">
        <app-color-card
          v-for="card in palettesCards.slice(startPalette, endPalette)"
          :key="card.id"
          :index="order(card)"
          :card="card"
          :is-selected="selectedCard?.id === card?.id"
          @selected="selected"
        ></app-color-card>
        <div v-if="palettesCards.length > 6" class="arrows">
          <font-awesome-icon
            class="arrow left"
            :size="isMobile ? 'sm' : '2xl'"
            :icon="['fas', 'arrow-left']"
            @click="nextPalette"
          />
          <font-awesome-icon
            class="arrow right"
            :size="isMobile ? 'sm' : '2xl'"
            :icon="['fas', 'arrow-right']"
            @click="nextPalette"
          />
        </div>
        <span class="selected-name">{{ t(selectedCard.name) }}</span>
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
            severity="secondary"
            :icon="['fas', 'cog']"
            @click="openPaletteSettings"
          ></app-button>
        </div>
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
          <AppCheckbox v-model="rememberChoose" label="rememberChoose"></AppCheckbox>
        </div>
        <font-awesome-icon
          v-if="isMobile"
          :icon="['fas', 'ellipsis-h']"
          size="lg"
          @click.stop="openPopover"
        />
      </section>
    </div>
    <app-popover v-model:visible="visiblePopover">
      <app-popover-wrapper>
        <app-popover-item @click="openPaletteSettings">
          <font-awesome-icon size="xl" :icon="['fas', 'cog']" />
          <span>{{ t('filter') }}</span>
        </app-popover-item>
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
          <AppCheckbox v-model="rememberChoose"></AppCheckbox>
          <span>{{ t('rememberChoose') }}</span>
        </app-popover-item>
      </app-popover-wrapper>
    </app-popover>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref, watch } from 'vue';

import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import AppEditorCanvas from '@/views/main/views/characteristic-colors/components/AppEditorCanvas.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { EditorCanvasRef } from '@/interfaces/editor-canvas-ref.interface';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { readFileAsDataURL } from '@/helpers/read-file-as-data-url';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/characteristic-colors/components/AppImageSignInModal.vue';
import AppImageSettingsModal from '@/shared/components/AppImageSettingsModal.vue';
import AppCameraModal from '@/shared/components/AppCameraModal.vue';
import { palettesObj, palettesObjShort } from '@/views/main/views/palette/palette';
import { Palette } from '@/types/palette.type';
import { PaletteCard } from '@/types/palette-card.type';
import AppColorCard from '@/views/main/views/characteristic-colors/components/AppColorCard.vue';
import AppPaletteDeterminantSettingsModal from '@/views/main/views/palette-determinant/components/AppPaletteDeterminantSettingsModal.vue';

export default defineComponent({
  components: {
    AppColorCard,
    AppCheckbox,
    AppPopoverItem,
    AppPopoverWrapper,
    AppPopover,
    AppButton,
    AppEditorCanvas,
  },
  setup(_) {
    const editorCanvasRef = ref<EditorCanvasRef | null>(null);
    const { t } = useI18n();
    const uploader = ref();
    const store = useStore();
    const visiblePopover = ref(false);
    const selectedCard = ref<null | PaletteCard>(null);
    const frameColors = ref();
    const imageUrl = ref<string | null>(null);
    const isSaveToGallery = ref(false);
    const targetRef = ref<HTMLElement | null>(null);

    const getPalette = (): Record<Palette, string[]> => {
      const fullFill = store.getters['palette/getSettingsMap'].fullFill;
      return fullFill ? palettesObj : palettesObjShort;
    };

    const createPaletteCard = (type: string, color: string[]): PaletteCard => ({
      id: type as Palette,
      name: type,
      colors: color,
      segments: color.map((it) => ({ color: it })),
    });

    const filterAndTransformPalettes = (
      palettesObj: Record<string, string[]>,
      visible: Record<string, boolean>
    ): PaletteCard[] => {
      return Object.entries(palettesObj)
        .filter(([type]) => visible[type])
        .map(([type, color]) => createPaletteCard(type, color));
    };

    const palettesCards = ref<PaletteCard[]>(
      filterAndTransformPalettes(getPalette(), store.getters['palette/getSettingsMap'].palette)
    );
    const startPalette = ref(0);
    const endPalette = ref(6);
    const rememberChoose = ref(store.getters['palette/rememberImgMask']);
    const imgMask = computed(() => store.getters['palette/imgMask']);
    const originalImgMask = computed(() => store.getters['palette/getOriginalImgMask']);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');

    onBeforeMount(() => {
      initSelectedFirst();
    });

    onMounted(() => {
      if (rememberChoose.value) {
        const file = imgMask.value;
        if (file) {
          onFileSelected(file);
        }
      }
    });

    const onFileSelected = async (file: File) => {
      imageUrl.value = await readFileAsDataURL(file);
      await store.dispatch('palette/uploadImgMask', { file });
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

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: editorCanvasRef.value?.getCanvasValue(),
          title: '',
          coloristicType: 'mask',
          maskType: '',
          paletteType: selectedCard.value ? selectedCard.value.id : '',
          userId: currentUser.value?.uid,
        });
      } finally {
        isSaveToGallery.value = false;
      }
    };

    const selected = (item: PaletteCard) => {
      selectedCard.value = item;
      frameColors.value = item.colors.map((it) => ({ color: it }));
    };

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const openImageModal = async () => {
      const url = editorCanvasRef.value?.getImageSrc();
      await openDialog(AppImageSignInModal, {
        url,
        coloristicType: 'mask',
        maskType: '',
        paletteType: selectedCard.value ? selectedCard.value.id : '',
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
          store.dispatch('palette/setOriginalImgMask', { file: value.originalFile });
        }
        store.dispatch('palette/uploadImgMask', { file: value.file });
        onFileSelected(value.file);
      });
    };

    watch(rememberChoose, (value: boolean) => {
      store.dispatch('palette/setRememberImgMask', {
        remember: value,
      });
    });

    const saveToDevice = () => {
      editorCanvasRef.value?.triggerSaveImage();
    };

    const openCameraModal = async () => {
      await openDialog(AppCameraModal, {
        colorCards: palettesCards.value,
      }).then((value) => {
        store.dispatch('palette/uploadImgMask', { file: value.file });
        onFileSelected(value.file);
        selected(value.selectedCard);
      });
    };

    const nextPalette = () => {
      startPalette.value === 0 ? initPositionEnd() : initPositionStart();
    };

    const openPaletteSettings = async () => {
      await openDialog(AppPaletteDeterminantSettingsModal, {}).then((value) => {
        palettesCards.value = filterAndTransformPalettes(getPalette(), value.palette);
        initPositionStart();
        initSelectedFirst();
      });
    };

    const initSelectedFirst = () => {
      const [first] = palettesCards.value;
      selectedCard.value = first;
      frameColors.value = first.colors.map((it) => ({ color: it }));
    };

    const initPositionStart = () => {
      startPalette.value = 0;
      endPalette.value = 6;
    };

    const initPositionEnd = () => {
      startPalette.value = 6;
      endPalette.value = 12;
    };

    const order = (card: PaletteCard): number => {
      return palettesCards.value.findIndex((it) => it.id === card.id);
    };

    return {
      frameColors,
      imageUrl,
      onFileSelected,
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
      rememberChoose,
      openImageModal,
      openImageSettingsModal,
      saveToDevice,
      openCameraModal,
      palettesCards,
      targetRef,
      endPalette,
      startPalette,
      nextPalette,
      openPaletteSettings,
      order,
    };
  },
});
</script>
<style scoped lang="scss">
.color-container {
  position: relative;
  overflow: auto;
  height: 100dvh;
}

.color-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  background: var(--color-wrap-bg);
  height: calc(100dvh - var(--header-height));
  gap: 20px;

  & .selected {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-content: flex-start;
    align-items: flex-start;
    justify-content: center;
    position: relative;

    & .arrows {
      width: 100%;
      display: flex;
      justify-content: center;
      cursor: pointer;
    }

    @media (max-width: 600px) {
      .selected-name {
        font-size: 14px;
      }
    }
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
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
  }

  .color-container .color-wrapper {
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex-wrap: nowrap;
    overflow: auto;
    height: 100dvh;
  }
  .color-container .color-wrapper .selected {
    flex: 0 1 auto;
    align-self: flex-start; // не тянется вниз
    width: 100%;
  }
}
</style>
