<template>
  <div class="gallery-container">
    <AppLoader v-if="isLoading"></AppLoader>
    <div class="gallery-wrapper">
      <section class="gallery-helper">
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
            <AppCheckbox v-model="chooseAll" label="Выбрать все"></AppCheckbox>
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
      <section ref="imagesContainer" class="images" @scroll="onScroll">
        <app-image-card
          v-for="(img, index) in images"
          :key="img.id || index"
          :src="img.src"
          :image="img"
          @click="openCardModal(index)"
        >
          <template #default> {{ t('photo') }} {{ index + 1 }} </template>
        </app-image-card>
      </section>
      <footer class="footer">
        <div class="icon-list-ol">
          <font-awesome-icon size="sm" :icon="['fas', 'list-ol']" /> {{ totalImages }}
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
            <font-awesome-icon size="sm" :icon="['fas', 'check']" /> {{ selected.length }}
          </div>

          <div v-if="isSelectedMode && selected.length" class="icon" @click="openDeleteModal">
            <font-awesome-icon size="sm" :icon="['fas', 'fa-trash']" />
          </div>
          <div v-if="isSelectedMode && selected.length" class="icon" @click="clearSelected">
            <font-awesome-icon size="sm" :icon="['fas', 'broom']" />
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
import { filterObjectForEmpty, isObjectEmpty } from '@/helpers/object-empty.helper';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import AppConfirmModal from '@/shared/components/AppConfirmModal.vue';
import { Image } from '@/store/modules/firebase-gallery';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';

export default defineComponent({
  components: {
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
    const isSelectedMode = ref(false);
    const chooseAll = ref(false);
    const visiblePopover = ref(false);

    let timeout: ReturnType<typeof setTimeout> | null = null;
    onMounted(async () => {
      await store.dispatch('folder/getFolders', currentUserId.value);
      await store.dispatch('gallery/initUserGalleryItems', {
        userId: currentUserId.value,
        options: {
          title: search.value,
          coloristicType: filter.value?.coloristicType?.id,
          maskType: filter.value?.maskType?.type,
          folderId: filter.value?.folder?.id,
        },
        reset: true,
      });
    });

    const openCardModal = async (index: number) => {
      await openDialog(AppImageModal, {
        images: images.value,
        startIndex: index,
      });
    };

    const openFilterModal = async () => {
      await openDialog(AppGalleryFilterModal, {}).then((isSetFilter) => {
        if (isSetFilter) {
          store.dispatch('gallery/initUserGalleryItems', {
            userId: currentUserId.value,
            options: {
              title: search.value,
              coloristicType: filter.value?.coloristicType?.id,
              maskType: filter.value?.maskType?.type,
              folderId: filter.value?.folder?.id,
            },
            reset: true,
          });
        }
      });
    };

    const onScroll = async (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollBottom = Math.ceil(target.scrollTop + target.clientHeight);
      const isEndReached = scrollBottom >= target.scrollHeight;
      if (isEndReached) {
        if (totalImages.value > images.value.length && !isLoading.value) {
          await store.dispatch('gallery/initUserGalleryItems', {
            userId: currentUserId.value,
            options: {
              title: search.value,
              coloristicType: filter.value?.coloristicType?.id,
              maskType: filter.value?.maskType?.type,
              folderId: filter.value?.folder?.id,
              lastDoc: lastDoc.value,
            },
          });
        }
      }
    };

    watch(search, (newVal) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        store.dispatch('gallery/initUserGalleryItems', {
          userId: currentUserId.value,
          options: {
            title: newVal,
            ...filter,
          },
          reset: true,
        });
      }, 300);
    });

    watch(isSelectedMode, (isSelectedMode) => {
      store.dispatch('gallery/setSelectedMode', isSelectedMode);
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
    };
  },
});
</script>
<style scoped lang="scss">
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
    margin-bottom: 10px;

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

  .gallery-wrapper {
    width: 100%;

    & .images {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 10px;
      padding: 0 0 0 20px; /* контролируем поля */
      overflow: auto;
      height: calc(100dvh - var(--header-height) - 145px);
      /* Скрыть скроллбар в разных браузерах */
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE и Edge */

      @media (max-width: 600px) {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        padding: 0;
        align-content: start;
        gap: 3px;
      }

      &::-webkit-scrollbar {
        /* Chrome, Safari, Opera */
        display: none;
      }
    }
  }

  @media (max-width: 600px) {
    padding: 5px 0;
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
  }

  & .icon-ellipsis-h {
    cursor: pointer;
    display: flex;
    flex: 1.2;
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
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: red;
    top: 6px;
    right: 10px;
  }
}
</style>
