export interface EditorCanvasRef {
  getCanvasValue: () => HTMLCanvasElement;
  getImageSrc: () => string;
  triggerSaveImage: () => void;
}
