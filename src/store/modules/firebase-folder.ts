import { Module } from 'vuex';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';

export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export interface FolderState {
  items: Folder[];
  filterItems: Folder[];
  isLoading: boolean;
}

export const folder: Module<FolderState, any> = {
  namespaced: true,
  state: (): FolderState => ({
    items: [],
    filterItems: [],
    isLoading: false,
  }),
  mutations: {
    SET_FOLDERS(state, folders: Folder[]) {
      state.items = folders;
      state.filterItems = folders;
    },
    ADD_FOLDERS(state, folder: Folder) {
      state.items.push(folder);
    },
    SET_LOADING(state, value: boolean) {
      state.isLoading = value;
    },
    REMOVE_FOLDER(state, folderId: string) {
      state.items = state.items.filter((f) => f.id !== folderId);
      state.filterItems = state.items;
    },
    UPDATE_FOLDER(state, updated: Folder) {
      const idx = state.items.findIndex((f) => f.id === updated.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...updated };
        state.filterItems[idx] = { ...state.items[idx], ...updated };
      }
    },
    FILTER_FOLDER(state, search: string) {
      if (!search) {
        state.filterItems = state.items;
        return;
      }
      state.filterItems = state.items.filter((f) =>
        f.name.toLowerCase().trim().includes(search.toLowerCase().trim())
      );
    },
  },
  actions: {
    async saveFolder({ dispatch, commit }, { userId, name }) {
      commit('SET_LOADING', true);
      try {
        const parentRef = collection(db, 'folder', 'bCxB7W5QIQZQAOSBcbfa', 'items');

        const docRef = await addDoc(parentRef, {
          userId,
          name,
          createdAt: new Date(),
        });

        // добавляем в state
        commit('ADD_FOLDERS', {
          id: docRef.id,
          userId,
          name,
          createdAt: new Date(),
        });

        await dispatch(
          'toast/addToast',
          { message: 'successFolderCreate', severity: 'success' },
          { root: true }
        );
      } catch (e) {
        await dispatch(
          'toast/addToast',
          { message: 'errorFolder', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async getFolders({ dispatch, commit }, userId: string) {
      commit('SET_LOADING', true);
      try {
        const parentRef = collection(db, 'folder', 'bCxB7W5QIQZQAOSBcbfa', 'items');
        const q = query(parentRef, where('userId', '==', userId));

        const snapshot = await getDocs(q);
        const folders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Folder[];

        commit('SET_FOLDERS', folders);
        return folders;
      } catch (e) {
        await dispatch(
          'toast/addToast',
          { message: 'errorLoadFolders', severity: 'error' },
          { root: true }
        );
        return [];
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async deleteFolder({ dispatch, commit }, folderId: string) {
      commit('SET_LOADING', true);
      try {
        const folderRef = doc(db, 'folder', 'bCxB7W5QIQZQAOSBcbfa', 'items', folderId);

        await deleteDoc(folderRef);

        commit('REMOVE_FOLDER', folderId);

        await dispatch(
          'toast/addToast',
          { message: 'successDeleteFolder', severity: 'success' },
          { root: true }
        );
      } catch (e) {
        await dispatch(
          'toast/addToast',
          { message: 'errorDeleteFolder', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async updateFolder({ dispatch, commit }, { id, name }: { id: string; name: string }) {
      commit('SET_LOADING', true);
      try {
        const folderRef = doc(db, 'folder', 'bCxB7W5QIQZQAOSBcbfa', 'items', id);

        await updateDoc(folderRef, { name });

        commit('UPDATE_FOLDER', { id, name });

        await dispatch(
          'toast/addToast',
          { message: 'successUpdateFolder', severity: 'success' },
          { root: true }
        );
      } catch (e) {
        await dispatch(
          'toast/addToast',
          { message: 'errorUpdateFolder', severity: 'error' },
          { root: true }
        );
      } finally {
        commit('SET_LOADING', false);
      }
    },
    filterFolder(ctx, search: string) {
      ctx.commit('FILTER_FOLDER', search);
    },
  },
  getters: {
    getFolders(state: FolderState): Folder[] {
      return state.items;
    },
    getFilterFolders(state: FolderState): Folder[] {
      return state.filterItems;
    },
    isLoading(state: FolderState): boolean {
      return state.isLoading;
    },
    getFolderById:
      (state: FolderState) =>
      (id: string): Folder | undefined => {
        return state.items.find((f) => f.id === id);
      },
  },
};
