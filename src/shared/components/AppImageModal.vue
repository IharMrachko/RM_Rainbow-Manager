<template>
  <div class="modal-backdrop" @click.self="close">
    <div ref="modalRef" class="modal-content">
      <!-- Фото -->
      <img :src="images[index].src" alt="" />
      <section class="info-section">
        <div class="info-section-wrapper">
          <!-- Информация -->
          <div class="info">
            <h3>{{ images[index].title }}</h3>
            <span class="badge">{{ images[index].maskType }}</span>
            <span class="badge">{{ images[index].coloristicType }}</span>
          </div>

          <!-- Действия -->
          <div class="actions">
            <div class="btn">
              <app-button title="Edit"></app-button>
            </div>
            <div class="btn">
              <app-button severity="error" title="Delete"></app-button>
            </div>
          </div>
        </div>
      </section>

      <button class="close" @click="close">✖</button>
      <button class="prev" @click="prev">⟨</button>
      <button class="next" @click="next">⟩</button>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import Hammer from 'hammerjs';

export default defineComponent({
  components: { AppButton },
  props: {
    images: { type: Array, required: true },
    startIndex: { type: Number, required: true },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const index = ref(props.startIndex);
    const modalRef = ref(null);
    let hammer = null;

    watch(
      () => props.startIndex,
      (val) => {
        index.value = val;
      }
    );

    function next() {
      index.value = (index.value + 1) % props.images.length;
    }
    function prev() {
      index.value = (index.value - 1 + props.images.length) % props.images.length;
    }
    function close() {
      emit('close');
    }

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

    return { index, next, prev, close, modalRef };
  },
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  background: #000;
  display: flex;
  flex-direction: column; /* вертикально */
  align-items: center;
  justify-content: flex-start;
  padding: 16px;
  box-sizing: border-box;
}
.modal-content img {
  max-height: 75%;
  width: 100%;
  max-width: 100%;
  object-fit: contain;
  flex: 2;
}
.info {
  color: white;
  text-align: center;
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
button.close,
button.prev,
button.next {
  position: absolute;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 24px;
  padding: 8px 12px;
  cursor: pointer;
}

.close {
  top: 10px;
  right: 10px;
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
    width: 100vw;
    border-radius: 0;
    padding: 12px;
    flex-direction: column; /* вертикально */
    justify-content: flex-start;
  }

  .modal-content img {
    max-height: 50vh; /* картинка занимает верхнюю часть */
    width: 100%;
    object-fit: contain;
  }

  .info {
    margin-top: 12px; /* отступ от картинки */
    text-align: center;
  }

  .info h3 {
    font-size: 16px;
    margin-bottom: 4px;
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
</style>
