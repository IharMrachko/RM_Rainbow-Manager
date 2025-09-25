import { createLogger, createStore } from 'vuex';
import { toast } from './modules/toast';
import { theme } from '@/store/modules/theme';

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    toast,
    theme,
  },
  plugins: [createLogger()],
});
