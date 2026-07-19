import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';
import {
  PaletteTemplate,
  PaletteTemplateSegment,
  PaletteTemplateService,
} from '../../core/services/palette-template.service';
import { ToastService } from '../../core/services/toast.service';

export interface PaletteTemplateFormSheetData {
  mode: 'create' | 'update';
  name?: string;
  segments: PaletteTemplateSegment[];
  templateId?: string;
}

export interface PaletteTemplateFormSheetResult {
  saved: boolean;
  template?: PaletteTemplate;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, FormsModule],
  selector: 'app-palette-template-form-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-tpl-form" role="dialog" aria-modal="true">
      <div class="rm-tpl-form__handle"></div>
      <h2>{{ (data.mode === 'update' ? 'updateTemplate' : 'addTemplate') | translate }}</h2>

      <div class="rm-tpl-form__stripes">
        @for (seg of data.segments; track $index) {
          <span class="rm-tpl-form__stripe" [style.background]="seg.color"></span>
        }
      </div>

      <ion-input
        class="rm-tpl-form__input"
        [label]="'templateName' | translate"
        labelPlacement="stacked"
        fill="solid"
        [(ngModel)]="name"
        [placeholder]="'templateName' | translate"
      ></ion-input>

      <div class="rm-tpl-form__actions">
        <ion-button expand="block" fill="outline" color="medium" (click)="cancel()">
          {{ 'cancel' | translate }}
        </ion-button>
        <ion-button expand="block" color="primary" [disabled]="saving || !name.trim()" (click)="save()">
          @if (saving) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            {{ 'save' | translate }}
          }
        </ion-button>
      </div>
    </div>
  `,
  styles: [
    `
      app-palette-template-form-sheet {
        display: block;
        width: 100%;
      }

      .rm-tpl-form {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 16px calc(14px + env(safe-area-inset-bottom, 0px));
        border-radius: 22px 22px 0 0;
        background: var(--rm-elevated, #fff);
        color: var(--rm-ink, #16182a);
      }

      .rm-tpl-form__handle {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: rgba(22, 24, 42, 0.16);
        margin: 0 auto 12px;
      }

      .rm-tpl-form h2 {
        margin: 0 0 14px;
        font-size: 1.1rem;
        font-weight: 700;
        text-align: center;
      }

      .rm-tpl-form__stripes {
        display: flex;
        height: 36px;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 14px;
        border: 1px solid rgba(22, 24, 42, 0.08);
      }

      .rm-tpl-form__stripe {
        flex: 1;
        min-width: 0;
      }

      .rm-tpl-form__input {
        --background: var(--rm-surface-2, #eef0f7);
        --border-radius: 12px;
        margin-bottom: 14px;
      }

      .rm-tpl-form__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .rm-tpl-form__actions ion-button {
        margin: 0;
        min-height: 44px;
        font-weight: 700;
      }
    `,
  ],
})
export class PaletteTemplateFormSheetComponent {
  name = '';
  saving = false;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: PaletteTemplateFormSheetData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<PaletteTemplateFormSheetResult>,
    private readonly api: PaletteTemplateService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
  ) {
    this.name = data.name ?? '';
  }

  cancel(): void {
    this.sheetRef.close({ saved: false });
  }

  async save(): Promise<void> {
    const name = this.name.trim();
    if (!name || this.saving) {
      return;
    }
    this.saving = true;
    try {
      if (this.data.mode === 'update' && this.data.templateId) {
        await this.api.update(this.data.templateId, name, this.data.segments);
        await this.toasts.show(this.translate.instant('templateSaved'), 'success');
        this.sheetRef.close({
          saved: true,
          template: {
            id: this.data.templateId,
            userId: '',
            name,
            segments: this.data.segments,
          },
        });
      } else {
        const template = await this.api.create(name, this.data.segments);
        await this.toasts.show(this.translate.instant('templateSaved'), 'success');
        this.sheetRef.close({ saved: true, template });
      }
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
    } finally {
      this.saving = false;
    }
  }
}
