<template>
  <div>
    <div ref="modalRef" class="modal-content neon">
      <app-modal-header @close="close"></app-modal-header>
      <app-loader v-if="isLoading"></app-loader>
      <section class="search">
        <div class="search-wrapper">
          <app-input
            v-model="search"
            placeholder="search"
            :icon="['fas', 'search']"
            :is-label="false"
            @focus="focusInput"
            @blur="focusOutInput"
          ></app-input>
        </div>
      </section>
      <section class="wrapper">
        <app-palette-template-card
          v-for="palette in paletteTemplates"
          :key="palette.id"
          :card="palette"
          :is-selected="selectedCard?.id === palette?.id"
          @selected="selected"
        ></app-palette-template-card>
      </section>
      <footer class="footer">
        <div class="btn" @click="apply">
          <app-button severity="warning" title="apply"></app-button>
        </div>
      </footer>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref, watch } from 'vue';
import { useStore } from 'vuex';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppLoader from '@/shared/components/AppLoader.vue';
import { PaletteTemplate } from '@/store/modules/my-palette';
import { useI18n } from 'vue-i18n';
import AppPaletteTemplateCard from '@/views/main/views/my-palette/components/AppPaletteTemplateCard.vue';
// @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: {
    AppPaletteTemplateCard,
    AppLoader,
    AppInput,
    AppButton,
    AppModalHeader,
  },
  props: {
    selectedTemplate: {
      type: Object as PropType<PaletteTemplate | null>,
      default: null,
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const search = ref('');
    const selectedCard = ref(props.selectedTemplate);
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const currentUserId = computed(() => store.getters['authFirebase/getUserId']);
    const paletteTemplates = computed(() => store.getters['myPalette/getPaletteTemplatesFilter']);
    const isLoading = computed(() => store.getters['myPalette/isLoading']);
    const device = computed(() => store.getters['mobile/getDevice']);

    onMounted(async () => {
      await store.dispatch('myPalette/getPaletteTemplates', currentUserId.value);
    });

    const selected = (item: PaletteTemplate) => {
      selectedCard.value = item;
    };

    const close = () => {
      emit('close');
    };

    const toggleCardOverlayPanel = () => {
      visible.value = !visible.value;
    };

    const apply = () => {
      emit('resolve', selectedCard.value);
    };

    const focusInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        iNoBounce.disable();
        setTimeout(() => window.scrollTo(0, 0), 50);
      }
    };

    watch(search, (value) => {
      store.dispatch('myPalette/filterPaletteTemplates', value);
    });

    return {
      paletteTemplates,
      isLoading,
      selected,
      selectedCard,
      close,
      t,
      targetRef,
      visible,
      toggleCardOverlayPanel,
      apply,
      search,
      focusInput,
      focusOutInput,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 50vw;
  height: 80vh;
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
    height: 100dvh;
  }

  & .wrapper {
    width: 100%;
    flex: 6;
    background: var(--color-wrap-bg);
    padding: 10px 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    overflow: auto;
    /* Скрыть скроллбар в разных браузерах */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE и Edge */

    @media (max-width: 600px) {
      align-content: start;
      justify-content: space-between;
      grid-template-columns: repeat(auto-fit, minmax(150px, 150px));
      gap: 12px;
    }
  }

  & .footer {
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
    gap: 12px;
    padding: 10px;
    width: 100%;

    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    /* матовое стекло */
    background: rgba(255, 255, 255, 0.2); /* полупрозрачный белый */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px); /* для Safari */

    @media (max-width: 600px) {
      border-radius: 0;
    }
  }
}

.search {
  width: 100%;
  padding: 15px;
  background: var(--color-wrap-bg);
  display: flex;

  .search-wrapper {
    flex: 0.5;

    @media (max-width: 600px) {
      flex: 1;
    }
  }
}
</style>
