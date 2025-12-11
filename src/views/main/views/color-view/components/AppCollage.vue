<template>
  <div class="collage-wrapper">
    <div class="collage-container">
      <canvas ref="canvas"></canvas>
    </div>

    <section class="buttons" :class="{ isMobile: isMobile }">
      <div v-if="!isMobile" class="btn">
        <app-button
          raised
          title="pickPhoto"
          severity="secondary"
          :icon="['fas', 'sliders']"
          @click="openImageSettingsModal"
        ></app-button>
      </div>
      <div v-if="!isMobile" class="btn">
        <app-button severity="success" title="download" @click="saveImage('collage')"></app-button>
      </div>
      <app-button
        v-if="!isMobile"
        severity="warning"
        title="saveToGallery"
        :loading="isSaveToGallery"
        @click="saveToGallery"
      ></app-button>
      <app-button
        v-if="!isMobile"
        severity="info"
        title="addSign"
        @click="openImageModal"
      ></app-button>
      <font-awesome-icon
        v-if="isMobile"
        :icon="['fas', 'ellipsis-h']"
        size="lg"
        @click.stop="openPopover"
      />
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="sharedWithMask" label="shareImageWithMask"></AppCheckbox>
      </div>
      <div v-if="!isMobile" class="checkbox">
        <AppCheckbox v-model="rememberChoose" label="rememberChoose"></AppCheckbox>
      </div>
    </section>
  </div>

  <app-popover v-model:visible="visiblePopover">
    <app-popover-wrapper>
      <app-popover-item @click="openImageSettingsModal">
        <font-awesome-icon size="xl" :icon="['fas', 'sliders']" />
        <span>{{ t('pickPhoto') }}</span>
      </app-popover-item>
      <app-popover-item @click="saveImage('collage')">
        <font-awesome-icon size="xl" :icon="['fas', 'download']" />
        <span>{{ t('download') }}</span>
      </app-popover-item>
      <app-popover-item @click="saveToGallery">
        <font-awesome-icon size="xl" :icon="['fas', 'images']" />
        <span>{{ t('saveToGallery') }}</span>
      </app-popover-item>
      <app-popover-item @click="openImageModal">
        <font-awesome-icon size="xl" :icon="['fas', 'fa-pencil-square']" />
        <span>{{ t('addSign') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
    <app-popover-wrapper>
      <app-popover-item>
        <AppCheckbox v-model="sharedWithMask"></AppCheckbox>
        <span>{{ t('shareImageWithMask') }}</span>
      </app-popover-item>
      <app-popover-item>
        <AppCheckbox v-model="rememberChoose"></AppCheckbox>
        <span>{{ t('rememberChoose') }}</span>
      </app-popover-item>
    </app-popover-wrapper>
  </app-popover>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import { colorCards } from '@/views/main/views/color-view/components/color-card.constanst';
import { useStore } from 'vuex';
import { useCanvasSaver } from '@/composables/useCanvasSaver';
import AppPopoverItem from '@/shared/components/AppPopoverItem.vue';
import AppPopoverWrapper from '@/shared/components/AppPopoverWrapper.vue';
import AppPopover from '@/shared/components/AppPopover.vue';
import { useI18n } from 'vue-i18n';
import AppCheckbox from '@/shared/components/AppCheckbox.vue';
import { readFileAsDataURL } from '@/helpers/read-file-as-data-url';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppImageSignInModal from '@/views/main/views/color-view/components/AppImageSignInModal.vue';
import AppImageSettingsModal from '@/shared/components/AppImageSettingsModal.vue';
// @ts-ignore
import iNoBounce from 'inobounce';

const mobileHeight = 410;
const mobileWidth = 320;
const desktopHeight = 550;
const desktopWidth = 960;
const desktopThickness = 30;
const mobileThickness = 20;
export default defineComponent({
  components: {
    AppCheckbox,
    AppPopover,
    AppPopoverWrapper,
    AppPopoverItem,
    AppButton,
  },

  emits: ['update:imageUrl', 'isLoading'],

  setup(_, { emit }) {
    const { t } = useI18n();
    const visiblePopover = ref(false);
    const store = useStore();
    const canvas = ref<HTMLCanvasElement | null>(null);
    const imageRef = ref<HTMLImageElement | null>(null);
    const width = ref(desktopWidth);
    const height = ref(desktopHeight);
    const photoScaleRef = ref(1);
    const originalUrlRef = ref<string | null>(null);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const currentUser = computed(() => store.getters['authFirebase/currentUser']);
    const imageUrl = ref<string | null>(null);
    const uploader = ref();
    const isSaveToGallery = ref(false);
    const sharedWithMask = ref(store.getters['imageColor/shareImgMask']);
    const rememberChoose = ref(store.getters['imageColor/rememberImgCollage']);
    let isLoadImage = false;
    const device = computed(() => store.getters['mobile/getDevice']);
    const onFileSelected = async (file: File) => {
      isLoadImage = false;
      imageUrl.value = await readFileAsDataURL(file);
      await store.dispatch('imageColor/uploadImgCollage', { file });
      await render();
    };
    const render = async () => {
      if (!canvas.value) return;
      const ctx = canvas.value.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;

      // Retina‑поддержка
      canvas.value.width = width.value * dpr;
      canvas.value.height = height.value * dpr;
      canvas.value.style.width = width.value + 'px';
      canvas.value.style.height = height.value + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width.value, height.value);

      if (imageUrl.value && !isLoadImage) {
        imageRef.value = await loadImage(imageUrl.value);
        isLoadImage = true;
      }

      const isMobile = width.value === mobileWidth;
      const cols = isMobile ? 2 : 3;
      const rows = isMobile ? 3 : 2;
      const gap = 10;
      const rowGap = 8;
      const photoScale = isMobile ? photoScaleRef.value * 1.2 : photoScaleRef.value;

      const totalGapX = gap * (cols - 1);
      const cellW = (width.value - totalGapX) / cols;

      let radius = (cellW / 2) * photoScale - desktopThickness;
      if (radius < 1) radius = 1;

      const totalGapY = rowGap * (rows - 1);
      const cellH = (height.value - totalGapY) / rows;

      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * (cellW + gap) + cellW / 2;
          const cy = row * (cellH + rowGap) + cellH / 2;

          const card = colorCards[idx % colorCards.length];
          drawImageWithFrame(ctx, imageRef.value, cx, cy, radius, card.segments);

          idx++;
        }
      }
    };

    const { getCanvasSrc, saveImage, loadImage, zoom } = useCanvasSaver(
      canvas,
      render,
      emit,
      originalUrlRef
    );

    const drawImageWithFrame = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement | null,
      cx: number,
      cy: number,
      radius: number,
      segmentsArr: { color: string }[]
    ) => {
      const thickness = width.value === mobileWidth ? mobileThickness : desktopThickness;

      // если есть картинка — рисуем её
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();

        // вычисляем квадратную область из центра исходного изображения
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        // итоговый размер (с учётом толщины рамки)
        const targetSize = (radius * 2 - thickness * 2) * zoom.value; // можно добавить zoom, если нужно

        // рисуем квадратную область по центру круга
        ctx.drawImage(
          img,
          sx,
          sy,
          minSide,
          minSide, // обрезка по центру
          cx - targetSize / 2, // x на канвасе
          cy - targetSize / 2, // y на канвасе
          targetSize,
          targetSize // размер на канвасе
        );

        ctx.restore();
      }
      // рамка из 12 сегментов
      const segments = segmentsArr.length;
      const step = (2 * Math.PI) / segments;

      ctx.lineWidth = thickness;
      for (let i = 0; i < segments; i++) {
        const start = i * step - Math.PI / 2; // сдвиг на 90° вверх
        const end = (i + 1) * step - Math.PI / 2;
        ctx.beginPath();
        ctx.strokeStyle = segmentsArr[i].color;
        ctx.arc(cx, cy, radius - thickness / 2, start, end);
        ctx.stroke();
      }
    };

    watch(
      () => store.getters['mobile/clientWidth'],
      (value) => {
        if (value < 600) {
          width.value = mobileWidth;
          height.value = mobileHeight;
        }

        if (value > 1024) {
          width.value = desktopWidth;
          height.value = desktopHeight;
        }
        render();
      },
      { immediate: true }
    );

    const openPopover = () => {
      visiblePopover.value = true;
    };

    const saveToGallery = async () => {
      // сохраняем в Firebase Storage
      if (!isLoadImage) {
        await store.dispatch('toast/addToast', {
          message: 'uploadImage',
          severity: 'warning',
        });
        return;
      }
      isSaveToGallery.value = true;
      visiblePopover.value = false;
      if (isMobile.value) {
        emit('isLoading', true);
      }
      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: canvas.value,
          title: '',
          coloristicType: 'collage',
          maskType: '',
          userId: currentUser.value?.uid,
          paletteType: '',
        }); // вернет URL
      } finally {
        isSaveToGallery.value = false;
        if (isMobile.value) emit('isLoading', false);
      }
    };

    watch(
      () => sharedWithMask.value,
      (value: boolean) => {
        store.dispatch('imageColor/setShareImgMask', {
          share: value,
        });
      }
    );

    watch(
      () => rememberChoose.value,
      (value: boolean) => {
        store.dispatch('imageColor/setRememberImgCollage', {
          remember: value,
        });
      }
    );

    watch(
      () => store.getters['imageColor/imgMask'],
      (file: File) => {
        if (store.getters['imageColor/shareImgCollage']) {
          onFileSelected(file);
        }
      }
    );

    onMounted(() => {
      render();
      if (store.getters['imageColor/rememberImgCollage']) {
        const file = store.getters['imageColor/imgCollage'];
        if (file) {
          onFileSelected(file);
        }
      }
      if (device.value === 'ios') {
        iNoBounce.enable();
      }
    });

    const openImageModal = async () => {
      const url = getCanvasSrc();

      await openDialog(AppImageSignInModal, {
        url,
        coloristicType: 'collage',
        currentUserId: currentUser.value?.uid,
        canvas: canvas.value,
        imageUrl: imageUrl.value,
      });
    };

    const openImageSettingsModal = async () => {
      visiblePopover.value = false;
      const originalFile = store.getters['imageColor/getOriginalImgCollage'];
      let url = null;
      if (originalFile) {
        url = await readFileAsDataURL(originalFile);
      }

      await openDialog(AppImageSettingsModal, {
        imageUrl: url,
      }).then((value) => {
        if (value.originalFile) {
          store.dispatch('imageColor/setOriginalImgCollage', { file: value.originalFile });
        }
        store.dispatch('imageColor/uploadImgCollage', { file: value.file });
        onFileSelected(value.file);
      });
    };
    return {
      canvas,
      saveImage,
      isMobile,
      openPopover,
      visiblePopover,
      t,
      isSaveToGallery,
      saveToGallery,
      sharedWithMask,
      rememberChoose,
      onFileSelected,
      uploader,
      openImageModal,
      openImageSettingsModal,
    };
  },
});
</script>
<style scoped>
.collage-wrapper {
  position: relative;
  height: calc(100dvh - var(--header-height) - var(--tabs-height-with-padding));
  width: 100%;
  background: var(--color-wrap-bg);
  display: flex;
  flex-wrap: wrap;
  padding: 20px;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 10px 5px 5px 5px;
    overflow: auto;
    align-content: flex-start;
  }
}

.collage-container {
  flex: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.buttons:not(.isMobile) {
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .checkbox {
    width: 230px;
    display: flex;
    padding-left: 20px;
  }
}

@media (max-width: 600px) {
  .buttons {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
