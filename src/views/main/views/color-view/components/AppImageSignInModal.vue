<template>
  <div ref="modalRef" class="modal-content neon">
    <!-- Фото -->
    <img :src="url" alt="" />
    <section class="info-section">
      <div class="info-section-wrapper">
        <div class="badge-wrapper">
          <span v-if="coloristicType" class="badge">{{ coloristicType }}</span>
          <span v-if="maskType" class="badge">{{ maskType }}</span>
        </div>

        <!-- Информация -->
        <div class="info">
          <app-input v-model="signIn" :icon="['fas', 'fa-pencil']" :is-label="false"></app-input>
        </div>

        <!-- Действия -->
        <div class="actions">
          <div class="btn">
            <app-button severity="info" title="Add folder"></app-button>
          </div>
          <div class="btn">
            <app-button
              :loading="isSaveToGallery"
              severity="warning"
              title="saveToGallery"
              @click="saveToGallery"
            ></app-button>
          </div>
        </div>
      </div>
    </section>
    <div class="close" @click="close">
      <font-awesome-icon size="lg" :icon="['fas', 'fa-times']" />
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { string } from 'yup';
import AppButton from '@/shared/components/AppButton.vue';
import AppInput from '@/shared/components/AppInput.vue';
import { useStore } from 'vuex';
import { MaskType } from '@/types/mask.type';

import { ColoristicType } from '@/types/coloristic.type';

export default defineComponent({
  components: { AppInput, AppButton },
  props: {
    url: string,
    coloristicType: {
      type: String as PropType<ColoristicType>,
      default: '',
    },
    maskType: {
      type: String as PropType<MaskType>,
      default: '',
    },
    canvas: HTMLCanvasElement,
    currentUserId: string,
  },
  emits: ['resolve', 'reject', 'close'],
  setup(props, { emit }) {
    const store = useStore();
    const signIn = ref('');
    const isSaveToGallery = ref(false);
    const close = () => {
      emit('close');
    };

    const saveToGallery = async () => {
      if (!props.canvas) return;
      isSaveToGallery.value = true;

      try {
        await store.dispatch('gallery/saveImageToGallery', {
          canvas: props.canvas,
          title: signIn.value,
          coloristicType: props.coloristicType,
          maskType: props.maskType,
          userId: props.currentUserId,
        }); // возвращает URL
        emit('close');
      } finally {
        isSaveToGallery.value = false;
      }
    };
    return {
      close,
      signIn,
      saveToGallery,
      isSaveToGallery,
    };
  },
});
</script>
<style scoped lang="scss">
.modal-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: var(--color-wrap-bg);
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  padding: 16px;
  border-radius: 20px;

  border: 1px solid #c5c5c5;
  box-shadow: 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 5px #c5c5c5, 0 0 25px #c5c5c5;

  @media (max-width: 600px) {
    width: 98vw;
    height: auto;
  }
}

.dark .neon {
  /* 🎇 Неоновая подсветка */
  border: 1px solid #0ff;
  box-shadow: 0 0 5px #0ff, 0 0 5px #0ff, 0 0 5px #0ff, 0 0 25px #0ff;
}
.modal-content img {
  max-height: 60%;
  width: 100%;
  max-width: 100%;
  object-fit: contain;
}
.info {
  color: white;
  text-align: center;
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #444;
  color: #fff;
  width: 100px;
  text-align: center;
}

.close {
  position: absolute;
  padding: 8px 12px;
  cursor: pointer;
  top: 10px;
  right: 10px;
}

.info-section {
  margin-top: 20px;
  width: 300px;
  margin-bottom: 10px;

  & .info-section-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
