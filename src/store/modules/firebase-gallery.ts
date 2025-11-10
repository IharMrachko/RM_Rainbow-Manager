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
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Module } from 'vuex';
import { ColoristicType } from '@/types/coloristic.type';
import { MaskType } from '@/types/mask.type';
import { tokenizeTitle } from '@/helpers/tokenize-title.helper';
import { Folder } from '@/store/modules/firebase-folder';
import { ColorCard } from '@/views/main/views/color-view/components/color-card.constanst';

type GalleryOptions = {
  coloristicType?: ColoristicType | null;
  title?: string;
  pageSize?: number;
  lastDoc?: unknown;
  maskType?: MaskType | null;
  folderId?: string;
};
interface SaveOptions {
  userId: string;
  canvas: HTMLCanvasElement;
  path?: string;
  title?: string;
  coloristicType?: ColoristicType;
  maskType?: MaskType;
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
}

export interface GalleryFilter {
  maskType: ColorCard | null;
  coloristicType: { id: string; name: string } | null;
  folder: Folder | null;
}

interface GalleryState {
  images: Image[];
  isLoading: boolean;
  lastDoc: unknown | null;
  totalImages: number;
  filter: Partial<GalleryFilter> | null;
}

export const gallery: Module<GalleryState, any> = {
  namespaced: true,
  state: (): GalleryState => ({
    images: [],
    isLoading: false,
    lastDoc: null,
    totalImages: 0,
    filter: null,
  }),
  mutations: {
    SET_IMAGES(
      state: GalleryState,
      payload: {
        items: any[];
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
    UPDATE_IMAGE(state: GalleryState, payload: { id: string; updates: Partial<Image> }) {
      const index = state.images.findIndex((img) => img.id === payload.id);
      if (index !== -1) {
        state.images[index] = { ...state.images[index], ...payload.updates };
      }
    },

    DELETE_IMAGE(state: GalleryState, id: string) {
      state.images = state.images.filter((img) => img.id !== id);
      state.totalImages = Math.max(0, state.totalImages - 1);
    },
  },

  actions: {
    async saveImageToGallery(
      { dispatch },
      {
        canvas,
        path = `avatar/${Date.now()}.png`,
        title = '',
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
              maskType,
              folderId,
              createdAt: new Date(),
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
            await dispatch(
              'toast/addToast',
              { message: 'errorImage', severity: 'error' },
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
        const { maskType, coloristicType, title, pageSize = 20, lastDoc, folderId } = options;
        const itemsRef = collection(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items');

        const constraints: any[] = [where('userId', '==', userId)];
        const constraintsForCount: any[] = [where('userId', '==', userId)];
        if (coloristicType) {
          constraints.push(where('coloristicType', '==', coloristicType));
          constraintsForCount.push(where('coloristicType', '==', coloristicType));
        }

        if (maskType) {
          constraints.push(where('maskType', '==', maskType));
          constraintsForCount.push(where('maskType', '==', maskType));
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

        const q = query(itemsRef, ...constraints);
        const q2 = query(itemsRef, ...constraintsForCount);

        const totalImages = await getCountFromServer(q2);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            src: data.url,
            title: data.title,
            coloristicType: data.coloristicType,
            maskType: data.maskType,
            folder: rootGetters['folder/getFolderById'](data.folderId), // здесь доступен rootGetters
          };
        });
        commit('SET_IMAGES', {
          items,
          lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
          totalImages: totalImages.data().count,
        });
      } catch (e) {
        await dispatch(
          'toast/addToast',
          { message: 'Ошибка загрузки', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async updateImageInGallery(
      { dispatch, commit },
      { id, updates }: { id: string; updates: Partial<Image> }
    ) {
      try {
        const itemRef = doc(db, 'gallery', 'NoUcXcCCYhRoogXFHJfV', 'items', id);
        await updateDoc(itemRef, {
          ...updates,
          updatedAt: new Date(),
          tokens: updates?.title ? tokenizeTitle(updates.title) : [],
        });
        commit('UPDATE_IMAGE', { id, updates });

        await dispatch(
          'toast/addToast',
          { message: 'successUpdate', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        await dispatch(
          'toast/addToast',
          { message: 'errorUpdate', severity: 'error' },
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
          { message: 'successDelete', severity: 'success' },
          { root: true }
        );
      } catch (err) {
        await dispatch(
          'toast/addToast',
          { message: 'errorDelete', severity: 'error' },
          { root: true }
        );
        throw err;
      }
    },
    setFilter(ctx, payload: Partial<GalleryFilter> | null) {
      ctx.commit('SET_FILTER', payload);
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
  },
};
