<template>
  <div class="faq-container">
    <h2>📌 {{ t('FAQ') }} — {{ t('installPWATitle') }}</h2>

    <div class="faq-item">
      <h3>❓ {{ t('howInstallIOSTitle') }}</h3>
      <p>
        {{ t('openAppInBrowserTitle') }} <strong>Safari</strong>. {{ t('pressBtnTitle') }}
        <em>Share</em> ({{ t('squareIconTitle') }}). {{ t('selectItem') }}
        <em>{{ t('addToHomeScreenTitle') }}</em
        >. {{ t('confirmAndClickTitle') }} <em>{{ t('addTitle') }}</em
        >. ➡
        {{ t('appWillAppearText') }}
      </p>
    </div>
    <div class="faq-photos">
      <div>
        <span>1</span>
        <img src="../../../assets/menu-ios.jpg" alt="Preview 1" />
      </div>
      <div>
        <span>2</span>
        <img src="../../../assets/install-ios-ru.jpg" alt="Preview 1" />
      </div>
      <div>
        <span>3</span>
        <img src="../../../assets/confirm-ios-ru.jpg" alt="Preview 2" />
      </div>
    </div>
    <div class="faq-item">
      <h3>❓ {{ t('howInstallAndroidTitle') }}</h3>
      <p>
        {{ t('openAppInBrowserTitle') }} <strong>Chrome</strong>. {{ t('pressBtnTitle') }}
        <em>⋮</em> ({{ t('threeDotsText') }}). {{ t('selectItem') }}
        <em>{{ t('addToHomeScreenTitle') }}</em
        >. {{ t('confirmAndClickTitle') }} <em>{{ t('addTitle') }}</em
        >. ➡
        {{ t('appWillAppearText') }}
      </p>
    </div>
    <div class="faq-photos">
      <div>
        <span>1</span>
        <img src="../../../assets/menu-android.jpg" alt="Preview 1" />
      </div>
      <div>
        <span>2</span>
        <img src="../../../assets/install-ru.jpg" alt="Preview 1" />
      </div>
      <div>
        <span>3</span>
        <img src="../../../assets/confirm-ru.jpg" alt="Preview 2" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  setup() {
    const { t } = useI18n();
    return {
      t,
    };
  },
});
</script>
<style scoped lang="scss">
.faq-container {
  overflow: auto;
  height: calc(100dvh - var(--header-height));
  background: var(--color-wrap-bg);
  padding: 20px;
}

.faq-container h2 {
  text-align: center;
  margin-bottom: 25px;
  font-size: 24px;
  color: var(--color-text);
}

.faq-item {
  margin-bottom: 20px;
  padding: 15px;
  border-left: 4px solid var(--active-doing);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.faq-item h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #222;
}

.faq-item p {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: #555;
}

.faq-photos {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  justify-content: start;
  gap: 30px;
  margin-bottom: 30px;

  & img {
    width: 200px;
    object-fit: cover;
  }

  @media (max-width: 600px) {
    justify-content: center;
  }
}
</style>
