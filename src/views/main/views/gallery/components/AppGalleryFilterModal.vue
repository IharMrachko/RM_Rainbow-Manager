<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <section class="wrapper-filter">
      <div class="filter-dropdown">
        <app-dropdown
          v-model="folder"
          :is-search="true"
          is-title
          title="Folders"
          label="name"
          height="48px"
          @search="searchFolder"
        >
          <div class="folders-overlay-container">
            <div class="folders-options-wrapper">
              <app-option v-for="item in folders" :key="item" :value="item">
                <div class="option-folder-item">
                  <img
                    loading="lazy"
                    :class="{ 'fade-in': onLoad }"
                    :src="require('@/assets/rainbow-folder.png')"
                    alt="Rainbow Folder"
                    @load="onLoad"
                  />
                  <span>
                    {{ item.name }}
                  </span>
                </div>
              </app-option>
            </div>
          </div>
        </app-dropdown>
      </div>
      <div class="filter-dropdown">
        <app-dropdown v-model="maskType" height="48px" label="type" is-title title="Mask type">
          <app-option v-for="card in cards" :key="card" :value="card">
            <div class="mask-type-wrapper">
              <div class="segments">
                <div
                  v-for="v in card.segments"
                  :key="v"
                  :style="{ backgroundColor: v.color }"
                  class="segment"
                ></div>
              </div>
              <span>{{ card.type }}</span>
            </div>
          </app-option>
        </app-dropdown>
      </div>
      <div class="filter-dropdown">
        <app-dropdown
          v-model="coloristicType"
          height="48px"
          label="name"
          is-title
          title="Color Type"
        >
          <app-option v-for="c in coloristicTypes" :key="c" :value="c">
            <font-awesome-icon :icon="['fa', c.icon]" />
            {{ c.name }}</app-option
          >
        </app-dropdown>
      </div>
    </section>
    <footer class="footer">
      <div class="btn" @click="clearFilter">
        <app-button severity="info" title="Очистить"></app-button>
      </div>
      <div class="btn" @click="applyFilter">
        <app-button severity="warning" title="Применить"></app-button>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppOption from '@/shared/components/dropdown/AppOption.vue';
import { Folder } from '@/store/modules/firebase-folder';
import { useStore } from 'vuex';
import {
  ColorCard,
  colorCards,
} from '@/views/main/views/color-view/components/color-card.constanst';

export default defineComponent({
  components: { AppOption, AppButton, AppDropdown, AppModalHeader },

  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const cards = ref<ColorCard[]>(colorCards);
    const maskType = ref<ColorCard | null>(null);
    const coloristicType = ref<{ id: string; name: string } | null>(null);
    const coloristicTypes = ref([
      { id: 'mask', name: 'mask', icon: 'mask' },
      { id: 'collage', name: 'collage', icon: 'images' },
    ]);
    const store = useStore();
    const folders = computed(() => store.getters['folder/getFilterFolders']);
    const folder = ref<Folder | null>(null);
    const close = () => {
      emit('close');
    };

    const searchFolder = (value: string) => {
      store.dispatch('folder/filterFolder', value);
    };

    const applyFilter = () => {
      emit('resolve', {
        folderId: folder.value?.id,
        coloristicType: coloristicType.value?.id,
        maskType: maskType.value?.type,
      });
    };

    const clearFilter = () => {
      folder.value = null;
      coloristicType.value = null;
      maskType.value = null;
    };

    return {
      close,
      folder,
      folders,
      searchFolder,
      cards,
      maskType,
      coloristicType,
      coloristicTypes,
      applyFilter,
      clearFilter,
    };
  },
});
</script>

<style scoped lang="scss">
.modal-content {
  background: var(--color-bg);
  position: relative;
  width: 35vw;
  height: 55vh;
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
.dark .neon {
  /* 🎇 Неоновая подсветка */
  border: 1px solid #0ff;
  box-shadow: 0 0 5px #0ff, 0 0 5px #0ff, 0 0 5px #0ff, 0 0 25px #0ff;
  @media (max-width: 600px) {
    box-shadow: none;
    border: none;
  }
}

img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.option-folder-item {
  display: flex;
  gap: 16px;
  align-items: center;
}

.folders-search {
  padding: 20px;
}

.segments {
  display: flex;
  flex-direction: column;
  height: 30px;
  width: 30px;
}

.segment {
  flex: 1; /* все 11 равные по высоте */
  opacity: 0.8; /* лёгкая прозрачность для эффекта */
}

.mask-type-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}
</style>
