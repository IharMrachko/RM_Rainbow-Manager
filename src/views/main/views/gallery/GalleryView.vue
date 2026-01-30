<template>
  <div class="gallery-container">
    <section v-if="isClueSection" class="clue">
      <div class="clue-wrapper">
        <font-awesome-icon size="xl" :icon="['fas', 'exclamation-triangle']" />
        {{ t('galleryEmpty') }}
        <font-awesome-icon size="xl" :icon="['fas', 'images']" @click="openCollageModal" />
      </div>
    </section>
    <section v-if="isNotFoundSection" class="not-found">
      <div class="not-found-wrapper">{{ t('noResults') }}</div>
    </section>
    <AppLoader v-if="isLoading"></AppLoader>
    <div ref="galleryRef" class="gallery-wrapper">
      <section class="gallery-helper" :class="{ hidden: isHidden }">
        <div class="search">
          <app-input
            v-model="search"
            placeholder="search"
            :icon="['fas', 'search']"
            :is-label="false"
          ></app-input>
        </div>

        <section class="actions-mode">
          <div v-if="!isMobile" class="choose-checkbox">
            <AppCheckbox v-model="isSelectedMode" label="choose"></AppCheckbox>
          </div>
          <div v-if="isSelectedMode && !isMobile" class="choose-checkbox">
            <AppCheckbox v-model="chooseAll" label="chooseAll"></AppCheckbox>
          </div>
          <app-button
            severity="secondary"
            raised
            :icon="['fas', 'filter']"
            @click="openFilterModal"
          ></app-button>
          <div v-if="!isFilterEmpty" class="filter-fill"></div>
        </section>
      </section>
      <section ref="imagesContainer" class="images" :class="{ hidden: isHidden }">
        <app-virtual-scroll-grid
          :items="images"
          :item-key="(item: Image) => item.id"
          :min-column-width="isMobile ? 100 : 250"
          :row-height="isMobile ? 150 : 300"
          :height="heightImagesContainer"
          @scroll="onScroll"
        >
          <template #default="{ item, index }">
            <app-image-card :src="item.src" :image="item" @click="openCardModal(index)">
              <template #default> {{ t('photo') }} {{ getCurrentIndex(item) + 1 }} </template>
            </app-image-card>
          </template>
        </app-virtual-scroll-grid>
      </section>
      <footer class="footer" :class="{ hidden: isHidden }">
        <div class="icon-list-ol">
          <font-awesome-icon size="lg" :icon="['fas', 'list-ol']" />
          <span> {{ totalImages }}</span>
        </div>
        <div class="icon-ellipsis-h">
          <font-awesome-icon
            v-if="isMobile"
            :icon="['fas', 'ellipsis-h']"
            size="lg"
            @click.stop="openPopover"
          />
        </div>
        <section class="selected-section" :class="{ mobile: isMobile }">
          <div v-if="isSelectedMode && selected.length" class="icon">
            <font-awesome-icon size="lg" :icon="['fas', 'images']" @click="openCollageModal" />
            {{ selected.length }}
          </div>

          <div v-if="isSelectedMode && selected.length" class="icon" @click="clearSelected">
            <font-awesome-icon size="lg" :icon="['fas', 'broom']" />
          </div>
          <div v-if="isSelectedMode && selected.length" class="icon" @click="openDeleteModal">
            <font-awesome-icon size="lg" :icon="['fas', 'fa-trash']" />
          </div>
        </section>
      </footer>
      <app-popover v-model:visible="visiblePopover">
        <app-popover-wrapper>
          <app-popover-item>
            <AppCheckbox v-model="isSelectedMode"></AppCheckbox>
            <span>{{ t('choose') }}</span>
          </app-popover-item>
          <app-popover-item v-if="isSelectedMode">
            <AppCheckbox v-model="chooseAll"></AppCheckbox>
            <span>{{ t('chooseAll') }}</span>
          </app-popover-item>
        </app-popover-wrapper>
      </app-popover>
    </div>
  </div>
</template>
<script lang="ts">
import AppImageCard from '@/views/main/views/gallery/components/AppImageCard.vue';
import AppImageModal from '@/views/main/views/gallery/components/AppImageModal.vue';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useStore } from 'vuex';
import AppLoader from '@/shared/components/AppLoader.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppGalleryFilterModal from '@/views/main/views/gallery/components/AppGalleryFilterModal.vue';
import { useI18n } from 'vue-i18n';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import AppConfirmModal from '@/shared/components/AppConfirmModal.vue';
import { GalleryOptions, Image } from '@/store/modules/firebase-gallery';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import AppVirtualScrollGrid from '@/shared/components/AppVirtualScrollGrid.vue';
import AppCanvasCollage from '@/views/main/views/gallery/components/AppCanvasCollage.vue';
import { filterObjectForEmpty, isObjectEmpty } from '@/helpers/object-empty.helper';

