import { Module } from 'vuex';

export interface PaletteSettings {
  fullFill: boolean;
  onlySoft: boolean;
  onlyBright: boolean;
  onlyCold: boolean;
  onlyWarm: boolean;
  onlyLight: boolean;
  onlyDark: boolean;
}

export interface PaletteSettingsMap {
  fullFill: boolean;
  palette: {
    softSummerPalette: boolean;
    softAutumnPalette: boolean;
    darkAutumnPalette: boolean;
    darkWinterPalette: boolean;
    coldSummerPalette: boolean;
    coldWinterPalette: boolean;
    lightSpringPalette: boolean;
    lightSummerPalette: boolean;
    brightSpringPalette: boolean;
    brightWinterPalette: boolean;
    warmSpringPalette: boolean;
    warmAutumnPalette: boolean;
  };
}

interface PaletteState {
  settings: PaletteSettings;
  rememberImgMask: boolean;
  imgMask: File | null;
  originalImgMask: File | null;
}

export const palette: Module<PaletteState, unknown> = {
  namespaced: true,
  state: (): PaletteState => ({
    settings: {
      fullFill: false,
      onlySoft: true,
      onlyBright: true,
      onlyCold: true,
      onlyWarm: true,
      onlyLight: true,
      onlyDark: true,
    },
    rememberImgMask: true,
    imgMask: null,
    originalImgMask: null,
  }),
  mutations: {
    SET_SETTINGS(state, settings: PaletteSettings) {
      state.settings = settings;
    },
    UPLOAD_IMG_MASK(state: PaletteState, payload: { file: File }): void {
      state.imgMask = payload.file;
    },
    SET_ORIGINAL_IMG_MASK(state: PaletteState, payload: { file: File }): void {
      state.originalImgMask = payload.file;
    },
    SET_REMEMBER_IMG_MASK(state: PaletteState, payload: { remember: boolean }): void {
      state.rememberImgMask = payload.remember;
    },
  },
  actions: {
    setSettings(ctx, payload: PaletteSettings) {
      ctx.commit('SET_SETTINGS', payload);
    },
    uploadImgMask({ commit }, payload: { file: File }): void {
      commit('UPLOAD_IMG_MASK', payload);
    },
    setOriginalImgMask({ commit }, payload: { file: File }): void {
      commit('SET_ORIGINAL_IMG_MASK', payload);
    },
    setRememberImgMask({ commit }, payload: { remember: boolean }): void {
      commit('SET_REMEMBER_IMG_MASK', payload);
    },
  },
  getters: {
    getSettings(state: PaletteState): PaletteSettings {
      return state.settings;
    },
    getSettingsMap(state: PaletteState): PaletteSettingsMap {
      return {
        fullFill: state.settings.fullFill,
        palette: {
          softSummerPalette: state.settings.onlySoft,
          softAutumnPalette: state.settings.onlySoft,
          darkAutumnPalette: state.settings.onlyDark,
          darkWinterPalette: state.settings.onlyDark,
          coldSummerPalette: state.settings.onlyCold,
          coldWinterPalette: state.settings.onlyCold,
          lightSpringPalette: state.settings.onlyLight,
          lightSummerPalette: state.settings.onlyLight,
          brightSpringPalette: state.settings.onlyBright,
          brightWinterPalette: state.settings.onlyBright,
          warmSpringPalette: state.settings.onlyWarm,
          warmAutumnPalette: state.settings.onlyWarm,
        },
      };
    },
    rememberImgMask(state: PaletteState): boolean {
      return state.rememberImgMask;
    },
    imgMask(state: PaletteState): File | null {
      return state.imgMask;
    },
    getOriginalImgMask(state: PaletteState): File | null {
      return state.originalImgMask;
    },
  },
};
