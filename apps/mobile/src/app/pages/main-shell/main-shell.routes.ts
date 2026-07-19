import { Routes } from '@angular/router';
import { MainShellPage } from './main-shell.page';

export const MAIN_SHELL_ROUTES: Routes = [
  {
    path: '',
    component: MainShellPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../main-home/main-home.page').then((m) => m.MainHomePage),
      },
      {
        path: 'more',
        loadComponent: () => import('../more/more.page').then((m) => m.MorePage),
      },
      {
        path: 'characteristic-colors',
        loadComponent: () =>
          import('../characteristic-colors/characteristic-colors.page').then(
            (m) => m.CharacteristicColorsPage,
          ),
      },
      {
        path: 'palette-determinant',
        loadComponent: () =>
          import('../palette-determinant/palette-determinant.page').then(
            (m) => m.PaletteDeterminantPage,
          ),
      },
      {
        path: 'cut-palette',
        loadComponent: () =>
          import('../cut-palette/cut-palette.page').then((m) => m.CutPalettePage),
      },
      {
        path: 'my-palette',
        loadComponent: () =>
          import('../my-palette/my-palette.page').then((m) => m.MyPalettePage),
      },
      {
        path: 'palette',
        loadComponent: () => import('../palette/palette.page').then((m) => m.PalettePage),
      },
      {
        path: 'chroma',
        loadComponent: () => import('../chroma/chroma.page').then((m) => m.ChromaPage),
      },
      {
        path: 'ai-agent',
        loadComponent: () => import('../ai-agent/ai-agent.page').then((m) => m.AiAgentPage),
      },
      {
        path: 'gallery',
        loadComponent: () => import('../gallery/gallery.page').then((m) => m.GalleryPage),
      },
      {
        path: 'consultation',
        loadComponent: () => import('../consult/consult.page').then((m) => m.ConsultPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
