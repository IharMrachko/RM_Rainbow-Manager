import { Module } from 'vuex';
import { DEFAULT_COLOR_SEGMENT } from '@/views/main/views/my-palette/my-palette.constants';

interface MyPaletteState {
  numberOfSegments: number;
  rememberImgMask: boolean;
  imgMask: File | null;
  originalImgMask: File | null;
  frameColors: { color: string }[];
}

export const myPalette: Module<MyPaletteState, unknown> = {
  namespaced: true,
  state: (): MyPaletteState => ({
    numberOfSegments: 1,
    rememberImgMask: true,
    imgMask: null,
    originalImgMask: null,
    frameColors: [{ color: DEFAULT_COLOR_SEGMENT }],
  }),
  mutations: {
    UPLOAD_IMG_MASK(state: MyPaletteState, payload: { file: File }): void {
      state.imgMask = payload.file;
    },
    SET_ORIGINAL_IMG_MASK(state: MyPaletteState, payload: { file: File }): void {
      state.originalImgMask = payload.file;
    },
    SET_REMEMBER_IMG_MASK(state: MyPaletteState, payload: { remember: boolean }): void {
      state.rememberImgMask = payload.remember;
    },
    SET_NUMBER_SEGMENTS(state: MyPaletteState, payload: number): void {
      state.numberOfSegments = payload;
    },
    SET_FRAME_COLORS(state: MyPaletteState, payload: { frameColors: { color: string }[] }): void {
      state.frameColors = payload.frameColors;
    },
  },
  actions: {
    uploadImgMask({ commit }, payload: { file: File }): void {
      commit('UPLOAD_IMG_MASK', payload);
    },
    setOriginalImgMask({ commit }, payload: { file: File }): void {
      commit('SET_ORIGINAL_IMG_MASK', payload);
    },
    setRememberImgMask({ commit }, payload: { remember: boolean }): void {
      commit('SET_REMEMBER_IMG_MASK', payload);
    },
    setNumberSegments({ commit }, payload: number): void {
      commit('SET_NUMBER_SEGMENTS', payload);
    },
    setFrameColors({ commit }, payload: { frameColors: { color: string }[] }): void {
      commit('SET_FRAME_COLORS', payload);
    },
  },
  getters: {
    rememberImgMask(state: MyPaletteState): boolean {
      return state.rememberImgMask;
    },
    imgMask(state: MyPaletteState): File | null {
      return state.imgMask;
    },
    getOriginalImgMask(state: MyPaletteState): File | null {
      return state.originalImgMask;
    },

    getNumberSegments(state: MyPaletteState): number {
      return state.numberOfSegments;
    },
    getFrameColors(state: MyPaletteState): { color: string }[] {
      return state.frameColors;
    },
  },
};
