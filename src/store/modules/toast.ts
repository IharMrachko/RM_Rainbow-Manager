import { Module } from 'vuex';
import { Severity } from '@/types/color.type';

export interface Toast {
  id: number;
  message: string;
  severity: Severity;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  counter: number;
}

export const toast: Module<ToastState, unknown> = {
  namespaced: true,
  state: () => ({
    toasts: [],
    counter: 0,
  }),
  mutations: {
    ADD_TOAST(state, toast: Omit<Toast, 'id'>) {
      const id = state.counter++;
      state.toasts.push({ id, ...toast });
      setTimeout(() => {
        const index = state.toasts.findIndex((t) => t.id === id);
        if (index !== -1) state.toasts.splice(index, 1);
      }, toast.duration);
    },
    DELETE_TOAST(state, id: number) {
      const index = state.toasts.findIndex((t) => t.id === id);
      if (index !== -1) state.toasts.splice(index, 1);
    },
  },
  actions: {
    addToast({ commit }, payload: { message: string; severity?: Severity; duration?: number }) {
      commit('ADD_TOAST', {
        message: payload.message,
        severity: payload.severity || 'info',
        duration: payload.duration || 4000,
      });
    },
    deleteToast({ commit }, payload: { id: number }) {
      commit('DELETE_TOAST', payload.id);
    },
  },
  getters: {
    getToasts(state: ToastState): Toast[] {
      return state.toasts;
    },
  },
};
