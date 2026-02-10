<template>
  <div class="color-container">
    <div class="color-wrapper">
      <section v-if="visibleSelectedSection" class="selected">
        <app-color-card
          v-for="card in palettesCards.slice(startPalette, endPalette)"
          :key="card.id"
          :index="order(card)"
          :card="card"
          :is-selected="selectedCard?.id === card?.id"
          @selected="selected"
        ></app-color-card>
        <div v-if="palettesCards.length > 6" class="arrows">
          <font-awesome-icon
            class="arrow left"
            :size="isMobile ? 'sm' : '2xl'"
            :icon="['fas', 'arrow-left']"
            @click="nextPalette"
          />
          <font-awesome-icon
            class="arrow right"
            :size="isMobile ? 'sm' : '2xl'"
            :icon="['fas', 'arrow-right']"
            @click="nextPalette"
          />
        </div>
        <span class="selected-name">{{ t(selectedCard.name) }}</span>
      </section>
      <div v-if="isMobile" class="chevron" @click="toggleSelectedSection">
        <font-awesome-icon
          :icon="['fas', visibleSelectedSection ? 'chevron-down' : 'chevron-up']"
          size="xl"
        />
      </div>
      <section class="editor">
        <app-palette
          :item="selectedCard"
          gap="8px"
          :width="isMobile ? '160px' : '200px'"
          :selected-mode="true"
          :selected-colors="selectedColors"
          @selected-color="selectedColor($event)"
        ></app-palette>
        <div class="selected-colors">
          <div v-if="selectedColors.size === 0" class="empty-message">
            <span class="reminder">
              <font-awesome-icon size="xl" :icon="['fas', 'exclamation-triangle']" />
              {{ t('selectTopColors') }}</span
            >
          </div>

          <template v-else>
            <div
              v-for="color in selectedColors"
              :key="color"
              class="selected-color"
              :style="{ background: color }"
            ></div>
          </template>
        </div>
        <div v-if="isMobile" class="btns">
          <div class="bnt-next">
            <app-button
              raised
              severity="secondary"
              title="reset"
              @click="cancelledTemplate"
            ></app-button>
          </div>
          <div class="bnt-next">
            <app-button severity="success" title="next" @click="nextStep"></app-button>
          </div>
        </div>
      </section>
      <section class="buttons" :class="{ isMobile: isMobile }">
        <div v-if="!isMobile" class="btn filter">
          <app-button
            raised
            severity="secondary"
            :icon="['fas', 'filter']"
            title="filter"
            @click="openPaletteSettings"
          ></app-button>
          <div v-if="!isCompareFilter" class="filter-fill"></div>
        </div>
        <div v-if="!isMobile" class="btn">
          <app-button
            raised
            :icon="['fas', 'undo']"
            severity="secondary"
            title="reset"
            @click="cancelledTemplate"
          ></app-button>
        </div>
        <div v-if="!isMobile" class="btn">
          <app-button severity="success" title="next" @click="nextStep"></app-button>
        </div>
        <font-awesome-icon
          v-if="isMobile"
          :icon="['fas', 'ellipsis-h']"
          size="xl"
          @click.stop="openPopover"
        />
      </section>
    </div>
    <app-popover v-model:visible="visiblePopover">
      <app-popover-wrapper>
        <app-popover-item @click="openPaletteSettings">
          <font-awesome-icon size="xl" :icon="['fas', 'filter']" />
          <span>{{ t('filter') }}</span>
          <div v-if="!isCompareFilter" class="popover-filter-fill"></div>
        </app-popover-item>
      </app-popover-wrapper>
    </app-popover>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import { palettesObj, palettesObjShort } from '@/views/main/views/palette/palette';
