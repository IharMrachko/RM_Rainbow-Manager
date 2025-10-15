import { Module } from 'vuex';
import { BreakPoint } from '@/types/break-point.type';

interface MobileViewState {
  clientWidth: number;
  breakPoint: BreakPoint;
}

export const mobile: Module<MobileViewState, any> = {
  namespaced: true,
  state: () => ({
    clientWidth: 0,
    breakPoint: 'desktop',
  }),
  mutations: {
    SET_CLIENT_WIDTH(state: MobileViewState, payload: { clientWidth: number }): void {
      state.clientWidth = payload.clientWidth;
      if (payload.clientWidth < 600) {
        state.breakPoint = 'mobile';
      }
      if (payload.clientWidth > 600 && payload.clientWidth < 1024) {
        state.breakPoint = 'tablet';
      }

      if (payload.clientWidth > 1024 && payload.clientWidth < 1440) {
        state.breakPoint = 'desktop';
      }
      if (payload.clientWidth > 1440) {
        state.breakPoint = 'fullScreen';
      }
    },
  },
  actions: {
    setClientWidth({ commit }, payload: { clientWidth: number }): void {
      commit('SET_CLIENT_WIDTH', payload);
    },
  },
  getters: {
    clientWidth(state: MobileViewState): number {
      return state.clientWidth;
    },
    breakPoint(state: MobileViewState): BreakPoint {
      return state.breakPoint;
    },
  },
};
