import { Routes } from '@angular/router';
import { TabsShellPage } from './tabs-shell.page';

export const TABS_SHELL_ROUTES: Routes = [
  {
    path: '',
    component: TabsShellPage,
    children: [
      {
        path: 'characteristics',
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
        path: 'cut',
        loadComponent: () =>
          import('../cut-palette/cut-palette.page').then((m) => m.CutPalettePage),
      },
      {
        path: 'gallery',
        loadComponent: () => import('../gallery/gallery.page').then((m) => m.GalleryPage),
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
        path: 'consultation',
        loadComponent: () => import('../consult/consult.page').then((m) => m.ConsultPage),
      },
      {
        path: 'lookbook',
        loadComponent: () => import('../lookbook/lookbook.page').then((m) => m.LookbookPage),
      },
      {
        path: 'lookbook/:id',
        loadComponent: () =>
          import('../lookbook/lookbook-editor.page').then((m) => m.LookbookEditorPage),
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
        path: 'stock-looks',
        loadComponent: () =>
          import('../stock-looks/stock-looks.page').then((m) => m.StockLooksPage),
      },
      {
        path: 'account',
        loadComponent: () => import('../account/account.page').then((m) => m.AccountPage),
      },
      {
        path: 'contacts',
        loadComponent: () => import('../contacts/contacts.page').then((m) => m.ContactsPage),
      },
      {
        path: '',
        redirectTo: 'characteristics',
        pathMatch: 'full',
      },
    ],
  },
];
