<template>
  <div class="card" :class="{ cardSelected: isSelected }">
    <div ref="targetRef" class="icon" @click="toggleCardOverlayPanel">
      <font-awesome-icon size="sm" :icon="['fas', 'ellipsis-v']" />
    </div>
    <app-overlay-panel
      v-if="targetRef"
      v-model:visible="visible"
      :width="150"
      :target="targetRef"
      :position="{
        x: 'center',
        y: 'bottom',
      }"
    >
      <div class="overlay-folder">
        <div class="overlay-folder-item" @click="deleteTemplate">
          <font-awesome-icon size="sm" :icon="['fas', 'fa-trash']" />
          <span>{{ t('delete') }}</span>
        </div>
      </div>
    </app-overlay-panel>
    <div class="segments" @click="selected">
      <div
        v-for="item in card.segments"
        :key="item"
        class="segment"
        :style="{ backgroundColor: item.color }"
      ></div>
      <div class="title" :title="card.name">
        <span>{{ card.name }}</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppOverlayPanel from '@/shared/components/AppOverlayPanel.vue';
import { openDialog } from '@/shared/components/dialog/services/dialog.service';
import AppConfirmModal from '@/shared/components/AppConfirmModal.vue';
import { useStore } from 'vuex';
import { PaletteTemplate } from '@/store/modules/my-palette';

export default defineComponent({
  components: { AppOverlayPanel },
  props: {
    card: {
      type: Object as PropType<PaletteTemplate>,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  emits: ['selected'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const store = useStore();
    const targetRef = ref<HTMLElement | null>(null);
    const visible = ref(false);
    const selected = () => {
      emit('selected', props.card);
    };

    const toggleCardOverlayPanel = () => {
      visible.value = !visible.value;
    };

    const deleteTemplate = async () => {
      toggleCardOverlayPanel();
      await openDialog(AppConfirmModal, {
        text: t('dywDelete'),
        title: t('delete'),
      }).then((isDeleted) => {
        if (isDeleted) {
          store.dispatch('myPalette/deletePaletteTemplate', props.card.id);
        }
      });
    };

    return {
      selected,
      t,
      targetRef,
      visible,
      toggleCardOverlayPanel,
      deleteTemplate,
    };
  },
});
</script>
<style scoped lang="scss">
.card {
  position: relative;
  height: 250px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px); /* лёгкий blur */
  cursor: pointer;
  transition: all 0.2s ease;
}

/* выделение */
.card.cardSelected {
  outline: 4px solid #4caf50; /* зелёная рамка */
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
}

/* телефоны */
@media (max-width: 600px) {
  .card {
    width: 150px;
    height: 250px;
  }
}

.segments {
  display: flex;
  flex-direction: column;
  height: 100%;
  & .title {
    border-top: 1px solid #ffffff;
    display: flex;
    justify-content: center;
    padding: 5px 10px;
    height: 60px;
    background: #ffffff;

    & span {
      color: #111111;
      white-space: nowrap; /* запрет переноса */
      overflow: hidden; /* скрыть лишний текст */
      text-overflow: ellipsis; /* добавить "..." */
    }
  }
}

.segment {
  flex: 1; /* все 11 равные по высоте */
  opacity: 0.8; /* лёгкая прозрачность для эффекта */
}

.icon {
  display: flex;
  justify-content: end;
  padding: 5px;
}

.overlay-folder {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;

  & .overlay-folder-item {
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #eaeaeb;
    cursor: pointer;
  }
}
</style>
