import {
  Injectable,
  Injector,
  InjectionToken,
  Type,
} from '@angular/core';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { firstValueFrom, Subject } from 'rxjs';
import { AppMenuService } from './app-menu.service';

export const OVERLAY_SHEET_DATA = new InjectionToken<unknown>('OVERLAY_SHEET_DATA');
export const OVERLAY_SHEET_REF = new InjectionToken<OverlaySheetRef<unknown>>('OVERLAY_SHEET_REF');

export interface OverlaySheetOpenOptions extends Partial<OverlayConfig> {
  /** Pin pane to the full viewport (camera, etc.). */
  fullscreen?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /**
   * Keep the currently open sheet (e.g. confirm on top of viewer).
   * Default closes any previous sheet.
   */
  stack?: boolean;
}

export class OverlaySheetRef<T> {
  private readonly closed$ = new Subject<T | undefined>();
  private settled = false;
  private onDisposed: (() => void) | null = null;

  constructor(
    private readonly overlayRef: OverlayRef,
    options: { closeOnBackdrop?: boolean; closeOnEscape?: boolean } = {},
  ) {
    if (options.closeOnBackdrop !== false) {
      overlayRef.backdropClick().subscribe(() => this.close());
    }
    if (options.closeOnEscape !== false) {
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      });
    }
  }

  /** Wire stack cleanup before attach. */
  setDisposeHandler(handler: () => void): void {
    this.onDisposed = handler;
  }

  close(result?: T): void {
    if (this.settled) {
      return;
    }
    this.settled = true;
    this.closed$.next(result);
    this.closed$.complete();
    // Drop from service stack immediately (don't wait for detachments).
    try {
      this.onDisposed?.();
    } catch {
      /* ignore */
    }
    this.onDisposed = null;
    this.overlayRef.dispose();
  }

  afterClosed() {
    return this.closed$.asObservable();
  }
}

@Injectable({ providedIn: 'root' })
export class OverlaySheetService {
  private readonly stack: OverlaySheetRef<unknown>[] = [];

  constructor(
    private readonly overlay: Overlay,
    private readonly injector: Injector,
    private readonly appMenu: AppMenuService,
  ) {}

  open<C, D, R = unknown>(
    component: Type<C>,
    data: D,
    options: OverlaySheetOpenOptions = {},
  ): Promise<R | undefined> {
    if (!options.stack) {
      this.closeAll();
    }

    const {
      fullscreen = false,
      closeOnBackdrop = !fullscreen,
      closeOnEscape = true,
      stack: _stack,
      panelClass,
      ...overlayConfig
    } = options;

    const positionStrategy = fullscreen
      ? this.overlay.position().global().top('0').left('0').right('0').bottom('0')
      : this.overlay.position().global().left('0').right('0').bottom('0');

    const panelClasses = [
      'rm-cdk-panel',
      ...(fullscreen ? ['rm-cdk-panel--fullscreen'] : []),
      ...(options.stack ? ['rm-cdk-panel--stacked'] : []),
      ...(Array.isArray(panelClass) ? panelClass : panelClass ? [panelClass] : []),
    ];

    const overlayRef = this.overlay.create({
      hasBackdrop: overlayConfig.hasBackdrop ?? !fullscreen,
      backdropClass: overlayConfig.backdropClass ?? 'rm-cdk-backdrop',
      panelClass: panelClasses,
      width: '100%',
      maxWidth: '100%',
      height: fullscreen ? '100%' : undefined,
      maxHeight: fullscreen ? '100%' : undefined,
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      disposeOnNavigation: true,
      ...overlayConfig,
    });

    const sheetRef = new OverlaySheetRef<R>(overlayRef, {
      closeOnBackdrop,
      closeOnEscape,
    });
    this.stack.push(sheetRef as OverlaySheetRef<unknown>);
    sheetRef.setDisposeHandler(() => {
      const idx = this.stack.indexOf(sheetRef as OverlaySheetRef<unknown>);
      if (idx >= 0) {
        this.stack.splice(idx, 1);
      }
      this.syncMenuSwipe();
    });
    this.syncMenuSwipe();

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: OVERLAY_SHEET_DATA, useValue: data },
        { provide: OVERLAY_SHEET_REF, useValue: sheetRef },
      ],
    });

    overlayRef.attach(new ComponentPortal(component, null, injector));

    return firstValueFrom(sheetRef.afterClosed());
  }

  private syncMenuSwipe(): void {
    // Horizontal drags inside sheets (color picker, etc.) must not open ion-menu.
    this.appMenu.setSwipeEnabled(this.stack.length === 0);
    if (this.stack.length > 0) {
      this.appMenu.close();
    }
  }

  close(): void {
    const top = this.stack.pop();
    top?.close(undefined);
  }

  closeAll(): void {
    while (this.stack.length) {
      this.stack.pop()?.close(undefined);
    }
  }
}
