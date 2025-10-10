import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import store from './store';
import 'modern-css-reset';
// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCheckCircle,
  faEnvelope,
  faExclamationTriangle,
  faFileUpload,
  faInfoCircle,
  faLock,
  faLongArrowAltRight,
  faMinus,
  faPlus,
  faSave,
  faTimesCircle,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import './styles/style.scss';
import { i18n } from '../i18n';

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
  faMinus
);

createApp(App)
  .use(store)
  .use(router)
  .use(i18n)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app');
