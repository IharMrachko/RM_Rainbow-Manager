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
  faArrowUp,
  faBirthdayCake,
  faBroom,
  faBrush,
  faCamera,
  faCheck,
  faCheckCircle,
  faCog,
  faContactCard,
  faCopy,
  faDownload,
  faEllipsisH,
  faEllipsisVertical,
  faEnvelope,
  faExclamationTriangle,
  faEye,
  faEyeDropper,
  faEyeSlash,
  faFileUpload,
  faFilter,
  faFolder,
  faGear,
  faHome,
  faImages,
  faInfoCircle,
  faLink,
  faListOl,
  faLock,
  faLongArrowAltRight,
  faMask,
  faMicrochip,
  faMinus,
  faPaintBrush,
  faPalette,
  faPencil,
  faPencilSquare,
  faPlus,
  faQuestion,
  faQuestionCircle,
  faRainbow,
  faRightFromBracket,
  faSave,
  faSearch,
  faShare,
  faSignIn,
  faSignOut,
  faSliders,
  faTimes,
  faTimesCircle,
  faTrash,
  faUndo,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import './styles/style.scss';
import { i18n } from '../i18n';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

library.add(
  faSearch,
  faFilter,
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
  faPencilSquare,
  faPencil,
  faTimes,
  faTimesCircle,
  faTrash,
  faMask,
  faFolder,
  faCopy,
  faLink,
  faBroom,
  faCheck,
  faListOl,
  faShare,
  faCog,
  faGear,
  faSliders,
  faDownload,
  faCamera,
  faEyeDropper,
  faSignIn,
  faSignOut,
  faUserPlus,
  faHome,
  faBirthdayCake,
  faEye,
  faEyeSlash,
  faMicrochip,
  faArrowUp,
  faPalette,
  faExclamationTriangle,
  faQuestion,
  faQuestionCircle,
  faContactCard,
  faArrowLeft,
  faBrush,
  faPaintBrush
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
