<template>
  <div class="color-picker">
    <div v-if="isPreviewRow" class="preview-row">
      <div class="preview" :style="{ background: hex }" aria-hidden="true"></div>
      <app-input v-model="hex" :is-label="false"></app-input>
    </div>

    <div class="controls">
      <!-- SV square -->
      <div
        ref="svEl"
        class="sv"
        :style="{ background: svBackground }"
        @pointerdown.prevent="onSvPointerDown"
      >
        <div class="sv-overlay" />
        <div class="sv-cursor" :style="svCursorStyle" aria-hidden="true" />
      </div>

      <!-- Hue slider -->
      <div ref="hueEl" class="hue" @pointerdown.prevent="onHuePointerDown">
        <div class="hue-cursor" :style="hueCursorStyle" aria-hidden="true" />
      </div>
    </div>

    <div v-if="isInfo" class="info">
      <div><strong>HEX:</strong> {{ hex }}</div>
      <div><strong>RGB:</strong> {{ rgb.join(', ') }}</div>
    </div>

    <section v-if="isCombosSection" class="combos">
      <h4>{{ t('combinations') }}</h4>
      <div class="row">
        <div v-for="c in combos" :key="c.label" class="combo">
          <div class="swatch" :style="{ background: c.color }"></div>
          <div class="label">{{ c.label }} — {{ c.color }}</div>
        </div>
      </div>
      <h4>{{ t('scale') }}</h4>
      <div class="row">
        <div v-for="s in scaleColors" :key="s" class="swatch" :style="{ background: s }"></div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import chroma from 'chroma-js';
import { useI18n } from 'vue-i18n';
import AppInput from '@/shared/components/AppInput.vue';

