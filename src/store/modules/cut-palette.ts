import { Module } from 'vuex';
import { compareObjects } from '@/helpers/compare-object.helper';

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

interface CutPaletteColorsState {
  settings: PaletteSettings;
  selectedColors: Set<string>;
}

export const cutPaletteColors: Module<CutPaletteColorsState, unknown> = {
  namespaced: true,
  state: (): CutPaletteColorsState => ({
    settings: {
      fullFill: true,
      onlySoft: true,
      onlyBright: true,
      onlyCold: true,
      onlyWarm: true,
      onlyLight: true,
      onlyDark: true,
    },
    selectedColors: new Set(),
  }),
  mutations: {
    SET_SETTINGS(state: CutPaletteColorsState, settings: PaletteSettings): void {
      state.settings = settings;
    },
    SELECTED_COLORS(state: CutPaletteColorsState, selectedColors: Set<string>): void {
      state.selectedColors = selectedColors;
    },
  },
  actions: {
    setSettings({ commit }, payload: PaletteSettings): void {
      commit('SET_SETTINGS', payload);
    },
    selectedColors({ commit }, payload: Set<string>): void {
      commit('SELECTED_COLORS', payload);
    },
  },
  getters: {
    getSettings(state: CutPaletteColorsState): PaletteSettings {
      return state.settings;
    },
    getSettingsMap(state: CutPaletteColorsState): PaletteSettingsMap {
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

    isCompareFilter(state: CutPaletteColorsState): boolean {
      const defaultPaletteSettings: PaletteSettings = {
        fullFill: true,
        onlySoft: true,
        onlyBright: true,
        onlyCold: true,
        onlyWarm: true,
        onlyLight: true,
        onlyDark: true,
      };
      return compareObjects(defaultPaletteSettings, state.settings);
    },
    getSelectedColors(state: CutPaletteColorsState): Set<string> {
      return state.selectedColors;
    },
  },
};
