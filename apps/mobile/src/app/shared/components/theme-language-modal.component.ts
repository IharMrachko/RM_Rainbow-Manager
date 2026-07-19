import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, AppLanguage } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-theme-language-modal',
  template: `
    <div class="sheet">
      <h2>
        {{ (mode === 'theme' ? 'themeSettings' : 'languageSettings') | translate }}
      </h2>

      @if (mode === 'theme') {
        <ion-item lines="none" class="sheet-row">
          <ion-icon slot="start" name="moon"></ion-icon>
          <ion-label>{{ 'theme' | translate }}</ion-label>
          <ion-toggle
            slot="end"
            [checked]="theme.isDark"
            (ionChange)="onTheme($any($event.detail.checked))"
          ></ion-toggle>
        </ion-item>
      }

      @if (mode === 'language') {
        <ion-segment
          [value]="language.language"
          (ionChange)="onLang($any($event.detail.value))"
          class="lang-seg"
        >
          <ion-segment-button value="en">EN</ion-segment-button>
          <ion-segment-button value="ru">RU</ion-segment-button>
        </ion-segment>
      }

      <ion-button expand="block" fill="clear" (click)="dismiss()">
        {{ 'cancel' | translate }}
      </ion-button>
    </div>
  `,
  styles: [
    `
      .sheet {
        padding: 20px 16px calc(12px + env(safe-area-inset-bottom));
        background: var(--rm-elevated, #fff);
        color: var(--rm-ink, #16182a);
        border-radius: 20px;
      }
      h2 {
        margin: 0 0 16px;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--rm-ink, #16182a);
      }
      .sheet-row {
        --background: var(--rm-surface-2, #f3f4f6);
        --color: var(--rm-ink, #16182a);
        --border-radius: 14px;
        margin-bottom: 12px;
      }
      .lang-seg {
        margin-bottom: 12px;
      }
    `,
  ],
})
export class ThemeLanguageModalComponent {
  @Input() mode: 'theme' | 'language' = 'theme';

  constructor(
    readonly theme: ThemeService,
    readonly language: LanguageService,
    private readonly modalCtrl: ModalController,
  ) {}

  onTheme(isDark: boolean): void {
    this.theme.setDark(isDark);
  }

  onLang(lang: AppLanguage): void {
    if (lang === 'en' || lang === 'ru') {
      this.language.setLanguage(lang);
    }
  }

  dismiss(): void {
    void this.modalCtrl.dismiss();
  }
}
