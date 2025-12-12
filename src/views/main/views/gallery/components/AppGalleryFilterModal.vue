<template>
  <div ref="modalRef" class="modal-content neon">
    <app-modal-header @close="close"></app-modal-header>
    <section class="wrapper-filter">
      <div class="filter-dropdown">
        <app-dropdown
          v-model="folder"
          :is-search="true"
          is-title
          title="folder"
          label="name"
          height="48px"
          @search="searchFolder"
          @focus-input="focusInput"
          @focus-out-input="focusOutInput"
        >
          <div class="folders-overlay-container">
            <div class="folders-options-wrapper">
              <app-option v-for="item in folders" :key="item.id" :value="item">
                <div class="option-folder-item">
                  <img :src="require('@/assets/rainbow-folder.png')" alt="Rainbow Folder" />
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
        <app-dropdown
          v-model="paletteType"
          height="48px"
          label="name"
          is-title
          title="palette"
          @focus-input="focusInput"
          @focus-out-input="focusOutInput"
        >
          <div class="wrapper-palette">
            <app-option v-for="card in palettesCards" :key="card.id" :value="card">
              <div class="mask-type-wrapper">
                <div class="segments">
                  <div
                    v-for="v in card.colors"
                    :key="v"
                    :style="{ backgroundColor: v }"
                    class="segment"
                  ></div>
                </div>
                <span>{{ card.name }}</span>
              </div>
            </app-option>
          </div>
        </app-dropdown>
      </div>
      <div class="filter-dropdown">
        <app-dropdown
          v-model="maskType"
          height="48px"
          label="name"
          is-title
          title="mask"
          @focus-input="focusInput"
          @focus-out-input="focusOutInput"
        >
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
              <span>{{ card.name }}</span>
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
          title="typeMasks"
          @focus-input="focusInput"
          @focus-out-input="focusOutInput"
        >
          <app-option v-for="c in coloristicTypes" :key="c.id" :value="c">
            <div class="type-maks-option">
              <font-awesome-icon :icon="['fa', c.icon]" />
              <span>{{ c.name }}</span>
            </div>
          </app-option>
        </app-dropdown>
      </div>
    </section>
    <footer class="footer">
      <div class="btn" @click="clearFilter">
        <app-button severity="info" title="clear"></app-button>
      </div>
      <div class="btn" @click="applyFilter">
        <app-button severity="warning" title="apply"></app-button>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppDropdown from '@/shared/components/dropdown/AppDropdown.vue';
import AppButton from '@/shared/components/AppButton.vue';
import AppOption from '@/shared/components/dropdown/AppOption.vue';
import { Folder } from '@/store/modules/firebase-folder';
import { useStore } from 'vuex';
import { colorCards } from '@/views/main/views/color-view/components/color-card.constanst';
import { useI18n } from 'vue-i18n';
import { palettesObj } from '@/views/main/views/palette/palette';
import { PaletteCard } from '@/types/palette-card.type';
import { MaskCard } from '@/types/mask-card.type';
import { Palette } from '@/types/palette.type'; // @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: { AppOption, AppButton, AppDropdown, AppModalHeader },
  emits: ['resolve', 'reject', 'close'],
  setup(_, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const device = computed(() => store.getters['mobile/getDevice']);
    const cards = ref<MaskCard[]>(colorCards.map((it) => ({ ...it, name: t(it.type) })));
    const palettesCards = ref<PaletteCard[]>(
      Object.entries(palettesObj).map(([type, color]) => ({
        id: type as Palette,
        name: t(type),
        colors: color,
      }))
    );
    const maskType = ref<MaskCard | null>(store.getters['gallery/getFilter']?.maskType);
    const paletteType = ref<PaletteCard | null>(store.getters['gallery/getFilter']?.paletteType);
    const coloristicType = ref<{ id: string; name: string } | null>(
      store.getters['gallery/getFilter']?.coloristicType
    );
    const coloristicTypes = ref([
      { id: 'mask', name: t('mask'), icon: 'mask' },
      { id: 'collage', name: t('collage'), icon: 'images' },
    ]);

    const folders = computed(() => store.getters['folder/getFilterFolders']);
    const folder = ref<Folder | null>(store.getters['gallery/getFilter']?.folder);

    const close = () => {
      emit('close');
    };

    const searchFolder = (value: string) => {
      store.dispatch('folder/filterFolder', value);
    };

    const applyFilter = () => {
      store.dispatch('gallery/setFilter', {
        folder: folder.value,
        coloristicType: coloristicType.value,
        maskType: maskType.value,
        paletteType: paletteType.value,
      });
      emit('resolve', true);
    };

    const clearFilter = () => {
      folder.value = null;
      coloristicType.value = null;
      maskType.value = null;
      paletteType.value = null;
      store.dispatch('gallery/setFilter', null);
    };

    onMounted(() => {
      if (coloristicType.value) {
        coloristicType.value = {
          id: coloristicType.value.id,
          name: t(coloristicType.value.id),
        };
      }
      if (paletteType.value) {
        paletteType.value = {
          ...paletteType.value,
          name: t(paletteType.value.id),
        };
      }
      if (maskType.value) {
        maskType.value = {
          ...maskType.value,
          name: t(maskType.value.type),
        };
      }
    });

    const focusInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        iNoBounce.enable();
        setTimeout(() => window.scrollTo(0, 0), 50);
      }
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
      t,
      paletteType,
      palettesCards,
      focusInput,
      focusOutInput,
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

.type-maks-option {
  padding: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.wrapper-palette {
  max-height: 300px;
  overflow-y: auto;
}

.folders-options-wrapper {
  max-height: 300px;
  overflow-y: auto;
}
</style>
