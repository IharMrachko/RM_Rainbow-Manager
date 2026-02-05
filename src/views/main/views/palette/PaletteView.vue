<template>
  <div class="chroma-container">
    <div class="chroma-wrapper" :class="{ hiddenOverflow: isHiddenOverflow }">
      <div class="photo-picker">
        <app-image-not-uploaded v-if="!imgEl" @on-file-selected="onFileSelected">
        </app-image-not-uploaded>
        <app-image-color-picker
          v-if="imgEl"
          ref="imageColorPickerRef"
          :image-element="imgEl"
          :is-show-section-info="false"
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
  </div>
</template>
<script lang="ts">
import { defineComponent, onBeforeMount, ref } from 'vue';
import AppImageNotUploaded from '@/shared/components/AppImageNotUploaded.vue';
import AppImageColorPicker from '@/shared/components/AppImageColorPicker.vue';
import AppPaletteFillCard from '@/views/main/views/palette/components/AppPaletteFillCard.vue';
import AppButton from '@/shared/components/AppButton.vue';
import chroma from 'chroma-js';
import { defaultPaletteCards, palettesObj } from '@/views/main/views/palette/palette';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppPaletteModal from '@/views/main/views/palette/components/AppPaletteModal.vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { Palette } from '@/types/palette.type';

export default defineComponent({
  components: {
    AppButton,
    AppPaletteFillCard,
    AppImageColorPicker,
    AppImageNotUploaded,
  },
  setup() {
    const imageColorPickerRef = ref<{
      getCanvasValue: () => HTMLCanvasElement;
      getImageSrc: () => string;
      triggerSaveImage: () => void;
    } | null>(null);
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
    const palettes: Record<Palette, string[]> = palettesObj;

    onBeforeMount(() => {
      initFirstCard();
    });

    const sharedImageUrl = ref<string>(''); // Для передачи в модалку

    const onFileSelected = async (file: File) => {
      if (!file) return;

      try {
        const urls = await createDistinctUrlsFromFile(file);

        imageUrl.value = urls.localUrl;
        sharedImageUrl.value = urls.safeUrl; // <-- Передавайте этот URL

        await loadImage(imageUrl.value);
        initFirstCard();
      } catch (error) {
        console.error('Failed to create distinct URLs:', error);

        // Простой fallback
        const blobUrl = URL.createObjectURL(file);
        imageUrl.value = blobUrl;
        sharedImageUrl.value = blobUrl;

        await loadImage(imageUrl.value);
        initFirstCard();
      }
    };

    const createDistinctUrlsFromFile = async (
      file: File
    ): Promise<{
      localUrl: string; // Для этого компонента
      sharedUrl: string; // Для передачи другим компонентам
      safeUrl: string; // Самый безопасный вариант
    }> => {
      // 1. Читаем файл в ArrayBuffer (один раз)
      const arrayBuffer = await file.arrayBuffer();

      // 2. Создаем три РАЗНЫХ Blob (хотя данные одинаковые)
      const blob1 = new Blob([arrayBuffer], { type: file.type });
      const blob2 = new Blob([new Uint8Array(arrayBuffer)], { type: file.type });
      const blob3 = new Blob([arrayBuffer.slice(0)], { type: file.type });

      return {
        // Для локального использования - data URL
        localUrl: await blobToDataUrl(blob1),

        // Для передачи - blob URL (первый)
        sharedUrl: URL.createObjectURL(blob2),

        // Самый безопасный - data URL с меткой
        safeUrl: await createUniqueDataUrl(blob3, file.name),
      };
    };

    // Создание уникального data URL
    const createUniqueDataUrl = async (blob: Blob, filename: string): Promise<string> => {
      const dataUrl = await blobToDataUrl(blob);

      // Добавляем уникальный идентификатор чтобы URL всегда был разный
      const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);

      // Можно добавить метаданные в data URL
      return `${dataUrl}#${filename}_${uniqueId}`;
    };

    // Конвертация Blob в data URL
    const blobToDataUrl = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const imageUrlChange = (url: string) => {
      imageUrl.value = url;
      sharedImageUrl.value = url;
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
        .map((it) => ({
          name: it.name,
          segments: palettes[it.name as Palette].map((v) => ({ color: v })),
        }));

      openDialog(AppPaletteModal, {
        results: results,
        imageUrl: sharedImageUrl.value,
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
      imageColorPickerRef,
    };
  },
});
</script>
<style scoped>
.chroma-container {
  position: relative;
  overflow: auto;
  height: 100dvh;
  background: var(--color-wrap-bg);
}
.chroma-wrapper {
  padding: 20px;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  gap: 20px;
  overflow: hidden;
  height: calc(100dvh - var(--header-height));
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
    padding: 0;
    gap: 0;
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
    margin-bottom: 15px;
    width: 350px;
    font-size: 12px;
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
