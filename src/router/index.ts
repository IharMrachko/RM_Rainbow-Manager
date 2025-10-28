import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import AuthLayout from '@/views/auth/AuthLayout.vue';
import LoginView from '@/views/auth/views/LoginView.vue';
import ForgotView from '@/views/auth/views/ForgotView.vue';
import MainLayout from '@/views/main/MainLayout.vue';
import ColorView from '@/views/main/views/color-view/ColorView.vue';
import store from '@/store';
import GalleryView from '@/views/main/views/gallery/GalleryView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'auth',
    component: AuthLayout,
    redirect: '/login',
    children: [
      {
        path: 'login',
        name: 'login',
        component: LoginView,
      },
      {
        path: 'forgot',
        name: 'forgot',
        component: ForgotView,
      },
    ],
  },
  {
    path: '/main',
    name: 'main',
    component: MainLayout,
    redirect: '/main/color',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'color',
        name: 'color',
        component: ColorView,
        meta: { requiresAuth: true },
      },
      {
        path: 'gallery',
        name: 'gallery',
        component: GalleryView,
        meta: { requiresAuth: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory('/vue3/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['authFirebase/isAuthenticated'];
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'login' });
    } else {
      next();
    }
  } else {
    // если пользователь уже вошёл и идёт на /login → редиректим в main
    if (to.name === 'login' && isAuthenticated) {
      next({ name: 'color' });
    } else {
      next();
    }
  }
});

export default router;
