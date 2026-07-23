import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Palette, palettesObjShort } from '@rainbow/shared';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';
import {
  StockLooksCategory,
  StockLooksMode,
  StockLooksProvider,
} from '../../core/services/stock-looks.types';

export interface StockLooksFilterSheetState {
  provider: StockLooksProvider;
  palette: Palette;
  category: StockLooksCategory;
}

export interface StockLooksFilterSheetData {
  mode: StockLooksMode;
  filter: StockLooksFilterSheetState;
  paletteNames: Palette[];
  categories: StockLooksCategory[];
  providers: StockLooksProvider[];
  hasPexelsKey: boolean;
  hasUnsplashKey: boolean;
  hasPixabayKey: boolean;
}

export type StockLooksFilterSheetResult = StockLooksFilterSheetState | null;

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-stock-looks-filter-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-filter-sheet stock-filter-sheet" role="dialog" aria-modal="true">
      <header class="rm-filter-sheet__head">
        <h2>{{ 'filter' | translate }}</h2>
        <button type="button" class="rm-filter-sheet__close" (click)="cancel()" aria-label="close">
          <ion-icon name="close"></ion-icon>
        </button>
      </header>

      <div class="rm-filter-sheet__body stock-filter-sheet__body">
        <section class="stock-filter-sheet__block">
          <h3>{{ 'stockLooksProvider' | translate }}</h3>
          <div class="stock-filter-sheet__chips">
            @for (p of data.providers; track p) {
              <button
                type="button"
                class="stock-filter-sheet__chip"
                [class.is-on]="provider === p"
                (click)="provider = p"
              >
                {{ providerKey(p) | translate }}
              </button>
            }
          </div>
          @if (!data.hasPexelsKey || !data.hasUnsplashKey || !data.hasPixabayKey) {
            <p class="stock-filter-sheet__hint">
              @if (!data.hasPexelsKey && !data.hasUnsplashKey && !data.hasPixabayKey) {
                {{ 'stockLooksNoKeys' | translate }}
              } @else {
                @if (!data.hasPexelsKey) {
                  <span>{{ 'stockLooksMissingPexels' | translate }}</span>
                }
                @if (!data.hasUnsplashKey) {
                  <span>{{ 'stockLooksMissingUnsplash' | translate }}</span>
                }
                @if (!data.hasPixabayKey) {
                  <span>{{ 'stockLooksMissingPixabay' | translate }}</span>
                }
              }
            </p>
          }
        </section>

        @if (data.mode === 'palette') {
          <section class="stock-filter-sheet__block">
            <h3>{{ 'stockLooksCategory' | translate }}</h3>
            <div class="stock-filter-sheet__chips">
              @for (category of data.categories; track category) {
                <button
                  type="button"
                  class="stock-filter-sheet__chip"
                  [class.is-on]="selectedCategory === category"
                  (click)="selectedCategory = category"
                >
                  {{ categoryKey(category) | translate }}
                </button>
              }
            </div>
          </section>

          <section class="stock-filter-sheet__block">
            <h3>{{ 'stockLooksPalette' | translate }}</h3>
            <div class="stock-filter-sheet__swatches" aria-hidden="true">
              @for (hex of accentSwatches; track hex) {
                <span [style.background]="hex"></span>
              }
            </div>
            <div class="stock-filter-sheet__chips stock-filter-sheet__chips--wrap">
              @for (name of data.paletteNames; track name) {
                <button
                  type="button"
                  class="stock-filter-sheet__chip"
                  [class.is-on]="selectedPalette === name"
                  (click)="selectedPalette = name"
                >
                  {{ name | translate }}
                </button>
              }
            </div>
          </section>
        }
      </div>

      <div class="rm-filter-sheet__actions">
        <button type="button" class="rm-filter-sheet__secondary" (click)="cancel()">
          {{ 'cancel' | translate }}
        </button>
        <button type="button" class="rm-filter-sheet__primary" (click)="apply()">
          {{ 'apply' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      app-stock-looks-filter-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-filter-sheet {
        width: 100%;
        box-sizing: border-box;
        margin: 0;
        padding: 18px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: #fff;
        box-shadow: 0 16px 40px rgba(22, 24, 42, 0.22);
        color: #16182a;
        font-family: var(--rm-font-body, Outfit, system-ui, sans-serif);
      }

      .rm-filter-sheet__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .rm-filter-sheet__head h2 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }

      .rm-filter-sheet__close {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        background: #eef0f7;
        color: #16182a;
        display: grid;
        place-items: center;
        font-size: 1.25rem;
      }

      .stock-filter-sheet__body {
        display: grid;
        gap: 16px;
        max-height: min(62vh, 520px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding-bottom: 4px;
      }

      .stock-filter-sheet__block h3 {
        margin: 0 0 8px;
        font-size: 0.78rem;
        font-weight: 650;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: #6b7280;
      }

      .stock-filter-sheet__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .stock-filter-sheet__chip {
        border: 1px solid #d7dbe8;
        background: #fff;
        color: #374151;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 0.86rem;
        font-weight: 600;
        line-height: 1.2;
      }

      .stock-filter-sheet__chip.is-on {
        border-color: #5b6ef5;
        background: color-mix(in srgb, #5b6ef5 14%, #fff);
        color: #3d4fd6;
      }

      .stock-filter-sheet__swatches {
        display: flex;
        gap: 6px;
        margin-bottom: 10px;
        overflow: hidden;
      }

      .stock-filter-sheet__swatches span {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        border: 1px solid rgba(22, 24, 42, 0.12);
        flex: 0 0 auto;
      }

      .stock-filter-sheet__hint {
        margin: 8px 0 0;
        font-size: 0.78rem;
        line-height: 1.35;
        color: #6b7280;
        display: grid;
        gap: 4px;
      }

      .rm-filter-sheet__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 16px;
      }

      .rm-filter-sheet__secondary,
      .rm-filter-sheet__primary {
        min-height: 48px;
        border: none;
        border-radius: 14px;
        font-size: 0.95rem;
        font-weight: 700;
      }

      .rm-filter-sheet__secondary {
        background: #e4e7f2;
        color: #16182a;
      }

      .rm-filter-sheet__primary {
        background: #5b6ef5;
        color: #fff;
      }
    `,
  ],
})
export class StockLooksFilterSheetComponent {
  provider: StockLooksProvider;
  selectedPalette: Palette;
  selectedCategory: StockLooksCategory;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: StockLooksFilterSheetData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<StockLooksFilterSheetResult>,
  ) {
    this.provider = data.filter.provider;
    this.selectedPalette = data.filter.palette;
    this.selectedCategory = data.filter.category;
  }

  get accentSwatches(): string[] {
    return (palettesObjShort[this.selectedPalette] ?? []).slice(0, 8);
  }

  providerKey(provider: StockLooksProvider): string {
    if (provider === 'pexels') return 'stockLooksProviderPexels';
    if (provider === 'unsplash') return 'stockLooksProviderUnsplash';
    if (provider === 'pixabay') return 'stockLooksProviderPixabay';
    return 'stockLooksProviderAll';
  }

  categoryKey(category: StockLooksCategory): string {
    if (category === 'outfit') return 'stockLooksCategoryOutfit';
    if (category === 'portrait') return 'stockLooksCategoryPortrait';
    return 'stockLooksCategoryAccessories';
  }

  apply(): void {
    this.sheetRef.close({
      provider: this.provider,
      palette: this.selectedPalette,
      category: this.selectedCategory,
    });
  }

  cancel(): void {
    this.sheetRef.close(null);
  }
}
