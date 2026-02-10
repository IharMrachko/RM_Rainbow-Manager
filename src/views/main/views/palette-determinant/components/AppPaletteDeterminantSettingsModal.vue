<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <section class="wrapper-filter">
      <AppCheckbox v-model="fullFillRef" label="fullFill"></AppCheckbox>
      <AppCheckbox v-model="onlySoftRef" label="showOnlySoft"></AppCheckbox>
      <AppCheckbox v-model="onlyBrightRef" label="showOnlyBright"></AppCheckbox>
      <AppCheckbox v-model="onlyColdRef" label="showOnlyCold"></AppCheckbox>
      <AppCheckbox v-model="onlyWarmRef" label="showOnlyWarm"></AppCheckbox>
      <AppCheckbox v-model="onlyLightRef" label="showOnlyLight"></AppCheckbox>
      <AppCheckbox v-model="onlyDarkRef" label="showOnlyDark"></AppCheckbox>
    </section>
    <footer class="footer">
      <div class="btn" @click="applyFilter">
        <app-button severity="warning" title="apply"></app-button>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import { useStore } from 'vuex';

export default defineComponent({
  components: { AppCheckbox, AppButton, AppModalHeader },
  props: {
    fullFill: {
      type: Boolean,
      default: false,
    },
    onlySoft: {
      type: Boolean,
      default: true,
    },
    onlyBright: {
      type: Boolean,
      default: true,
    },
    onlyCold: {
      type: Boolean,
      default: true,
    },
    onlyWarm: {
      type: Boolean,
      default: true,
    },
    onlyLight: {
      type: Boolean,
      default: true,
    },
    onlyDark: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const store = useStore();
    const fullFillRef = ref(props.fullFill);
    const onlySoftRef = ref(props.onlySoft);
    const onlyBrightRef = ref(props.onlyBright);
    const onlyColdRef = ref(props.onlyCold);
    const onlyWarmRef = ref(props.onlyWarm);
    const onlyLightRef = ref(props.onlyLight);
    const onlyDarkRef = ref(props.onlyDark);

    const clearAll = computed(() => {
      return (
        !onlySoftRef.value &&
        !onlyBrightRef.value &&
        !onlyColdRef.value &&
        !onlyWarmRef.value &&
        !onlyLightRef.value &&
        !onlyDarkRef.value
      );
    });

    const close = () => {
      emit('close');
    };

    const applyFilter = () => {
      if (clearAll.value) {
        store.dispatch('toast/addToast', {
          message: 'pleaseSelectAtLeastOneCharacteristic',
          severity: 'warning',
        });
        return;
      }

      emit('resolve', {
        fullFill: fullFillRef.value,
        onlySoft: onlySoftRef.value,
        onlyBright: onlyBrightRef.value,
        onlyCold: onlyColdRef.value,
        onlyWarm: onlyWarmRef.value,
        onlyDark: onlyDarkRef.value,
        onlyLight: onlyLightRef.value,
      });
    };
    return {
      close,
      applyFilter,
      fullFillRef,
      onlySoftRef,
      onlyBrightRef,
      onlyColdRef,
      onlyWarmRef,
      onlyLightRef,
      onlyDarkRef,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 35vw;
  height: 68vh;
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;

  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100%;
    flex-direction: column; /* вертикально */
    justify-content: flex-start;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  & .wrapper-filter {
    flex: 3;
    width: 100%;
    background: var(--color-wrap-bg);
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: start;
    gap: 12px;

    @media (max-width: 600px) {
      padding-top: 60px;
    }
  }

  & .footer {
    display: flex;
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

    & .btn {
      width: 200px;
    }
  }
}
</style>
