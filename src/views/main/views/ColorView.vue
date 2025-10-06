<template>
  <div class="color-container">
    <div class="color-wrapper">
      <section class="selected">
        <div class="card">
          <div class="card-number">1</div>
          <div class="segments">
            <div class="segment" style="background-color: #ff6b6b"></div>
            <div class="segment" style="background-color: #feca57"></div>
            <div class="segment" style="background-color: #48dbfb"></div>
            <div class="segment" style="background-color: #1dd1a1"></div>
            <div class="segment" style="background-color: #5f27cd"></div>
            <div class="segment" style="background-color: #ff9ff3"></div>
            <div class="segment" style="background-color: #54a0ff"></div>
            <div class="segment" style="background-color: #00d2d3"></div>
            <div class="segment" style="background-color: #ffb142"></div>
            <div class="segment" style="background-color: #10ac84"></div>
            <div class="segment" style="background-color: #ee5253"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-number">1</div>
          <div class="segments">
            <div class="segment" style="background-color: #ff6b6b"></div>
            <div class="segment" style="background-color: #feca57"></div>
            <div class="segment" style="background-color: #48dbfb"></div>
            <div class="segment" style="background-color: #1dd1a1"></div>
            <div class="segment" style="background-color: #5f27cd"></div>
            <div class="segment" style="background-color: #ff9ff3"></div>
            <div class="segment" style="background-color: #54a0ff"></div>
            <div class="segment" style="background-color: #00d2d3"></div>
            <div class="segment" style="background-color: #ffb142"></div>
            <div class="segment" style="background-color: #10ac84"></div>
            <div class="segment" style="background-color: #ee5253"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-number">1</div>
          <div class="segments">
            <div class="segment" style="background-color: #ff6b6b"></div>
            <div class="segment" style="background-color: #feca57"></div>
            <div class="segment" style="background-color: #48dbfb"></div>
            <div class="segment" style="background-color: #1dd1a1"></div>
            <div class="segment" style="background-color: #5f27cd"></div>
            <div class="segment" style="background-color: #ff9ff3"></div>
            <div class="segment" style="background-color: #54a0ff"></div>
            <div class="segment" style="background-color: #00d2d3"></div>
            <div class="segment" style="background-color: #ffb142"></div>
            <div class="segment" style="background-color: #10ac84"></div>
            <div class="segment" style="background-color: #ee5253"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-number">1</div>
          <div class="segments">
            <div class="segment" style="background-color: #ff6b6b"></div>
            <div class="segment" style="background-color: #feca57"></div>
            <div class="segment" style="background-color: #48dbfb"></div>
            <div class="segment" style="background-color: #1dd1a1"></div>
            <div class="segment" style="background-color: #5f27cd"></div>
            <div class="segment" style="background-color: #ff9ff3"></div>
            <div class="segment" style="background-color: #54a0ff"></div>
            <div class="segment" style="background-color: #00d2d3"></div>
            <div class="segment" style="background-color: #ffb142"></div>
            <div class="segment" style="background-color: #10ac84"></div>
            <div class="segment" style="background-color: #ee5253"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-number">1</div>
          <div class="segments">
            <div class="segment" style="background-color: #ff6b6b"></div>
            <div class="segment" style="background-color: #feca57"></div>
            <div class="segment" style="background-color: #48dbfb"></div>
            <div class="segment" style="background-color: #1dd1a1"></div>
            <div class="segment" style="background-color: #5f27cd"></div>
            <div class="segment" style="background-color: #ff9ff3"></div>
            <div class="segment" style="background-color: #54a0ff"></div>
            <div class="segment" style="background-color: #00d2d3"></div>
            <div class="segment" style="background-color: #ffb142"></div>
            <div class="segment" style="background-color: #10ac84"></div>
            <div class="segment" style="background-color: #ee5253"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-number">1</div>
          <div class="segments">
            <div class="segment" style="background-color: #ff6b6b"></div>
            <div class="segment" style="background-color: #feca57"></div>
            <div class="segment" style="background-color: #48dbfb"></div>
            <div class="segment" style="background-color: #1dd1a1"></div>
            <div class="segment" style="background-color: #5f27cd"></div>
            <div class="segment" style="background-color: #ff9ff3"></div>
            <div class="segment" style="background-color: #54a0ff"></div>
            <div class="segment" style="background-color: #00d2d3"></div>
            <div class="segment" style="background-color: #ffb142"></div>
            <div class="segment" style="background-color: #10ac84"></div>
            <div class="segment" style="background-color: #ee5253"></div>
          </div>
        </div>
      </section>
      <section class="editor">
        <app-editor-canvas
          v-model:image-url="imageUrl"
          :size="size"
          :thickness="thickness"
          :segments="frameColors"
          :zoom="zoom"
          :rotation="rotation"
          :filter="filter"
          :offset-x="offsetX"
          :offset-y="offsetY"
        ></app-editor-canvas>
      </section>
      <section class="buttons">
        <app-file-uploader @select="onFileSelected"></app-file-uploader>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import AppEditorCanvas from '@/shared/components/AppEditorCanvas.vue';
