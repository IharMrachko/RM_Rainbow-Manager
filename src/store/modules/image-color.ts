import { Module } from 'vuex';

interface ImageColorState {
  rememberImgMask: boolean;
  rememberImgCollage: boolean;
  shareImgMask: boolean;
  shareImgCollage: boolean;
  imgMask: File | null;
  originalImgMask: File | null;
  imgCollage: File | null;
  originalImgCollage: File | null;
}

export const imageColor: Module<ImageColorState, unknown> = {
  namespaced: true,
  state: () => ({
    rememberImgMask: true,
    rememberImgCollage: true,
    shareImgMask: true,
    shareImgCollage: true,
    imgMask: null,
    imgCollage: null,
    originalImgMask: null,
    originalImgCollage: null,
  }),
  mutations: {
    UPLOAD_IMG_MASK(state: ImageColorState, payload: { file: File }): void {
      state.imgMask = payload.file;
    },
    SET_ORIGINAL_IMG_MASK(state: ImageColorState, payload: { file: File }): void {
      state.originalImgMask = payload.file;
    },
    UPLOAD_IMG_COLLAGE(state: ImageColorState, payload: { file: File }): void {
      state.imgCollage = payload.file;
    },
    SET_ORIGINAL_IMG_COLLAGE(state: ImageColorState, payload: { file: File }): void {
      state.originalImgCollage = payload.file;
    },

    SET_REMEMBER_IMG_MASK(state: ImageColorState, payload: { remember: boolean }): void {
      state.rememberImgMask = payload.remember;
    },
    SET_REMEMBER_IMG_COLLAGE(state: ImageColorState, payload: { remember: boolean }): void {
      state.rememberImgCollage = payload.remember;
    },
    SET_SHARE_IMG_COLLAGE(state: ImageColorState, payload: { share: boolean }): void {
      state.shareImgCollage = payload.share;
    },
    SET_SHARE_IMG_MASK(state: ImageColorState, payload: { share: boolean }): void {
      state.shareImgMask = payload.share;
    },
  },
  actions: {
    uploadImgMask({ commit }, payload: { file: File }): void {
      commit('UPLOAD_IMG_MASK', payload);
    },
    setOriginalImgMask({ commit }, payload: { file: File }): void {
      commit('SET_ORIGINAL_IMG_MASK', payload);
    },
    uploadImgCollage({ commit }, payload: { file: File }): void {
      commit('UPLOAD_IMG_COLLAGE', payload);
    },
    setOriginalImgCollage({ commit }, payload: { file: File }): void {
      commit('SET_ORIGINAL_IMG_COLLAGE', payload);
    },
    setRememberImgCollage({ commit }, payload: { remember: boolean }): void {
      commit('SET_REMEMBER_IMG_COLLAGE', payload);
    },
    setRememberImgMask({ commit }, payload: { remember: boolean }): void {
      commit('SET_REMEMBER_IMG_MASK', payload);
    },
    setShareImgCollage({ commit }, payload: { share: boolean }): void {
      commit('SET_SHARE_IMG_COLLAGE', payload);
    },
    setShareImgMask({ commit }, payload: { share: boolean }): void {
      commit('SET_SHARE_IMG_MASK', payload);
    },
  },
  getters: {
    rememberImgMask(state: ImageColorState): boolean {
      return state.rememberImgMask;
    },
    rememberImgCollage(state: ImageColorState): boolean {
      return state.rememberImgCollage;
    },
    shareImgMask(state: ImageColorState): boolean {
      return state.shareImgMask;
    },
    shareImgCollage(state: ImageColorState): boolean {
      return state.shareImgCollage;
    },
    imgMask(state: ImageColorState): File | null {
      return state.imgMask;
    },
    imgCollage(state: ImageColorState): File | null {
      return state.imgCollage;
    },
    getOriginalImgMask(state: ImageColorState): File | null {
      return state.originalImgMask;
    },
    getOriginalImgCollage(state: ImageColorState): File | null {
      return state.originalImgCollage;
    },
  },
};
