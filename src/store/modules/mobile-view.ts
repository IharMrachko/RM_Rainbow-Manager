import { Module } from 'vuex';
import { BreakPoint } from '@/types/break-point.type';

export type Device = 'ios' | 'android' | 'desktop';
interface MobileViewState {
  clientWidth: number;
  breakPoint: BreakPoint;
  device: Device;
}

export const mobile: Module<MobileViewState, unknown> = {
  namespaced: true,
  state: () => ({
    clientWidth: 0,
    breakPoint: 'desktop',
    device: 'desktop',
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
    SET_DEVICE(state: MobileViewState, payload: { device: Device }): void {
      state.device = payload.device;
    },
  },
  actions: {
    setClientWidth({ commit }, payload: { clientWidth: number }): void {
      commit('SET_CLIENT_WIDTH', payload);
    },
    setDevice({ commit }, payload: { device: Device }): void {
      commit('SET_DEVICE', payload);
    },
  },
  getters: {
    clientWidth(state: MobileViewState): number {
      return state.clientWidth;
    },
    breakPoint(state: MobileViewState): BreakPoint {
      return state.breakPoint;
    },
    getDevice(state: MobileViewState): Device {
      return state.device;
    },
  },
};