import { Palette } from '@/types/palette.type';
import { PaletteCard } from '@/types/palette-card.type';
import AppColorCard from '@/views/main/views/characteristic-colors/components/AppColorCard.vue';
import AppPaletteDeterminantSettingsModal from '@/views/main/views/palette-determinant/components/AppPaletteDeterminantSettingsModal.vue';
import AppPalette from '@/shared/components/AppPalette.vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  components: {
    AppPalette,
    AppColorCard,
    AppPopoverItem,
    AppPopoverWrapper,
    AppPopover,
    AppButton,
  },
  setup(_) {
    const { t } = useI18n();
    const store = useStore();
    const router = useRouter();
    const visiblePopover = ref(false);
    const selectedCard = ref<null | PaletteCard>(null);
    const frameColors = ref();
    const targetRef = ref<HTMLElement | null>(null);
    const visibleSelectedSection = ref(true);
    const selectedColors = ref<Set<string>>(store.getters['cutPaletteColors/getSelectedColors']);
    const getPalette = (): Record<Palette, string[]> => {
      const fullFill = store.getters['cutPaletteColors/getSettingsMap'].fullFill;
      return fullFill ? palettesObj : palettesObjShort;
    };

    const createPaletteCard = (type: string, color: string[]): PaletteCard => ({
      id: type as Palette,
      name: type,
      colors: color,
      segments: color.map((it) => ({ color: it })),
    });

    const filterAndTransformPalettes = (
      palettesObj: Record<string, string[]>,
      visible: Record<string, boolean>
    ): PaletteCard[] => {
      return Object.entries(palettesObj)
        .filter(([type]) => visible[type])
        .map(([type, color]) => createPaletteCard(type, color));
    };

    const palettesCards = ref<PaletteCard[]>(
      filterAndTransformPalettes(
        getPalette(),
        store.getters['cutPaletteColors/getSettingsMap'].palette
      )
    );
    const startPalette = ref(0);
    const endPalette = ref(6);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const isCompareFilter = computed(() => store.getters['cutPaletteColors/isCompareFilter']);
    onBeforeMount(() => {
      initSelectedFirst();
    });

    const selected = (item: PaletteCard) => {
      selectedCard.value = item;
      frameColors.value = item.colors.map((it) => ({ color: it }));
    };

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const nextPalette = () => {
      startPalette.value === 0 ? initPositionEnd() : initPositionStart();
    };

    const openPaletteSettings = async () => {
      await openDialog(AppPaletteDeterminantSettingsModal, {
        fullFill: store.getters['cutPaletteColors/getSettings'].fullFill,
        onlySoft: store.getters['cutPaletteColors/getSettings'].onlySoft,
        onlyBright: store.getters['cutPaletteColors/getSettings'].onlyBright,
        onlyCold: store.getters['cutPaletteColors/getSettings'].onlyCold,
        onlyWarm: store.getters['cutPaletteColors/getSettings'].onlyWarm,
        onlyLight: store.getters['cutPaletteColors/getSettings'].onlyLight,
        onlyDark: store.getters['cutPaletteColors/getSettings'].onlyDark,
      }).then((value) => {
        store.dispatch('cutPaletteColors/setSettings', value);
        palettesCards.value = filterAndTransformPalettes(
          getPalette(),
          store.getters['cutPaletteColors/getSettingsMap'].palette
        );
        initPositionStart();
        initSelectedFirst();
        selectedColors.value = new Set();
      });
    };

    const initSelectedFirst = () => {
      const [first] = palettesCards.value;
      selectedCard.value = first;
      frameColors.value = first.colors.map((it) => ({ color: it }));
    };

    const initPositionStart = () => {
      startPalette.value = 0;
      endPalette.value = 6;
    };

    const initPositionEnd = () => {
      startPalette.value = 6;
      endPalette.value = 12;
    };

    const order = (card: PaletteCard): number => {
      return palettesCards.value.findIndex((it) => it.id === card.id);
    };

    const selectedColor = (item: { color: string; selected: boolean }) => {
      if (item.selected) {
        selectedColors.value.add(item.color);
      } else {
        selectedColors.value.delete(item.color);
      }
      selectedColors.value = new Set(selectedColors.value);
      store.dispatch('cutPaletteColors/selectedColors', selectedColors.value);
    };

    const cancelledTemplate = () => {
      selectedColors.value = new Set();
      store.dispatch('cutPaletteColors/selectedColors', selectedColors.value);
    };

    const nextStep = () => {
      if (selectedColors.value.size === 0) {
        store.dispatch('toast/addToast', {
          message: 'selectOneColor',
          severity: 'warning',
        });
        return;
      }
      router.push('/main/cut-palette-color/edit');
    };

    const toggleSelectedSection = () => {
      visibleSelectedSection.value = !visibleSelectedSection.value;
    };

    return {
      frameColors,
      selected,
      selectedCard,
      visiblePopover,
      isMobile,
      openPopover,
      t,
      palettesCards,
      targetRef,
      endPalette,
      startPalette,
      nextPalette,
      openPaletteSettings,
      order,
      isCompareFilter,
      selectedColor,
      selectedColors,
      cancelledTemplate,
      nextStep,
      visibleSelectedSection,
      toggleSelectedSection,
    };
  },
});
</script>
<style scoped lang="scss">
@import '@/styles/style';

.color-container {
  position: relative;
  overflow: auto;
  height: 100dvh;
  background: var(--color-wrap-bg);
}

.color-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  height: calc(100dvh - var(--header-height));
  gap: 20px;

  & .selected {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-content: flex-start;
    align-items: flex-start;
    justify-content: center;
    position: relative;

    & .arrows {
      width: 100%;
      display: flex;
      justify-content: center;
      cursor: pointer;
    }

    @media (max-width: 600px) {
      .selected-name {
        font-size: 14px;
      }
    }
  }
  & .editor {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 2;
    gap: 2rem;
    overflow: auto;

    @media (max-width: 600px) {
      gap: 0;
    }
  }
  & .buttons:not(.isMobile) {
    width: 301px;
    display: flex;
    gap: 12px;
    flex-direction: column;
    align-items: end;

    .btn {
      width: 230px;
    }

    .checkbox {
      width: 230px;
      display: flex;
      padding-left: 20px;
    }
  }
}

@media (max-width: 600px) {
  .color-wrapper .buttons {
    display: flex;
    justify-content: center;
    font-size: 20px;
  }

  .color-container .color-wrapper {
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex-wrap: nowrap;
    overflow: auto;
  }
  .color-container .color-wrapper .selected {
    flex: 0 1 auto;
    align-self: flex-start; // не тянется вниз
    width: 100%;
  }
}

.btn.filter {
  position: relative;
}

.filter-fill {
  @include filter-dot;
  left: 90px;
}

.popover-filter-fill {
  @include filter-dot;
  left: 33px;
}

.selected-colors {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  padding: 10px;
  border: 1px solid var(--active-doing);
  width: 100%;
  height: 200px;
  min-height: 200px;
  overflow: auto;
  /* Выравниваем элементы по верхнему краю */
  align-items: flex-start;
  /* Или растягиваем строки */
  align-content: flex-start;

  & .selected-color {
    height: 30px;
    width: 30px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.bnt-next {
  width: 100%;
}

.chevron {
  width: 100%;
  display: flex;
  justify-content: center;
}

.btns {
  margin-top: 15px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-message {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 600px) {
    font-size: 12px;
  }
}
</style>
