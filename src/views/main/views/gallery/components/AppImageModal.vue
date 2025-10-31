<template>
  <div ref="modalRef" class="modal-content neon">
    <!-- Фото -->
    <img :src="images[index].src" alt="" />
    <section class="info-section">
      <div class="info-section-wrapper">
        <!-- Информация -->
        <div class="info">
          <div class="badge-wrapper">
            <span v-if="images[index].maskType" class="badge">{{ images[index].maskType }}</span>
            <span v-if="images[index].coloristicType" class="badge">{{
              images[index].coloristicType
            }}</span>
          </div>
          <div v-if="!isEditTitle" class="info-title">
            <font-awesome-icon
              size="xs"
              :icon="['fas', 'fa-pencil']"
              @click="toggleTitle(images[index].title)"
            />
            <span v-if="images[index].title"> {{ images[index].title }}</span>
          </div>
          <div v-if="isEditTitle" class="edit-title">
            <app-input v-model="sign" :icon="['fas', 'fa-pencil']" :is-label="false"></app-input>
            <div class="edit-title-save-icon">
              <font-awesome-icon size="sm" :icon="['fas', 'undo']" />
            </div>
          </div>
        </div>

        <!-- Действия -->
        <div class="actions">
          <div class="btn">
            <app-button severity="error" :icon="['fas', 'fa-trash']"></app-button>
          </div>
        </div>
      </div>
    </section>

    <div class="close" @click="close">
      <font-awesome-icon size="lg" :icon="['fas', 'fa-times']" />
    </div>
    <div v-if="!isMobile" class="next" @click="next">
      <font-awesome-icon :icon="['fas', 'fa-arrow-right']" />
    </div>
    <div v-if="!isMobile" class="prev" @click="prev">
      <font-awesome-icon :icon="['fas', 'fa-arrow-left']" />
    </div>
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import Hammer from 'hammerjs';
import { useStore } from 'vuex';
import AppInput from '@/shared/components/AppInput.vue';

export default defineComponent({
  components: { AppInput, AppButton },
  props: {
    images: { type: Array, required: true },
    startIndex: { type: Number, required: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const store = useStore();
    const index = ref(props.startIndex);
    const modalRef = ref(null);
    const isEditTitle = ref(false);
    const sign = ref('');
    let hammer = null;

    watch(
      () => props.startIndex,
      (val) => {
        index.value = val;
      }
    );

    const next = () => {
      index.value = (index.value + 1) % props.images.length;
      isEditTitle.value = false;
    };

    const prev = () => {
      index.value = (index.value - 1 + props.images.length) % props.images.length;
      isEditTitle.value = false;
    };

    const close = () => {
      emit('close');
    };

    const toggleTitle = (title) => {
      isEditTitle.value = true;
      sign.value = title;
    };

    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');

    onMounted(() => {
      if (modalRef.value) {
        hammer = new Hammer(modalRef.value);
        hammer.on('swipeleft', next);
        hammer.on('swiperight', prev);
      }
    });

    onUnmounted(() => {
      hammer?.destroy();
    });

    return { index, next, prev, close, modalRef, isMobile, isEditTitle, toggleTitle, sign };
  },
});
</script>

<style scoped>
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
  }
}
.dark .neon {
  /* 🎇 Неоновая подсветка */
  border: 1px solid #0ff;
  box-shadow: 0 0 5px #0ff, 0 0 5px #0ff, 0 0 5px #0ff, 0 0 25px #0ff;
}
.modal-content img {
  max-height: 75%;
  width: 100%;
  max-width: 100%;
  object-fit: contain;
  flex: 1.5;

  @media (max-width: 600px) {
    max-height: 65%;
  }
}
.info-title {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  gap: 10px;
  cursor: pointer;
  height: 24px;
  margin-bottom: 16px;

  & span {
    margin-right: 20px;
  }
}

.badge-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  background: #444;
  color: #fff;
}
.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;

  & .btn {
    width: 150px;
  }
}
.actions button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #555;
  color: white;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
}

.prev,
.next {
  position: absolute;
  padding: 8px 12px;
  cursor: pointer;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
}
.prev {
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
}
.next {
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
}

.info-section {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.info-section-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 📱 Мобильная адаптация */
@media (max-width: 600px) {
  .modal-content {
    width: 98vw;
    padding: 12px;
    flex-direction: column; /* вертикально */
    justify-content: flex-start;
  }

  .badge {
    font-size: 12px;
    padding: 2px 6px;
  }

  .actions {
    & .btn {
      width: 100px;
    }
  }

  .actions button {
    width: 100%;
    font-size: 16px;
    padding: 10px;
  }
}

.edit-title {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;

  & .edit-title-save-icon {
    cursor: pointer;
    position: absolute;
    right: 20px;
    z-index: 100;
    color: black;
  }
  @media (max-width: 600px) {
  }
}
</style>
