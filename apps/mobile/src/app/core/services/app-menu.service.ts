import { Injectable } from '@angular/core';
import { MenuController } from '@ionic/angular/standalone';

/** Opens/closes the app side menu (`menuId="app-menu"`). */
@Injectable({ providedIn: 'root' })
export class AppMenuService {
  static readonly menuId = 'app-menu';

  constructor(private readonly menu: MenuController) {}

  open(): void {
    void this.menu.open(AppMenuService.menuId);
  }

  close(): void {
    void this.menu.close(AppMenuService.menuId);
  }

  toggle(): void {
    void this.menu.toggle(AppMenuService.menuId);
  }

  /** Disable edge-swipe while overlays/sheets capture horizontal drags. */
  setSwipeEnabled(enabled: boolean): void {
    void this.menu.swipeGesture(enabled, AppMenuService.menuId);
  }
}
