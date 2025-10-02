import { createLogger, createStore } from 'vuex';
import { toast } from './modules/toast';
import { theme } from '@/store/modules/theme';
import { language } from '@/store/modules/language';

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    toast,
    theme,
    language,
  },
  plugins: [createLogger()],
});
