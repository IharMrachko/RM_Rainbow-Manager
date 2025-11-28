import { Module } from 'vuex';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db } from '@/firebase';
import { errorMessages } from '@/helpers/error-message.helper';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { FirebaseError } from '@/interfaces/firebase-error.interface';

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export interface SignUp {
  firstName: string;
  lastName: string;
  birthDate: string;
  password: string;
  confirmPassword?: string;
  email: string;
  role: Role;
}
export interface AuthState {
  user: User | null;
  loading: boolean;
}
export const authFirebase: Module<AuthState, unknown> = {
  namespaced: true,
  state: (): AuthState => ({
    user: null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state: AuthState) => {
      const raw = localStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : null;
      return !!state.user || !!user;
    },
    currentUser: (state: AuthState) => state.user,
    isLoading: (state: AuthState) => state.loading,
    getUserId: () => {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw).uid : null;
    },
  },
  mutations: {
    setUser(state, user: User | null) {
      state.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    setLoading(state, value: boolean) {
      state.loading = value;
    },
  },
  actions: {
    async register({ commit, dispatch }, payload: SignUp) {
      commit('setLoading', true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          payload.email,
          payload.password
        );
        const parentRef = collection(db, 'users', 'Asbe4RDbnbYilRIWtx4F', 'items');

        await addDoc(parentRef, {
          userId: userCredential.user.uid,
          firstName: payload.firstName,
          lastName: payload.lastName,
          birthDate: payload.birthDate,
          email: payload.email,
          role: payload.role,
          createdAt: serverTimestamp(),
        });
        commit('setUser', userCredential.user);
        // можно добавить уведомление об успешной регистрации
        dispatch(
          'toast/addToast',
          {
            message: 'Регистрация прошла успешно!',
            severity: 'success',
            duration: 3000,
          },
          { root: true }
        );
      } catch (err) {
        const e = err as FirebaseError;
        dispatch(
          'toast/addToast',
          {
            message: e.code ? errorMessages[e.code] : 'unknownError',
            severity: 'error',
            duration: 3000,
          },
          { root: true }
        );
        throw err;
      } finally {
        commit('setLoading', false);
      }
    },
    async login({ commit, dispatch }, { email, password }: { email: string; password: string }) {
      commit('setLoading', true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        commit('setUser', userCredential.user);
      } catch (err) {
        const e = err as FirebaseError;
        dispatch(
          'toast/addToast',
          {
            message: e.code ? errorMessages[e.code] : 'unknownError',
            severity: 'error',
            duration: 3000,
          },
          { root: true }
        );
        commit('setLoading', false);
        throw err;
      } finally {
        commit('setLoading', false);
      }
    },
    async logout({ commit }) {
      await signOut(auth);
      commit('setUser', null);
    },
  },
};
