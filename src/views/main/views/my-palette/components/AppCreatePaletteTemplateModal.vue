<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header :title="getTitle" @close="close"></app-modal-header>
    <section class="wrapper">
      <div class="card">
        <div class="segments">
          <div
            v-for="item in card.segments"
            :key="item"
            class="segment"
            :style="{ backgroundColor: item.color }"
          ></div>
        </div>
      </div>
    </section>
    <footer class="footer">
      <div class="footer-wrapper">
        <app-input
          v-model="signIn"
          :icon="['fas', 'fa-pencil']"
          :is-label="false"
          @focus="focusInput"
          @blur="focusOutInput"
        ></app-input>
        <div class="btn" @click="saveTemplate">
          <app-button
            :loading="isLoading"
            severity="warning"
            :title="id ? 'update' : 'save'"
          ></app-button>
        </div>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppInput from '@/shared/components/AppInput.vue';
import { MaskCard } from '@/types/mask-card.type';
import { useStore } from 'vuex';
// @ts-ignore
import iNoBounce from 'inobounce';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: { AppInput, AppModalHeader, AppButton },
  props: {
    id: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    card: {
      type: Object as PropType<MaskCard>,
      required: true,
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const signIn = ref(props.name);
    const store = useStore();
    const currentUserId = computed(() => store.getters['authFirebase/getUserId']);
    const device = computed(() => store.getters['mobile/getDevice']);
    const isLoading = computed(() => store.getters['myPalette/isLoading']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const getTitle = computed(() => {
      if (isMobile.value) {
        return props.id ? t('updateTemplate') : t('addTemplate');
      } else {
        return '';
      }
    });
    const saveTemplate = async () => {
      if (props.id) {
        await store.dispatch('myPalette/updatePaletteTemplate', {
          id: props.id,
          name: signIn.value,
          segments: props.card.segments,
        });
        emit('resolve', signIn.value);
      } else {
        await store.dispatch('myPalette/savePaletteTemplate', {
          userId: currentUserId.value,
          name: signIn.value,
          segments: props.card.segments,
        });
        close();
      }
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

    const close = () => {
      emit('close');
    };

    return {
      signIn,
      saveTemplate,
      focusInput,
      focusOutInput,
      close,
      isLoading,
      isMobile,
      t,
      getTitle,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 550px;
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
    height: 100%;
  }

  & .wrapper {
    background: var(--color-wrap-bg);
    width: 100%;
    display: flex;
    justify-content: center;
    overflow: auto;
    align-items: center;
    gap: 20px;
    height: calc(100% - 65px);
  }

  & .footer {
    display: flex;
    align-items: center;
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

    & .footer-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 70%;
    }
  }
}

.card {
  position: relative;
  width: 250px;
  height: 350px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px); /* лёгкий blur */
  cursor: pointer;
  transition: all 0.2s ease;
}

.segments {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.segment {
  flex: 1; /* все 11 равные по высоте */
  opacity: 0.8; /* лёгкая прозрачность для эффекта */
}
</style>
