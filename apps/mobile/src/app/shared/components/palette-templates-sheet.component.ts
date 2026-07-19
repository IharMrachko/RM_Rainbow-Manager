import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmService } from '../../core/services/confirm.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';
import {
  PaletteTemplate,
  PaletteTemplateService,
} from '../../core/services/palette-template.service';
import { ToastService } from '../../core/services/toast.service';

export interface PaletteTemplatesSheetData {
  /** currently unused — reserved for preselection */
  selectedId?: string;
}

export interface PaletteTemplatesSheetResult {
  applied?: PaletteTemplate;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-palette-templates-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-tpls" role="dialog" aria-modal="true">
      <header class="rm-tpls__bar">
        <button type="button" class="rm-tpls__icon-btn" (click)="dismiss()" aria-label="close">
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>
        <div class="rm-tpls__title">{{ 'myTemplates' | translate }}</div>
        <span class="rm-tpls__spacer"></span>
      </header>

      <div class="rm-tpls__body">
        <ion-searchbar
          [placeholder]="'search' | translate"
          [(ngModel)]="query"
          (ionInput)="onQuery($event)"
          debounce="200"
        ></ion-searchbar>

        @if (loading) {
          <div class="rm-tpls__loader">
            <ion-spinner name="crescent"></ion-spinner>
          </div>
        } @else if (!filtered.length) {
          <p class="rm-tpls__empty">{{ 'noTemplates' | translate }}</p>
        } @else {
          <div class="rm-tpls__list">
            @for (tpl of filtered; track tpl.id) {
              <button
                type="button"
                class="rm-tpls__card"
                [class.is-selected]="selectedId === tpl.id"
                (click)="select(tpl)"
              >
                <div class="rm-tpls__card-head">
                  <strong>{{ tpl.name }}</strong>
                  <button
                    type="button"
                    class="rm-tpls__delete"
                    (click)="remove($event, tpl)"
                    aria-label="delete"
                  >
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
                <div class="rm-tpls__stripes">
                  @for (seg of tpl.segments; track $index) {
                    <span [style.background]="seg.color"></span>
                  }
                </div>
                <small>{{ tpl.segments.length }} {{ 'segments' | translate }}</small>
              </button>
            }
          </div>
        }
      </div>

      <footer class="rm-tpls__footer">
        <ion-button
          expand="block"
          color="primary"
          [disabled]="!selected"
          (click)="apply()"
        >
          {{ 'applyTemplate' | translate }}
        </ion-button>
      </footer>
    </div>
  `,
  styles: [
    `
      .rm-tpls {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: var(--rm-surface, #eef0f7);
        color: var(--rm-ink, #16182a);
      }

      .rm-tpls__bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
        background: var(--rm-elevated, #fff);
        border-bottom: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-tpls__title {
        flex: 1;
        font-weight: 650;
        font-size: 17px;
      }

      .rm-tpls__icon-btn {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        font-size: 22px;
      }

      .rm-tpls__spacer {
        width: 40px;
      }

      .rm-tpls__body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 8px 12px 12px;
      }

      .rm-tpls__loader,
      .rm-tpls__empty {
        display: grid;
        place-items: center;
        padding: 40px 16px;
        color: var(--rm-muted, #5c6178);
      }

      .rm-tpls__list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .rm-tpls__card {
        width: 100%;
        text-align: left;
        border: 2px solid transparent;
        border-radius: 14px;
        padding: 12px;
        background: var(--rm-elevated, #fff);
        color: inherit;
        box-shadow: 0 4px 14px rgba(22, 24, 42, 0.06);
      }

      .rm-tpls__card.is-selected {
        border-color: #5b6ef5;
        background: rgba(91, 110, 245, 0.08);
      }

      .rm-tpls__card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
      }

      .rm-tpls__delete {
        width: 36px;
        height: 36px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #ef4444;
        font-size: 20px;
        display: grid;
        place-items: center;
      }

      .rm-tpls__stripes {
        display: flex;
        height: 28px;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 6px;
      }

      .rm-tpls__stripes span {
        flex: 1;
        min-width: 0;
      }

      .rm-tpls__card small {
        color: var(--rm-muted, #5c6178);
        font-size: 0.78rem;
      }

      .rm-tpls__footer {
        padding: 12px 14px calc(14px + env(safe-area-inset-bottom, 0px));
        background: var(--rm-elevated, #fff);
        border-top: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }

      .rm-tpls__footer ion-button {
        margin: 0;
        min-height: 48px;
        font-weight: 700;
      }
    `,
  ],
})
export class PaletteTemplatesSheetComponent implements OnInit {
  templates: PaletteTemplate[] = [];
  filtered: PaletteTemplate[] = [];
  query = '';
  loading = true;
  selectedId = '';
  selected: PaletteTemplate | null = null;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) data: PaletteTemplatesSheetData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<PaletteTemplatesSheetResult>,
    private readonly api: PaletteTemplateService,
    private readonly confirm: ConfirmService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
  ) {
    this.selectedId = data.selectedId ?? '';
  }

  async ngOnInit(): Promise<void> {
    try {
      this.templates = await this.api.listMine();
      this.filtered = this.templates;
      if (this.selectedId) {
        this.selected = this.templates.find((t) => t.id === this.selectedId) ?? null;
      }
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('galleryLoadError'), 'danger');
    } finally {
      this.loading = false;
    }
  }

  onQuery(ev: CustomEvent): void {
    const value = String((ev.detail as { value?: string })?.value ?? this.query ?? '')
      .trim()
      .toLowerCase();
    this.query = value;
    this.filtered = !value
      ? this.templates
      : this.templates.filter((t) => t.name.toLowerCase().includes(value));
  }

  select(tpl: PaletteTemplate): void {
    this.selectedId = tpl.id;
    this.selected = tpl;
  }

  async remove(event: Event, tpl: PaletteTemplate): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirm.danger('confirmDeleteTemplate', 'delete', 'delete', 'cancel');
    if (!ok) {
      return;
    }
    try {
      await this.api.remove(tpl.id);
      this.templates = this.templates.filter((t) => t.id !== tpl.id);
      this.filtered = this.filtered.filter((t) => t.id !== tpl.id);
      if (this.selectedId === tpl.id) {
        this.selectedId = '';
        this.selected = null;
      }
      await this.toasts.show(this.translate.instant('templateDeleted'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
    }
  }

  apply(): void {
    if (!this.selected) {
      return;
    }
    this.sheetRef.close({ applied: this.selected });
  }

  dismiss(): void {
    this.sheetRef.close({});
  }
}