import AppFileUploader from '@/shared/components/AppFileUploader.vue';

export default defineComponent({
  components: {
    AppEditorCanvas,
    AppFileUploader,
  },
  setup() {
    const windowWidth = ref(document.documentElement.clientWidth);

    function updateWidth() {
      windowWidth.value = document.documentElement.clientWidth;
    }

    onMounted(() => {
      window.addEventListener('resize', updateWidth);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateWidth);
    });

    // вычисляем size и thickness в зависимости от ширины
    const size = computed(() => {
      if (windowWidth.value < 600) return 300;
      if (windowWidth.value < 1024) return 450;
      return 550;
    });

    const thickness = computed(() => {
      if (windowWidth.value < 600) return 50;
      if (windowWidth.value < 1024) return 80;
      return 100;
    });

    const zoom = ref(1);
    const rotation = ref(0);
    const filter = ref('none');
    const cropMode = ref(false);
    const offsetX = ref(0);
    const offsetY = ref(0);
    const frameColors = ref([
      { color: '#979DAF' },
      { color: '#C21E56' },
      { color: '#F3ED7C' },
      { color: '#155DA4' },
      { color: '#008684' },
      { color: '#E5ADD5' },
      { color: '#D0417E' },
      { color: '#E7B8D3' },
      { color: '#FFFFFF' },
      { color: '#34373B' },
      { color: '#BA397B' },
    ]);
    const imageUrl = ref<string | null>(null);

    function onFileSelected(file: File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageUrl.value = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }

    return {
      size,
      thickness,
      zoom,
      rotation,
      filter,
      cropMode,
      offsetX,
      offsetY,
      frameColors,
      imageUrl,
      onFileSelected,
    };
  },
});
</script>

<style scoped>
.color-container {
  padding: 10px 20px;
  max-height: calc(100vh - var(--header-height));
  overflow: auto;

  & .color-wrapper {
    padding: 20px;
    display: flex;
    width: 100%;
    height: 100%;
    flex-wrap: wrap;
    background: var(--color-wrap-bg);
    border-radius: 10px;
    gap: 20px;

    & .selected {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-content: flex-start;
      align-items: flex-start; /* вместо center */
      justify-content: center; /* оставляем центрирование по горизонтали */
    }

    & .editor {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 2;
    }

    & .buttons {
      flex: 1;
      display: flex;
      align-items: start;
      justify-content: right;
    }
  }
}

.card {
  position: relative;
  width: 100px;
  height: 150px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px); /* лёгкий blur */
  cursor: pointer;
  transition: all 0.2s ease;
}

/* планшеты */
@media (max-width: 1024px) {
  .card {
    width: 60px;
    height: 120px;
  }
}

/* телефоны */
@media (max-width: 600px) {
  .card {
    width: 85px;
    height: 100px;
  }
}

@media (max-width: 600px) {
  .color-container .color-wrapper .buttons {
    justify-content: center;
  }
}

.segments {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.segment {
  flex: 1; /* все 11 равные по высоте */
  opacity: 0.8; /* лёгкая прозрачность для эффекта */
}

.card-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 72px; /* крупнее */
  font-weight: 900; /* максимально жирный */
  color: #fff; /* чисто белый */
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), /* мягкое свечение */ 0 2px 6px rgba(0, 0, 0, 0.7),
    /* глубокая тень */ 0 0 12px rgba(0, 0, 0, 0.9); /* дополнительная чёткость */
  letter-spacing: 2px; /* чуть больше воздуха */
  pointer-events: none;
}
</style>
