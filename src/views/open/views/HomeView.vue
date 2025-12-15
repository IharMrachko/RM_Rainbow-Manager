<template>
  <div class="home-container">
    <div class="welcome-section">
      <img src="../../../assets/rainbow-bg.png" alt="Background photo" class="background-photo" />
      <div class="welcome-text">
        <h1>{{ t('welcomeText') }}</h1>
        <p class="welcomeSubText">{{ t('welcomeSubText') }}</p>
      </div>
    </div>
    <div class="section-wrapper">
      <section class="who-for-section">
        <h2 class="section-title fade-in-down">👥 {{ t('whoIsThisAppFor') }}</h2>
        <p class="section-subtitle fade-in-down">
          {{ t('discoverColorText') }}
        </p>
        <p class="section-subtitle fade-in-down">
          {{ t('canInstall') }}
          <strong>Progressive Web App (PWA)</strong>. {{ t('detailInstructions') }}
          <router-link class="txt2" :to="{ name: 'FAQ' }">{{ t('FAQ') }} </router-link>
        </p>

        <ul class="who-for-list">
          <li class="fade-in-left delay-1">
            <span class="marker gradient-1"></span>
            {{ t('individualReadyText') }}
          </li>
          <li class="fade-in-left delay-2">
            <span class="marker gradient-2"></span>
            {{ t('fashionLoversText') }}
          </li>
          <li class="fade-in-left delay-3">
            <span class="marker gradient-3"></span>
            {{ t('designersCravingText') }}
          </li>
          <li class="fade-in-left delay-4">
            <span class="marker gradient-4"></span>
            {{ t('curiosMindText') }}
          </li>
        </ul>

        <div class="btn fade-in-up">
          <app-button
            severity="gradient"
            gradient
            title="getStarted"
            @click="getStarted"
          ></app-button>
        </div>
      </section>
      <section class="who-for-section">
        <h2 class="section-title">📸 {{ t('instantFramedPhotos') }}</h2>
        <p class="section-subtitle">
          {{ t('capturePhotoText') }}
        </p>

        <div class="frames-carousel">
          <div class="frame-card">
            <img :src="src" alt="Background photo" class="img-carousel" />
          </div>
        </div>
      </section>
    </div>
    <div class="palette-explore">
      <section class="palette-explore-section">
        <h2 class="section-title fade-in-down">🌈 {{ t('paletteExplorerText') }}</h2>

        <ul class="who-for-list">
          <li class="fade-in-left delay-1">
            <span class="marker gradient-1"></span>
            {{ t('selectAnyColorsText') }}
          </li>
          <li class="fade-in-left delay-2">
            <span class="marker gradient-2"></span>
            {{ t('optionalColorChromaText') }}
          </li>
          <li class="fade-in-left delay-3">
            <span class="marker gradient-3"></span>
            {{ t('buildPaletteText') }}
          </li>
        </ul>
        <div class="palettes">
          <div class="frames-carousel">
            <div class="frame-card">
              <img :src="srcPalette" alt="Background photo" class="img-carousel" />
            </div>
          </div>
          <app-palette :item="palette"></app-palette>
        </div>
      </section>
      <div class="picker">
        <app-color-picker :hex-p="selectedHex"></app-color-picker>
      </div>
    </div>
    <div class="section-wrapper">
      <section class="who-for-section">
        <h2 class="section-title fade-in-down">🤖 {{ t('aiAgent') }}</h2>
        <ul class="who-for-list">
          <li class="fade-in-left delay-1">
            <span class="marker gradient-1"></span>
            {{ t('askQuestionAiText') }}
          </li>
          <li class="fade-in-left delay-2">
            <span class="marker gradient-2"></span>
            {{ t('learnPreferColorText') }}
          </li>
          <li class="fade-in-left delay-3">
            <span class="marker gradient-3"></span>
            {{ t('afterAllText') }}
          </li>
        </ul>
        <section class="video-section">
          <video class="video-bg" autoplay muted loop playsinline :src="srcVideo">
            Your browser does not support the video tag.
          </video>
        </section>
      </section>
      <section class="who-for-section">
        <h2 class="section-title">🖼️ {{ t('yourGallery') }}</h2>
        <p class="section-subtitle">{{ t('organizeGalleryText') }}</p>

        <div class="gallery-cards">
          <div class="gallery-card fade-in-left delay-1">
            <div class="icon"><font-awesome-icon size="lg" :icon="['fas', 'folder']" /></div>
            <span>
              {{ t('allYourPhotoText') }}
            </span>
          </div>
          <div class="gallery-card fade-in-left delay-2">
            <div class="icon"><font-awesome-icon size="lg" :icon="['fas', 'search']" /></div>
            <span>
              {{ t('searchGalleryText') }}
            </span>
          </div>
          <div class="gallery-card fade-in-left delay-3">
            <div class="icon"><font-awesome-icon size="lg" :icon="['fas', 'lock']" /></div>
            <span>{{ t('storedText') }} </span>
          </div>
        </div>

        <div class="gallery-preview">
          <img src="../../../assets/buba-0.png" alt="Preview 1" />
          <img src="../../../assets/buba-1.png" alt="Preview 2" />
          <img src="../../../assets/buba-c-0.png" alt="Preview 3" />
          <img src="../../../assets/buba-0.png" alt="Preview 1" />
          <img src="../../../assets/buba-1.png" alt="Preview 2" />
          <img src="../../../assets/buba-c-0.png" alt="Preview 3" />
          <img src="../../../assets/buba-0.png" alt="Preview 1" />
          <img src="../../../assets/buba-1.png" alt="Preview 2" />
          <img src="../../../assets/buba-c-0.png" alt="Preview 3" />
          <img src="../../../assets/buba-0.png" alt="Preview 1" />
          <img src="../../../assets/buba-1.png" alt="Preview 2" />
          <img src="../../../assets/buba-c-0.png" alt="Preview 3" />
        </div>

        <div class="btn fade-in-up">
          <app-button
            severity="gradient"
            gradient
            title="getStarted"
            @click="getStarted"
          ></app-button>
        </div>
      </section>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import AppColorPicker from '@/shared/components/AppColorPicker.vue';
