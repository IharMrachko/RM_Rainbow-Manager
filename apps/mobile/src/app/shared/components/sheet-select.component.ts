import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export interface SheetSelectOption {
  value: string;
  label: string;
}

@Component({
  standalone: true,
  imports: [IonicModule],
  selector: 'app-sheet-select',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="rm-sheet-select"
      [class.is-open]="open"
      [class.is-filled]="hasValue"
      [class.is-compact]="compact"
    >
      <button type="button" class="rm-sheet-select__trigger" (click)="toggle($event)">
        @if (label) {
          <span class="rm-sheet-select__label">{{ label }}</span>
        }
        <span class="rm-sheet-select__value">
          <span class="rm-sheet-select__text">{{ displayLabel }}</span>
          @if (hasValue) {
            <span
              class="rm-sheet-select__clear"
              role="button"
              tabindex="0"
              [attr.aria-label]="'clear'"
              (click)="clear($event)"
              (keydown.enter)="clear($event)"
            >
              <ion-icon name="close-circle"></ion-icon>
            </span>
          } @else {
            <ion-icon
              class="rm-sheet-select__chevron"
              [name]="open ? 'chevron-down-outline' : 'chevron-down-outline'"
            ></ion-icon>
          }
        </span>
      </button>

      @if (open) {
        <div class="rm-sheet-select__menu" role="listbox">
          @for (opt of options; track opt.value) {
            <button
              type="button"
              class="rm-sheet-select__opt"
              [class.is-active]="opt.value === value"
              (click)="choose(opt.value, $event)"
            >
              <span>{{ opt.label }}</span>
              @if (opt.value === value) {
                <ion-icon name="checkmark-outline"></ion-icon>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      app-sheet-select {
        display: block;
        width: 100%;
      }

      .rm-sheet-select {
        width: 100%;
      }

      .rm-sheet-select__trigger {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
        min-height: 64px;
        padding: 10px 14px;
        border: 0;
        border-radius: 14px;
        background: #eef0f7;
        color: #16182a;
        text-align: left;
      }

      .rm-sheet-select.is-filled .rm-sheet-select__trigger {
        background: rgba(91, 110, 245, 0.1);
        box-shadow: inset 0 0 0 1px rgba(91, 110, 245, 0.28);
      }

      .rm-sheet-select.is-open .rm-sheet-select__trigger {
        border-radius: 14px 14px 0 0;
        background: #e4e7f2;
      }

      .rm-sheet-select.is-filled.is-open .rm-sheet-select__trigger {
        background: rgba(91, 110, 245, 0.12);
      }

      .rm-sheet-select__label {
        font-size: 0.78rem;
        font-weight: 600;
        color: #5c6178;
      }

      .rm-sheet-select.is-filled .rm-sheet-select__label {
        color: #5b6ef5;
      }

      .rm-sheet-select__value {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-size: 0.98rem;
        font-weight: 650;
      }

      .rm-sheet-select__text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rm-sheet-select__chevron {
        flex: 0 0 auto;
        font-size: 1.1rem;
        color: #5c6178;
      }

      .rm-sheet-select__clear {
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        margin: -4px -6px -4px 0;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #5b6ef5;
        font-size: 1.35rem;
      }

      .rm-sheet-select__clear:active {
        background: rgba(91, 110, 245, 0.16);
      }

      .rm-sheet-select__menu {
        display: grid;
        gap: 2px;
        max-height: 220px;
        overflow: auto;
        padding: 6px;
        border-radius: 0 0 14px 14px;
        background: #eef0f7;
        border-top: 1px solid rgba(22, 24, 42, 0.08);
        -webkit-overflow-scrolling: touch;
      }

      .rm-sheet-select__opt {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 44px;
        padding: 10px 12px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #16182a;
        font-size: 0.95rem;
        font-weight: 600;
        text-align: left;
      }

      .rm-sheet-select__opt.is-active {
        background: rgba(91, 110, 245, 0.14);
        color: #5b6ef5;
      }

      .rm-sheet-select.is-compact .rm-sheet-select__trigger {
        min-height: 42px;
        padding: 6px 11px;
        gap: 1px;
        border-radius: 11px;
      }

      .rm-sheet-select.is-compact.is-open .rm-sheet-select__trigger {
        border-radius: 11px 11px 0 0;
      }

      .rm-sheet-select.is-compact .rm-sheet-select__value {
        font-size: 0.84rem;
      }

      .rm-sheet-select.is-compact .rm-sheet-select__menu {
        border-radius: 0 0 11px 11px;
      }

      .rm-sheet-select.is-compact .rm-sheet-select__opt {
        min-height: 38px;
        padding: 7px 10px;
        font-size: 0.84rem;
      }
    `,
  ],
})
export class SheetSelectComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() value = '';
  /** Value used when cleared (usually empty string for "all"). */
  @Input() emptyValue = '';
  @Input() compact = false;
  @Input() options: SheetSelectOption[] = [];
  @Output() valueChange = new EventEmitter<string>();
  @Output() openedChange = new EventEmitter<boolean>();

  open = false;

  get hasValue(): boolean {
    return this.value !== this.emptyValue && this.value != null && this.value !== '';
  }

  get displayLabel(): string {
    return this.options.find((o) => o.value === this.value)?.label || this.placeholder || this.value;
  }

  toggle(event: Event): void {
    event.stopPropagation();
    this.open = !this.open;
    this.openedChange.emit(this.open);
  }

  close(): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.openedChange.emit(false);
  }

  clear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.value = this.emptyValue;
    this.valueChange.emit(this.emptyValue);
    this.close();
  }

  choose(value: string, event: Event): void {
    event.stopPropagation();
    this.value = value;
    this.valueChange.emit(value);
    this.close();
  }
}
