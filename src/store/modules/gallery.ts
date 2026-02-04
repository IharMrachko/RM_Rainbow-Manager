import { db, storage } from '@/firebase';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Module } from 'vuex';
import { ColoristicType } from '@/types/coloristic.type';
import { MaskType } from '@/types/mask.type';
import { tokenizeTitle } from '@/helpers/tokenize-title.helper';
import { Folder } from '@/store/modules/folder';
import { FirebaseError } from '@/interfaces/firebase-error.interface';
import { errorMessages } from '@/helpers/error-message.helper';
import { MaskCard } from '@/types/mask-card.type';
import { PaletteCard } from '@/types/palette-card.type';
import { Palette } from '@/types/palette.type';

export type GalleryOptions = {
  coloristicType?: ColoristicType | null;
  title?: string;
  pageSize?: number;
  lastDoc?: unknown;
  maskType?: MaskType | null;
  folderId?: string;
  paletteType?: Palette | null;
};
interface SaveOptions {
  userId: string;
  canvas: HTMLCanvasElement;
  path?: string;
  title?: string;
  coloristicType?: ColoristicType;
  maskType?: MaskType;
  paletteType?: Palette;
  folderId?: string;
  deprecated?: boolean;
}

export interface Image {
  id: string;
  src: string;
  title: string;
  coloristicType: ColoristicType;
  maskType: MaskType;
  folder: Folder;
  paletteType: Palette;
}
export interface ImageUpdate {
  id: string;
  src: string;
  title: string;
  coloristicType: ColoristicType;
  maskType: MaskType;
  paletteType: Palette;
  folderId: string | null;
}

export interface GalleryFilter {
  maskType: MaskCard | null;
  coloristicType: { id: string; name: string } | null;
  folder: Folder | null;
  paletteType: PaletteCard | null;
}

interface GalleryState {
  images: Image[];
  isLoading: boolean;
  lastDoc: unknown | null;
  totalImages: number;
  filter: Partial<GalleryFilter> | null;
  isSelectedMode: boolean;
  selectedImages: Map<string, Image>;
}