import { palettesObj } from '@/views/main/views/palette/palette';
import AppPalette from '@/shared/components/AppPalette.vue';
import { useI18n } from 'vue-i18n';
import AppButton from '@/shared/components/AppButton.vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default defineComponent({
  components: { AppButton, AppPalette, AppColorPicker },
  setup() {
    const store = useStore();
    const { t } = useI18n();
    const frames = new Array(7);
    const router = useRouter();
    const palettesImg = new Array(12);
    const currentIndex = ref(0);
    const currentPaletteIndex = ref(0);
    const theme = computed(() => store.getters['theme/theme']);
    const language = computed(() => store.getters['language/language']);
    let intervalId: number;
    const palettes: { segments: { color: string }[] }[] = Object.entries(palettesObj).map(
      ([_, value]) => ({
        segments: value.map((it) => ({ color: it })),
      })
    );
    const src = computed(() => require(`@/assets/buba-${currentIndex.value}.png`));
    const srcVideo = computed(() => require(`@/assets/ai-${theme.value}-${language.value}.mp4`));

    const srcPalette = computed(() => require(`@/assets/buba-c-${currentPaletteIndex.value}.png`));
    const palette = computed(() => {
      return palettes[currentPaletteIndex.value];
    });

    onMounted(() => {
      intervalId = setInterval(() => {
        currentIndex.value = (currentIndex.value + 1) % frames.length;
        currentPaletteIndex.value = (currentPaletteIndex.value + 1) % palettesImg.length;
      }, 3000);
    });

    onUnmounted(() => {
      clearInterval(intervalId);
    });

    const getStarted = async () => {
      await router.push('/signUp');
    };

    return {
      frames,
      currentIndex,
      src,
      srcPalette,
      palette,
      t,
      getStarted,
      srcVideo,
    };
  },
});
</script>
<style scoped lang="scss">
@import '@/styles/style';
.home-container {
  overflow: auto;
  height: 100dvh;
  background: var(--color-wrap-bg);
  overscroll-behavior-y: contain; /* снижает bounce */
  -webkit-overflow-scrolling: touch; /* плавность на iOS */
  overflow-anchor: none; /* отключить scroll anchoring */

  /* Скрыть скроллбар в разных браузерах */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
  overscroll-behavior: contain; /* или none */
  padding-bottom: var(--header-height);
  &::-webkit-scrollbar {
    /* Chrome, Safari, Opera */
    display: none;
  }
}

