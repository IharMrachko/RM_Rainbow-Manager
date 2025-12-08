<template>
  <div class="home-container">
    <div class="welcome-section" style="position: relative; overflow: hidden">
      <img src="../../../assets/rainbow-bg.png" alt="Background photo" class="background-photo" />
      <div class="welcome-text">
        <h1>Welcome to Your Personal Color Guide</h1>
        <p>
          Discover your unique color harmony through smart analysis, intuitive tools, and
          personalized visuals.
        </p>
      </div>
    </div>
    <div class="hui">
      <section class="who-for-section">
        <h2 class="section-title fade-in-down">👥 Who Is This App For?</h2>
        <p class="section-subtitle fade-in-down">
          Discover how this app empowers your color journey.
        </p>

        <ul class="who-for-list">
          <li class="fade-in-left delay-1">
            <span class="marker gradient-1"></span>
            Individuals ready to unlock the power of color in their personal style journey.
          </li>
          <li class="fade-in-left delay-2">
            <span class="marker gradient-2"></span>
            Fashion lovers seeking clarity and confidence in every outfit choice.
          </li>
          <li class="fade-in-left delay-3">
            <span class="marker gradient-3"></span>
            Designers craving palettes that spark creativity and harmony.
          </li>
          <li class="fade-in-left delay-4">
            <span class="marker gradient-4"></span>
            Curious minds exploring the science and emotion behind color aesthetics.
          </li>
        </ul>

        <button class="cta-button fade-in-up">Start Your Color Journey</button>
      </section>
      <section class="instant-photos">
        <h2 class="section-title">📸 Instant Framed Photos</h2>
        <p class="section-subtitle">
          Capture photos directly with elegant frames<br />
          Save to your gallery with custom folder and caption options
        </p>

        <!-- Карусель рамок -->
        <div class="frames-carousel">
          <div class="frame-card">
            <img :src="src" alt="Background photo" class="img-carousel" />
            <!--            {{ frames[currentIndex] }}-->
          </div>
        </div>
      </section>
    </div>
    <div class="hui-2">
      <section class="who-for-section-2">
        <h2 class="section-title fade-in-down">🌈 Palette Explorer</h2>

        <ul class="who-for-list">
          <li class="fade-in-left delay-1">
            <span class="marker gradient-1"></span>
            Select any color from your photo.
          </li>
          <li class="fade-in-left delay-2">
            <span class="marker gradient-2"></span>
            Get optimal matching colors using Chroma.js.
          </li>
          <li class="fade-in-left delay-3">
            <span class="marker gradient-3"></span>
            Build your best palette from five selected tones.
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
    <div class="hui">
      <section class="who-for-section">
        <h2 class="section-title fade-in-down">🤖 AI Color Assistant</h2>
        <ul class="who-for-list">
          <li class="fade-in-left delay-1">
            <span class="marker gradient-1"></span>
            Ask questions, get guidance, and explore seasonal palettes.
          </li>
          <li class="fade-in-left delay-2">
            <span class="marker gradient-2"></span>
            Learn which color types suit your undertones and preferences.
          </li>
          <li class="fade-in-left delay-3">
            <span class="marker gradient-3"></span>
            Learn which color types suit your undertones and preferences.
          </li>
        </ul>
        <section class="video-section">
          <video class="video-bg" autoplay muted loop playsinline>
            <source src="../../../assets/ai.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </section>
      </section>
      <section class="gallery-section">
        <h2 class="section-title">🖼️ Your Gallery</h2>
        <p class="section-subtitle">Organize, explore, and relive your memories with ease.</p>

        <div class="gallery-cards">
          <div class="gallery-card fade-in-left delay-1">
            <span class="">
              <font-awesome-icon size="lg" :icon="['fas', 'folder']" />
              All your saved photos in one place
            </span>
            <!--            <p>All your saved photos in one place</p>-->
          </div>
          <div class="gallery-card fade-in-left delay-2">
            <span class="">
              <font-awesome-icon size="lg" :icon="['fas', 'search']" />
              Search and filter by palette type, tags, or date
            </span>
            <!--            <p>Search and filter by palette type, tags, or date</p>-->
          </div>
          <div class="gallery-card fade-in-left delay-3">
            <span class="">
              <font-awesome-icon size="lg" :icon="['fas', 'lock']" />Stored securely via Firebase
            </span>
            <!--            <p>Stored securely via Firebase</p>-->
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

        <button class="cta-button fade-in-up">Open Gallery</button>
      </section>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue';
