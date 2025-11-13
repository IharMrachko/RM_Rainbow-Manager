<template>
  <div ref="container" class="virtual-grid" :style="containerStyle" @scroll="onScroll">
    <div class="spacer" :style="{ height: totalHeight + 'px' }">
      <div
        v-for="(item, i) in visibleItems"
        :key="itemKey(item)"
        class="cell"
        :style="cellStyle(startIndex + i)"
      >
        <slot :item="item" :index="startIndex + i" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  PropType,
  ref,
} from 'vue';

export default defineComponent({
  props: {
    items: { type: Array as PropType<any[]>, required: true },
    itemKey: {
      type: Function as PropType<(item: any) => string>,
      default: (item: any) => item?.id ?? JSON.stringify(item),
    },
    minColumnWidth: { type: Number, default: 250 }, // минимальная ширина колонки
    rowHeight: { type: Number, default: 300 }, // фиксированная высота строки
    gap: { type: Number, default: 5 }, // промежуток между колонками
    bufferRows: { type: Number, default: 20 }, // запас по строкам
    height: { type: [Number, String] as PropType<number | string>, default: 400 }, // высота контейнера
  },
  emits: ['scroll'],
  setup(props, { emit }) {
    const container = ref<HTMLElement | null>(null);
    const scrollTop = ref(0);
    const containerHeight = ref(0);
    const containerWidth = ref(0);

    const containerStyle = computed(() => ({
      height: typeof props.height === 'number' ? `${props.height}px` : String(props.height),
    }));

    // количество колонок вычисляется динамически
    const columnsCount = computed(() => {
      return Math.max(
        1,
        Math.floor((containerWidth.value + props.gap) / (props.minColumnWidth + props.gap))
      );
    });

    const colWidth = computed(() => {
      const cols = columnsCount.value;
      return (containerWidth.value - (cols - 1) * props.gap) / cols;
    });

    const totalRows = computed(() => Math.ceil(props.items.length / columnsCount.value));
    const totalHeight = computed(
      () => totalRows.value * props.rowHeight + Math.max(0, totalRows.value - 1) * props.gap
    );
    const maxScroll = computed(() => Math.max(0, totalHeight.value - containerHeight.value));

    const visibleRows = computed(
      () => Math.ceil(containerHeight.value / (props.rowHeight + props.gap)) + props.bufferRows
    );

    const startRow = computed(() => {
      const raw = Math.floor(scrollTop.value / (props.rowHeight + props.gap));
      const maxStart = Math.max(0, Math.ceil(totalRows.value - visibleRows.value));
      return Math.min(raw, maxStart);
    });

    const startIndex = computed(() => startRow.value * columnsCount.value);
    const endIndex = computed(() => {
      const max = props.items.length;
      const span = visibleRows.value * columnsCount.value;
      return Math.min(startIndex.value + span, max);
    });
    const visibleItems = computed(() => props.items.slice(startIndex.value, endIndex.value));

    const topSpacer = computed(() => startRow.value * (props.rowHeight + props.gap));

    const endRow = computed(() => Math.floor(endIndex.value / columnsCount.value));
    const bottomSpacer = computed(() => {
      const remainingRows = Math.max(0, totalRows.value - endRow.value);
      return remainingRows * (props.rowHeight + props.gap);
    });

    const measure = () => {
      const el = container.value;
      if (!el) return;
      containerHeight.value = el.clientHeight;
      containerWidth.value = el.clientWidth;
    };

    const cellStyle = (index: number) => {
      const row = Math.floor(index / columnsCount.value);
      const col = index % columnsCount.value;
      const x = col * (colWidth.value + props.gap);
      const y = row * (props.rowHeight + props.gap);
      return {
        position: 'absolute',
        transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`,
        width: `${Math.round(colWidth.value)}px`,
        height: `${props.rowHeight}px`,
      };
    };

    const onScroll = (e: Event) => {
      emit('scroll', e);
      const el = e.target as HTMLElement;
      const next = el.scrollTop;
      if (next > maxScroll.value) {
        el.scrollTop = maxScroll.value;
        scrollTop.value = maxScroll.value;
      } else {
        scrollTop.value = next;
      }
    };

    onMounted(() => {
      nextTick(() => measure());
      if (container.value && 'ResizeObserver' in window) {
        const ro = new ResizeObserver(() => measure());
        ro.observe(container.value);
      }
      window.addEventListener('resize', measure);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', measure);
    });

    return {
      container,
      containerStyle,
      visibleItems,
      startIndex,
      totalHeight,
      topSpacer,
      bottomSpacer,
      cellStyle,
      onScroll,
    };
  },
});
</script>
<style scoped lang="scss">
.virtual-grid {
  overflow-y: auto;
  position: relative;
  overscroll-behavior-y: contain; /* снижает bounce */
  -webkit-overflow-scrolling: touch; /* плавность на iOS */
  overflow-anchor: none; /* отключить scroll anchoring */

  /* Скрыть скроллбар в разных браузерах */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE и Edge */
  overscroll-behavior: contain; /* или none */

  &::-webkit-scrollbar {
    /* Chrome, Safari, Opera */
    display: none;
  }
}
.grid {
  width: 100%;
}
.virtual-grid > div {
  overflow-anchor: none;
}

.spacer {
  position: relative;
  width: 100%;
}
.cell {
  box-sizing: border-box;
  overflow-anchor: none;
}
</style>
