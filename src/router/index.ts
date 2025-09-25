import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import AuthLayout from '@/views/auth/AuthLayout.vue';
import LoginView from '@/views/auth/views/LoginView.vue';
import ForgotView from '@/views/auth/views/ForgotView.vue';

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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
