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
      <app-editor-canvas
        ref="editorCanvasRef"
        v-model:image-url="imageUrl"
        :segments="frameColors"
      ></app-editor-canvas>
    </section>
    <section class="buttons">
      <div v-if="!isMobile" class="btn">
        <app-file-uploader :is-show-sign="false" @select="onFileSelected"></app-file-uploader>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button
          severity="warning"
          title="saveToGallery"
          :loading="isSaveToGallery"
          @click="saveToGallery"
        ></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button severity="info" title="addSign"></app-button>
      </div>
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="sharedWithCollage" label="Share image with collage"></AppCheckbox>
      </div>
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="rememberChoose" label="Remember choose"></AppCheckbox>
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
      <app-popover-item @click="saveToGallery">
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </app-popover-item>
      <app-popover-item>
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
    <app-popover-wrapper>
      <app-popover-item>
        <AppCheckbox v-model="sharedWithCollage"></AppCheckbox>
        <span>Share image with collage</span>
      </app-popover-item>
      <app-popover-item>
        <AppCheckbox v-model="rememberChoose"></AppCheckbox>
        <span>Remember choose</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>
<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref, watch } from 'vue';
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
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import { readFileAsDataURL } from '@/helpers/read-file-as-data-url';

export default defineComponent({
  components: {
    AppCheckbox,
    AppPopoverItem,
    AppPopoverWrapper,
    AppPopover,
    AppButton,
    AppEditorCanvas,
    AppColorCard,
    AppFileUploader,
  },
  emits: ['fileOnLoad', 'isLoading'],
  setup(_, { emit }) {
    const editorCanvasRef = ref<{ saveToGallery: () => Promise<string> } | null>(null);
    const { t } = useI18n();
    const uploader = ref();
    const store = useStore();
    const visiblePopover = ref(false);
    const cards: ColorCard[] = colorCards;
    const selectedCard = ref<null | { id: number; segments: any[] }>(null);
    const frameColors = ref();
    const imageUrl = ref<string | null>(null);
    const fileRef = ref<File | null>(null);
    const isSaveToGallery = ref(false);
    const sharedWithCollage = ref(store.getters['imageColor/shareImgCollage']);
    const rememberChoose = ref(store.getters['imageColor/rememberImgMask']);
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');

    onBeforeMount(() => {
      const [first] = cards;
      selectedCard.value = first;
      frameColors.value = first.segments;
    });

    onMounted(() => {
      if (store.getters['imageColor/rememberImgMask']) {
        const file = store.getters['imageColor/imgMask'];
        if (file) {
          onFileSelected(file);
        }
      }
    });
    const onFileSelected = async (file: File) => {
      imageUrl.value = await readFileAsDataURL(file);
      await store.dispatch('imageColor/uploadImgMask', { file });
    };

    const saveToGallery = async () => {
      // сохраняем в Firebase Storage
      if (!fileRef.value) {
        await store.dispatch('toast/addToast', {
          message: 'Upload image',
          severity: 'warning',
        });
        return;
      }
      isSaveToGallery.value = true;
      visiblePopover.value = false;
      if (isMobile.value) {
        emit('isLoading', true);
      }

      try {
        const url = await editorCanvasRef.value?.saveToGallery();
        await addDoc(collection(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items'), {
          userId: currentUser.value?.uid,
          url,
          title: 'Что-то',
          type: 'mask',
          createdAt: new Date(),
        });
        await store.dispatch('toast/addToast', {
          message: 'Success',
          severity: 'success',
        });
        isSaveToGallery.value = false;
        if (isMobile.value) {
          emit('isLoading', false);
        }
        // можно сохранить url в store или отправить на сервер
      } catch (err) {
        isSaveToGallery.value = false;
        await store.dispatch('toast/addToast', {
          message: 'Error',
          severity: 'error',
        });
        if (isMobile.value) {
          emit('isLoading', false);
        }
      }
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

    watch(
      () => sharedWithCollage.value,
      (value: boolean) => {
        store.dispatch('imageColor/setShareImgCollage', {
          share: value,
        });
      }
    );

    watch(
      () => rememberChoose.value,
      (value: boolean) => {
        store.dispatch('imageColor/setRememberImgMask', {
          remember: value,
        });
      }
    );
    watch(
      () => store.getters['imageColor/imgCollage'],
      (file: File) => {
        if (store.getters['imageColor/shareImgMask']) {
          onFileSelected(file);
        }
      }
    );
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
      saveToGallery,
      isSaveToGallery,
      editorCanvasRef,
      sharedWithCollage,
      rememberChoose,
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
  @media (max-width: 600px) {
    height: auto;
  }

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

    .checkbox {
      width: 230px;
      display: flex;
      padding-left: 20px;
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
