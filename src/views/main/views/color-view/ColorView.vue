<template>
  <div class="color-container">
    <app-tabs>
      <app-tab title="Mask"
        ><div class="color-wrapper">
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
              v-model:image-url="imageUrl"
              :size="size"
              :thickness="thickness"
              :segments="frameColors"
              :rotation="rotation"
              :filter="filter"
              :offset-x="offsetX"
              :offset-y="offsetY"
            ></app-editor-canvas>
          </section>
          <section class="buttons">
            <app-file-uploader @select="onFileSelected"></app-file-uploader>
          </section></div
      ></app-tab>
      <app-tab title="Collage">
        <div class="collage-wrapper">
          <app-collage
            v-model:image-url="imageUrl"
            :thickness="30"
            :row-gap="10"
            :photo-scale="1"
          ></app-collage>
        </div>
      </app-tab>
    </app-tabs>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue';
import AppEditorCanvas from '@/views/main/views/color-view/components/AppEditorCanvas.vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppColorCard from '@/views/main/views/color-view/components/AppColorCard.vue';
import {
  ColorCard,
  colorCards,
} from '@/views/main/views/color-view/components/color-card.constanst';
import { useStore } from 'vuex';
import AppTabs from '@/shared/components/tabs/AppTabs.vue';
import AppTab from '@/shared/components/tabs/AppTab.vue';
import AppCollage from '@/views/main/views/color-view/components/AppCollage.vue';

export default defineComponent({
  components: {
    AppCollage,
    AppTab,
    AppTabs,
    AppColorCard,
    AppEditorCanvas,
    AppFileUploader,
  },
  setup() {
    const store = useStore();
    const cards: ColorCard[] = colorCards;
    const rotation = ref(0);
    const filter = ref('none');
    const cropMode = ref(false);
    const offsetX = ref(0);
    const offsetY = ref(0);
    const selectedCard = ref<null | { id: number; segments: any[] }>(null);
    const frameColors = ref();
    const imageUrl = ref<string | null>(null);

    // вычисляем size и thickness в зависимости от ширины
    const size = computed(() => {
      if (store.getters['mobile/clientWidth'] < 600) return 200;
      if (store.getters['mobile/clientWidth'] < 1024) return 400;
      return 480;
    });

    const thickness = computed(() => {
      if (store.getters['mobile/clientWidth'] < 600) return 40;
      if (store.getters['mobile/clientWidth'] < 1024) return 70;
      return 90;
    });

    onBeforeMount(() => {
      const [first] = cards;
      selectedCard.value = first;
      frameColors.value = first.segments;
    });

    const onFileSelected = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageUrl.value = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    };

    const selected = (item: any) => {
      selectedCard.value = item;
      frameColors.value = item.segments;
    };

    return {
      size,
      thickness,
      rotation,
      filter,
      cropMode,
      offsetX,
      offsetY,
      frameColors,
      imageUrl,
      onFileSelected,
      cards,
      selected,
      selectedCard,
    };
  },
});
</script>

<style scoped>
.color-container {
  padding: 10px 20px 5px 20px;
  height: calc(100vh - var(--header-height));
  overflow: auto;

  & .color-wrapper {
    padding: 20px;
    display: flex;
    width: 100%;
    height: calc(100vh - var(--header-height) - 80px);
    flex-wrap: wrap;
    background: var(--color-wrap-bg);
    border-radius: 10px;
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
      justify-content: center;
      flex: 2;
    }

    & .buttons {
      flex: 1;
      display: flex;
      align-items: start;
      justify-content: right;
    }
  }
  @media (max-width: 768px) {
    padding: 5px;
  }
}

@media (max-width: 768px) {
  .color-container .color-wrapper .buttons {
    justify-content: center;
  }
}

.collage-wrapper {
  height: calc(100vh - var(--header-height) - 80px);
  width: 100%;
  background: var(--color-wrap-bg);
  padding-top: 10px;
}
</style>
