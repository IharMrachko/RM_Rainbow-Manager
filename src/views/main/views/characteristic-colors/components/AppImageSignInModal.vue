<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <img :src="url" alt="" />
    <section class="info-section">
      <div class="info-section-wrapper">
        <div class="badge-wrapper">
          <span v-if="folder" class="badge darkBadge">{{ folder?.name }}</span>
          <span v-if="coloristicType" class="badge darkBadge">{{ t(coloristicType) }}</span>
          <span v-if="maskType" class="badge darkBadge">{{ t(maskType) }}</span>
          <span v-if="paletteType" class="badge darkBadge">{{ getPaletteName() }}</span>
        </div>

        <app-input
          v-model="signIn"
          :icon="['fas', 'fa-pencil']"
          :is-label="false"
          @focus="focusInput"
          @blur="focusOutInput"
        ></app-input>

        <div class="actions">
          <div class="btn">
            <app-button severity="info" title="addFolder" @click="openFolderModal"></app-button>
          </div>
          <div class="btn">
            <app-button
              :loading="isSaveToGallery"
              severity="warning"
              title="saveToGallery"
              @click="saveToGallery"
            ></app-button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import { string } from 'yup';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import { useStore } from 'vuex';
import { MaskType } from '@/types/mask.type';

import { ColoristicType } from '@/types/coloristic.type';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppFolderModal from '@/shared/components/folder-modal/AppFolderModal.vue';
import { Folder } from '@/store/modules/folder';
import { useI18n } from 'vue-i18n';
import { Palette } from '@/types/palette.type';
import { paletteI18nHelper } from '@/helpers/palette-i18n.helper';
// @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: { AppModalHeader, AppInput, AppButton },
  props: {
    url: string,
    coloristicType: {
      type: String as PropType<ColoristicType>,
      default: '',
    },
    maskType: {
      type: String as PropType<MaskType>,
      default: '',
    },
    paletteType: {
      type: String as PropType<Palette>,
      default: '',
    },
    canvas: HTMLCanvasElement,
    currentUserId: string,
    imageUrl: string,
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const signIn = ref('');
    const isSaveToGallery = ref(false);
    const folder = ref<Folder | null>(null);
    const device = computed(() => store.getters['mobile/getDevice']);

    const close = () => {
      emit('close');
    };

    const saveToGallery = async () => {
      if (!props.imageUrl) {
        await store.dispatch('toast/addToast', {
          message: 'uploadImage',
          severity: 'warning',
        });
        return;
      }
      isSaveToGallery.value = true;

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: props.canvas,
          title: signIn.value,
          coloristicType: props.coloristicType,
          maskType: props.maskType,
          paletteType: props.paletteType,
          userId: props.currentUserId,
          folderId: folder.value?.id ? folder.value?.id : '',
        }); // возвращает URL
        emit('close');
      } finally {
        isSaveToGallery.value = false;
      }
    };

    const openFolderModal = async () => {
      await openDialog(
        AppFolderModal,
        {},
        {
          transparent: true,
        }
      ).then((item: Folder) => {
        folder.value = item;
      });
    };

    const getPaletteName = (): string => {
      const name = paletteI18nHelper.get(props.paletteType) || '';
      return t(name);
    };

    const focusInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        iNoBounce.disable();
        setTimeout(() => window.scrollTo(0, 0), 50);
      }
    };

    return {
      close,
      signIn,
      saveToGallery,
      isSaveToGallery,
      openFolderModal,
      folder,
      t,
      getPaletteName,
      focusInput,
      focusOutInput,
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
}

.dark .darkBadge {
  border: 1px solid #fff;
}

.modal-content img {
  background: var(--color-wrap-bg);
  max-height: 55%;
  width: 100%;
  max-width: 100%;
  object-fit: contain;
  flex: 6;
  padding: 16px;
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #444;
  color: #fff;
  min-width: 100px;
  text-align: center;
}

.info-section {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-grow: 1;
  background: var(--color-bg);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(256, 256, 256, 0.2);

  @media (max-width: 600px) {
    border-radius: 0;
  }
}

.actions {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
