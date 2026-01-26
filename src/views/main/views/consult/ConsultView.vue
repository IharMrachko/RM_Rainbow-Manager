<template>
  <section class="color-consultation">
    <!-- Заголовок -->
    <div class="title-wrapper">
      <h2 class="title">
        <span class="title-icon">🎨</span>
        {{ t('revealYourInherentElegance') }}
      </h2>
    </div>

    <!-- Вступление -->
    <div class="intro-card">
      <div class="intro-content">
        <p class="intro-text">
          <strong> {{ t('haveYouEverContemplated') }}</strong> {{ t('whyCertainHues') }}
        </p>
        <p class="intro-text">
          {{ t('greedy') }}
        </p>
        <p class="intro-text highlight">
          <font-awesome-icon :icon="['fas', 'bullseye']" class="icon" />
          {{ t('myGoal') }}
        </p>
      </div>
      <div class="intro-image">
        <div class="color-wheel"></div>
      </div>
    </div>

    <!-- Преимущества -->
    <div class="benefits-section">
      <div class="benefits-title-wrapper">
        <h3 class="benefits-title">
          <font-awesome-icon :icon="['fas', 'gift']" />
          {{ t('whatWilGain') }}
        </h3>
      </div>

      <div class="benefits-grid">
        <div class="benefit-card">
          <div class="benefit-icon">
            <font-awesome-icon :icon="['fas', 'piggy-bank']" />
          </div>
          <div class="benefit-content">
            <h4>{{ t('recoveredTime') }}</h4>
            <p>{{ t('youWillCeaseAcquiring') }}</p>
          </div>
        </div>

        <div class="benefit-card">
          <div class="benefit-icon">
            <font-awesome-icon :icon="['fas', 'check-double']" />
          </div>
          <div class="benefit-content">
            <h4>{{ t('assuredSelection') }}</h4>
            <p>
              {{ t('youWillPossessPreciseClarity') }}
            </p>
          </div>
        </div>

        <div class="benefit-card">
          <div class="benefit-icon">
            <font-awesome-icon :icon="['fas', 'palette']" />
          </div>
          <div class="benefit-content">
            <h4>{{ t('cohesiveHarmonious') }}</h4>
            <p>
              {{ t('youWillAppearMore') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Призыв к действию -->
    <div class="cta-section">
      <div class="cta-card">
        <div class="cta-content">
          <div class="cta-title-wrapper">
            <h3 class="cta-title">
              {{ t('bidFarewell') }}
            </h3>
          </div>
          <div class="cta-title-wrapper">
            <p class="cta-text">
              {{ t('togetherWeWillDiscover') }}
              <span class="highlight-text">💯</span>
            </p>
          </div>

          <div class="action-buttons">
            <app-button
              :severity="'secondary'"
              raised
              :icon="['fas', 'eye']"
              title="demoLookbook"
              @click="openPdfModal"
            >
            </app-button>
            <app-button
              :severity="'secondary'"
              raised
              :icon="['fab', 'telegram']"
              title="connectViaTelegram"
              @click="openTelegram"
            >
            </app-button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppButton from '@/shared/components/AppButton.vue';
import { useI18n } from 'vue-i18n';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppPdfPreview from '@/shared/components/AppPdfPreview.vue';

export default defineComponent({
  components: { AppButton },
  setup() {
    const { t } = useI18n();

    const openTelegram = () => {
      const contacts = {
        telegram: '@Yuliyaa_S',
      };

      try {
        // Проверяем, установлен ли Telegram на устройстве
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
          // Для мобильных пробуем открыть приложение
          window.location.href = `tg://resolve?domain=${contacts.telegram.replace('@', '')}`;

          // Если приложение не установлено, откроется браузер
          setTimeout(() => {
            window.open(`https://t.me/${contacts.telegram.replace('@', '')}`, '_blank');
          }, 500);
        } else {
          // Для десктопа сразу в браузер
          window.open(`https://t.me/${contacts.telegram.replace('@', '')}`, '_blank');
        }
      } catch (error) {
        console.error('Error opening Telegram:', error);
        // Резервный вариант
        window.open(`https://t.me/${contacts.telegram.replace('@', '')}`, '_blank');
      }
    };
    const openPdfModal = () => {
      openDialog(AppPdfPreview, {});
    };
    return {
      openTelegram,
      t,
      openPdfModal,
    };
  },
});
</script>

<style scoped>
.color-consultation {
  padding: 20px;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  height: calc(100dvh - var(--header-height));
  background: var(--color-wrap-bg);
  display: flex;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    padding: 0 0 60px 0;
    height: 100dvh;
    overflow: auto;
  }
}

