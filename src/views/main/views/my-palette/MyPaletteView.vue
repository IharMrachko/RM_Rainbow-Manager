<template>
  <div class="color-container">
    <div class="color-wrapper">
      <section class="selected">
        <div class="selected-slider">
          <span class="selected-slider-count">{{ t('numberOfSegments') }}: {{ slider }} </span>
          <span v-if="templateRef?.name" class="template-name"
            >{{ t('template') }}: {{ templateRef?.name }}</span
          >
          <app-slider v-model="slider" :min="1" :max="12"></app-slider>
        </div>

        <div class="color-picker-wrapper">
          <div v-if="isMobile" class="undo">
            <div v-if="templateRef?.name" class="btn">
              <app-button
                raised
                severity="secondary"
                :icon="['fas', 'undo']"
                @click="cancelledTemplate"
              ></app-button>
            </div>
          </div>

          <div class="color-picker-inner">
            <app-color-picker
              :is-preview-row="false"
              :is-combos-section="false"
              :is-info="false"
              @change="colorChange($event)"
            ></app-color-picker>
          </div>
          <section v-if="!isMobile" class="color-picker-actions">
            <div v-if="templateRef?.name" class="btn">
              <app-button
                raised
                severity="secondary"
                title="resetTemplate"
                @click="cancelledTemplate"
              ></app-button>
            </div>
            <div v-if="!isChangeTemplate" class="btn">
              <app-button
                raised
                severity="secondary"
                title="Сохранить изменения"
                @click="openCreateTemplateModal('update')"
              ></app-button>
            </div>
          </section>
          <section v-if="isMobile" class="color-picker-actions">
            <div v-if="!isChangeTemplate" class="btn">
              <app-button
                raised
                severity="secondary"
                :icon="['fas', 'save']"
                @click="openCreateTemplateModal('update')"
              ></app-button>
            </div>
            <div class="btn">
              <app-button
                raised
                severity="secondary"
                :icon="['fas', 'plus']"
                @click="openCreateTemplateModal('create')"
              ></app-button>
            </div>
          </section>
        </div>
      </section>
      <section class="editor">
        <app-editor-canvas
          ref="editorCanvasRef"
          v-model:image-url="imageUrl"
          :segments="frameColors"
          :gap-between-segments="gapBetweenSegments"
          :is-mark-segment="true"
          @selected-segment="selectedSegment($event)"
        ></app-editor-canvas>
      </section>
      <section class="buttons" :class="{ isMobile: isMobile }">
        <div v-if="!isMobile" class="btn">
          <app-button
            raised
            severity="secondary"
            title="addTemplate"
            :icon="['fas', 'plus']"
            @click="openCreateTemplateModal('create')"
          ></app-button>
        </div>
        <div v-if="!isMobile" class="btn">
          <app-button
            raised
            severity="secondary"
            title="myTemplates"
            :icon="['fas', 'fill-drip']"
            @click="openPaletteTemplatesModal"
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
        <app-popover-item @click="openPaletteTemplatesModal">
          <font-awesome-icon size="xl" :icon="['fas', 'fill-drip']" />
          <span>{{ t('myTemplates') }}</span>
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
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import AppSlider from '@/shared/components/AppSlider.vue';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import AppEditorCanvas from '@/views/main/views/characteristic-colors/components/AppEditorCanvas.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useI18n } from 'vue-i18n';
import { EditorCanvasRef } from '@/interfaces/editor-canvas-ref.interface';
import { useStore } from 'vuex';
import { readFileAsDataURL } from '@/helpers/read-file-as-data-url';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/characteristic-colors/components/AppImageSignInModal.vue';
import AppImageSettingsModal from '@/shared/components/AppImageSettingsModal.vue';
import AppCameraModal from '@/shared/components/AppCameraModal.vue';
import AppColorPicker from '@/shared/components/AppColorPicker.vue';
import {
  DEFAULT_COLOR_SEGMENT,
  MARK_COLOR_SEGMENT,
} from '@/views/main/views/my-palette/my-palette.constants';
import AppCreatePaletteTemplateModal from '@/views/main/views/my-palette/components/AppCreatePaletteTemplateModal.vue';
import AppPaletteTemplatesModal from '@/views/main/views/my-palette/components/AppPaletteTemplatesModal.vue';
import { PaletteTemplate } from '@/store/modules/my-palette';

