<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <section class="wrapper-filter">
      <AppCheckbox v-model="fullFill" label="Полная заливка"></AppCheckbox>
      <AppCheckbox v-model="onlySoft" label="Показывать только мягкие"></AppCheckbox>
      <AppCheckbox v-model="onlyBright" label="Показывать только яркие"></AppCheckbox>
      <AppCheckbox v-model="onlyCold" label="Показывать только холодные"></AppCheckbox>
      <AppCheckbox v-model="onlyWarm" label="Показывать только теплые"></AppCheckbox>
      <AppCheckbox v-model="onlyLight" label="Показывать только светлые"></AppCheckbox>
      <AppCheckbox v-model="onlyDark" label="Показывать только темные"></AppCheckbox>
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
  emits: ['resolve', 'reject', 'close'],
  setup(_, { emit }) {
    const store = useStore();
    const fullFill = ref(store.getters['palette/getSettings'].fullFill);
    const onlySoft = ref(store.getters['palette/getSettings'].onlySoft);
    const onlyBright = ref(store.getters['palette/getSettings'].onlyBright);
    const onlyCold = ref(store.getters['palette/getSettings'].onlyCold);
    const onlyWarm = ref(store.getters['palette/getSettings'].onlyWarm);
    const onlyLight = ref(store.getters['palette/getSettings'].onlyLight);
    const onlyDark = ref(store.getters['palette/getSettings'].onlyDark);

    const clearAll = computed(() => {
      return (
        !onlySoft.value &&
        !onlyBright.value &&
        !onlyCold.value &&
        !onlyWarm.value &&
        !onlyLight.value &&
        !onlyDark.value
      );
    });

    const close = () => {
      emit('close');
    };

    const applyFilter = () => {
      if (clearAll.value) {
        store.dispatch('toast/addToast', {
          message: 'Выберите хотя бы одну характерестику!',
          severity: 'warning',
        });
        return;
      }
      store.dispatch('palette/setSettings', {
        fullFill: fullFill.value,
        onlySoft: onlySoft.value,
        onlyBright: onlyBright.value,
        onlyCold: onlyCold.value,
        onlyWarm: onlyWarm.value,
        onlyDark: onlyDark.value,
        onlyLight: onlyLight.value,
      });
      emit('resolve', store.getters['palette/getSettingsMap']);
    };
    return {
      close,
      applyFilter,
      fullFill,
      onlySoft,
      onlyBright,
      onlyCold,
      onlyWarm,
      onlyLight,
      onlyDark,
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
