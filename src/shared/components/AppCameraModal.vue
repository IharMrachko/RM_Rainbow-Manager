<template>
  <div class="modal-content neon">
    <app-loader v-if="isLoader"></app-loader>
    <app-overlay-panel
      v-if="modalRef"
      v-model:visible="visible"
      :width="isMobile ? 300 : 550"
      :target="modalRef"
      :position="{
        x: 'left',
        y: 'center',
      }"
    >
      <section class="cards">
        <app-color-card
          v-for="card in cards"
          :key="card.id"
          :card="card"
          :is-selected="selectedCard?.id === card?.id"
          @selected="selected"
        ></app-color-card>
      </section>
    </app-overlay-panel>
    <app-modal-header @close="close"></app-modal-header>
    <div ref="viewer" class="cam-wrap">
      <video ref="video" autoplay playsinline muted></video>
      <canvas ref="overlay" class="overlay"></canvas>
    </div>
    <footer v-if="!isLoader">
      <div class="image" @click="goBackWithResult">
        <img v-if="photo" :src="photo" alt="photo" />
      </div>
      <div class="btn">
        <AppShutterButton @capture="takePhotoWithFrameMasked"></AppShutterButton>
      </div>

      <div ref="modalRef" class="settings" @click="openOverlayPanel">
        <font-awesome-icon size="xl" :icon="['fas', 'sliders']" />
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import AppModalHeader from '@/shared/components/AppModalHeader.vue';
import AppColorCard from '@/views/main/views/color-view/components/AppColorCard.vue';
import { colorCards } from '@/views/main/views/color-view/components/color-card.constanst';
import { useStore } from 'vuex';
import AppShutterButton from '@/shared/components/AppShutterButton.vue';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
import AppLoader from '@/shared/components/AppLoader.vue';
import { MaskCard } from '@/types/mask-card.type';