export default defineComponent({
  components: { AppInput },
  props: {
    hexP: {
      type: String,
      default: '#D4F880',
    },
    isPreviewRow: {
      type: Boolean,
      default: true,
    },
    isInfo: {
      type: Boolean,
      default: true,
    },
    isCombosSection: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const hex = ref(props.hexP);
    const hue = ref(chroma(hex.value).hsl()[0] ?? 0);
    const sat = ref(chroma(hex.value).hsl()[1] ?? 1);
    const val = ref(chroma(hex.value).hsl()[2] ?? 0.5);

    // refs to DOM
    const svEl = ref<HTMLElement | null>(null);
    const hueEl = ref<HTMLElement | null>(null);
    // следим за изменениями пропа и обновляем локальную копию
    watch(
      () => props.hexP,
      (newVal) => {
        hex.value = newVal;
      },
      { immediate: false } // immediate: true если нужно сразу применить (уже сделано через ref)
    );
    // derived
    const color = computed(() => {
      return chroma.valid(hex.value) ? chroma(hex.value) : chroma('#000');
    });
    const rgb = computed(() => color.value.rgb());

    const svBackground = computed(() => chroma.hsl(hue.value, 1, 0.5).hex());
    const svCursorStyle = computed(() => ({
      left: `${(sat.value * 100).toFixed(2)}%`,
      top: `${((1 - val.value) * 100).toFixed(2)}%`,
      transform: 'translate(-50%,-50%)',
    }));
    const hueCursorStyle = computed(() => ({
      left: `${(((hue.value % 360) / 360) * 100).toFixed(2)}%`,
      transform: 'translateX(-50%)',
    }));
    // генерация сочетаний
    const combos = computed(() => {
      const h = color.value.hsl()[0] ?? 0;
      const s = color.value.hsl()[1];
      const l = color.value.hsl()[2];
      return [
        { label: 'Complement', color: chroma.hsl((h + 180) % 360, s, l).hex() },
        { label: 'Analog -30', color: chroma.hsl((h - 30 + 360) % 360, s, l).hex() },
        { label: 'Analog +30', color: chroma.hsl((h + 30) % 360, s, l).hex() },
        { label: 'Triad 1', color: chroma.hsl((h + 120) % 360, s, l).hex() },
        { label: 'Triad 2', color: chroma.hsl((h + 240) % 360, s, l).hex() },
      ];
    });

    // шкала в LAB для равномерного визуального перехода
    const scaleColors = computed(() => {
      const color = chroma.valid(hex.value) ? hex.value : '#000';
      return chroma
        .scale([color, chroma(color).darken(2)])
        .mode('lab')
        .colors(5);
    });

    const updateHexFromHSV = () => {
      const c = chroma.hsv(hue.value, sat.value, val.value);
      hex.value = c.hex();
      emit('change', hex.value);
    };

    const syncFromHex = () => {
      if (chroma.valid(hex.value)) {
        const hsl = chroma(hex.value).hsl();
        hue.value = hsl[0] ?? 0;
        sat.value = hsl[1] ?? 1;
        val.value = hsl[2] ?? 0.5;
      }
    };

    // Pointer handling utilities (SV)
    let svActive = false;
    const handleSvPointer = (clientX: number, clientY: number) => {
      const el = svEl.value;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(Math.max(0, clientX - r.left), r.width);
      const y = Math.min(Math.max(0, clientY - r.top), r.height);
      sat.value = x / r.width;
      val.value = 1 - y / r.height;
      updateHexFromHSV();
    };

    const onSvPointerDown = (e: PointerEvent) => {
      svActive = true;
      svEl.value?.setPointerCapture?.(e.pointerId);
      handleSvPointer(e.clientX, e.clientY);
      window.addEventListener('pointermove', onWindowSvMove);
      window.addEventListener('pointerup', onWindowSvUp, { once: true });
    };

    const onWindowSvMove = (e: PointerEvent) => {
      if (svActive) handleSvPointer(e.clientX, e.clientY);
    };

    const onWindowSvUp = (e: PointerEvent) => {
      svActive = false;
      svEl.value?.releasePointerCapture?.(e.pointerId);
      window.removeEventListener('pointermove', onWindowSvMove);
      window.removeEventListener('pointerup', onWindowSvUp);
    };

    // Pointer handling utilities (Hue)
    let hueActive = false;
    const handleHuePointer = (clientX: number) => {
      const el = hueEl.value;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = Math.min(Math.max(0, clientX - r.left), r.width);
      hue.value = (x / r.width) * 360;
      updateHexFromHSV();
    };

    const onHuePointerDown = (e: PointerEvent) => {
      hueActive = true;
      hueEl.value?.setPointerCapture?.(e.pointerId);
      handleHuePointer(e.clientX);
      window.addEventListener('pointermove', onWindowHueMove);
      window.addEventListener('pointerup', onWindowHueUp, { once: true });
    };

    const onWindowHueMove = (e: PointerEvent) => {
      if (hueActive) handleHuePointer(e.clientX);
    };

    const onWindowHueUp = (e: PointerEvent) => {
      hueActive = false;
      hueEl.value?.releasePointerCapture?.(e.pointerId);
      window.removeEventListener('pointermove', onWindowHueMove);
      window.removeEventListener('pointerup', onWindowHueUp);
    };

    // cleanup
    onBeforeUnmount(() => {
      window.removeEventListener('pointermove', onWindowSvMove);
      window.removeEventListener('pointerup', onWindowSvUp);
      window.removeEventListener('pointermove', onWindowHueMove);
      window.removeEventListener('pointerup', onWindowHueUp);
    });

    // init sync
    onMounted(async () => {
      await nextTick();
      syncFromHex();
    });

    return {
      hex,
      hue,
      sat,
      val,
      svEl,
      hueEl,
      color,
      rgb,
      svBackground,
      svCursorStyle,
      hueCursorStyle,
      onSvPointerDown,
      onHuePointerDown,
      combos,
      scaleColors,
      t,
    };
  },
});
</script>

<style scoped>
.color-picker {
  max-width: 520px;
  margin: 12px auto;
  font-family: system-ui;
}
.preview-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}
.preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.sv {
  width: 220px;
  height: 220px;
  border-radius: 8px;
  position: relative;
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.sv-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
  border-radius: 8px;
  pointer-events: none;
}
.sv-cursor {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.hue {
  width: 220px;
  height: 18px;
  border-radius: 8px;
  position: relative;
  background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.hue-cursor {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid grey;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  top: -4px;
}

@media (max-width: 600px) {
  .sv {
    width: 160px;
    height: 80px;
  }
  .hue {
    width: 160px;
  }
}

.row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.swatch {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.combo {
  text-align: center;
  font-size: 12px;
}
</style>