export const gallery: Module<GalleryState, unknown> = {
  namespaced: true,
  state: (): GalleryState => ({
    images: [],
    isLoading: false,
    lastDoc: null,
    totalImages: 0,
    filter: null,
    isSelectedMode: false,
    selectedImages: new Map<string, Image>(),
  }),
  mutations: {
    SET_IMAGES(
      state: GalleryState,
      payload: {
        items: Image[];
        lastDoc: unknown;
        totalImages: number;
      }
    ) {
      state.images = [...state.images, ...payload.items];
      state.lastDoc = payload.lastDoc;
      state.totalImages = payload.totalImages;
    },
    RESET_IMAGES(state: GalleryState) {
      state.images = [];
      state.lastDoc = null;
      state.totalImages = 0;
    },
    SET_LOADING(state, value: boolean) {
      state.isLoading = value;
    },
    SET_FILTER(state, filter: Partial<GalleryFilter> | null) {
      state.filter = filter;
    },
    UPDATE_IMAGE(state: GalleryState, payload: ImageUpdate) {
      const index = state.images.findIndex((img) => img.id === payload.id);
      if (index !== -1) {
        state.images[index] = { ...state.images[index], ...payload };
      }
    },

    DELETE_IMAGE(state: GalleryState, id: string) {
      state.images = state.images.filter((img) => img.id !== id);
      state.totalImages = Math.max(0, state.totalImages - 1);
    },
    DELETE_IMAGES(state, ids: string[]) {
      const idSet = new Set(ids);
      state.images = state.images.filter((img) => !idSet.has(img.id));
      state.totalImages = Math.max(0, state.totalImages - ids.length);
      const selected = state.selectedImages;
      ids.forEach((id) => selected.delete(id));
      state.selectedImages = selected;
    },

    SET_SELECTED_MODE(state: GalleryState, isSelectedMode: boolean) {
      state.isSelectedMode = isSelectedMode;
    },
    SET_SELECTED(state: GalleryState, image: Image) {
      const selected: Map<string, Image> = state.selectedImages;
      if (selected.has(image.id)) {
        selected.delete(image.id);
      } else {
        selected.set(image.id, image);
      }
      state.selectedImages = selected;
    },
    SET_SELECTED_ALL(state: GalleryState, images: Image[]) {
      const selected: Map<string, Image> = state.selectedImages;
      images.forEach((it) => selected.set(it.id, it));
      state.selectedImages = selected;
    },
    CLEAR_SELECTED(state: GalleryState) {
      state.selectedImages = new Map<string, Image>();
    },
  },

  actions: {
    async saveImageToGallery(
      { dispatch },
      {
        canvas,
        path = `avatar/${Date.now()}.png`,
        title = '',
        paletteType,
        coloristicType,
        maskType,
        userId,
        folderId = '',
        deprecated = false,
      }: SaveOptions
    ) {
      return new Promise<string>((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Не удалось получить Blob из canvas'));

          try {
            // 1. Сохраняем в Storage
            const fileRef = storageRef(storage, path);
            await uploadBytes(fileRef, blob);
            const downloadURL = await getDownloadURL(fileRef);

            // 2. Добавляем запись в Firestore
            await addDoc(collection(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items'), {
              userId,
              url: downloadURL,
              title,
              coloristicType,
              paletteType,
              maskType,
              folderId,
              createdAt: serverTimestamp(),
              deprecated,
              tokens: tokenizeTitle(title),
            });

            await dispatch(
              'toast/addToast',
              { message: 'successImage', severity: 'success' },
              { root: true }
            );
            resolve(downloadURL);
          } catch (err) {
            const e = err as FirebaseError;
            await dispatch(
              'toast/addToast',
              { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
              { root: true }
            );
            reject(err);
          }
        }, 'image/png');
      });
    },
    async initUserGalleryItems(
      { dispatch, commit, rootGetters },
      {
        userId,
        options = {},
        reset = false,
      }: { userId: string; options?: GalleryOptions; reset: boolean }
    ) {
      commit('SET_LOADING', true);
      try {
        if (reset) {
          commit('RESET_IMAGES');
        }
        const {
          paletteType,
          maskType,
          coloristicType,
          title,
          pageSize = 50,
          lastDoc,
          folderId,
        } = options;
        const itemsRef = collection(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items');
        const constraints: QueryConstraint[] = [where('userId', '==', userId)];
        const constraintsForCount: QueryConstraint[] = [where('userId', '==', userId)];
        if (coloristicType) {
          constraints.push(where('coloristicType', '==', coloristicType));
          constraintsForCount.push(where('coloristicType', '==', coloristicType));
        }

        if (maskType) {
          constraints.push(where('maskType', '==', maskType));
          constraintsForCount.push(where('maskType', '==', maskType));
        }

        if (paletteType) {
          constraints.push(where('paletteType', '==', paletteType));
          constraintsForCount.push(where('paletteType', '==', paletteType));
        }

        if (folderId) {
          constraints.push(where('folderId', '==', folderId));
          constraintsForCount.push(where('folderId', '==', folderId));
        }

        if (title) {
          // префиксный поиск по title
          constraints.push(where('tokens', 'array-contains', title.toLowerCase()));
          constraintsForCount.push(where('tokens', 'array-contains', title.toLowerCase()));
        }
        constraints.push(orderBy('createdAt', 'desc'));
        if (lastDoc) {
          constraints.push(startAfter(lastDoc));
        }

        constraints.push(limit(pageSize));

        const queryForGallery = query(itemsRef, ...constraints);
        const queryForCount = query(itemsRef, ...constraintsForCount);

        const totalImages = await getCountFromServer(queryForCount);
        const snapshot = await getDocs(queryForGallery);
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            src: data.url,
            title: data.title,
            coloristicType: data.coloristicType,
            maskType: data.maskType,
            paletteType: data.paletteType,
            folder: rootGetters['folder/getFolderById'](data.folderId),
          };
        });
        commit('SET_IMAGES', {
          items,
          lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
          totalImages: totalImages.data().count,
        });
      } catch (err) {
        console.error(err);
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
    async updateImageInGallery({ dispatch, commit }, payload: ImageUpdate) {
      try {
        const itemRef = doc(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items', payload.id);
        await updateDoc(itemRef, {
          ...payload,
          updatedAt: new Date(),
          tokens: payload?.title ? tokenizeTitle(payload.title) : [],
        });
        commit('UPDATE_IMAGE', payload);

        await dispatch(
          'toast/addToast',
          { message: 'successUpdateImage', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
        throw err;
      }
    },
    async deleteImageFromGallery({ dispatch, commit }, { id }: { id: string }) {
      try {
        // 1. Удаляем документ из Firestore
        const itemRef = doc(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items', id);
        await deleteDoc(itemRef);
        commit('DELETE_IMAGE', id);
        await dispatch(
          'toast/addToast',
          { message: 'successDeleteImage', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
        throw err;
      }
    },
    async deleteImagesFromGallery({ dispatch, commit }, ids: string[]) {
      try {
        // 1. Удаляем все документы параллельно
        await Promise.all(
          ids.map((id) => {
            const itemRef = doc(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items', id);
            return deleteDoc(itemRef);
          })
        );

        // 2. Коммитим удаление в state
        commit('DELETE_IMAGES', ids);

        // 3. Показываем тост
        await dispatch(
          'toast/addToast',
          { message: 'successDeleteImages', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        await dispatch(
          'toast/addToast',
          { message: e.code ? errorMessages[e.code] : 'unknownError', severity: 'error' },
          { root: true }
        );
        throw err;
      }
    },

    setFilter(ctx, payload: Partial<GalleryFilter> | null) {
      ctx.commit('SET_FILTER', payload);
    },
    setSelectedMode(ctx, isSelectedMode: boolean) {
      ctx.commit('SET_SELECTED_MODE', isSelectedMode);
    },
    setSelected(ctx, image: Image) {
      ctx.commit('SET_SELECTED', image);
    },
    setSelectedAll(ctx, images: Image[]) {
      ctx.commit('SET_SELECTED_ALL', images);
    },
    clearSelected(ctx) {
      ctx.commit('CLEAR_SELECTED');
    },
  },
  getters: {
    getImages(state: GalleryState): Image[] {
      return state.images;
    },
    getTotalImages(state: GalleryState): number {
      return state.totalImages;
    },
    getLastDoc(state: GalleryState): unknown | null {
      return state.lastDoc;
    },
    isLoading(state: GalleryState): boolean {
      return state.isLoading;
    },
    getFilter(state: GalleryState): Partial<GalleryFilter> | null {
      return state.filter;
    },
    getSelectedMode(state: GalleryState): boolean {
      return state.isSelectedMode;
    },
    getSelected(state: GalleryState): Image[] {
      return [...state.selectedImages.values()];
    },
    isSelected:
      (state: GalleryState) =>
      (id: string): boolean => {
        return state.selectedImages.has(id);
      },
  },
};
