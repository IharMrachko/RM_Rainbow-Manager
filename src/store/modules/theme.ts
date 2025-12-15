import { Module } from 'vuex';

export type ThemeType = 'light' | 'dark';

interface ThemeState {
  theme: ThemeType;
  isDark: boolean;
}

export const theme: Module<ThemeState, unknown> = {
  namespaced: true,
  state: () => ({
    theme: 'light',
    isDark: false,
  }),
  mutations: {
    INIT_THEME(state: ThemeState): void {
      let theme: ThemeType = localStorage.getItem('theme') as ThemeType;
      if (theme) {
        state.theme = theme;
        state.isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', state.isDark);
      }
    },
    SET_THEME(state: ThemeState, isDark: boolean): void {
      state.theme = isDark ? 'dark' : 'light';
      state.isDark = isDark;
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', state.theme);
    },
  },
  actions: {
    initTheme({ commit }): void {
      commit('INIT_THEME');
    },
    setTheme({ commit }, isDark: boolean): void {
      commit('SET_THEME', isDark);
    },
  },
  getters: {
    isDark(state: ThemeState): boolean {
      return state.isDark;
    },
    theme(state: ThemeState): ThemeType {
      return state.theme;
    },
  },
};
