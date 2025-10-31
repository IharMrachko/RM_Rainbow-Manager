<template>
  <div class="gallery-container">
    <AppLoader v-if="isLoading"></AppLoader>
    <div class="gallery-wrapper">
      <section class="gallery-helper">
        <div class="search">
          <app-input
            :placeholder="'Search'"
            :icon="['fas', 'search']"
            :is-label="false"
          ></app-input>
        </div>
        <div><app-button severity="secondary" raised :icon="['fas', 'filter']"></app-button></div>
      </section>
      <section class="images">
        <app-image-card
          v-for="(img, index) in images"
          :key="img.id || index"
          :src="img.src"
          @click="openModal(index)"
        >
          <template #default> Фото {{ index + 1 }} </template>
        </app-image-card>
      </section>
    </div>
  </div>
  <footer class="footer">Загружено: 100</footer>
</template>
<script lang="ts">
import AppImageCard from '@/views/main/views/gallery/components/AppImageCard.vue';
import AppImageModal from '@/views/main/views/gallery/components/AppImageModal.vue';
import { defineComponent, onMounted, ref } from 'vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppButton from '@/shared/components/AppButton.vue';
import {
  collection,
  endAt,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  startAfter,
  startAt,
  where,
} from 'firebase/firestore';
import { useStore } from 'vuex';
import AppLoader from '@/shared/components/AppLoader.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';

type Options = {
  coloristicType?: string;
  title?: string;
  pageSize?: number;
  lastDoc?: any;
};
export default defineComponent({
  components: { AppLoader, AppButton, AppInput, AppImageCard },
  setup() {
    const store = useStore();
    const images = ref<any[]>([]);
    const db = getFirestore();
    const currentIndex = ref<number | null>(null);
    const isLoading = ref(false);
    async function getUserGalleryItems(userId: string, options: Options = {}) {
      const { coloristicType, title, pageSize = 20, lastDoc } = options;

      const itemsRef = collection(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items');

      const constraints: any[] = [where('userId', '==', userId)];

      if (coloristicType) {
        constraints.push(where('coloristicType', '==', coloristicType));
      }

      if (title) {
        // префиксный поиск по title
        constraints.push(orderBy('title'));
        constraints.push(startAt(title));
        constraints.push(endAt(title + '\uf8ff'));
      } else {
        // сортировка по дате создания
        constraints.push(orderBy('createdAt', 'desc'));
      }

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(pageSize));

      const q = query(itemsRef, ...constraints);
      const snapshot = await getDocs(q);

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        items,
        lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
      };
    }

    onMounted(async () => {
      isLoading.value = true;
      const userId = store.getters['authFirebase/getUserId'];
      if (userId) {
        const { items } = await getUserGalleryItems(userId);
        images.value = items.map((item: any) => ({
          id: item.id,
          src: item.url,
          title: item.title,
          coloristicType: item.coloristicType,
          maskType: item.maskType,
        }));
        isLoading.value = false;
      }
    });

    const openModal = async (index: number) => {
      await openDialog(AppImageModal, {
        images: images.value,
        startIndex: index,
      });
    };

    return { images, currentIndex, openModal, isLoading };
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
  padding: 10px 20px 5px 20px;

  .gallery-wrapper {
    background: var(--color-wrap-bg);
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
  height: 40px;
  position: fixed; /* или fixed, если нужно закрепить */
  bottom: 0;
  z-index: 100;
  padding: 9px 20px 5px 15px;
  width: 100%;

  /* матовое стекло */
  background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
}
</style>
