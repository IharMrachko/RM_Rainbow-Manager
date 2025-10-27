<template>
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
      <app-editor-canvas v-model:image-url="imageUrl" :segments="frameColors"></app-editor-canvas>
    </section>
    <section class="buttons">
      <div class="btn">
        <app-file-uploader v-if="!isMobile" @select="onFileSelected"></app-file-uploader>
      </div>
      <div class="btn">
        <app-button v-if="!isMobile" severity="warning" title="saveToGallery"></app-button>
      </div>
      <div class="btn">
        <app-button v-if="!isMobile" severity="info" title="addSign"></app-button>
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
      <app-popover-item @click="triggerUpload">
        <font-awesome-icon size="xl" :icon="['fas', 'file-upload']" />
        <span>{{ t('upload') }}</span>
        <!-- скрытый uploader -->
        <app-file-uploader ref="uploader" style="display: none" @select="onFileSelected" />
      </app-popover-item>
      <app-popover-item>
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </app-popover-item>
      <app-popover-item>
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>
<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';
import AppColorCard from '@/views/main/views/color-view/components/AppColorCard.vue';
import AppEditorCanvas from '@/views/main/views/color-view/components/AppEditorCanvas.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import {
  ColorCard,
  colorCards,
} from '@/views/main/views/color-view/components/color-card.constanst';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';

export default defineComponent({
  components: {
    AppPopoverItem,
    AppPopoverWrapper,
    AppPopover,
    AppButton,
    AppEditorCanvas,
    AppColorCard,
    AppFileUploader,
  },
  emits: ['fileOnLoad'],
  setup(props, { emit }) {
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
        emit('fileOnLoad', imageUrl.value);
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
.color-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  background: var(--color-wrap-bg);
  height: calc(100dvh - var(--header-height) - var(--tabs-height-with-padding));
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
    width: 301px;
    display: flex;
    gap: 12px;
    flex-direction: column;
    align-items: end;

    .btn {
      width: 230px;
    }
  }
}

@media (max-width: 600px) {
  .color-wrapper .buttons {
    align-items: center;
    width: 100%;
    gap: 0;
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
</style>
