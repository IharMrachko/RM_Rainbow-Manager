<template>
  <div ref="modalRef" class="modal-content neon">
    <header class="header">
      <span>{{ title }}</span>
    </header>
    <div class="text">
      <span>{{ text }}</span>
    </div>

    <div class="actions">
      <div class="btn" @click="close">
        <app-button title="cancel" severity="error"></app-button>
      </div>
      <div class="btn" @click="ok">
        <app-button title="ok" severity="info"></app-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';

export default defineComponent({
  components: { AppButton },
  props: {
    text: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const close = () => {
      emit('close');
    };

    const ok = () => {
      emit('resolve', true);
    };

    return {
      close,
      ok,
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

  & .text {
    flex: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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

.dark .neon {
  /* 🎇 Неоновая подсветка */
  border: 1px solid #0ff;
  box-shadow: 0 0 5px #0ff, 0 0 5px #0ff, 0 0 5px #0ff, 0 0 25px #0ff;
}
</style>
