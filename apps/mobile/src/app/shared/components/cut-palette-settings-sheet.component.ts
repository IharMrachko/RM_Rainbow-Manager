import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonLabel,
  IonRange,
  IonSegment,
  IonSegmentButton,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export type CutPaletteShape = 'square' | 'circle' | 'triangle';
export type CutPaletteSettingsTab = 'shape' | 'grid' | 'size' | 'shadow';

export interface CutPaletteEditorModel {
  shape: CutPaletteShape;
  columns: number;
  rows: number;
  elementSize: number;
  spacing: number;
  shadowBlur: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  rotation: number;
  tab: CutPaletteSettingsTab;
}

export interface CutPaletteSettingsSheetData {
  model: CutPaletteEditorModel;
  onChange: () => void;
}

@Component({
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    IonIcon,
    IonLabel,
    IonRange,
    IonSegment,
    IonSegmentButton,
  ],
  selector: 'app-cut-palette-settings-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-cut-settings" role="dialog" aria-modal="true">
      <div class="rm-cut-settings__handle"></div>

      <ion-segment
        mode="md"
        scrollable="false"
        class="rm-cut-settings__seg"
        [value]="model.tab"
        (ionChange)="onTabChange($event)"
      >
        <ion-segment-button value="shape">
          <ion-label>{{ 'shapeOfElements' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button value="grid">
          <ion-label>{{ 'arrangementElements' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button value="size">
          <ion-label>{{ 'sizingSettings' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button value="shadow">
          <ion-label>{{ 'shadowSettings' | translate }}</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div class="rm-cut-settings__body">
        @if (model.tab === 'shape') {
          <div class="rm-cut-settings__shapes">
            <button
              type="button"
              class="rm-cut-settings__shape"
              [class.is-active]="model.shape === 'square'"
              (click)="setShape('square')"
              aria-label="square"
            >
              <span class="rm-cut-settings__icon rm-cut-settings__icon--square"></span>
            </button>
            <button
              type="button"
              class="rm-cut-settings__shape"
              [class.is-active]="model.shape === 'circle'"
              (click)="setShape('circle')"
              aria-label="circle"
            >
              <span class="rm-cut-settings__icon rm-cut-settings__icon--circle"></span>
            </button>
            <button
              type="button"
              class="rm-cut-settings__shape"
              [class.is-active]="model.shape === 'triangle'"
              (click)="setShape('triangle')"
              aria-label="triangle"
            >
              <span class="rm-cut-settings__icon rm-cut-settings__icon--triangle"></span>
            </button>
            <button
              type="button"
              class="rm-cut-settings__shape"
              (click)="rotate()"
              aria-label="rotate"
            >
              <ion-icon name="reload-outline"></ion-icon>
            </button>
          </div>
        }

        @if (model.tab === 'grid') {
          <label class="rm-cut-settings__label">
            {{ 'columns' | translate }}: {{ model.columns }}
          </label>
          <ion-range
            [min]="1"
            [max]="10"
            [ngModel]="model.columns"
            (ngModelChange)="patch('columns', $event)"
          ></ion-range>
          <label class="rm-cut-settings__label">{{ 'rows' | translate }}: {{ model.rows }}</label>
          <ion-range
            [min]="1"
            [max]="10"
            [ngModel]="model.rows"
            (ngModelChange)="patch('rows', $event)"
          ></ion-range>
        }

        @if (model.tab === 'size') {
          <label class="rm-cut-settings__label">
            {{ 'elementSize' | translate }}: {{ model.elementSize }}px
          </label>
          <ion-range
            [min]="20"
            [max]="90"
            [ngModel]="model.elementSize"
            (ngModelChange)="patch('elementSize', $event)"
          ></ion-range>
          <label class="rm-cut-settings__label">
            {{ 'spaceBetweenElements' | translate }}: {{ model.spacing }}px
          </label>
          <ion-range
            [min]="0"
            [max]="40"
            [ngModel]="model.spacing"
            (ngModelChange)="patch('spacing', $event)"
          ></ion-range>
        }

        @if (model.tab === 'shadow') {
          <label class="rm-cut-settings__label">
            {{ 'intensity' | translate }}: {{ model.shadowBlur }}
          </label>
          <ion-range
            [min]="0"
            [max]="20"
            [ngModel]="model.shadowBlur"
            (ngModelChange)="patch('shadowBlur', $event)"
          ></ion-range>
          <label class="rm-cut-settings__label">
            {{ 'yOffset' | translate }}: {{ model.shadowOffsetY }}
          </label>
          <ion-range
            [min]="0"
            [max]="12"
            [ngModel]="model.shadowOffsetY"
            (ngModelChange)="patch('shadowOffsetY', $event)"
          ></ion-range>
          <label class="rm-cut-settings__label">
            {{ 'transparency' | translate }}: {{ model.shadowOpacity }}%
          </label>
          <ion-range
            [min]="0"
            [max]="100"
            [ngModel]="model.shadowOpacity"
            (ngModelChange)="patch('shadowOpacity', $event)"
          ></ion-range>
        }
      </div>
    </div>
  `,
  styles: [
    `
      app-cut-palette-settings-sheet {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }

      .rm-cut-settings {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 8px 16px calc(12px + env(safe-area-inset-bottom, 0px));
        border-radius: 20px 20px 0 0;
        background: var(--rm-elevated, #fff);
        box-shadow: 0 -8px 28px rgba(22, 24, 42, 0.16);
      }

      .rm-cut-settings__handle {
        width: 36px;
        height: 4px;
        margin: 0 auto 8px;
        border-radius: 999px;
        background: rgba(22, 24, 42, 0.16);
      }

      .rm-cut-settings__seg {
        width: 100%;
        margin: 0 0 12px;
        padding: 3px;
        --background: var(--rm-surface, #eef0f7);
        border-radius: 14px;
      }

      .rm-cut-settings__seg ion-segment-button {
        --border-width: 0 !important;
        --border-color: transparent !important;
        --border-style: none !important;
        --indicator-box-shadow: none !important;
        --indicator-color: var(--rm-elevated, #fff);
        --background: transparent;
        --background-checked: transparent;
        --color: var(--rm-muted, #8b90a5);
        --color-checked: var(--ion-color-primary, #5b6ef5);
        --border-radius: 12px;
        --padding-start: 6px;
        --padding-end: 6px;
        min-height: 40px;
        min-width: 0;
        flex: 1 1 0;
        max-width: none;
        font-size: 0.8rem;
        font-weight: 650;
        text-transform: none;
        letter-spacing: 0;
      }

      .rm-cut-settings__seg ion-segment-button::before {
        display: none !important;
        content: none !important;
      }

      .rm-cut-settings__seg ion-segment-button::part(native) {
        border: none;
        min-height: 40px;
      }

      .rm-cut-settings__seg ion-segment-button::part(indicator-background) {
        box-shadow: none !important;
        background: var(--rm-elevated, #fff);
        border-radius: 12px;
      }

      .rm-cut-settings__seg ion-label {
        margin: 0;
        line-height: 1.2;
        white-space: nowrap;
      }

      .rm-cut-settings__body {
        display: block;
      }

      .rm-cut-settings__shapes {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .rm-cut-settings__shape {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        border: 1.5px solid rgba(22, 24, 42, 0.12);
        background: var(--rm-surface, #eef0f7);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        color: var(--rm-ink, #16182a);
      }

      .rm-cut-settings__shape.is-active {
        border-color: #5b6ef5;
        background: rgba(91, 110, 245, 0.14);
        color: #5b6ef5;
      }

      .rm-cut-settings__shape ion-icon {
        font-size: 1.25rem;
      }

      .rm-cut-settings__icon {
        display: block;
        background: currentColor;
      }

      .rm-cut-settings__icon--square {
        width: 18px;
        height: 18px;
        border-radius: 2px;
      }

      .rm-cut-settings__icon--circle {
        width: 18px;
        height: 18px;
        border-radius: 50%;
      }

      .rm-cut-settings__icon--triangle {
        width: 0;
        height: 0;
        background: transparent;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 17px solid currentColor;
      }

      .rm-cut-settings__label {
        display: block;
        margin-top: 4px;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--rm-muted, #8b90a5);
      }

      .rm-cut-settings ion-range {
        padding-inline: 16px;
        margin: 0 0 2px;
      }
    `,
  ],
})
export class CutPaletteSettingsSheetComponent {
  readonly model: CutPaletteEditorModel;
  private readonly onChange: () => void;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) data: CutPaletteSettingsSheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly sheetRef: OverlaySheetRef<void>,
  ) {
    this.model = data.model;
    this.onChange = data.onChange;
  }

  close(): void {
    this.sheetRef.close();
  }

  onTabChange(event: CustomEvent): void {
    const value = event.detail?.value as CutPaletteSettingsTab | undefined;
    if (value === 'shape' || value === 'grid' || value === 'size' || value === 'shadow') {
      this.model.tab = value;
      this.emit();
    }
  }

  setShape(shape: CutPaletteShape): void {
    this.model.shape = shape;
    this.emit();
  }

  rotate(): void {
    this.model.rotation = (this.model.rotation + 15) % 360;
    this.emit();
  }

  patch(
    key: 'columns' | 'rows' | 'elementSize' | 'spacing' | 'shadowBlur' | 'shadowOffsetY' | 'shadowOpacity',
    value: number | { lower: number },
  ): void {
    const raw = typeof value === 'number' ? value : value.lower;
    this.model[key] = Math.round(raw);
    this.emit();
  }

  private emit(): void {
    this.onChange();
  }
}
