import { Module } from 'vuex';

type LanguageType = 'en' | 'ru';
interface LanguageState {
  language: LanguageType;
}

export const language: Module<LanguageState, any> = {
  namespaced: true,
  state: () => ({
    language: 'en',
  }),
  mutations: {
    INIT_LANGUAGE(state: LanguageState): void {
      let language: LanguageType = localStorage.getItem('language') as LanguageType;
      if (language) {
        state.language = language;
      }
    },
    SET_LANGUAGE(state: LanguageState, payload: { language: LanguageType }): void {
      state.language = payload.language;
      localStorage.setItem('language', payload.language);
    },
  },
  actions: {
    initLanguage({ commit }): void {
      commit('INIT_LANGUAGE');
    },
    setLanguage({ commit }, payload: { language: LanguageType }): void {
      commit('SET_LANGUAGE', payload);
    },
  },
  getters: {
    language(state: LanguageState): LanguageType {
      return state.language;
    },
  },
};