export default defineComponent({
  components: {
    AppColorPicker,
    AppButton,
    AppEditorCanvas,
    AppPopover,
    AppPopoverWrapper,
    AppPopoverItem,
    AppCheckbox,
    AppSlider,
  },
  setup() {
    const editorCanvasRef = ref<EditorCanvasRef | null>(null);
    const { t } = useI18n();
    const uploader = ref();
    const store = useStore();
    const visiblePopover = ref(false);
    const frameColors = ref<{ color: string }[]>(store.getters['myPalette/getFrameColors']);
    const slider = ref(store.getters['myPalette/getNumberSegments']);
    const imageUrl = ref<string | null>(null);
    const isSaveToGallery = ref(false);
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const templateRef = ref<PaletteTemplate | null>(
      store.getters['myPalette/getSelectedPaletteTemplate']
    );
    let activeSegmentIndex = 0;
    const selectedSegmentMap: Map<number, boolean> = new Map<number, boolean>();
    const rememberChoose = ref(store.getters['myPalette/rememberImgMask']);
    const imgMask = computed(() => store.getters['myPalette/imgMask']);
    const originalImgMask = computed(() => store.getters['myPalette/getOriginalImgMask']);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const gapBetweenSegments = computed(() => {
      return frameColors.value.length === 1 ? 0 : 0.003;
    });
    const isChangeTemplate = computed(() => {
      if (templateRef.value) {
        return (
          frameColors.value.length === templateRef.value.segments.length &&
          frameColors.value.every(
            (it, index) => it.color === templateRef.value?.segments[index].color
          )
        );
      } else {
        return true;
      }
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
      await store.dispatch('myPalette/uploadImgMask', { file });
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
          paletteType: '',
          userId: currentUser.value?.uid,
        });
      } finally {
        isSaveToGallery.value = false;
      }
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
        paletteType: '',
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
          store.dispatch('myPalette/setOriginalImgMask', { file: value.originalFile });
        }
        store.dispatch('myPalette/uploadImgMask', { file: value.file });
        onFileSelected(value.file);
      });
    };

    const openCreateTemplateModal = async (mode: 'create' | 'update') => {
      if (mode === 'create') {
        await openDialog(AppCreatePaletteTemplateModal, {
          card: {
            segments: frameColors.value,
          },
        });
      } else {
        await openDialog(AppCreatePaletteTemplateModal, {
          id: templateRef.value?.id,
          name: templateRef.value?.name,
          card: {
            segments: frameColors.value,
          },
        }).then((name: string) => {
          if (name && templateRef.value) {
            templateRef.value = {
              ...templateRef.value,
              name,
            };
          }
        });
      }
    };

    const openPaletteTemplatesModal = async () => {
      await openDialog(AppPaletteTemplatesModal, {
        selectedTemplate: templateRef.value,
      }).then((template: PaletteTemplate) => {
        if (template) {
          templateRef.value = template;
          frameColors.value = template.segments;
          slider.value = template.segments.length;
          if (rememberChoose.value) {
            store.dispatch('myPalette/setFrameColors', {
              frameColors: template.segments,
            });
            store.dispatch('myPalette/selectedTemplate', templateRef.value);
          }
        }
      });
    };

    watch(rememberChoose, (value: boolean) => {
      store.dispatch('myPalette/setRememberImgMask', {
        remember: value,
      });
    });

    const saveToDevice = () => {
      editorCanvasRef.value?.triggerSaveImage();
    };

    const openCameraModal = async () => {
      await openDialog(AppCameraModal, {
        colorCards: [
          {
            segments: frameColors.value,
          },
        ],
      }).then((value) => {
        store.dispatch('myPalette/uploadImgMask', { file: value.file });
        onFileSelected(value.file);
      });
    };

    const selectedSegment = (ind: number) => {
      activeSegmentIndex = ind;
      if (!selectedSegmentMap.has(ind)) {
        setColorsSegment(ind, true);
        return;
      }
      selectedSegmentMap.get(ind) ? setColorsSegment(ind, false) : setColorsSegment(ind, true);
    };

    const setColorsSegment = (ind: number, isActive: boolean) => {
      frameColors.value = frameColors.value.map((it, index) => {
        return index === ind
          ? {
              color: MARK_COLOR_SEGMENT,
            }
          : {
              color: it.color === MARK_COLOR_SEGMENT ? DEFAULT_COLOR_SEGMENT : it.color,
            };
      });
      selectedSegmentMap.set(ind, isActive);
      store.dispatch('myPalette/setFrameColors', {
        frameColors: frameColors.value,
      });
    };

    watch(slider, (value) => {
      const result = [];
      for (let i = 0; i < value; i++) {
        const color = templateRef.value
          ? {
              color: templateRef.value.segments[i]
                ? templateRef.value.segments[i].color
                : DEFAULT_COLOR_SEGMENT,
            }
          : { color: DEFAULT_COLOR_SEGMENT };
        result.push(color);

        frameColors.value = result;
        if (rememberChoose.value) {
          store.dispatch('myPalette/setFrameColors', {
            frameColors: frameColors.value,
          });
          store.dispatch('myPalette/setNumberSegments', slider);
        }
      }
    });

    const colorChange = (selectedHex: string) => {
      frameColors.value = frameColors.value.map((it, index) => {
        return index === activeSegmentIndex
          ? {
              color: selectedHex,
            }
          : it;
      });
      store.dispatch('myPalette/setFrameColors', {
        frameColors: frameColors.value,
      });
    };

    const cancelledTemplate = () => {
      templateRef.value = null;
      slider.value = 1;
      store.dispatch('myPalette/selectedTemplate', null);
    };

    return {
      frameColors,
      imageUrl,
      onFileSelected,
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
      targetRef,
      visible,
      colorChange,
      slider,
      selectedSegment,
      gapBetweenSegments,
      openCreateTemplateModal,
      openPaletteTemplatesModal,
      templateRef,
      isChangeTemplate,
      cancelledTemplate,
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
    display: flex;
    justify-content: center;
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
    width: 100%;
    gap: 0;
  }
}

.selected-slider {
  width: 100%;

  @media (max-width: 600px) {
    padding: 0;
  }
}

.template-name {
  margin-left: 10px;
}
.color-picker-inner {
  flex: 2;
}
.undo {
  width: 80px;
}

.color-picker-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 600px) {
    justify-content: end;
    flex-wrap: wrap;
    width: 80px;
  }
}

@media (max-width: 600px) {
  .selected-slider-count,
  .template-name {
    font-size: 12px;
  }
  .color-picker-wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
}
</style>
