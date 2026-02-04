import { Module } from 'vuex';
import { DEFAULT_COLOR_SEGMENT } from '@/views/main/views/my-palette/my-palette.constants';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { FirebaseError } from '@/interfaces/firebase-error.interface';
import { errorMessages } from '@/helpers/error-message.helper';

export interface PaletteTemplate {
  id: string;
  userId: string;
  name: string;
  segments: { color: string }[];
  createdAt?: string;
}

interface MyPaletteState {
  numberOfSegments: number;
  rememberImgMask: boolean;
  imgMask: File | null;
  originalImgMask: File | null;
  frameColors: { color: string }[];
  paletteTemplates: PaletteTemplate[];
  paletteTemplatesFilter: PaletteTemplate[];
  loading: boolean;
  selectedTemplate: PaletteTemplate | null;
}

export const myPalette: Module<MyPaletteState, unknown> = {
  namespaced: true,
  state: (): MyPaletteState => ({
    numberOfSegments: 1,
    rememberImgMask: true,
    imgMask: null,
    originalImgMask: null,
    frameColors: [{ color: DEFAULT_COLOR_SEGMENT }],
    loading: false,
    paletteTemplates: [],
    paletteTemplatesFilter: [],
    selectedTemplate: null,
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
    SET_LOADING(state: MyPaletteState, payload: boolean): void {
      state.loading = payload;
    },
    ADD_TEMPLATE(state: MyPaletteState, template: PaletteTemplate): void {
      state.paletteTemplates.push(template);
    },
    SET_TEMPLATES(state, template: PaletteTemplate[]): void {
      state.paletteTemplates = template;
      state.paletteTemplatesFilter = template;
    },
    UPDATE_PALETTE_TEMPLATE(state: MyPaletteState, template: PaletteTemplate): void {
      const idx = state.paletteTemplates.findIndex((f) => f.id === template.id);
      if (idx !== -1) {
        state.paletteTemplates[idx] = { ...state.paletteTemplates[idx], ...template };
        state.paletteTemplatesFilter[idx] = { ...state.paletteTemplates[idx], ...template };
      }
    },
    FILTER_PALETTE_TEMPLATE(state: MyPaletteState, search: string): void {
      if (!search) {
        state.paletteTemplatesFilter = state.paletteTemplates;
        return;
      }
      state.paletteTemplatesFilter = state.paletteTemplates.filter((f) =>
        f.name.toLowerCase().trim().includes(search.toLowerCase().trim())
      );
    },
    REMOVE_PALETTE_TEMPLATE(state: MyPaletteState, templateId: string): void {
      state.paletteTemplates = state.paletteTemplates.filter((f) => f.id !== templateId);
      state.paletteTemplatesFilter = state.paletteTemplates;
    },
    SELECTED_PALETTE_TEMPLATE(state: MyPaletteState, template: PaletteTemplate): void {
      state.selectedTemplate = template;
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
    filterPaletteTemplates({ commit }, search: string) {
      commit('FILTER_PALETTE_TEMPLATE', search);
    },
    selectedTemplate({ commit }, payload: PaletteTemplate): void {
      commit('SELECTED_PALETTE_TEMPLATE', payload);
    },
    async savePaletteTemplate({ dispatch, commit }, { userId, name, segments }) {
      commit('SET_LOADING', true);
      try {
        const parentRef = collection(db, 'palette-templates', 'kFDy9AD2SVL64PG7hOl1', 'items');

        const docRef = await addDoc(parentRef, {
          userId,
          name,
          segments,
          createdAt: serverTimestamp(),
        });

        // добавляем в state
        commit('ADD_TEMPLATE', {
          id: docRef.id,
          userId,
          name,
          segments,
          createdAt: serverTimestamp(),
        });

        await dispatch(
          'toast/addToast',
          { message: 'successPaletteTemplateCreate', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async getPaletteTemplates({ dispatch, commit }, userId: string) {
      commit('SET_LOADING', true);
      try {
        const parentRef = collection(db, 'palette-templates', 'kFDy9AD2SVL64PG7hOl1', 'items');
        const q = query(parentRef, where('userId', '==', userId));

        const snapshot = await getDocs(q);
        const templates = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        commit('SET_TEMPLATES', templates);
        return templates;
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
        return [];
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async deletePaletteTemplate({ dispatch, commit }, templateId: string) {
      commit('SET_LOADING', true);
      try {
        const folderRef = doc(db, 'palette-templates', 'kFDy9AD2SVL64PG7hOl1', 'items', templateId);

        await deleteDoc(folderRef);

        commit('REMOVE_PALETTE_TEMPLATE', templateId);

        await dispatch(
          'toast/addToast',
          { message: 'successDeletePaletteTemplate', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async updatePaletteTemplate({ dispatch, commit }, { id, name, segments }) {
      commit('SET_LOADING', true);
      try {
        const folderRef = doc(db, 'palette-templates', 'kFDy9AD2SVL64PG7hOl1', 'items', id);

        await updateDoc(folderRef, { name, segments });

        commit('UPDATE_PALETTE_TEMPLATE', { id, name, segments });

        await dispatch(
          'toast/addToast',
          { message: 'successUpdatePaletteTemplate', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
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
    isLoading(state: MyPaletteState): boolean {
      return state.loading;
    },
    getPaletteTemplates(state: MyPaletteState): PaletteTemplate[] {
      return state.paletteTemplates;
    },

    getPaletteTemplatesFilter(state: MyPaletteState): PaletteTemplate[] {
      return state.paletteTemplatesFilter;
    },
    getSelectedPaletteTemplate(state: MyPaletteState): PaletteTemplate | null {
      return state.selectedTemplate;
    },
  },
};
