<template>
  <section class="folder-wrapper">
    <div ref="targetRef" class="icon" @click="toggleCardOverlayPanel">
      <font-awesome-icon size="sm" :icon="['fas', 'ellipsis-v']" />
    </div>
    <div class="folder-card" :class="{ cardSelected: isSelected }" @click="selected">
      <img src="/rainbow-folder.png" alt="Rainbow Folder" />
      <div class="title">
        <span>{{ folder.name }}</span>
      </div>

      <app-overlay-panel
        v-if="targetRef"
        v-model:visible="visible"
        :width="150"
        :target="targetRef"
        :position="{
          x: 'right',
          y: 'center',
        }"
      >
        <div class="overlay-folder">
          <div class="overlay-folder-item" @click="openCreateFolderModal">
            <font-awesome-icon size="sm" :icon="['fas', 'fa-pencil']" />
            <span>Edit</span>
          </div>
          <div class="overlay-folder-item" @click="deleteFolder">
            <font-awesome-icon size="sm" :icon="['fas', 'fa-trash']" />
            <span>Delete</span>
          </div>
        </div>
      </app-overlay-panel>
    </div>
  </section>
</template>
<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
import { Folder } from '@/store/modules/firebase-folder';
import { useStore } from 'vuex';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppFolderCreate from '@/shared/components/folder-modal/components/AppFolderCreate.vue';

export default defineComponent({
  components: { AppOverlayPanel },
  props: {
    isSelected: {
      type: Boolean,
      default: false,
    },
    folder: {
      type: Object as PropType<Folder>,
      required: true,
    },
  },
  emits: ['selected'],
  setup(props, { emit }) {
    const store = useStore();
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const selected = () => {
      emit('selected', props.folder);
    };

    const toggleCardOverlayPanel = () => {
      visible.value = !visible.value;
    };

    const deleteFolder = () => {
      store.dispatch('folder/deleteFolder', props.folder.id);
    };

    const openCreateFolderModal = async () => {
      toggleCardOverlayPanel();
      await openDialog(AppFolderCreate, {
        name: props.folder.name,
      }).then((name) => {
        store.dispatch('folder/updateFolder', {
          id: props.folder.id,
          name,
        });
      });
    };
    return {
      targetRef,
      toggleCardOverlayPanel,
      visible,
      selected,
      deleteFolder,
      openCreateFolderModal,
    };
  },
});
</script>
<style scoped lang="scss">
.folder-wrapper {
  position: relative;
  & .icon {
    position: absolute;
    top: 10px;
    color: #111111;
    cursor: pointer;
    left: 5px;
  }
}
.folder-card {
  width: 150px;
  height: 140px;
  background: #f0f0f0;
  cursor: pointer;
  box-shadow: 2px 2px 6px #c5c5c5, -2px -2px 6px #ffffff;

  & img {
    object-fit: contain;
  }

  & .title {
    border-top: 1px solid #ffffff;
    display: flex;
    justify-content: center;
    padding: 5px 10px;

    & span {
      color: #111111;
      white-space: nowrap; /* запрет переноса */
      overflow: hidden; /* скрыть лишний текст */
      text-overflow: ellipsis; /* добавить "..." */
    }
  }
}

.overlay-folder {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;

  & .overlay-folder-item {
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #eaeaeb;
    cursor: pointer;
  }
}

.folder-card.cardSelected {
  outline: 4px solid #4caf50; /* зелёная рамка */
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
}
</style>
