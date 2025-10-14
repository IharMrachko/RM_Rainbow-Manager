<template>
  <div class="color-container">
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
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import AppEditorCanvas from '@/shared/components/AppEditorCanvas.vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppColorCard from '@/views/main/views/color-view/components/AppColorCard.vue';
import {
  ColorCard,
  colorCards,
} from '@/views/main/views/color-view/components/color-card.constanst';

export default defineComponent({
  components: {
    AppColorCard,
    AppEditorCanvas,
    AppFileUploader,
  },
  setup() {
    const cards: ColorCard[] = colorCards;
    const windowWidth = ref(document.documentElement.clientWidth);
    const rotation = ref(0);
    const filter = ref('none');
    const cropMode = ref(false);
    const offsetX = ref(0);
    const offsetY = ref(0);
    const selectedCard = ref<null | { id: number; segments: any[] }>(null);
    const frameColors = ref();
    const imageUrl = ref<string | null>(null);

    const updateWidth = () => {
      windowWidth.value = document.documentElement.clientWidth;
    };

    onMounted(() => {
      window.addEventListener('resize', updateWidth);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateWidth);
    });

    // вычисляем size и thickness в зависимости от ширины
    const size = computed(() => {
      if (windowWidth.value < 600) return 300;
      if (windowWidth.value < 1024) return 450;
      return 550;
    });

    const thickness = computed(() => {
      if (windowWidth.value < 600) return 50;
      if (windowWidth.value < 1024) return 80;
      return 100;
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
  max-height: calc(100vh - var(--header-height));
  overflow: auto;

  & .color-wrapper {
    padding: 20px;
    display: flex;
    width: 100%;
    height: 100%;
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
</style>
