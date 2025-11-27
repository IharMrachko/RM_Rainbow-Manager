import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import MainLayout from '@/views/main/MainLayout.vue';
import ColorView from '@/views/main/views/color-view/ColorView.vue';
import store from '@/store';
import GalleryView from '@/views/main/views/gallery/GalleryView.vue';
import ChromaView from '@/views/main/views/chroma/ChromaView.vue';
import OpenLayout from '@/views/open/OpenLayout.vue';
import SignInView from '@/views/open/views/SignInView.vue';
import ForgotView from '@/views/open/views/ForgotView.vue';
import HomeView from '@/views/open/views/HomeView.vue';
import SignUpView from '@/views/open/views/SignUpView.vue';
import AIAgentView from '@/views/main/views/ai-agent/AIAgentView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'open',
    component: OpenLayout,
    redirect: '/signIn',
    children: [
      {
        path: 'home',
        name: 'home',
        component: HomeView,
      },
      {
        path: 'signIn',
        name: 'signIn',
        component: SignInView,
      },
      {
        path: 'signUp',
        name: 'signUp',
        component: SignUpView,
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
        path: 'chroma',
        name: 'chroma',
        component: ChromaView,
        meta: { requiresAuth: true },
      },
      {
        path: 'ai-agent',
        name: 'ai-agent',
        component: AIAgentView,
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
  history: createWebHashHistory('/RM_Rainbow-Manager/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters['authFirebase/isAuthenticated'];
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'signIn' });
    } else {
      next();
    }
  } else {
    // если пользователь уже вошёл и идёт на /login → редиректим в main
    if (to.name === 'signIn' && isAuthenticated) {
      next({ name: 'color' });
    } else {
      next();
    }
  }
});

export default router;
