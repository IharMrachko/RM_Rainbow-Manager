import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline } from 'ionicons/icons';

addIcons({ searchOutline });

/** Same search field used on Gallery (and Lookbooks). */
@Component({
  standalone: true,
  selector: 'app-input-search',
  imports: [IonInput, IonIcon],
  template: `
    <div class="rm-input-search" [class.is-hidden]="isHidden">
      <ion-input
        class="rm-input-search__input"
        type="search"
        inputmode="search"
        enterkeyhint="search"
        fill="outline"
        mode="md"
        [clearInput]="true"
        [debounce]="debounce"
        [placeholder]="placeholder"
        [value]="value"
        (ionInput)="onInput($any($event).detail.value)"
        (ionFocus)="focused.emit()"
      >
        <ion-icon slot="start" name="search-outline" aria-hidden="true"></ion-icon>
      </ion-input>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .rm-input-search {
        flex-shrink: 0;
        z-index: 6;
        padding: 12px 16px 10px;
        box-sizing: border-box;
        background: linear-gradient(
          180deg,
          var(--rm-surface) 70%,
          color-mix(in srgb, var(--rm-surface) 0%, transparent)
        );
        transition: transform 0.22s ease, opacity 0.22s ease;
        will-change: transform, opacity;
      }

      .rm-input-search.is-hidden {
        transform: translateY(calc(-100% - 4px));
        opacity: 0;
        pointer-events: none;
      }

      .rm-input-search__input {
        width: 100%;
        max-width: 100%;
        min-height: 44px;
        --background: var(--rm-elevated);
        --color: var(--rm-ink);
        --placeholder-color: var(--rm-muted);
        --border-radius: 14px;
        --border-width: 1px;
        --border-color: var(--rm-line);
        --padding-start: 12px;
        --padding-end: 8px;
        --highlight-color-focused: var(--rm-brand-a, #8a4fa0);
        font-size: 15px;
        box-shadow: 0 2px 10px rgba(22, 24, 42, 0.06);
      }

      .rm-input-search__input ion-icon[slot='start'] {
        color: var(--rm-muted);
        font-size: 20px;
        margin-inline-end: 6px;
      }
    `,
  ],
})
export class InputSearchComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Input() isHidden = false;
  /** Ionic ion-input debounce in ms (0 = none). */
  @Input() debounce = 0;

  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly focused = new EventEmitter<void>();

  onInput(value: string | null | undefined): void {
    this.valueChange.emit(value ?? '');
  }
}
