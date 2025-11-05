<template>
  <div ref="modalRef" class="modal-content">
    <header class="header"><span>Nеw folder</span></header>
    <div class="input">
      <app-input
        v-model="folderName"
        :is-focused="true"
        :is-label="false"
        placeholder="Name folder"
      ></app-input>
    </div>

    <div class="actions">
      <div class="btn" @click="close">
        <app-button title="Cancel" severity="error"></app-button>
      </div>
      <div class="btn" @click="setName">
        <app-button :disabled="!folderName" title="Ok" severity="info"></app-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppButton from '@/shared/components/AppButton.vue';

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
    const folderName = ref(props.name);
    const close = () => {
      emit('close');
    };

    const setName = () => {
      emit('resolve', folderName.value);
    };
    return {
      folderName,
      close,
      setName,
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