/* Заголовок */
.title-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  background: var(--color-wrap-bg);
  @media (max-width: 600px) {
    margin-top: 15px;
  }

  & .title {
    text-align: center;
    font-size: 2.5rem;
    color: var(--color-text);
    margin-bottom: 50px;
    position: relative;
    padding-bottom: 20px;

    @media (max-width: 600px) {
      font-size: 20px;
      margin-bottom: 0;
      padding-left: 15px;
      padding-right: 15px;
    }

    & .title-icon {
      margin-right: 15px;
      font-size: 2.8rem;
      vertical-align: middle;

      @media (max-width: 600px) {
        font-size: 20px;
      }
    }
  }

  .title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
    border-radius: 2px;
  }
}

/* Вступление */
.intro-card {
  display: flex;
  gap: 40px;
  background: var(--color-wrap-bg);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 50px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.intro-content {
  flex: 1;
}

.intro-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: 20px;

  @media (max-width: 600px) {
    font-size: 0.9rem;
  }
}

.intro-text.highlight {
  background: linear-gradient(90deg, #fff5f5, #ffffff);
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #ff6b6b;
  font-weight: 600;
  color: #2d3436;
}

.intro-text.highlight .icon {
  color: #ff6b6b;
  margin-right: 10px;
}

.intro-image {
  flex: 0 0 300px;
}

.color-wheel {
  width: 300px;
  height: 300px;
  background: conic-gradient(
    from 0deg,
    #ff6b6b,
    #ffd166,
    #06d6a0,
    #118ab2,
    #9b5de5,
    #f15bb5,
    #ff6b6b
  );
  border-radius: 50%;
  position: relative;
  animation: rotate 20s linear infinite;
}

.color-wheel::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Преимущества */
.benefits-section {
  width: 100%;
  margin-bottom: 50px;
  @media (max-width: 600px) {
    margin-bottom: 0;
    padding: 15px;
  }
}

.benefits-title-wrapper {
  display: flex;
  justify-content: center;
  @media (max-width: 600px) {
    padding: 15px;
  }
}

.benefits-title {
  font-size: 1.8rem;
  color: var(--color-text);
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 600px) {
    font-size: 20px;
  }
}

.benefits-title svg {
  color: #ff6b6b;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.benefit-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  @media (max-width: 600px) {
    padding: 15px;
  }
}

.benefit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.benefit-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;

  @media (max-width: 600px) {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

.benefit-card:nth-child(2) .benefit-icon {
  background: linear-gradient(135deg, #4ecdc4, #6ce5e0);
}

.benefit-card:nth-child(3) .benefit-icon {
  background: linear-gradient(135deg, #9b5de5, #b388ff);
}

.benefit-content h4 {
  font-size: 1.2rem;
  color: #2d3436;
  margin-bottom: 10px;

  @media (max-width: 600px) {
    font-size: 1em;
  }
}

.benefit-content p {
  color: #6c757d;
  line-height: 1.5;
  @media (max-width: 600px) {
    font-size: 14px;
  }
}

/* Призыв к действию */
.cta-section {
  width: 100%;
  margin-top: 60px;
  @media (max-width: 600px) {
    margin-top: 10px;
  }
}

.cta-card {
  background: var(--color-bg-gradient);
  border-radius: 25px;
  padding: 50px;
  display: flex;
  gap: 50px;
  align-items: center;
  color: white;
  position: relative;
  overflow: hidden;
  @media (max-width: 600px) {
    border-radius: 0;
  }
}

.cta-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.cta-title-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.cta-title {
  font-size: 1.8rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 600px) {
    font-size: 20px;
  }
}

.cta-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.95;
  @media (max-width: 600px) {
    font-size: 1rem;
  }
}

.highlight-text {
  font-size: 1.5rem;
  vertical-align: middle;
  margin-left: 10px;
}

/* Кнопки */
.action-buttons {
  display: flex;
  justify-content: center;
  width: 100%;
  gap: 15px;
  margin-bottom: 30px;
}

/* Адаптивность */
@media (max-width: 992px) {
  .intro-card {
    flex-direction: column;
    margin-bottom: 10px;
  }

  .intro-image {
    order: -1;
    flex: 0 0 0;
  }

  .cta-card {
    flex-direction: column;
    text-align: center;
  }

  .action-buttons {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .intro-card,
  .cta-card {
    padding: 15px;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .color-wheel {
    width: 200px;
    height: 200px;
  }
}
</style>
