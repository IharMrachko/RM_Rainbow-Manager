import { ChangeDetectorRef, Component, Inject, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { closeOutline, trashOutline } from 'ionicons/icons';
import {
  AiChatHistoryService,
  AiChatSession,
} from '../../core/services/ai-chat-history.service';
import { ConfirmService } from '../../core/services/confirm.service';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

addIcons({ closeOutline, trashOutline });

export interface AiChatHistorySheetData {
  sessions: AiChatSession[];
  activeId: string;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, DatePipe],
  selector: 'app-ai-chat-history-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ai-history-sheet" role="dialog" aria-modal="true">
      <header>
        <h2>{{ 'aiHistory' | translate }}</h2>
        <button type="button" (click)="close()"><ion-icon name="close-outline"></ion-icon></button>
      </header>
      <div class="ai-history-sheet__list">
        @for (session of sessions; track session.id) {
          <div class="ai-history-sheet__item" [class.is-active]="session.id === data.activeId">
            <button type="button" class="ai-history-sheet__open" (click)="open(session.id)">
              <strong>{{ session.title || ('aiNewChat' | translate) }}</strong>
              <span>{{ session.updatedAt | date: 'short' }}</span>
            </button>
            <button
              type="button"
              class="ai-history-sheet__delete"
              (click)="remove(session.id, $event)"
              [disabled]="deletingId === session.id"
              [attr.aria-label]="'delete' | translate"
            >
              @if (deletingId === session.id) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                <ion-icon name="trash-outline"></ion-icon>
              }
            </button>
          </div>
        } @empty {
          <div class="ai-history-sheet__empty">{{ 'aiHistoryEmpty' | translate }}</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ai-history-sheet {
        height: min(72vh, 620px);
        display: flex;
        flex-direction: column;
        background: var(--rm-elevated, #fff);
        color: var(--rm-ink, #16182a);
        border-radius: 22px 22px 0 0;
        overflow: hidden;
      }
      .ai-history-sheet header {
        display: flex;
        align-items: center;
        padding: 16px 16px 12px;
        border-bottom: 1px solid var(--rm-line, rgba(22, 24, 42, 0.08));
      }
      .ai-history-sheet h2 {
        flex: 1;
        margin: 0;
        font-size: 1.1rem;
      }
      .ai-history-sheet header button,
      .ai-history-sheet__delete {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 12px;
        background: transparent;
        color: inherit;
        font-size: 20px;
      }
      .ai-history-sheet__list {
        flex: 1;
        overflow-y: auto;
        padding: 10px 12px calc(14px + env(safe-area-inset-bottom, 0px));
      }
      .ai-history-sheet__item {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        border-radius: 14px;
        background: var(--rm-surface-2, #f2f3f8);
        border: 1px solid transparent;
      }
      .ai-history-sheet__item.is-active {
        border-color: #b576c7;
      }
      .ai-history-sheet__open {
        flex: 1;
        min-width: 0;
        padding: 12px 4px 12px 14px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
      }
      .ai-history-sheet__open strong,
      .ai-history-sheet__open span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ai-history-sheet__open strong {
        font-size: 14px;
      }
      .ai-history-sheet__open span {
        margin-top: 4px;
        color: var(--rm-muted, #777c91);
        font-size: 12px;
      }
      .ai-history-sheet__delete {
        flex: 0 0 40px;
        margin-right: 4px;
        color: #c2415b;
        font-size: 18px;
      }
      .ai-history-sheet__delete:disabled {
        opacity: 0.55;
      }
      .ai-history-sheet__delete ion-spinner {
        width: 18px;
        height: 18px;
      }
      .ai-history-sheet__empty {
        padding: 48px 20px;
        text-align: center;
        color: var(--rm-muted, #777c91);
      }
    `,
  ],
})
export class AiChatHistorySheetComponent {
  sessions = [...this.data.sessions];
  deletingId: string | null = null;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) readonly data: AiChatHistorySheetData,
    @Inject(OVERLAY_SHEET_REF) private readonly ref: OverlaySheetRef<string | null>,
    private readonly history: AiChatHistoryService,
    private readonly confirm: ConfirmService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  open(id: string): void {
    this.ref.close(id);
  }

  close(): void {
    this.ref.close(null);
  }

  remove(id: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    void this.removeAsync(id);
  }

  private async removeAsync(id: string): Promise<void> {
    if (this.deletingId) return;
    const ok = await this.confirm.danger('aiHistoryDeleteConfirm', 'delete', 'delete', 'cancel');
    if (!ok) return;

    this.deletingId = id;
    this.cdr.markForCheck();
    try {
      this.sessions = await this.history.remove(id);
      this.cdr.detectChanges();
      if (id === this.data.activeId) {
        this.ref.close('__deleted_active__');
      }
    } finally {
      this.deletingId = null;
      this.cdr.markForCheck();
    }
  }
}
