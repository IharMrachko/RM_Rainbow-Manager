<template>
  <div ref="modalRef" class="modal-content">
    <app-modal-header @close="close"></app-modal-header>

    <section class="folder-section">
      <div class="folder-section-create">
        <div class="search">
          <app-input
            :placeholder="'Search'"
            :icon="['fas', 'search']"
            :is-label="false"
          ></app-input>
        </div>
        <app-button :icon="['fas', 'plus']" severity="info"></app-button>
      </div>
      <div class="folder-section-folders">
        <app-folder-card
          v-for="c of folders"
          :key="c.id"
          :folder="c"
          :is-selected="selectedFolder?.id === c?.id"
          @selected="selected"
        ></app-folder-card>
      </div>
      <div class="folder-section-actions">
        <div class="btn">
          <app-button :disabled="!selectedFolder" title="Choose" severity="warning"></app-button>
        </div>
      </div>
    </section>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppFolderCard from '@/shared/components/folder-modal/components/AppFolderCard.vue';

export default defineComponent({
  components: {
    AppFolderCard,
    AppInput,
    AppButton,
    AppModalHeader,
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const folders = ref([
      { id: Math.random(), title: 'Название папки' },
      { id: Math.random(), title: 'Название папки w' },
    ]);
    const selectedFolder = ref<null | any>(null);

    const selected = (item: any) => {
      selectedFolder.value = item;
    };
    const close = () => {
      emit('close');
    };
    return {
      close,
      folders,
      selected,
      selectedFolder,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100%;
    border-radius: 0;
  }

  & .folder-section {
    width: 100%;
    height: calc(100% - 50px);
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
    display: flex;
    flex-direction: column;

    & .folder-section-create {
      flex: 0.5;
      background: var(--color-wrap-bg);
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    & .folder-section-folders {
      flex: 6;
      background: var(--color-wrap-bg);
      padding: 10px 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
      overflow: auto;
      /* Скрыть скроллбар в разных браузерах */
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE и Edge */

      @media (max-width: 600px) {
        justify-content: space-between;
        grid-template-columns: repeat(auto-fit, minmax(150px, 150px));
      }
    }

    & .folder-section-actions {
      flex: 1;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px); /* для Safari */
      border-top: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(256, 256, 256, 0.2);
      border-bottom-left-radius: 20px;
      border-bottom-right-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: right;
      padding: 0 20px;

      @media (max-width: 600px) {
        flex: 0.6;
        border-radius: 0;
        padding: 0 10px;
        justify-content: center;
      }

      & .btn {
        width: 150px;
      }
    }
  }
}
</style>
