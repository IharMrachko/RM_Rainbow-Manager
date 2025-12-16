<template>
  <section class="container">
    <div class="wrap-contact">
      <app-image-login></app-image-login>
      <div class="contacts">
        <h1 class="title">{{ t('contacts') }}</h1>

        <section class="contact">
          <span class="description">{{ t('ideaAndSuggestions') }}</span>
          <div class="contact-item">
            <font-awesome-icon size="xl" :icon="['fas', 'envelope']" />
            <a href="mailto:rainbow-manager@info.com">rainbow-manager@info.com</a>
          </div>
          <span class="description">{{ t('supportAndAssistance') }}</span>
          <div class="contact-item">
            <font-awesome-icon size="xl" :icon="['fas', 'envelope']" />
            <a href="mailto:rainbow-manager@support.com">rainbow-manager@support.com</a>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AppImageLogin from '@/shared/components/AppImageLogin.vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  components: { AppImageLogin },
  setup() {
    const { t } = useI18n();
    return {
      t,
    };
  },
});
</script>
<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 1rem;
  overflow: auto;
  @media (max-width: 600px) {
    padding: 0;
    height: 100dvh;
  }
}

.wrap-contact {
  width: 100%;
  max-width: 960px;
  background: var(--color-wrap-bg);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2rem;
  gap: 2rem;
  height: 80vh;
  margin-top: 20px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: center;
    border-radius: 0;
    margin-top: 0;
    padding: 1.5rem;
    height: 100dvh;
  }
}

.contacts {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: 6rem;

  @media (max-width: 600px) {
    width: 100%;
    gap: 1rem;
  }
}

.title {
  font-size: 2rem;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 50px;
  }
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  border-left: 4px solid var(--active-doing);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 15px;
  color: #111111;
  margin-bottom: 20px;
  cursor: pointer;
}

.description {
  display: inline-block;
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-sub-text);
  margin-bottom: 0.5rem;
}
</style>
