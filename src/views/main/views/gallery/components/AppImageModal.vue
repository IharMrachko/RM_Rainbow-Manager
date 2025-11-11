<template>
  <section class="modal-wrapper">
    <div ref="modalRef" class="modal-content neon">
      <app-modal-header @close="close"></app-modal-header>
      <div ref="targetRef" class="ellipsis-vertical" @click="toggleImageOverlayPanel">
        <font-awesome-icon size="lg" :icon="['fas', 'fa-ellipsis-vertical']" />
      </div>
      <app-overlay-panel
        v-if="targetRef"
        v-model:visible="visible"
        :width="250"
        :target="targetRef"
        :position="{
          x: 'left',
          y: 'center',
        }"
      >
        <div class="overlay-image">
          <div class="overlay-image-item" @click="openFolderModal">
            <font-awesome-icon size="sm" :icon="['fas', 'fa-folder']" />
            {{ t('addFolder') }}
          </div>
          <div class="overlay-image-item" @click="updateFolder">
            <font-awesome-icon size="sm" :icon="['fas', 'undo']" />
            {{ t('update') }}
          </div>
          <div class="overlay-image-item" @click="copyLink">
            <font-awesome-icon size="sm" :icon="['fas', 'fa-link']" />
            {{ t('copyLink') }}
          </div>
        </div>
      </app-overlay-panel>
      <!-- Фото -->
      <img :src="currentImage.src" alt="" class="modal-image" />
      <section class="info-section scroll-area">
        <div class="info-section-wrapper">
          <div class="slider-dots">
            <div
              v-for="(img, i) in images"
              :key="img.id"
              class="dot"
              :class="{ active: i === index }"
            ></div>
          </div>
          <div class="info">
            <div class="badge-wrapper">
              <span v-if="localImages[index].folder" class="badge darkBadge">{{
                localImages[index].folder.name
              }}</span>
              <span v-if="currentImage.maskType" class="badge darkBadge">{{
                currentImage.maskType
              }}</span>
              <span v-if="currentImage.coloristicType" class="badge darkBadge">{{
                currentImage.coloristicType
              }}</span>
            </div>
            <div v-if="!isEditTitle" class="info-title">
              <font-awesome-icon
                size="xs"
                :icon="['fas', 'fa-pencil']"
                @click="toggleTitle(currentImage.title)"
              />
              <span> {{ currentImage.title ? currentImage.title : t('noName') }}</span>
            </div>
            <div v-if="isEditTitle" class="edit-title">
              <app-input
                v-model="sign"
                :icon="['fas', 'fa-pencil']"
                :is-label="false"
                is-focused
              ></app-input>
              <div class="edit-title-save-icon" @click="updateSign">
                <font-awesome-icon size="sm" :icon="['fas', 'undo']" />
              </div>
            </div>
          </div>

          <div class="actions">
            <div class="btn">
              <app-button
                severity="error"
                :icon="['fas', 'fa-trash']"
                @click="deleteImage"
              ></app-button>
            </div>
          </div>
        </div>
      </section>

      <div v-if="!isMobile" class="next" @click="next">
        <font-awesome-icon :icon="['fas', 'fa-arrow-right']" />
      </div>
      <div v-if="!isMobile" class="prev" @click="prev">
        <font-awesome-icon :icon="['fas', 'fa-arrow-left']" />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  watch,
} from 'vue';
import AppButton from '@/shared/components/AppButton.vue';

import { useStore } from 'vuex';
import AppInput from '@/shared/components/AppInput.vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppConfirmModal from '@/shared/components/AppConfirmModal.vue';
import { useI18n } from 'vue-i18n';
import { Image, ImageUpdate } from '@/store/modules/firebase-gallery';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
import AppFolderModal from '@/shared/components/folder-modal/AppFolderModal.vue';
import { Folder } from '@/store/modules/firebase-folder';

