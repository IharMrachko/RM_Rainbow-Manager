<template>
  <div ref="modalRef" class="modal-content neon">
    <header class="header">
      <span>{{ t('newFolder') }}</span>
    </header>
    <div class="input">
      <app-input
        v-model="folderName"
        :is-focused="true"
        :is-label="false"
        placeholder="nameFolder"
        @focus="focusInput"
        @blur="focusOutInput"
      ></app-input>
    </div>

    <div class="actions">
      <div class="btn" @click="close">
        <app-button title="cancel" severity="error" @click="close"></app-button>
      </div>
      <div class="btn">
        <app-button
          :disabled="!folderName"
          title="ok"
          severity="info"
          @click="setName"
        ></app-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useI18n } from 'vue-i18n';
// @ts-ignore
import iNoBounce from 'inobounce';
import { useStore } from 'vuex';

export default defineComponent({
  components: { AppButton, AppInput },
  props: {
    name: {
      type: String,
      default: '',
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const folderName = ref(props.name);
    const device = computed(() => store.getters['mobile/getDevice']);

    const close = () => {
      emit('close');
    };

    const setName = () => {
      emit('resolve', folderName.value);
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
    return {
      folderName,
      close,
      setName,
      t,
      focusInput,
      focusOutInput,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  width: 30vw;
  height: 30vh;
  background: var(--color-wrap-bg);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 600px) {
    width: 90vw;
  }

  & .header {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
    flex: 1;
  }

  & .input {
    flex: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  & .actions {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;

    & .btn {
      flex: 1;
    }
  }
}
</style>