.welcome-section {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;

  & .welcome-text {
    position: relative;
    z-index: 2;
    max-width: 600px;
    animation: fadeInUp 1s ease forwards;
  }

  & .welcomeSubText {
    padding: 0 10px;
  }
}

.background-photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.5);
  z-index: 1;
}

.who-for-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  flex: 1;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: left;
  @media (max-width: 600px) {
    padding: 0;
  }
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--color-sub-text);
  margin-bottom: 1.5rem;
}

.who-for-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.who-for-list li {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  padding-left: 2.5rem;
  position: relative;
  color: var(--color-li);
}

.marker {
  position: absolute;
  left: 0;
  top: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.marker:hover {
  transform: scale(1.2);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 600px) {
  .who-for-section {
    padding: 1rem;
    border-radius: 0;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }
}

.frames-carousel {
  display: flex;
  gap: 1rem;
  scroll-snap-type: x mandatory;
  padding-bottom: 1rem;
  justify-content: center;

  @media (max-width: 600px) {
    width: 100%;
  }
}

.frame-card {
  flex: 0 0 auto;
  min-width: 300px;
  max-width: 340px;
  height: 300px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  scroll-snap-align: start;
  transition: transform 0.3s ease;

  & .img-carousel {
    width: inherit;
    height: inherit;
    object-fit: contain;
  }
}

.frame-card:hover {
  transform: scale(1.05);
}

.section-wrapper {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  gap: 10px;
  background: var(--color-wrap-bg);

  @media (max-width: 600px) {
    padding: 0;
    gap: 0;
  }
}

.dark .who-for-section,
.dark .palette-explore {
  border: 1px solid var(--active-doing);

  @media (max-width: 600px) {
    border: none;
    border-bottom: 1px solid var(--active-doing);
  }
}

.palette-explore {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  gap: 10px;
  background: var(--color-wrap-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 10px;

  @media (max-width: 600px) {
    margin: 0;
    border-radius: 0;
  }

  .palette-explore-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 800px;
    flex: 1;
    margin: 0 auto;
    padding: 2rem;
    text-align: left;
    @media (max-width: 600px) {
      padding: 0;
    }
  }
}

.picker {
  flex: 1;
}

.palettes {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  width: 100%;
}

.gallery-cards {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 2rem;
}

.gallery-card {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
  border: 1px solid map-get($type-colors, success);

  & .icon {
    margin-right: 10px;
  }
  @media (max-width: 600px) {
    & span {
      font-size: 12px;
    }
  }
}

.gallery-card:hover {
  transform: translateY(-5px);
}

.marker {
  display: inline-block;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.gallery-preview {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.gallery-preview img {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.gallery-preview img:hover {
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 600px) {
  .gallery-cards {
    flex-direction: column;
  }

  .gallery-preview img {
    width: 80px;
    height: 80px;
  }
}

.video-section {
  margin-top: 20px;
  position: relative;
  height: 507px;
  width: 253px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-radius: 12px;

  @media (max-width: 600px) {
    width: 250px;
  }
}

.video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* заполняет контейнер */
  z-index: 0;
}

/* Gradients */
.gradient-1 {
  background: linear-gradient(45deg, #ff6b6b, #f7d794);
}
.gradient-2 {
  background: linear-gradient(45deg, #6a11cb, #2575fc);
}
.gradient-3 {
  background: linear-gradient(45deg, #f7971e, #ffd200);
}
.gradient-4 {
  background: linear-gradient(45deg, #11998e, #38ef7d);
}

/* Animations */
.fade-in-down {
  animation: fadeInDown 0.8s ease forwards;
}
.fade-in-left {
  animation: fadeInLeft 0.8s ease forwards;
}
.fade-in-up {
  animation: fadeInUp 0.8s ease forwards;
}

.delay-1 {
  animation-delay: 0.2s;
}
.delay-2 {
  animation-delay: 0.4s;
}
.delay-3 {
  animation-delay: 0.6s;
}
.delay-4 {
  animation-delay: 0.8s;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

a {
  font-size: 18px;
  line-height: 1.7;
  color: #666666;
  margin: 0;
  text-decoration: none;
  transition: all 0.4s;
  -webkit-transition: all 0.4s;
  -o-transition: all 0.4s;
  -moz-transition: all 0.4s;
}

a:hover {
  color: #57b846;
}
</style>
