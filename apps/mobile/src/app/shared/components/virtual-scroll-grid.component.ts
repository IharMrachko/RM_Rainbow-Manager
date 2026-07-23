import { NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';

export interface VirtualScrollGridScrollEvent {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  nearEnd: boolean;
}

/**
 * Windowed grid virtualization (same idea as Vue AppVirtualScrollGrid):
 * only visible cells (+ buffer) stay in the DOM; absolute positioning on a tall spacer.
 */
@Component({
  standalone: true,
  selector: 'app-virtual-scroll-grid',
  imports: [NgTemplateOutlet, NgStyle],
  template: `
    <div
      #container
      class="virtual-grid"
      [class.virtual-grid--locked]="scrollLocked"
      (scroll)="onScroll($event)"
    >
      <div class="virtual-grid__spacer" [style.height.px]="totalHeight">
        @for (item of visibleItems; track trackItem(startIndex + $index, item); let i = $index) {
          <div class="virtual-grid__cell" [ngStyle]="cellStyle(startIndex + i)">
            <ng-container
              *ngTemplateOutlet="
                cellTemplate;
                context: { $implicit: item, index: startIndex + i }
              "
            />
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }

      .virtual-grid {
        height: 100%;
        overflow-y: auto;
        position: relative;
        overscroll-behavior-y: contain;
        -webkit-overflow-scrolling: touch;
        overflow-anchor: none;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .virtual-grid::-webkit-scrollbar {
        display: none;
      }

      .virtual-grid--locked {
        overflow: hidden;
        touch-action: none;
      }

      .virtual-grid__spacer {
        position: relative;
        width: 100%;
        overflow-anchor: none;
      }

      .virtual-grid__cell {
        box-sizing: border-box;
        overflow: hidden;
        overflow-anchor: none;
      }

      .virtual-grid__cell > :first-child {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class VirtualScrollGridComponent<T = unknown>
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input({ required: true }) items: T[] = [];
  @Input() itemKey: (item: T, index: number) => string | number = (_item, index) => index;
  @Input() minColumnWidth = 160;
  @Input() gap = 10;
  @Input() bufferRows = 4;
  /**
   * Media box width/height (CSS aspect-ratio).
   * Gallery thumbs use 1; stock look cards use 3/4.
   */
  @Input() mediaAspectRatio = 1;
  /** Extra height below the media (title / actions). */
  @Input() metaHeight = 36;
  @Input() nearEndOffset = 180;
  @Input() scrollLocked = false;

  @Output() readonly gridScroll = new EventEmitter<VirtualScrollGridScrollEvent>();
  @Output() readonly nearEnd = new EventEmitter<void>();

  @ContentChild(TemplateRef) cellTemplate!: TemplateRef<{ $implicit: T; index: number }>;
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  scrollTop = 0;
  containerHeight = 0;
  containerWidth = 0;
  startIndex = 0;
  visibleItems: T[] = [];
  totalHeight = 0;

  private columnsCount = 1;
  private colWidth = 0;
  private rowHeight = 0;
  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;
  private nearEndEmitted = false;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.measure();
    this.recompute();
    const el = this.containerRef.nativeElement;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.zone.run(() => {
          this.measure();
          this.recompute();
        });
      });
      this.resizeObserver.observe(el);
    }
    window.addEventListener('resize', this.onWindowResize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['items'] ||
      changes['minColumnWidth'] ||
      changes['gap'] ||
      changes['metaHeight'] ||
      changes['mediaAspectRatio']
    ) {
      this.nearEndEmitted = false;
      this.measure();
      this.recompute();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  trackItem(index: number, item: T): string | number {
    return this.itemKey(item, index);
  }

  cellStyle(index: number): Record<string, string> {
    const row = Math.floor(index / this.columnsCount);
    const col = index % this.columnsCount;
    const x = col * (this.colWidth + this.gap);
    const y = row * (this.rowHeight + this.gap);
    return {
      position: 'absolute',
      transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`,
      width: `${Math.round(this.colWidth)}px`,
      height: `${Math.round(this.rowHeight)}px`,
    };
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const raw = el.scrollTop;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(() => {
      this.scrollTop = Math.max(0, raw);
      this.recompute();
      const payload: VirtualScrollGridScrollEvent = {
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        nearEnd: el.scrollTop + el.clientHeight >= el.scrollHeight - this.nearEndOffset,
      };
      this.gridScroll.emit(payload);
      if (payload.nearEnd) {
        if (!this.nearEndEmitted) {
          this.nearEndEmitted = true;
          this.nearEnd.emit();
        }
      } else {
        this.nearEndEmitted = false;
      }
      this.rafId = null;
    });
  }

  /** Reset near-end latch after more items were appended. */
  resetNearEndLatch(): void {
    this.nearEndEmitted = false;
  }

  scrollToTop(): void {
    this.containerRef.nativeElement.scrollTop = 0;
    this.scrollTop = 0;
    this.recompute();
  }

  private readonly onWindowResize = (): void => {
    this.zone.run(() => {
      this.measure();
      this.recompute();
    });
  };

  private measure(): void {
    const el = this.containerRef?.nativeElement;
    if (!el) return;
    this.containerHeight = el.clientHeight;
    this.containerWidth = el.clientWidth;
  }

  private recompute(): void {
    const width = Math.max(0, this.containerWidth);
    const gap = this.gap;
    const cols = Math.max(1, Math.floor((width + gap) / (this.minColumnWidth + gap)));
    this.columnsCount = cols;
    this.colWidth = cols > 0 ? (width - (cols - 1) * gap) / cols : width;
    const aspect = this.mediaAspectRatio > 0 ? this.mediaAspectRatio : 1;
    const mediaHeight = this.colWidth / aspect;
    this.rowHeight = Math.max(1, mediaHeight + this.metaHeight);

    const totalRows = Math.ceil(this.items.length / cols) || 0;
    this.totalHeight = totalRows * this.rowHeight + Math.max(0, totalRows - 1) * gap;

    const rowPitch = this.rowHeight + gap;
    const visibleRows =
      Math.ceil(this.containerHeight / Math.max(1, rowPitch)) + this.bufferRows;
    const rawStart = Math.floor(this.scrollTop / Math.max(1, rowPitch));
    const maxStart = Math.max(0, totalRows - visibleRows);
    const startRow = Math.min(Math.max(0, rawStart), maxStart);
    this.startIndex = startRow * cols;
    const endIndex = Math.min(this.startIndex + visibleRows * cols, this.items.length);
    this.visibleItems = this.items.slice(this.startIndex, endIndex);
    this.cdr.markForCheck();
  }
}
