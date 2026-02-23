import { Module } from 'vuex';
import { db } from '@/firebase';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export interface ActiveUser {
  users: { email: string; createdAt: Date }[];
  loading: boolean;
  error: string | null;
}

export const activeUser: Module<ActiveUser, unknown> = {
  namespaced: true,
  state: (): ActiveUser => ({
    users: [],
    loading: false,
    error: null,
  }),
  getters: {
    getActiveUsers: (state: ActiveUser) => state.users,
    getLoading: (state: ActiveUser) => state.loading,
    getError: (state: ActiveUser) => state.error,
    getActiveUsersCount: (state: ActiveUser) => state.users.length,
    getLastActiveUsers: (state: ActiveUser) => (count: number) => state.users.slice(0, count),
  },
  mutations: {
    SET_LOADING(state: ActiveUser, payload: boolean) {
      state.loading = payload;
    },
    SET_ERROR(state: ActiveUser, payload: string | null) {
      state.error = payload;
    },
    SET_ACTIVE_USERS(state: ActiveUser, payload: { email: string; createdAt: Date }[]) {
      state.users = payload;
    },
    ADD_ACTIVE_USER(state: ActiveUser, payload: { email: string; createdAt: Date }) {
      state.users.unshift(payload);
    },
  },
  actions: {
    async setActiveUser({ commit }, payload: { email: string }) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);

        const parentRef = collection(db, 'statistics', 'j9uNVwKD7UiLuSjJ2Pkx', 'items');

        const docRef = await addDoc(parentRef, {
          email: payload.email,
          createdAt: serverTimestamp(),
        });

        // Добавляем пользователя в state с временным ID
        commit('ADD_ACTIVE_USER', {
          email: payload.email,
          createdAt: new Date(),
          id: docRef.id,
        });

        commit('SET_LOADING', false);
        return docRef;
      } catch (err) {
        commit('SET_ERROR', err instanceof Error ? err.message : 'Unknown error');
        console.error(err);
        throw err;
      }
    },

    async fetchActiveUsers({ commit }, options?: { limitCount?: number }) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);

        const parentRef = collection(db, 'statistics', 'j9uNVwKD7UiLuSjJ2Pkx', 'items');

        // Строим запрос с сортировкой по дате создания
        let q = query(parentRef, orderBy('createdAt', 'desc'));

        // Добавляем лимит, если указан
        if (options?.limitCount) {
          q = query(q, limit(options.limitCount));
        }

        const querySnapshot = await getDocs(q);

        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        commit('SET_ACTIVE_USERS', users);
        commit('SET_LOADING', false);

        return users;
      } catch (err) {
        commit('SET_ERROR', err instanceof Error ? err.message : 'Unknown error');
        commit('SET_LOADING', false);
        console.error('Error fetching active users:', err);
        throw err;
      }
    },

    async fetchActiveUsersByDateRange({ commit }, payload: { startDate: Date; endDate: Date }) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);

        const parentRef = collection(db, 'statistics', 'j9uNVwKD7UiLuSjJ2Pkx', 'items');

        const q = query(
          parentRef,
          orderBy('createdAt', 'desc')
          // Здесь можно добавить фильтрацию по дате, если нужно
        );

        const querySnapshot = await getDocs(q);

        const users = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))
          .filter((user) => {
            const userDate = user.createdAt;
            return userDate >= payload.startDate && userDate <= payload.endDate;
          });

        commit('SET_ACTIVE_USERS', users);
        commit('SET_LOADING', false);

        return users;
      } catch (err) {
        commit('SET_ERROR', err instanceof Error ? err.message : 'Unknown error');
        commit('SET_LOADING', false);
        console.error('Error fetching active users by date range:', err);
        throw err;
      }
    },
  },
};
