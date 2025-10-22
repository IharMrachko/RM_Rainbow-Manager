import { Ref, ref } from 'vue';

export function useCanvasSaver(
  canvas: Ref<HTMLCanvasElement | null>,
  render: () => void,
  emit?: (event: 'update:imageUrl', value: string) => void,
  originalUrl?: Ref<string | null>
) {
  const zoom = ref(1);

  const saveImage = (filename = 'avatar.png') => {
    if (!canvas.value) return;
    const url = canvas.value.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Ошибка загрузки: ${url}`));
      img.src = url;
    });
  };

  const resetImage = () => {
    if (originalUrl?.value && emit) {
      emit('update:imageUrl', originalUrl.value);
    }
    zoom.value = 1;
    render();
  };

  const zoomPlus = () => {
    zoom.value++;
    render();
  };

  const zoomMinus = () => {
    if (zoom.value === 1) return;
    zoom.value--;
    render();
  };

  return { saveImage, loadImage, resetImage, zoomPlus, zoomMinus, zoom };
}