export default defineComponent({
  components: { AppOverlayPanel, AppModalHeader, AppInput, AppButton },
  props: {
    images: { type: Array as PropType<Image[]>, required: true },
    startIndex: { type: Number, required: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const index = ref(props.startIndex);
    const modalRef = ref<HTMLElement | null>(null);
    const isEditTitle = ref(false);
    const sign = ref('');
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const currentImage = computed(() => props.images[index.value]);
    const visible = ref(false);
    const targetRef = ref<HTMLElement | null>(null);
    const localImages = ref<Image[]>([...props.images]);

    watch(
      () => props.startIndex,
      (val) => {
        index.value = val;
      }
    );

    const next = () => {
      index.value = (index.value + 1) % props.images.length;
      isEditTitle.value = false;
    };

    const prev = () => {
      index.value = (index.value - 1 + props.images.length) % props.images.length;
      isEditTitle.value = false;
    };

    const close = () => {
      emit('close');
    };

    const toggleTitle = (title: string) => {
      isEditTitle.value = true;
      sign.value = title;
    };

    const deleteImage = async () => {
      await openDialog(AppConfirmModal, {
        text: t('dywDelete'),
        title: t('delete'),
      }).then((isDeleted) => {
        if (isDeleted) {
          store.dispatch('gallery/deleteImageFromGallery', {
            id: props.images[index.value].id,
          });
          emit('close');
        }
      });
    };

    const updateSign = () => {
      const image: Image = props.images[index.value];
      isEditTitle.value = false;
      if (image?.title === sign.value) {
        return;
      }
      store.dispatch('gallery/updateImageInGallery', {
        ...getImageUpdate(image, sign.value),
      });
    };

    const updateFolder = () => {
      toggleImageOverlayPanel();
      store.dispatch('gallery/updateImageInGallery', {
        ...getImageUpdate(props.images[index.value]),
      });
    };

    const getImageUpdate = (image: Image, title?: string): ImageUpdate => {
      return {
        id: image.id,
        src: image.src,
        title: title ? title : image.title,
        coloristicType: image.coloristicType,
        maskType: image.maskType,
        folderId: image?.folder?.id ?? null,
      };
    };

    function lockBodyScroll() {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('modal-open');
      (document.body as any)._scrollY = scrollY;
    }
    function unlockBodyScroll() {
      const prevY = (document.body as any)._scrollY || 0;
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, prevY);
    }

    // высота клавиатуры = innerHeight - visualViewport.height (если доступно)
    function updateKeyboardPadding() {
      const vv = (window as any).visualViewport;
      const kb =
        vv && typeof vv.height === 'number' ? Math.max(0, window.innerHeight - vv.height) : 0;
      document.documentElement.style.setProperty('--kb', `${kb}px`);
    }

    onMounted(() => {
      lockBodyScroll();
      updateKeyboardPadding();

      const onResize = () => updateKeyboardPadding();
      const onFocusIn = () => updateKeyboardPadding();
      const onFocusOut = () => document.documentElement.style.setProperty('--kb', '0px');

      (window as any).visualViewport?.addEventListener('resize', onResize);
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      document.addEventListener('focusin', onFocusIn);
      document.addEventListener('focusout', onFocusOut);

      // сохранить для снятия
      (document.documentElement as any)._cleanupKb = () => {
        (window as any).visualViewport?.removeEventListener('resize', onResize);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        document.removeEventListener('focusin', onFocusIn);
        document.removeEventListener('focusout', onFocusOut);
      };
      ///

      let startX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) next(); // свайп влево
        if (endX - startX > 50) prev(); // свайп вправо
      };

      if (modalRef.value) {
        modalRef.value.addEventListener('touchstart', handleTouchStart);
        modalRef.value.addEventListener('touchend', handleTouchEnd);

        // сохраняем ссылки, чтобы удалить потом
        (modalRef.value as any)._touchHandlers = { handleTouchStart, handleTouchEnd };
      }
    });

    onUnmounted(() => {
      if (modalRef.value && (modalRef.value as any)._touchHandlers) {
        const { handleTouchStart, handleTouchEnd } = (modalRef.value as any)._touchHandlers;
        modalRef.value.removeEventListener('touchstart', handleTouchStart);
        modalRef.value.removeEventListener('touchend', handleTouchEnd);
      }
      unlockBodyScroll();
      (document.documentElement as any)._cleanupKb?.();
      document.documentElement.style.removeProperty('--kb');
    });

    const toggleImageOverlayPanel = () => {
      visible.value = !visible.value;
    };

    const openFolderModal = async () => {
      toggleImageOverlayPanel();
      await openDialog(
        AppFolderModal,
        {
          folder: props.images[index.value].folder,
        },
        {
          transparent: true,
        }
      ).then((item: Folder) => {
        localImages.value[index.value].folder = item;
      });
    };

    const copyLink = async () => {
      toggleImageOverlayPanel();
      const link = props.images[index.value].src;
      try {
        await navigator.clipboard.writeText(link);
        await store.dispatch('toast/addToast', {
          message: 'Ссылка скопирована!',
          severity: 'success',
        });
      } catch (err) {
        await store.dispatch('toast/addToast', {
          message: 'Ошибка копирования!',
          severity: 'error',
        });
      }
    };

    watch(
      index,
      async (newIndex) => {
        await nextTick();
        const dots = document.querySelectorAll('.slider-dots .dot');
        const activeDot = dots[newIndex] as HTMLElement;
        if (activeDot) {
          activeDot.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest',
          });
        }
      },
      { immediate: true }
    );

    return {
      index,
      next,
      prev,
      close,
      modalRef,
      isMobile,
      isEditTitle,
      toggleTitle,
      sign,
      deleteImage,
      updateSign,
      currentImage,
      toggleImageOverlayPanel,
      targetRef,
      visible,
      t,
      openFolderModal,
      localImages,
      updateFolder,
      copyLink,
    };
  },
});
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: pan-y;
}
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;

  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;
  padding-bottom: var(--kb, 0px); /* «подушка» под клавиатуру */
  @supports (-webkit-touch-callout: none) {
    /* iOS-специфика, помогает с высотой */
    height: -webkit-fill-available;
  }
  @media (max-width: 600px) {
    width: 100vw;
    flex-direction: column; /* вертикально */
    justify-content: flex-start;
    border-radius: 0;
    box-shadow: none;
    border: none;
    overflow: hidden;
    height: 100%;
  }
}
.dark .neon {
  /* 🎇 Неоновая подсветка */
  border: 1px solid #0ff;
  box-shadow: 0 0 5px #0ff, 0 0 5px #0ff, 0 0 5px #0ff, 0 0 25px #0ff;
  @media (max-width: 600px) {
    box-shadow: none;
    border: none;
  }
}
.modal-content img {
  background: var(--color-wrap-bg);
  max-height: 65%;
  width: 100%;
  max-width: 100%;
  object-fit: contain;
  flex: 6;
  padding: 16px;

  @media (max-width: 600px) {
    max-height: 65%;
  }
}
.info-title {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  gap: 10px;
  cursor: pointer;
  height: 24px;
  margin-bottom: 16px;

  & span {
    margin-right: 20px;
  }
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #444;
  color: #fff;
}

