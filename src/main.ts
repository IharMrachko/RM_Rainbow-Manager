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
  faBullseye,
  faCamera,
  faCheck,
  faCheckCircle,
  faCheckDouble,
  faChevronDown,
  faChevronUp,
  faCircle,
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
  faFillDrip,
  faFilter,
  faFolder,
  faGear,
  faGift,
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
  faPiggyBank,
  faPlay,
  faPlus,
  faQuestion,
  faQuestionCircle,
  faRainbow,
  faRightFromBracket,
  faSave,
  faScissors,
  faSearch,
  faShare,
  faSignIn,
  faSignOut,
  faSliders,
  faSquare,
  faTimes,
  faTimesCircle,
  faToggleOff,
  faToggleOn,
  faTrash,
  faUndo,
  faUserPlus,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import './styles/style.scss';
import { i18n } from '../i18n';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { faGoogle, faTelegram } from '@fortawesome/free-brands-svg-icons';

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
  faPaintBrush,
  faUserTie,
  faGift,
  faPiggyBank,
  faCheckDouble,
  faBullseye,
  faCopy,
  faFillDrip,
  faScissors,
  faSquare,
  faCircle,
  faPlay,
  faToggleOff,
  faToggleOn,
  faChevronUp,
  faChevronDown
);

// @ts-ignore
library.add(faTelegram, faGoogle);

onAuthStateChanged(auth, (user) => {
  store.commit('authFirebase/setUser', user);
});

createApp(App)
  .use(store)
  .use(router)
  .use(i18n)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app');
