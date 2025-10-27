<template>
  <div class="color-container">
    <app-tabs>
      <app-tab title="mask">
        <app-color-mask @file-on-load="fileOnLoad"></app-color-mask>
      </app-tab>
      <app-tab title="collage">
        <app-collage v-model:image-url="imageUrl"></app-collage>
      </app-tab>
    </app-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import AppTabs from '@/shared/components/tabs/AppTabs.vue';
import AppTab from '@/shared/components/tabs/AppTab.vue';
import AppCollage from '@/views/main/views/color-view/components/AppCollage.vue';
import AppColorMask from '@/views/main/views/color-view/components/AppColorMask.vue';

export default defineComponent({
  components: {
    AppColorMask,
    AppCollage,
    AppTab,
    AppTabs,
  },
  setup() {
    const imageUrl = ref<string | null>(null);

    const fileOnLoad = (image: string) => {
      imageUrl.value = image;
    };
    return {
      imageUrl,
      fileOnLoad,
    };
  },
});
</script>

<style scoped lang="scss">
.color-container {
  padding: 10px 20px 5px 20px;
  overflow: auto;
  height: calc(100dvh - var(--header-height));

  @media (max-width: 600px) {
    padding: 5px;
  }
}
</style>
