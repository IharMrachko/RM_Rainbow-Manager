import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import store from './store';
import './firebase';
import 'modern-css-reset';
// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowLeft,
  faArrowRight,
  faCheckCircle,
  faEllipsisH,
  faEllipsisVertical,
  faEnvelope,
  faExclamationTriangle,
  faFileUpload,
  faImages,
  faInfoCircle,
  faLock,
  faLongArrowAltRight,
  faMinus,
  faPencilSquare,
  faPlus,
  faRainbow,
  faRightFromBracket,
  faSave,
  faTimesCircle,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import './styles/style.scss';
import { i18n } from '../i18n';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

library.add(
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
  faExclamationTriangle,
  faLock,
  faLongArrowAltRight,
  faEnvelope,
  faFileUpload,
  faUndo,
  faSave,
  faPlus,
  faMinus,
  faRightFromBracket,
  faArrowLeft,
  faArrowRight,
  faRainbow,
  faImages,
  faEllipsisVertical,
  faEllipsisH,
  faPencilSquare
);

onAuthStateChanged(auth, (user) => {
  store.commit('authFirebase/setUser', user);
});

createApp(App)
  .use(store)
  .use(router)
  .use(i18n)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app');
