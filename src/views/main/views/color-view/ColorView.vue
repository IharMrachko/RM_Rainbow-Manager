<template>
  <div class="color-container">
    <app-tabs>
      <app-tab title="mask"
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
              :segments="frameColors"
            ></app-editor-canvas>
          </section>
          <section class="buttons">
            <app-file-uploader v-if="!isMobile" @select="onFileSelected"></app-file-uploader>
            <app-button v-if="!isMobile" severity="warning" title="saveToGallery"></app-button>
            <app-button v-if="!isMobile" severity="info" title="addSign"></app-button>
            <font-awesome-icon
              v-if="isMobile"
              :icon="['fas', 'ellipsis-h']"
              size="lg"
              @click.stop="openPopover"
            />
          </section>
        </div>
      </app-tab>
      <app-tab title="collage">
        <div class="collage-wrapper">
          <app-collage v-model:image-url="imageUrl"></app-collage>
        </div>
      </app-tab>
    </app-tabs>
  </div>
  <app-popover v-model:visible="visiblePopover">
    <section class="popover-wrapper">
      <div class="popover-item" @click="triggerUpload">
        <font-awesome-icon size="xl" :icon="['fas', 'file-upload']" />
        <span>{{ t('upload') }}</span>
        <!-- скрытый uploader -->
        <app-file-uploader ref="uploader" style="display: none" @select="onFileSelected" />
      </div>
      <div class="popover-item">
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </div>
      <div class="popover-item">
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </div>
    </section>
  </app-popover>
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
import AppTabs from '@/shared/components/tabs/AppTabs.vue';
import AppTab from '@/shared/components/tabs/AppTab.vue';
import AppCollage from '@/views/main/views/color-view/components/AppCollage.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import AppButton from '@/shared/components/AppButton.vue';

export default defineComponent({
  components: {
    AppButton,
    AppPopover,
    AppCollage,
    AppTab,
    AppTabs,
    AppColorCard,
    AppEditorCanvas,
    AppFileUploader,
  },
  setup() {
    const { t } = useI18n();
    const uploader = ref();
    const store = useStore();
    const visiblePopover = ref(false);
    const cards: ColorCard[] = colorCards;
    const selectedCard = ref<null | { id: number; segments: any[] }>(null);
    const frameColors = ref();
    const imageUrl = ref<string | null>(null);

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

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const triggerUpload = () => {
      // внутри app-file-uploader обычно есть <input type="file">
      // у него можно вызвать click()
      uploader.value?.$el.querySelector('input[type=file]')?.click();
    };

    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');

    return {
      frameColors,
      imageUrl,
      onFileSelected,
      cards,
      selected,
      selectedCard,
      visiblePopover,
      isMobile,
      openPopover,
      triggerUpload,
      uploader,
      t,
    };
  },
});
</script>

<style scoped lang="scss">
.color-container {
  padding: 10px 20px 5px 20px;
  overflow: auto;
  height: calc(100dvh - var(--header-height));

  & .color-wrapper {
    padding: 20px;
    display: flex;
    width: 100%;
    height: calc(100dvh - var(--header-height) - var(--tabs-height-with-padding));
    flex-wrap: wrap;
    background: var(--color-wrap-bg);
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
      gap: 12px;
      //align-items: start;
      //justify-content: right;
      flex-direction: column;
    }
  }
  @media (max-width: 600px) {
    padding: 5px;
  }
}

@media (max-width: 600px) {
  .color-container .color-wrapper .buttons {
    flex-direction: row;
    justify-content: center;
    align-items: start;
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
  }
}

.collage-wrapper {
  height: calc(100vh - var(--header-height) - var(--tabs-height-with-padding));
  width: 100%;
  background: var(--color-wrap-bg);
  padding-top: 10px;
}

.popover-wrapper {
  background-color: #fff;
  border-radius: 20px;
  & .popover-item {
    padding: 15px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #444;
  }
}
</style>
