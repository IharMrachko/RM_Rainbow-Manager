import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import AuthLayout from '@/views/auth/AuthLayout.vue';
import LoginView from '@/views/auth/views/LoginView.vue';
import ForgotView from '@/views/auth/views/ForgotView.vue';
import MainLayout from '@/views/main/MainLayout.vue';
import ColorView from '@/views/main/views/ColorView.vue';

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
    children: [
      {
        path: 'color',
        name: 'color',
        component: ColorView,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory('/vue3/'),
  routes,
});

export default router;
