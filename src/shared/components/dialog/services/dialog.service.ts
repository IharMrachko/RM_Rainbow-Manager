import { Component, reactive } from 'vue';

export interface DialogItem {
  id: number;
  component: Component;
  props?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
  options?: DialogOptions;
}

export interface DialogOptions {
  transparent: boolean;
}
let idCounter = 0;

export const dialogsStore = reactive<{ dialogs: DialogItem[] }>({
  dialogs: [],
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function openDialog<T = any>(
  component: Component,
  props = {},
  options?: DialogOptions
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = ++idCounter;
    dialogsStore.dialogs.push({ id, component, props, resolve, reject, options });
  });
}

export function closeDialog(id: number): void {
  dialogsStore.dialogs = dialogsStore.dialogs.filter((d: DialogItem): boolean => d.id !== id);
}
