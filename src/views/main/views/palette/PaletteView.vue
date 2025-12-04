<template>
  <div class="chroma-wrapper">
    <div class="photo-picker" :class="{ hiddenOverflow: isHiddenOverflow }">
      <app-image-not-uploaded v-if="!imgEl" @on-file-selected="onFileSelected">
      </app-image-not-uploaded>
      <app-image-color-picker
        v-if="imgEl"
        :image-element="imgEl"
        @selected-hex="onSelectedHex"
        @is-hidden-overflow="isHiddenOverflow = $event"
        @image-url-changed="imageUrlChange"
      ></app-image-color-picker>
    </div>
    <div class="palette-fill">
      <span class="reminder">
        <font-awesome-icon size="xl" :icon="['fas', 'exclamation-triangle']" />
        {{ t('reminderPickColor') }}</span
      >
      <div class="preview-row">
        <app-palette-fill-card
          v-for="item in paletteCards"
          :key="item.id"
          :selected-hex="item"
          :is-selected="selectedCard?.id === item?.id"
          @selected="onSelectedCard"
        >
        </app-palette-fill-card>
      </div>
      <div class="btn-wrap">
        <div class="btn">
          <app-button title="define" @click="range"></app-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, onBeforeMount, ref } from 'vue';
import AppImageNotUploaded from '@/shared/components/AppImageNotUploaded.vue';
import AppImageColorPicker from '@/shared/components/AppImageColorPicker.vue';
import AppPaletteFillCard from '@/views/main/views/palette/components/AppPaletteFillCard.vue';
import AppButton from '@/shared/components/AppButton.vue';
import chroma from 'chroma-js';
import {
  brightSpringPalette,
  brightWinterPalette,
  coldWinterPalette,
  coolSummerPalette,
  darkAutumnPalette,
  darkWinterPalette,
  defaultPaletteCards,
  lightSpringPalette,
  lightSummerPalette,
  softAutumnPalette,
  softSummerPalette,
  warmAutumnPalette,
  warmSpringPalette,
} from '@/views/main/views/palette/components/palette';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppPaletteModal from '@/views/main/views/palette/components/AppPaletteModal.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';

