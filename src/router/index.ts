import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import MainLayout from '@/views/main/MainLayout.vue';
import CharacteristicColorsView from '@/views/main/views/characteristic-colors/CharacteristicColorsView.vue';
import store from '@/store';
import GalleryView from '@/views/main/views/gallery/GalleryView.vue';
import ChromaView from '@/views/main/views/chroma/ChromaView.vue';
import OpenLayout from '@/views/open/OpenLayout.vue';
import SignInView from '@/views/open/views/SignInView.vue';
import ForgotView from '@/views/open/views/ForgotView.vue';
import HomeView from '@/views/open/views/HomeView.vue';
import SignUpView from '@/views/open/views/SignUpView.vue';
import AIAgentView from '@/views/main/views/ai-agent/AIAgentView.vue';
import PaletteView from '@/views/main/views/palette/PaletteView.vue';
import FAQView from '@/views/open/views/FAQView.vue';
import ContactUsView from '@/views/open/views/ContactUsView.vue';
import PaletteDeterminantView from '@/views/main/views/palette-determinant/PaletteDeterminantView.vue';
import MyPaletteView from '@/views/main/views/my-palette/MyPaletteView.vue';
import ConsultView from '@/views/main/views/consult/ConsultView.vue';
import CutPaletteColorView from '@/views/main/views/cut-palette-color/views/CutPaletteColorView.vue';
import CutPaletteCololorCanvasEditView from '@/views/main/views/cut-palette-color/views/CutPaletteCololorCanvasEditView.vue';
import CutPaletteColorContainer from '@/views/main/views/cut-palette-color/CutPaletteColorContainer.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'open',
    component: OpenLayout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'home',
        component: HomeView,
      },
      {
        path: 'consultation',
        name: 'open-consultation',
        component: ConsultView,
      },
      {
        path: 'FAQ',
        name: 'FAQ',
        component: FAQView,
      },
      {
        path: 'contacts',
        name: 'contacts',
        component: ContactUsView,
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
    redirect: '/main/characteristic-colors',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'characteristic-colors',
        name: 'characteristic-colors',
        component: CharacteristicColorsView,
        meta: { requiresAuth: true },
      },
      {
        path: 'palette-determinant',
        name: 'palette-determinant',
        component: PaletteDeterminantView,
        meta: { requiresAuth: true },
      },
      {
        path: 'my-palette',
        name: 'my-palette',
        component: MyPaletteView,
        meta: { requiresAuth: true },
      },
      {
        path: 'chroma',
        name: 'chroma',
        component: ChromaView,
        meta: { requiresAuth: true },
      },
      {
        path: 'cut-palette-color',
        name: 'cut-palette-color',
        component: CutPaletteColorContainer,
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'cut-palette-color-view',
            component: CutPaletteColorView,
            meta: { requiresAuth: true },
          },
          {
            path: 'edit',
            name: 'edit',
            component: CutPaletteCololorCanvasEditView,
            meta: { requiresAuth: true },
          },
        ],
      },
      {
        path: 'palette',
        name: 'palette',
        component: PaletteView,
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
      {
        path: 'consultation',
        name: 'main-consultation',
        component: ConsultView,
        meta: { requiresAuth: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
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
      next({ name: 'characteristic-colors' });
    } else {
      next();
    }
  }
});

export default router;
