import { Module } from 'vuex';
import { signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth } from '@/firebase';
import { errorMessages } from '@/helpers/error-message.helper';

export interface AuthState {
  user: User | null;
  loading: boolean;
}
export const authFirebase: Module<AuthState, any> = {
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
    async login({ commit, dispatch }, { email, password }: { email: string; password: string }) {
      commit('setLoading', true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        commit('setUser', userCredential.user);
      } catch (err: any) {
        dispatch(
          'toast/addToast',
          {
            message: errorMessages[err.code],
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