.dark .darkBadge {
  border: 1px solid #fff;
}
.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;

  & .btn {
    width: 150px;
  }
}
.actions button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #555;
  color: white;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
}

.prev,
.next {
  position: absolute;
  padding: 8px 12px;
  cursor: pointer;
}

.prev {
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
}
.next {
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
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

.info-section-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@media (max-width: 600px) {
  .badge {
    font-size: 12px;
    padding: 2px 6px;
  }

  .actions {
    & .btn {
      width: 100px;
    }
  }

  .actions button {
    width: 100%;
    font-size: 16px;
    padding: 10px;
  }
}

.edit-title {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;

  & .edit-title-save-icon {
    cursor: pointer;
    position: absolute;
    right: 20px;
    z-index: 100;
    color: black;
  }
  @media (max-width: 600px) {
  }
}

.ellipsis-vertical {
  position: absolute;
  top: 100px;
  right: 20px;
  cursor: pointer;

  @media (max-width: 600px) {
    top: 24px;
  }
}

.overlay-image {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  & .overlay-image-item {
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #eaeaeb;
    cursor: pointer;
  }
}
.slider-dots {
  position: relative;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* чтобы точки шли подряд */
  gap: 5px;
  width: 75px;
  overflow-x: auto; /* включаем горизонтальный скролл */
  scrollbar-width: none; /* скрыть скроллбар в Firefox */
}
.slider-dots::-webkit-scrollbar {
  display: none; /* скрыть скроллбар в Chrome/Safari */
}

.slider-dots .dot {
  flex-shrink: 0; /* запрещаем сжатие точек */
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}
.dot.active {
  background: var(--active-doing);
  width: 9px;
  height: 9px;
}

/* Блокируем фон страницы при модалке */
body.modal-open {
  overflow: hidden;
  position: fixed; /* предотвращает «скачки» на iOS */
  width: 100%;
}

/* iOS учёт доступной высоты */
@supports (-webkit-touch-callout: none) {
  .modal-wrapper {
    height: -webkit-fill-available;
  }
}

/* Избежать zoom при фокусе */
input,
textarea {
  font-size: 16px;
}

/* Для «чёлки» и нижней зоны */
.modal-content {
  padding-bottom: calc(var(--kb, 0px) + env(safe-area-inset-bottom, 0px));
}

/* зона, где разрешён скролл — только она */
.scroll-area {
  flex: 1 1 auto;
  min-height: 0; /* очень важно для корректного flex + overflow */
  overflow: auto;
  -webkit-overflow-scrolling: touch; /* плавный скролл на iOS */
}
/* изображение не должно «ломать» высоту */
.modal-image {
  flex: 0 0 auto;
  max-height: 65%;
  width: 100%;
  object-fit: contain;
}
</style>
