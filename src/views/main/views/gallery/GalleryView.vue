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
        <div class="filter-btn" @click="openFilterModal">
          <app-button severity="secondary" raised :icon="['fas', 'filter']"></app-button>
          <div v-if="!isFilterEmpty" class="filter-fill"></div>
        </div>
      </section>
      <section ref="imagesContainer" class="images" @scroll="onScroll">
        <app-image-card
          v-for="(img, index) in images"
          :key="img.id || index"
          :src="img.src"
          @click="openCardModal(index)"
        >
          <template #default> {{ t('photo') }} {{ index + 1 }} </template>
        </app-image-card>
      </section>
      <footer class="footer">{{ t('total') }}: {{ totalImages }}</footer>
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

export default defineComponent({
  components: { AppLoader, AppButton, AppInput, AppImageCard },
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
    const isFilterEmpty = computed(() => {
      const val = filter.value;
      return !val || isObjectEmpty(filterObjectForEmpty(val));
    });
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

  /* матовое стекло */
  background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}
.filter-btn {
  position: relative;
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