import AppColorPicker from '@/shared/components/AppColorPicker.vue';
import { palettesObj } from '@/views/main/views/palette/palette';
import AppPalette from '@/shared/components/AppPalette.vue';

export default defineComponent({
  components: { AppPalette, AppColorPicker },
  setup() {
    const frames = ['Classic', 'Minimal', 'Classic', 'Minimal', 'Classic', 'Minimal', 'Minimal'];
    const palettesImg = [
      'Classic',
      'Minimal',
      'Classic',
      'Minimal',
      'Classic',
      'Minimal',
      'Minimal',
      'Minimal',
      'Classic',
      'Minimal',
      'Classic',
      'Minimal',
    ];
    const currentIndex = ref(0);
    const currentPaletteIndex = ref(0);
    const palettes: { segments: { color: string }[] }[] = Object.entries(palettesObj).map(
      ([_, value]) => ({
        segments: value.map((it) => ({ color: it })),
      })
    );
    let intervalId: number;

    onMounted(() => {
      intervalId = setInterval(() => {
        currentIndex.value = (currentIndex.value + 1) % frames.length;
        currentPaletteIndex.value = (currentPaletteIndex.value + 1) % palettesImg.length;
      }, 3000);
    });

    onUnmounted(() => {
      clearInterval(intervalId);
    });

    const src = computed(() => require(`@/assets/buba-${currentIndex.value}.png`));

    const srcPalette = computed(() => require(`@/assets/buba-c-${currentPaletteIndex.value}.png`));
    const palette = computed(() => {
      return palettes[currentPaletteIndex.value];
    });
    return {
      frames,
      currentIndex,
      src,
      srcPalette,
      palette,
    };
  },
});
</script>
<style scoped>
.home-container {
  overflow: auto;
  height: calc(100dvh);
  background: var(--color-wrap-bg);
  overscroll-behavior-y: contain; /* снижает bounce */
  -webkit-overflow-scrolling: touch; /* плавность на iOS */
  overflow-anchor: none; /* отключить scroll anchoring */

  /* Скрыть скроллбар в разных браузерах */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
  overscroll-behavior: contain; /* или none */

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

.welcome-text {
  position: relative;
  z-index: 2;
  max-width: 600px;
  animation: fadeInUp 1s ease forwards;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.who-for-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  flex: 1;
  margin: 0 auto;
  padding: 2rem;
  background: var(--color-wrap-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: left;
  @media (max-width: 600px) {
    max-width: 340px;
    padding: 0;
  }
}

.who-for-section-2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 800px;
  flex: 1;
  margin: 0 auto;
  padding: 2rem;
  text-align: left;
  @media (max-width: 600px) {
    max-width: 340px;
    padding: 0;
  }
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #333;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #666;
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
  color: #555;
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

.cta-button {
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.cta-button:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
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

/* Responsive */
@media (max-width: 600px) {
  .who-for-section {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 1rem;
  }
}

.instant-photos {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background: var(--color-wrap-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (max-width: 600px) {
    max-width: 340px;
  }
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #333;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}

.frames-carousel {
  display: flex;
  gap: 1rem;
  scroll-snap-type: x mandatory;
  padding-bottom: 1rem;
  justify-content: center;
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

.hui {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  gap: 10px;
}

.hui-2 {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  gap: 10px;
  background: var(--color-wrap-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 10px;
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

.gallery-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  flex: 1;
  background: var(--color-wrap-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #333;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.gallery-cards {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  margin-bottom: 2rem;
}

.gallery-card {
  flex: 1;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.gallery-card:hover {
  transform: translateY(-5px);
}

.marker {
  display: inline-block;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.gradient-1 {
  color: #ff6b6b;
}

.gradient-2 {
  color: #2575fc;
}

.gradient-3 {
  color: #38ef7d;
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

.cta-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.cta-button:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
}

/* Animations */
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
  height: 508px;
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

.video-overlay {
  position: relative;
  z-index: 1;
  color: white;
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.3); /* лёгкий затемняющий слой для читаемости текста */
  border-radius: 12px;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
}

.section-subtitle {
  font-size: 1.1rem;
  line-height: 1.5;
}

.video-wrapper {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>
