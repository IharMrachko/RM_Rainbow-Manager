import { Injectable } from '@angular/core';
import { OverlaySheetService } from './overlay-sheet.service';
import {
  ConfirmSheetComponent,
  ConfirmSheetData,
  ConfirmSheetResult,
} from '../../shared/components/confirm-sheet.component';

/**
 * Confirmation UI via CDK bottom sheet (same host as filter/viewer).
 * Ionic AlertController is not used — it renders under ion-app and stays
 * hidden behind CDK overlays.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private readonly sheets: OverlaySheetService) {}

  async danger(
    messageKey: string,
    headerKey = 'delete',
    confirmKey = 'delete',
    cancelKey = 'cancel',
  ): Promise<boolean> {
    return this.ask({
      titleKey: headerKey,
      messageKey,
      confirmKey,
      cancelKey,
      danger: true,
    });
  }

  async ask(data: ConfirmSheetData): Promise<boolean> {
    const result = await this.sheets.open<
      ConfirmSheetComponent,
      ConfirmSheetData,
      ConfirmSheetResult
    >(ConfirmSheetComponent, data, {
      fullscreen: false,
      closeOnBackdrop: true,
      // Keep viewer/filter open underneath when confirming from a sheet.
      stack: true,
      hasBackdrop: true,
      backdropClass: 'rm-cdk-backdrop',
    });
    return result === true;
  }
}

/** @deprecated Kept for callers that still lift Ionic overlays. */
export function liftAboveCdk(el: HTMLElement): void {
  const apply = (): void => {
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
    el.style.setProperty('z-index', '40000');
    el.style.setProperty('position', 'fixed');
    el.style.setProperty('inset', '0');
    el.style.setProperty('pointer-events', 'auto');
  };
  apply();
  requestAnimationFrame(apply);
  setTimeout(apply, 0);
}
