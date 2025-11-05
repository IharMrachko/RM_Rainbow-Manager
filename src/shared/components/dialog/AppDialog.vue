<template>
  <teleport to="body">
    <div
      v-for="dlg in dialogsSt.dialogs"
      :key="dlg.id"
      class="dialog-backdrop"
      :class="{ 'dialog-backdrop-transparent': dlg.options?.transparent }"
      @click.self="close(dlg.id)"
    >
      <component
        :is="dlg.component"
        v-bind="dlg.props"
        @resolve="
          (val) => {
            dlg.resolve(val);
            close(dlg.id);
          }
        "
        @reject="
          (err) => {
            dlg.reject(err);
            close(dlg.id);
          }
        "
        @close="close(dlg.id)"
      />
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { closeDialog, dialogsStore } from '@/shared/components/dialog/services/dialog.service';

export default defineComponent({
  setup() {
    const dialogsSt = dialogsStore;

    const close = closeDialog;
    return {
      dialogsSt,
      close,
    };
  },
});
</script>

<style scoped lang="scss">
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.dialog-backdrop-transparent {
  background: transparent;
}
</style>
