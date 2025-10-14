<template>
  <div>
    <button @click="askAI">Спросить AI</button>
    <p>{{ result }}</p>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue';
import { getGenerativeModel } from 'firebase/ai';
import { ai } from '@/firebase';

export default defineComponent({
  setup() {
    const result = ref('');
    const imageUrl = ref<string | null>(null);
    const askAI = async () => {
      // Подключаем модель Gemini
      const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash-lite' });
      if (!imageUrl.value) {
        result.value = 'Сначала загрузите фото!';
        return;
      }
      // Пример запроса
      const response = await model.generateContent([
        'Определи цветотип человека по этой фотографии. Ответь на русскомс',
        { inlineData: { mimeType: 'image/jpeg', data: imageUrl.value.split(',')[1] } },
      ]);

      result.value = response.response.text();
    };
    return {
      askAI,
    };
  },
});
</script>
<style scoped lang="scss"></style>
