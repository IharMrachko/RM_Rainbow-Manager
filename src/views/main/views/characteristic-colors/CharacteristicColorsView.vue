<template>
  <div class="color-container">
    <AppLoader v-if="isLoading"></AppLoader>
    <app-tabs>
      <app-tab title="mask">
        <app-color-mask @is-loading="isLoading = $event"></app-color-mask>
      </app-tab>
      <app-tab title="collage">
        <app-collage @is-loading="isLoading = $event"></app-collage>
      </app-tab>
    </app-tabs>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import AppTabs from '@/shared/components/tabs/AppTabs.vue';
import AppTab from '@/shared/components/tabs/AppTab.vue';
import AppCollage from '@/views/main/views/characteristic-colors/components/AppCollage.vue';
import AppColorMask from '@/views/main/views/characteristic-colors/components/AppColorMask.vue';
import AppLoader from '@/shared/components/AppLoader.vue';
// @ts-ignore
import iNoBounce from 'inobounce';

export default defineComponent({
  components: {
    AppLoader,
    AppColorMask,
    AppCollage,
    AppTab,
    AppTabs,
  },
  setup() {
    const imageUrl = ref<string | null>(null);
    const isLoading = ref(false);
    const fileOnLoad = (image: string) => {
      imageUrl.value = image;
    };

    onMounted(() => {
      iNoBounce.disable();
    });
    return {
      imageUrl,
      fileOnLoad,
      isLoading,
    };
  },
});
</script>

<style scoped lang="scss">
.color-container {
  position: relative;
  overflow: auto;
  height: 100dvh;
  background: var(--color-wrap-bg);
}
</style>
