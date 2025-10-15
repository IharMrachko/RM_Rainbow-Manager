import { createLogger, createStore } from 'vuex';
import { toast } from './modules/toast';
import { theme } from '@/store/modules/theme';
import { language } from '@/store/modules/language';
import { authFirebase } from '@/store/modules/auth';
import { mobile } from '@/store/modules/mobile-view';
import { burgerMenu } from '@/store/modules/burger-menu';

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    toast,
    theme,
    language,
    authFirebase,
    mobile,
    burgerMenu,
  },
  plugins: [createLogger()],
});
