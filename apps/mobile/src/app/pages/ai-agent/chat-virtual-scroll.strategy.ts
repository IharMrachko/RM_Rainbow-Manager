import { Injectable } from '@angular/core';
import { CdkVirtualScrollViewport, VirtualScrollStrategy } from '@angular/cdk/scrolling';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

/** Variable-height chat rows: estimate first, then use measured heights. */
@Injectable()
export class ChatVirtualScrollStrategy implements VirtualScrollStrategy {
  private viewport: CdkVirtualScrollViewport | null = null;
  private readonly heights = new Map<number, number>();
  private readonly index$ = new Subject<number>();
  private estimate = 340;
  private bufferPx = 900;

  readonly scrolledIndexChange: Observable<number> = this.index$.pipe(distinctUntilChanged());

  attach(viewport: CdkVirtualScrollViewport): void {
    this.viewport = viewport;
    this.onDataLengthChanged();
  }

  detach(): void {
    this.viewport = null;
    this.heights.clear();
  }

  onContentScrolled(): void {
    this.updateRenderedRange();
  }

  onDataLengthChanged(): void {
    if (!this.viewport) return;
    const n = this.viewport.getDataLength();
    // Drop stale measurements when list shrinks / is replaced.
    for (const key of [...this.heights.keys()]) {
      if (key >= n) this.heights.delete(key);
    }
    this.viewport.setTotalContentSize(this.totalSize(n));
    this.updateRenderedRange();
  }

  onContentRendered(): void {}

  onRenderedOffsetChanged(): void {}

  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    this.viewport?.scrollToOffset(this.offsetForIndex(index), behavior);
  }

  /** Persist measured row height (px). */
  setItemHeight(index: number, height: number): void {
    const h = Math.max(1, Math.round(height));
    if (this.heights.get(index) === h) return;
    this.heights.set(index, h);
    if (!this.viewport) return;
    this.viewport.setTotalContentSize(this.totalSize(this.viewport.getDataLength()));
    this.updateRenderedRange();
  }

  reset(): void {
    this.heights.clear();
    this.onDataLengthChanged();
  }

  private heightAt(index: number): number {
    return this.heights.get(index) ?? this.estimate;
  }

  private totalSize(count: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) total += this.heightAt(i);
    return total;
  }

  private offsetForIndex(index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) offset += this.heightAt(i);
    return offset;
  }

  private updateRenderedRange(): void {
    if (!this.viewport) return;
    const n = this.viewport.getDataLength();
    if (n === 0) {
      this.viewport.setRenderedRange({ start: 0, end: 0 });
      this.viewport.setRenderedContentOffset(0);
      return;
    }

    const scrollOffset = this.viewport.measureScrollOffset();
    const viewportSize = Math.max(1, this.viewport.getViewportSize());
    const startOffset = Math.max(0, scrollOffset - this.bufferPx);
    const endOffset = scrollOffset + viewportSize + this.bufferPx;

    let acc = 0;
    let start = 0;
    for (let i = 0; i < n; i++) {
      const next = acc + this.heightAt(i);
      if (next > startOffset) {
        start = i;
        break;
      }
      acc = next;
      start = i;
    }

    let end = start;
    for (let i = start; i < n; i++) {
      end = i + 1;
      if (acc + this.heightAt(i) >= endOffset) break;
      acc += this.heightAt(i);
    }

    this.viewport.setRenderedRange({ start, end: Math.min(n, end) });
    this.viewport.setRenderedContentOffset(this.offsetForIndex(start));
    this.index$.next(start);
  }
}
