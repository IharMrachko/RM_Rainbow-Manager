import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'home',
    canActivate: [guestGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'sign-in',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/sign-in/sign-in.page').then((m) => m.SignInPage),
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/sign-up/sign-up.page').then((m) => m.SignUpPage),
  },
  {
    path: 'forgot',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/forgot/forgot.page').then((m) => m.ForgotPage),
  },

  {
    path: 'contacts',
    loadComponent: () => import('./pages/contacts/contacts.page').then((m) => m.ContactsPage),
  },

  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./pages/tabs-shell/tabs-shell.routes').then((m) => m.TABS_SHELL_ROUTES),
  },
  // Legacy /main/* redirects
  { path: 'main/home', redirectTo: 'tabs/characteristics', pathMatch: 'full' },
  { path: 'main/characteristic-colors', redirectTo: 'tabs/characteristics', pathMatch: 'full' },
  { path: 'main/palette-determinant', redirectTo: 'tabs/palette-determinant', pathMatch: 'full' },
  { path: 'tabs/picker', redirectTo: 'tabs/palette-determinant', pathMatch: 'full' },
  { path: 'main/cut-palette', redirectTo: 'tabs/cut', pathMatch: 'full' },
  { path: 'main/gallery', redirectTo: 'tabs/gallery', pathMatch: 'full' },
  { path: 'main/stock-looks', redirectTo: 'tabs/stock-looks', pathMatch: 'full' },
  { path: 'main/chroma', redirectTo: 'tabs/chroma', pathMatch: 'full' },
  { path: 'main/ai-agent', redirectTo: 'tabs/ai-agent', pathMatch: 'full' },
  { path: 'main/consultation', redirectTo: 'tabs/consultation', pathMatch: 'full' },
  { path: 'main/account', redirectTo: 'tabs/account', pathMatch: 'full' },
  { path: 'main/my-palette', redirectTo: 'tabs/my-palette', pathMatch: 'full' },
  { path: 'main/palette', redirectTo: 'tabs/palette', pathMatch: 'full' },
  { path: 'main/more', redirectTo: 'tabs/characteristics', pathMatch: 'full' },
  { path: 'main', redirectTo: 'tabs/characteristics', pathMatch: 'full' },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
