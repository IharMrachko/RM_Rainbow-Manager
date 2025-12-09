<template>
  <div ref="modalRef" class="modal-content">
    <app-modal-header @close="close"></app-modal-header>
    <section class="folder-section">
      <app-loader v-if="isLoading"></app-loader>
      <div class="folder-section-create">
        <div class="search">
          <app-input
            v-model="search"
            placeholder="search"
            :icon="['fas', 'search']"
            :is-label="false"
            @focus="focusInput"
            @blur="focusOutInput"
          ></app-input>
        </div>
        <app-button
          :icon="['fas', 'plus']"
          severity="info"
          @click="openCreateFolderModal"
        ></app-button>
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
        <div class="btn" @click="choose">
          <app-button :disabled="!selectedFolder" title="choose" severity="warning"></app-button>
        </div>
      </div>
    </section>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref, watch } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import AppFolderCard from '@/shared/components/folder-modal/components/AppFolderCard.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppFolderCreate from '@/shared/components/folder-modal/components/AppFolderCreate.vue';
import { useStore } from 'vuex';
import AppLoader from '@/shared/components/AppLoader.vue';
import { Folder } from '@/store/modules/firebase-folder';
// @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: {
    AppLoader,
    AppFolderCard,
    AppInput,
    AppButton,
    AppModalHeader,
  },
  props: {
    folder: {
      type: Object as PropType<Folder | null>,
      default: null,
    },
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const store = useStore();
    const folders = computed(() => store.getters['folder/getFilterFolders']);
    const selectedFolder = ref<null | Folder>(props.folder);
    const currentUserId = computed(() => store.getters['authFirebase/getUserId']);
    const isLoading = computed(() => store.getters['folder/isLoading']);
    const search = ref('');
    const device = computed(() => store.getters['mobile/getDevice']);

    const selected = (item: Folder) => {
      selectedFolder.value = item;
    };
    const close = () => {
      emit('close');
    };

    onMounted(() => {
      store.dispatch('folder/getFolders', currentUserId.value);
    });

    const openCreateFolderModal = async () => {
      await openDialog(AppFolderCreate, {}).then((name) => {
        store.dispatch('folder/saveFolder', {
          userId: currentUserId.value,
          name,
        });
      });
    };

    const choose = () => {
      emit('resolve', selectedFolder.value);
    };

    watch(search, (value) => {
      store.dispatch('folder/filterFolder', value);
    });

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
      close,
      folders,
      selected,
      selectedFolder,
      openCreateFolderModal,
      isLoading,
      choose,
      search,
      focusInput,
      focusOutInput,
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

      @media (max-width: 600px) {
        padding: 10px;
        .search {
          width: 250px;
        }
      }
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
        align-content: start;
        justify-content: space-between;
        grid-template-columns: repeat(auto-fit, minmax(150px, 150px));
        gap: 12px;
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
        padding: 10px;
        justify-content: center;
      }

      & .btn {
        width: 150px;
      }
    }
  }
}
</style>
