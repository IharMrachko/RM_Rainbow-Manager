<template>
  <section class="modal-header-section">
    <font-awesome-icon v-if="isMobile" size="lg" :icon="['fas', 'arrow-left']" @click="close" />
    <div v-if="!isMobile" class="close" @click="close">
      <font-awesome-icon size="lg" :icon="['fas', 'fa-times']" />
    </div>
  </section>
</template>
<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  emits: ['close'],
  setup(_, { emit }) {
    const store = useStore();
    const isMobile = computed(() => store.getters['mobile/breakPoint'] === 'mobile');
    const close = () => {
      emit('close');
    };
    return { isMobile, close };
  },
});
</script>
<style scoped lang="scss">
.modal-header-section {
  width: 100%;
  height: 50px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background: rgba(256, 256, 256, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* для Safari */
  display: flex;
  align-items: center;
  padding: 0 10px;

  & .close {
    display: flex;
    justify-content: right;
    width: 100%;
    cursor: pointer;
  }
  @media (max-width: 600px) {
    border-radius: 0;
    height: var(--header-height);
  }
}
</style>
