import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import store from './store';
import 'modern-css-reset';
// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Добавляем иконку в библиотеку
library.add(faEnvelope);
library.add(faLock);

createApp(App).use(store).use(router).component('font-awesome-icon', FontAwesomeIcon).mount('#app');
