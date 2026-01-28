import { Module } from 'vuex';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db } from '@/firebase';
import { errorMessages } from '@/helpers/error-message.helper';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
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
          email: payload.email,
          role: payload.role,
          createdAt: serverTimestamp(),
        });
        commit('setUser', userCredential.user);
        dispatch(
          'toast/addToast',
          {
            message: 'registrationSuccessful',
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
        dispatch(
          'toast/addToast',
          {
            message: 'loginSuccessful',
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
        commit('setLoading', false);
        throw err;
      } finally {
        commit('setLoading', false);
      }
    },

    // Вход через Google
    async loginWithGoogle({ commit, dispatch }) {
      commit('setGoogleLoading', true);
      try {
        const provider = new GoogleAuthProvider();

        // Добавляем дополнительные scope для получения информации о пользователе
        provider.addScope('profile');
        provider.addScope('email');

        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await dispatch('checkAndCreateUserInDatabase', user);

        commit('setUser', user);

        dispatch(
          'toast/addToast',
          {
            message: 'loginSuccessful',
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
            message: e.code ? errorMessages[e.code] || e.message : 'unknownError',
            severity: 'error',
            duration: 3000,
          },
          { root: true }
        );
        throw err;
      }
    },

    // Проверка и создание пользователя в базе данных
    async checkAndCreateUserInDatabase(_, user: User) {
      try {
        // Проверяем, существует ли пользователь уже в нашей коллекции
        const userRef = doc(db, 'users', 'Asbe4RDbnbYilRIWtx4F', 'items', user.uid);

        // Можно проверить существование документа или просто создать/обновить
        const userData = {
          userId: user.uid,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ')[1] || '',
          email: user.email,
          role: 'USER',
          createdAt: serverTimestamp(),
        };

        await setDoc(userRef, userData, { merge: true });
      } catch (e) {
        console.error(e);
      }
    },

    async logout({ commit }) {
      await signOut(auth);
      commit('setUser', null);
    },

    async resetPassword({ dispatch }, email: string) {
      try {
        await sendPasswordResetEmail(auth, email);
        dispatch(
          'toast/addToast',
          { message: 'passwordResetEmailSent', severity: 'success', duration: 3000 },
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
      }
    },
  },
};
