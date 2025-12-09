<template>
  <div ref="containerRef" class="ai-container">
    <section class="ai-answers">
      <div v-if="answers.length === 0" class="ai-answers-area">
        <h2>{{ t('greedyAI') }}</h2>
      </div>
      <section v-for="item in answers" :key="item.id">
        <div class="ai-answers-area">
          <div v-if="item.url" class="answer-item-wrapper">
            <div class="image">
              <img :src="item.url" alt="image" />
            </div>
          </div>
          <div class="answer-item-wrapper">
            <div class="answer-item">{{ item.ask }}</div>
          </div>
          <div v-if="item.answerHtml" class="asked-item-wrapper">
            <div v-html="item.answerHtml"></div>
          </div>
        </div>
      </section>
    </section>
    <section class="ai-ask" :style="{ padding: paddingAreaIos }">
      <div class="ai-ask-area">
        <app-textarea :loader="loader" @apply="apply" @focus="focusInput" @blur="focusOutInput" />
      </div>
    </section>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, nextTick, ref } from 'vue';
import AppTextarea from '@/shared/components/AppTextarea.vue';
import { getGenerativeModel } from 'firebase/ai';
import { ai } from '@/firebase';
import { useStore } from 'vuex';
import { marked } from 'marked';
import { useI18n } from 'vue-i18n'; // @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: { AppTextarea },
  setup() {
    const store = useStore();
    const containerRef = ref<HTMLElement | null>(null);
    const language = computed(() => store.getters['language/language']);
    const answers = ref<{ id: number; ask: string; url: string; answerHtml: string | null }[]>([]);
    const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash-lite' });
    const loader = ref(false);
    const { t } = useI18n();
    const device = computed(() => store.getters['mobile/getDevice']);
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const focusInputForIosRef = ref(false);
    const apply = async (value: { text: string; url: string; base64Data: string }) => {
      loader.value = true;
      const id = Math.random();
      answers.value = [
        ...answers.value,
        {
          id,
          ask: value.text,
          url: value.url,
          answerHtml: null,
        },
      ];
      await nextTick();
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollHeight;
      }
      const text =
        language.value === 'en'
          ? `${value.text}. Answer in English`
          : `${value.text}. Ответь на русском`;
      const req = value.base64Data
        ? [text, { inlineData: { mimeType: 'image/jpeg', data: value.base64Data } }]
        : [text];
      const response = await model.generateContent(req);

      const answer = response.response.text();
      const answerHtml = marked.parse(answer) as string;
      const index = answers.value.findIndex((item) => item.id === id);
      if (index !== -1) {
        answers.value[index] = {
          ...answers.value[index],
          answerHtml: answerHtml,
        };
      }
      await nextTick();
      if (containerRef.value) {
        containerRef.value.scrollTop = containerRef.value.scrollTop + 50;
      }
      loader.value = false;
    };
    const focusInput = () => {
      if (device.value === 'ios') {
        setTimeout(() => {
          iNoBounce.enable();
        });
        focusInputForIosRef.value = true;
      }
    };

    const focusOutInput = () => {
      if (device.value === 'ios') {
        iNoBounce.disable();
        setTimeout(() => window.scrollTo(0, 0), 50);
        focusInputForIosRef.value = false;
      }
    };

    const paddingAreaIos = computed(() => {
      if (device.value === 'ios' && isMobile.value && focusInputForIosRef.value) {
        return '0 20px 0 20px';
      }
      if (device.value === 'ios' && isMobile.value && !focusInputForIosRef.value) {
        return '0 20px 50px 20px';
      }

      return '';
    });
    return {
      apply,
      answers,
      containerRef,
      loader,
      t,
      focusInput,
      focusOutInput,
      device,
      isMobile,
      paddingAreaIos,
    };
  },
});
</script>
<style scoped lang="scss">
.ai-container {
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-wrap-bg);
  overflow: auto;
  @media (max-width: 600px) {
    overflow: auto;
  }

  & .ai-answers {
    padding-top: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    & .ai-answers-area {
      width: 700px;

      @media (max-width: 600px) {
        width: 95vw;
      }

      & .answer-item-wrapper {
        display: flex;
        justify-content: end;

        & .answer-item {
          max-width: 350px;
          min-width: 100px;
          background: #fbe2cd;
          padding: 5px 15px 5px 20px;
          font-size: 1rem;
          font-variation-settings: 'opsz' 40, 'wght' 410;
          line-height: 1.625rem;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          border-radius: 25px;
          margin-bottom: 6px;
          color: #111111;
        }

        .image {
          width: 100px;
          margin-bottom: 5px;
          & img {
            object-fit: contain;
            border-radius: 0.75rem;
          }
        }
      }
    }
    & section:not(:last-child) {
      border-bottom: 1px solid #ccc;
      padding: 10px 0 10px 0;
      margin-bottom: 10px;
    }
  }

  & .ai-ask {
    position: sticky;
    flex: 1;
    padding: 0 20px 20px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: 0;
    background: var(--color-wrap-bg);

    @media (max-width: 600px) {
      padding: 0 20px 20px 20px;
    }

    & .ai-ask-area {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 700px;

      @media (max-width: 600px) {
        width: 95vw;
      }
    }
  }
}
</style>