export default defineComponent({
  components: {
    AppVirtualScrollGrid,
    AppPopover,
    AppPopoverWrapper,
    AppPopoverItem,
    AppCheckbox,
    AppLoader,
    AppButton,
    AppInput,
    AppImageCard,
  },
  setup() {
    const { t } = useI18n();
    const store = useStore();
    const search = ref('');
    const imagesContainer = ref<HTMLElement | null>(null);
    const galleryRef = ref<HTMLElement | null>(null);
    const images = computed(() => store.getters['gallery/getImages']);
    const currentIndex = ref<number | null>(null);
    const currentUserId = computed(() => store.getters['authFirebase/getUserId']);
    const totalImages = computed(() => store.getters['gallery/getTotalImages']);
    const lastDoc = computed(() => store.getters['gallery/getLastDoc']);
    const isLoading = computed(() => store.getters['gallery/isLoading']);
    const filter = computed(() => store.getters['gallery/getFilter']);
    const selected = computed<Image[]>(() => store.getters['gallery/getSelected']);
    const isFilterEmpty = computed(() => {
      const val = filter.value;
      return !val || isObjectEmpty(filterObjectForEmpty(val));
    });

    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const isClueSection = computed(() => {
      return (
        !isInit.value &&
        !isLoading.value &&
        !search.value?.trim() &&
        isFilterEmpty.value &&
        images.value.length === 0
      );
    });
    const isNotFoundSection = computed(() => {
      return (
        !isInit.value &&
        !isLoading.value &&
        images.value?.length === 0 &&
        (!!search.value?.trim() || !isFilterEmpty.value)
      );
    });
    const isSelectedMode = ref(false);
    const chooseAll = ref(false);
    const visiblePopover = ref(false);
    const isHidden = ref(false);
    const isInit = ref(true);
    let lastScrollTop = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    onMounted(async () => {
      await store.dispatch('folder/getFolders', currentUserId.value);
      await initUserGalleryItems(true, search.value);
      isSelectedMode.value = !!selected.value.length;
      isInit.value = false;
    });

    const initUserGalleryItems = async (reset = false, search: string) => {
      await store.dispatch('gallery/initUserGalleryItems', {
        userId: currentUserId.value,
        options: {
          ...galleryOptions(search),
        },
        reset,
      });
    };

    const galleryOptions = (search: string): GalleryOptions => {
      return {
        title: search,
        coloristicType: filter.value?.coloristicType?.id,
        maskType: filter.value?.maskType?.type,
        folderId: filter.value?.folder?.id,
        paletteType: filter.value?.paletteType?.id,
      };
    };

    const openCardModal = async (index: number) => {
      await openDialog(AppImageModal, {
        images: images.value,
        startIndex: index,
      });
    };

    const openFilterModal = async () => {
      await openDialog(AppGalleryFilterModal, {}).then((isSetFilter) => {
        if (isSetFilter) {
          initUserGalleryItems(true, search.value);
        }
      });
    };

    const openCollageModal = async () => {
      if (selected.value.length > 6) {
        await store.dispatch('toast/addToast', {
          message: 'maximumSelectedCollage',
          severity: 'warning',
        });
        return;
      }
      await openDialog(AppCanvasCollage, {
        images: selected.value.map((it) => it.src),
        padding: 5,
      }).then((result) => {
        if (result?.update) {
          initUserGalleryItems(true, search.value);
        }
      });
    };

    const onScroll = async (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollBottom = Math.ceil(target.scrollTop + target.clientHeight);
      const scrollTop = target.scrollTop;
      const isEndReached = scrollBottom >= target.scrollHeight;
      if (isEndReached) {
        if (totalImages.value > images.value.length && !isLoading.value) {
          await store.dispatch('gallery/initUserGalleryItems', {
            userId: currentUserId.value,
            options: {
              ...galleryOptions(search.value),
              lastDoc: lastDoc.value,
            },
          });
        }
      }
      const nearBottom = scrollBottom >= target.scrollHeight - 20; // порог 20px

      if (galleryRef.value && galleryRef.value.clientHeight >= target.scrollHeight) {
        isHidden.value = false;
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        return;
      }

      if (!nearBottom) {
        if (scrollTop > lastScrollTop) {
          isHidden.value = true;
        } else if (scrollTop < lastScrollTop) {
          isHidden.value = false;
        }
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    watch(search, (newVal) => {
      if (timeout) clearTimeout(timeout);
      isInit.value = true;
      timeout = setTimeout(() => {
        initUserGalleryItems(true, newVal);
        isInit.value = false;
      }, 300);
    });

    watch(isSelectedMode, (isSelectedMode) => {
      store.dispatch('gallery/setSelectedMode', isSelectedMode);
      if (!isSelectedMode) {
        clearSelected();
      }
    });

    watch(chooseAll, (isChooseAll) => {
      if (isChooseAll) {
        store.dispatch('gallery/setSelectedMode', true);
        store.dispatch('gallery/setSelectedAll', images.value);
      } else {
        store.dispatch('gallery/clearSelected');
      }
    });

    const openDeleteModal = async () => {
      await openDialog(AppConfirmModal, {
        text: t('dyrAllDeleted'),
        title: t('delete'),
      }).then((isDeleted) => {
        if (isDeleted) {
          store.dispatch(
            'gallery/deleteImagesFromGallery',
            selected.value.map((v) => v.id)
          );
        }
      });
    };

    const clearSelected = () => {
      store.dispatch('gallery/clearSelected');
    };

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const getCurrentIndex = (image: Image) => {
      return images.value.findIndex((v: Image) => v.id === image.id);
    };

    const heightImagesContainer = computed(() => {
      if (isMobile.value && isHidden.value) {
        return 'calc(100dvh - var(--header-height) - 5px)';
      }

      return isHidden.value
        ? 'calc(100dvh - var(--header-height) - 25px)'
        : 'calc(100dvh - var(--header-height) - 135px)';
    });

    return {
      images,
      currentIndex,
      openCardModal,
      isLoading,
      totalImages,
      imagesContainer,
      onScroll,
      search,
      openFilterModal,
      isFilterEmpty,
      t,
      isSelectedMode,
      selected,
      openDeleteModal,
      clearSelected,
      chooseAll,
      isMobile,
      openPopover,
      visiblePopover,
      isHidden,
      getCurrentIndex,
      heightImagesContainer,
      galleryRef,
      openCollageModal,
      isClueSection,
      isNotFoundSection,
    };
  },
});
</script>
<style scoped lang="scss">
@import '@/styles/style';
.gallery-helper {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .search {
    width: 350px;
  }

  @media (max-width: 600px) {
    padding: 15px;
    margin-bottom: 0;

    .search {
      width: 250px;
    }
  }
}
.gallery-container {
  position: relative;
  overflow: auto;
  height: calc(100dvh - var(--header-height));
  width: 100%;
  display: flex;
  background: var(--color-wrap-bg);

  @media (max-width: 600px) {
    height: 100dvh;
  }

  .gallery-wrapper {
    width: 100%;
    overflow: hidden;
  }

  .images {
    padding: 0 0 0 20px;
    @media (max-width: 600px) {
      padding: 0;
    }
  }

  @media (max-width: 600px) {
    padding: 0;
  }
}

.footer {
  height: 55px;
  padding: 9px 20px 15px 25px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  /* матовое стекло */
  background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
  border-top: 1px solid rgba(255, 255, 255, 0.3);

  & .icon-list-ol {
    flex: 1;
    display: flex;
    gap: 10px;
    align-items: center;
  }

  & .icon-ellipsis-h {
    cursor: pointer;
    display: flex;
    flex: 0.8;
    align-items: center;
    justify-content: center;
  }

  & .selected-section {
    display: flex;
    align-items: center;
    gap: 10px;

    & .selected {
      font-weight: bold;
    }

    & .icon {
      cursor: pointer;
    }
  }
  & .selected-section.mobile {
    flex: 1;
  }
}
.actions-mode {
  position: relative;
  display: flex;
  align-items: center;
  & .choose-checkbox {
    width: 120px;
    margin-right: 20px;
  }

  & .filter-fill {
    @include filter-dot;
    right: 10px;
  }
}

.gallery-helper,
.footer {
  transition: transform 0.3s ease, opacity 0.3s ease;

  &.hidden {
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    height: 0;
    margin: 0;
    padding-bottom: 2px;

    @media (max-width: 600px) {
      padding: 0;
    }
  }
}

.footer.hidden {
  transform: translateY(100%);
}

// Базовый миксин для абсолютного центрирования
@mixin absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

// Базовый миксин для адаптивного контейнера
@mixin responsive-container($mobile-top: 30%) {
  @media (max-width: 600px) {
    width: 100%;
    padding: 20px;
    top: $mobile-top;
  }
}

// Стили для центрированных блоков с контентом
.centered-block {
  @include absolute-center;

  &-wrapper {
    width: 700px;
    margin: 0 auto;

    @media (max-width: 600px) {
      width: 100%;
    }
  }

  @include responsive-container;
}

// Конкретные компоненты (могут наследовать или использовать миксины)
.clue {
  @extend .centered-block;

  &-wrapper {
    width: 700px;
    margin: 0 auto;

    @media (max-width: 600px) {
      width: 100%;
    }
  }
}

.not-found {
  @include absolute-center;

  &-wrapper {
    width: 700px;
    display: flex;
    justify-content: center;

    @media (max-width: 600px) {
      width: 100%;
    }
  }

  @include responsive-container;
}
</style>