export default defineComponent({
  components: {
    AppButton,
    AppPaletteFillCard,
    AppImageColorPicker,
    AppImageNotUploaded,
  },
  setup() {
    const { t } = useI18n();
    const store = useStore();
    const selectedHex = ref<string>('#fff');
    const imgEl = ref<HTMLImageElement | null>(null);
    const imageUrl = ref<string>('');
    const isHiddenOverflow = ref(false);
    const defPaletteCards = defaultPaletteCards.map((card) => ({ ...card }));
    const paletteCards = ref<{ id: number; color: string }[]>([...defPaletteCards]);
    const selectedCard = ref<{ id: number; color: string } | null>(null);
    // Настройки: веса метрики и допуск попадания
    const weights = { l: 1.0, c: 1.0, h: 1.5 };
    const tolerance = { l: 10, c: 20, h: 15 };
    const palettes: Record<string, string[]> = {
      softSummerPalette: softSummerPalette,
      darkAutumnPalette: darkAutumnPalette,
      coolSummerPalette: coolSummerPalette,
      lightSpringPalette: lightSpringPalette,
      softAutumnPalette: softAutumnPalette,
      brightSpringPalette: brightSpringPalette,
      warmSpringPalette: warmSpringPalette,
      darkWinterPalette: darkWinterPalette,
      lightSummerPalette: lightSummerPalette,
      warmAutumnPalette: warmAutumnPalette,
      coldWinterPalette: coldWinterPalette,
      brightWinterPalette: brightWinterPalette,
    };

    onBeforeMount(() => {
      initFirstCard();
    });

    const onFileSelected = (file: File) => {
      if (!file) return;
      imageUrl.value = URL.createObjectURL(file);
      loadImage(imageUrl.value);
      initFirstCard();
    };

    const imageUrlChange = (url: string) => {
      imageUrl.value = url;
      paletteCards.value = defaultPaletteCards.map((card) => ({ ...card }));
      initFirstCard();
    };

    const initFirstCard = () => {
      const [first] = paletteCards.value;
      selectedCard.value = first;
    };

    const loadImage = async (src: string) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load error'));
        img.src = src;
      });
      imgEl.value = img;
    };

    const onSelectedCard = (item: { id: number; color: string }) => {
      selectedCard.value = item;
    };

    const onSelectedHex = (value: string) => {
      if (selectedCard.value) {
        const ind = paletteCards.value.findIndex(
          (v: { id: number; color: string }) => v.id === selectedCard.value?.id
        );
        if (ind !== -1) {
          paletteCards.value[ind].color = value;
        }
      }
    };

    const range = () => {
      if (!imageUrl.value) {
        store.dispatch('toast/addToast', {
          message: 'uploadImage',
          severity: 'warning',
        });
        return;
      }
      const photoColors: string[] = paletteCards.value.map(
        (it: { id: number; color: string }) => it.color
      );

      // Агрегация: рейтинг палитр по всем фото-цветам
      const results = Object.entries(palettes)
        .map(([name, palette]) => {
          // Для каждого фото-цвета — ближайший цвет палитры
          const closestMap = photoColors.map((hex) => {
            let best = { hex: '', distance: Infinity, hit: false };
            for (const p of palette) {
              const d = colorDistance(hex, p);
              if (d < best.distance) best = { hex: p, distance: d, hit: isWithinTolerance(hex, p) };
            }
            return { source: hex, closest: best.hex, distance: best.distance, hit: best.hit };
          });

          // Средняя минимальная дистанция по всем фото-цветам (меньше = лучше)
          const score =
            closestMap.reduce((sum, it) => sum + it.distance, 0) / Math.max(1, closestMap.length);

          // Количество попаданий в допуск (больше = лучше)
          const hits = closestMap.filter((it) => it.hit).length;

          return { name, score, hits, closestMap };
        })
        .sort((a, b) => b.hits - a.hits || a.score - b.score)
        .slice(0, 3)
        .map((it) => ({
          name: it.name,
          segments: palettes[it.name].map((v) => ({ color: v })),
        }));

      openDialog(AppPaletteModal, {
        results: results,
        imageUrl: imageUrl.value,
        paletteCards: paletteCards.value,
      });
    };

    const hueDelta = (h1: number, h2: number) => {
      return Math.abs(((h1 - h2 + 180) % 360) - 180);
    };

    const colorDistance = (hexA: string, hexB: string) => {
      const [l1, c1, h1] = chroma(hexA).lch();
      const [l2, c2, h2] = chroma(hexB).lch();

      const dl = Math.abs(l1 - l2);
      const dc = Math.abs(c1 - c2);
      const dh = hueDelta(h1, h2);

      return weights.l * dl + weights.c * dc + weights.h * dh;
    };

    const isWithinTolerance = (hexA: string, hexB: string) => {
      const [l1, c1, h1] = chroma(hexA).lch();
      const [l2, c2, h2] = chroma(hexB).lch();

      return (
        Math.abs(l1 - l2) <= tolerance.l &&
        Math.abs(c1 - c2) <= tolerance.c &&
        hueDelta(h1, h2) <= tolerance.h
      );
    };

    return {
      imgEl,
      selectedHex,
      onFileSelected,
      isHiddenOverflow,
      paletteCards,
      onSelectedCard,
      selectedCard,
      onSelectedHex,
      range,
      imageUrlChange,
      t,
    };
  },
});
</script>
<style scoped>
.chroma-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  background: var(--color-wrap-bg);
  height: calc(100dvh - var(--header-height));
  gap: 20px;
  overflow: hidden;

  /* Скрыть скроллбар в разных браузерах */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
  overscroll-behavior: contain; /* или none */

  &::-webkit-scrollbar {
    /* Chrome, Safari, Opera */
    display: none;
  }

  @media (max-width: 600px) {
    overflow: auto;
    align-content: start;
  }
}
.photo-picker {
  margin: 12px auto;
}

.hiddenOverflow {
  overflow: hidden;
}

.palette-fill {
  margin: 12px auto;
  max-width: 520px;

  & .reminder {
    display: inline-block;
    margin-bottom: 20px;
    width: 350px;
  }

  & .preview-row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  & .btn-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    & .btn {
      width: 300px;
    }
  }
}
</style>
