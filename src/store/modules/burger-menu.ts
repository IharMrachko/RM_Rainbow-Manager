import { Module } from 'vuex';

interface BurgerMenuState {
  isOpen: boolean;
}

export const burgerMenu: Module<BurgerMenuState, any> = {
  namespaced: true,
  state: () => ({
    isOpen: false,
  }),
  mutations: {
    SET_BURGER(state: BurgerMenuState, payload: { isOpen: boolean }): void {
      state.isOpen = payload.isOpen;
    },
  },
  actions: {
    setBurger({ commit }, payload: { isOpen: boolean }): void {
      commit('SET_BURGER', payload);
    },
  },
  getters: {
    isOpen(state: BurgerMenuState): boolean {
      return state.isOpen;
    },
  },
};