export default defineComponent({
  components: { AppLoader, AppOverlayPanel, AppShutterButton, AppColorCard, AppModalHeader },
  emits: ['resolve', 'reject', 'close'],
  setup(_, { emit }) {
    const store = useStore();
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const cards: MaskCard[] = colorCards;
    const video = ref<HTMLVideoElement | null>(null);
    const overlay = ref<HTMLCanvasElement | null>(null);
    const canvas = ref<HTMLCanvasElement | null>(null);
    const outCanvas = ref<HTMLCanvasElement | null>(null);
    const stream = ref<MediaStream | null>(null);
    const photo = ref<string | null>(null);
    const viewer = ref<HTMLElement | null>(null);
    const modalRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const selectedCard = ref<null | MaskCard>(null);
    const frameColors = ref();
    const isLoader = ref(false);
    onBeforeMount(() => {
      const [first] = cards;
      selectedCard.value = first;
      frameColors.value = first.segments;
    });
    onMounted(() => {
      start();
    });

    onBeforeUnmount(() => {
      if (stream.value) {
        stream.value.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        stream.value = null;
      }
    });

    const close = () => {
      emit('close');
    };

    // Устанавливаем overlay в пиксельный размер с учётом DPR и рисуем
    const resizeAndDrawOverlay = () => {
      const canvas = overlay.value;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;

      const dpr = window.devicePixelRatio || 1;

      const physW = Math.round(cssW * dpr);
      const physH = Math.round(cssH * dpr);
      if (canvas.width !== physW || canvas.height !== physH) {
        canvas.width = physW;
        canvas.height = physH;
      }

      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // переключаем систему координат: теперь все последующие команды — в CSS-пикселях
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // очищаем в CSS-координатах
      ctx.clearRect(0, 0, cssW, cssH);

      // параметры в CSS-пикселях
      const padding = Math.max(6, Math.round(Math.min(cssW, cssH) * 0.02));
      const thickness = isMobile.value ? 60 : 80; // для компа 80;
      const overSize = 2; // для компа 2
      const cx = cssW / 2;
      const cy = cssH / 2;
      const radius = Math.max(10, Math.min(cssW, cssH) / 2 - padding - thickness / overSize);

      // отрисовка сегментов (в CSS-пикселях)
      const n = frameColors.value.length;
      const step = (2 * Math.PI) / n;
      const startOffset = -Math.PI / 2;
      ctx.save();
      ctx.lineWidth = thickness; // теперь это CSS-пиксели, т.к. setTransform применён
      ctx.lineCap = 'butt';
      for (let i = 0; i < n; i++) {
        const a0 = i * step + startOffset;
        const a1 = (i + 1) * step + startOffset;
        ctx.beginPath();
        ctx.strokeStyle = frameColors.value[i].color;
        ctx.arc(cx, cy, radius, a0, a1, false);
        ctx.stroke();
      }
      ctx.restore();
    };

    const start = async () => {
      isLoader.value = true;
      try {
        stream.value = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!video.value) return;
        video.value.srcObject = stream.value;

        // Ждём loadedmetadata, чтобы получить intrinsic размеры
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            video.value?.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          video.value?.addEventListener('loadedmetadata', onLoaded);
        });
        await video.value.play();
        isLoader.value = false;
        resizeAndDrawOverlay();
      } catch (e) {
        console.error('Camera error', e);
        isLoader.value = false;
      }
    };

    const takePhotoWithFrameMasked = async () => {
      const v = video.value as HTMLVideoElement | null;
      const outSize = isMobile.value ? 320 : 520;
      if (!v || !v.videoWidth || !v.videoHeight) return;

      // canvas + DPR
      const out = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      out.width = Math.round(outSize * dpr);
      out.height = Math.round(outSize * dpr);
      out.style.width = `${outSize}px`;
      out.style.height = `${outSize}px`;
      const ctx = out.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, outSize, outSize);

      // video source
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      const videoRatio = vw / vh;
      const destRatio = 1; // square

      // basic cover crop
      let sx = 0,
        sy = 0,
        sw = vw,
        sh = vh;
      if (videoRatio > destRatio) {
        sh = vh;
        sw = Math.round(sh * destRatio);
        sx = Math.round((vw - sw) * 0.5);
        sy = 0;
      } else {
        sw = vw;
        sh = Math.round(sw / destRatio);
        sx = 0;
        sy = Math.round((vh - sh) * 0.5);
      }

      // apply zoom (scale) and optional pan offsets
      const zoom = isMobile.value ? 1.6 : 1.6; // пример scale
      const offsetX = 0; // -0.5..+0.5
      const offsetY = 0; // -0.5..+0.5

      const newSw = Math.max(1, Math.round(sw / zoom));
      const newSh = Math.max(1, Math.round(sh / zoom));
      const centerX = sx + sw / 2 + offsetX * (sw / 2);
      const centerY = sy + sh / 2 + offsetY * (sh / 2);
      sx = Math.round(centerX - newSw / 2);
      sy = Math.round(centerY - newSh / 2);
      // clamp
      sx = Math.max(0, Math.min(vw - newSw, sx));
      sy = Math.max(0, Math.min(vh - newSh, sy));
      sw = newSw;
      sh = newSh;

      // draw scaled source -> full out square
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, outSize, outSize);

      // далее маска/рамка и сохранение, как у тебя
      photo.value = out.toDataURL('image/png');
      outCanvas.value = out;
    };
    const selected = (item: MaskCard) => {
      selectedCard.value = item;
      frameColors.value = item.segments;
      resizeAndDrawOverlay();
    };

    const goBackWithResult = async () => {
      const blob = await new Promise<Blob | null>((resolve) => {
        if (outCanvas.value) {
          outCanvas.value.toBlob((b) => resolve(b), 'image/png');
        }
      });
      if (!blob) return null;
      const file = new File([blob], 'avatar.png', { type: 'image/png', lastModified: Date.now() });
      emit('resolve', {
        file,
        selectedCard: selectedCard.value,
      });
    };

    const openOverlayPanel = () => {
      visible.value = true;
    };
    return {
      video,
      canvas,
      viewer,
      photo,
      overlay,
      takePhotoWithFrameMasked,
      cards,
      selectedCard,
      selected,
      goBackWithResult,
      close,
      modalRef,
      visible,
      openOverlayPanel,
      isMobile,
      isLoader,
    };
  },
});
</script>

<style scoped lang="scss">
.modal-content {
  position: relative;
  width: 650px;
  height: 90vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  border-radius: 20px;

  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;

  @media (max-width: 600px) {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  & .cam-wrap {
    position: relative;
    display: block;

    & .overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
      z-index: 2;
    }

    @media (max-width: 600px) {
      flex: 1;
    }
  }
}

.cards {
  padding: 20px;
  justify-content: center;
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 30px 20px;
  flex-shrink: 0;

  & .image {
    width: 70px;
    height: 70px;
    cursor: pointer;

    & img {
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 50%;
      background: white;
      @media (max-width: 600px) {
        width: 50px;
        height: 50px;
      }
    }

    @media (max-width: 600px) {
      width: 50px;
      height: 50px;
    }
  }

  & .settings {
    cursor: pointer;
  }
}

video {
  @media (max-width: 600px) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.btn {
  width: 100%;
  display: flex;
  justify-content: center;
  flex: 6;
  margin-right: 20px;
}
</style>
