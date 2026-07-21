import { NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { LOOKBOOK_A4 } from '../../core/utils/lookbook-print-layout';
import { buildImageTransform } from './lookbook-schema';

const ARM_PX = 8;
const MAX_OFFSET = Math.round(LOOKBOOK_A4.widthPx * 0.55);

export type ImageOffsetDragOpts = {
  view: EditorView;
  fromPos: number;
  pointerId: number;
  startX: number;
  startY: number;
  /** DOM wrapper to paint live transform (NodeView root). */
  wrapEl?: HTMLElement | null;
};

/**
 * Center-handle free pan: continuous ox/oy in unscaled page pixels.
 * Vertical-dominant movement before arm aborts so page scroll still works.
 */
export class ImageOffsetDrag {
  private static active: ImageOffsetDrag | null = null;

  static start(opts: ImageOffsetDragOpts): void {
    ImageOffsetDrag.active?.teardown();
    const session = new ImageOffsetDrag(opts);
    ImageOffsetDrag.active = session;
    session.begin();
  }

  static isActive(): boolean {
    return ImageOffsetDrag.active != null;
  }

  static isDraggingWrap(el: HTMLElement | null | undefined): boolean {
    return !!el && ImageOffsetDrag.active?.wrapEl === el;
  }

  private readonly view: EditorView;
  private readonly fromPos: number;
  private readonly startX: number;
  private readonly startY: number;
  private readonly startOx: number;
  private readonly startOy: number;
  private readonly rot: string;
  private readonly scale: number;
  private readonly wrapEl: HTMLElement | null;

  private armed = false;
  private finished = false;
  private ox: number;
  private oy: number;
  private raf = 0;

  private readonly onMove = (e: Event): void => this.handleMove(e);
  private readonly onUp = (): void => this.handleUp();

  private constructor(opts: ImageOffsetDragOpts) {
    this.view = opts.view;
    this.fromPos = opts.fromPos;
    this.startX = opts.startX;
    this.startY = opts.startY;
    this.wrapEl = opts.wrapEl ?? null;

    const node = opts.view.state.doc.nodeAt(opts.fromPos);
    if (!node || node.type.name !== 'image') {
      throw new Error('ImageOffsetDrag: fromPos is not an image');
    }
    this.startOx = parseFloat(String(node.attrs['ox'] || '0')) || 0;
    this.startOy = parseFloat(String(node.attrs['oy'] || '0')) || 0;
    this.ox = this.startOx;
    this.oy = this.startOy;
    this.rot = String(node.attrs['rot'] || '0');
    this.scale = readPrintScale(opts.wrapEl || opts.view.dom);
  }

  private begin(): void {
    // Do not lock body/scroll until the gesture is armed as an offset drag.
    window.addEventListener('pointermove', this.onMove, { passive: false, capture: true });
    window.addEventListener('pointerup', this.onUp, { capture: true });
    window.addEventListener('pointercancel', this.onUp, { capture: true });
    window.addEventListener('touchmove', this.onMove, { passive: false, capture: true });
    window.addEventListener('touchend', this.onUp, { capture: true });
    window.addEventListener('touchcancel', this.onUp, { capture: true });
  }

  private handleMove(e: Event): void {
    if (this.finished) return;
    const pt = clientPoint(e);
    if (!pt) return;

    const dxScreen = pt.x - this.startX;
    const dyScreen = pt.y - this.startY;
    const dist = Math.hypot(dxScreen, dyScreen);

    if (!this.armed) {
      if (dist < ARM_PX) return;
      // Vertical-dominant → user is scrolling the page, not moving the photo.
      if (Math.abs(dyScreen) > Math.abs(dxScreen) * 1.25) {
        this.finished = true;
        this.teardown();
        return;
      }
      this.armed = true;
      document.body.classList.add('lb-image-dragging', 'lb-pm-gesture-lock');
      this.wrapEl?.classList.add('is-offset-dragging');
    }

    e.preventDefault();
    e.stopPropagation();

    const s = Math.max(0.01, this.scale);
    this.ox = clamp(this.startOx + dxScreen / s, -MAX_OFFSET, MAX_OFFSET);
    this.oy = clamp(this.startOy + dyScreen / s, -MAX_OFFSET, MAX_OFFSET);

    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.paintLive();
    });
  }

  private handleUp(): void {
    if (this.finished) return;
    this.finished = true;
    const armed = this.armed;
    const ox = this.ox;
    const oy = this.oy;
    this.teardown();
    if (armed) {
      this.commit(ox, oy);
    }
  }

  private paintLive(): void {
    if (!this.wrapEl) return;
    this.wrapEl.style.transform = buildImageTransform(String(this.ox), String(this.oy), this.rot);
    this.wrapEl.style.transformOrigin = 'center center';
  }

  private resolvePos(): number | null {
    if (this.wrapEl) {
      try {
        const at = this.view.posAtDOM(this.wrapEl, 0);
        if (typeof at === 'number') {
          const node = this.view.state.doc.nodeAt(at);
          if (node?.type.name === 'image') return at;
        }
      } catch {
        /* fall through */
      }
    }
    const node = this.view.state.doc.nodeAt(this.fromPos);
    return node?.type.name === 'image' ? this.fromPos : null;
  }

  private commit(ox: number, oy: number): void {
    const pos = this.resolvePos();
    if (pos == null) return;
    const node = this.view.state.doc.nodeAt(pos);
    if (!node || node.type.name !== 'image') return;
    let tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      ox: String(Math.round(ox)),
      oy: String(Math.round(oy)),
      float: 'none',
    });
    try {
      tr = tr.setSelection(NodeSelection.create(tr.doc, pos));
    } catch {
      /* ignore */
    }
    this.view.dispatch(tr);
  }

  private teardown(): void {
    window.removeEventListener('pointermove', this.onMove, true);
    window.removeEventListener('pointerup', this.onUp, true);
    window.removeEventListener('pointercancel', this.onUp, true);
    window.removeEventListener('touchmove', this.onMove, true);
    window.removeEventListener('touchend', this.onUp, true);
    window.removeEventListener('touchcancel', this.onUp, true);
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.wrapEl?.classList.remove('is-offset-dragging');
    document.body.classList.remove('lb-image-dragging', 'lb-image-resizing', 'lb-pm-gesture-lock');
    ImageOffsetDrag.clearStuckScrollLock();
    if (ImageOffsetDrag.active === this) {
      ImageOffsetDrag.active = null;
    }
  }

  /** Repair ion-content / body if a previous drag left scroll disabled. */
  static clearStuckScrollLock(): void {
    document.body.classList.remove(
      'lb-image-dragging',
      'lb-image-resizing',
      'lb-image-rotating',
      'lb-image-placing',
      'lb-pm-gesture-lock',
    );
    const content = document.querySelector('ion-content.lb-editor-content') as HTMLElement | null;
    const inner =
      (content?.shadowRoot?.querySelector('.inner-scroll') as HTMLElement | null) ||
      (content?.querySelector('.inner-scroll') as HTMLElement | null);
    if (!inner) return;
    if (inner.style.overflow === 'hidden' || 'lbPrevOverflow' in inner.dataset) {
      inner.style.overflow = inner.dataset['lbPrevOverflow'] || '';
      delete inner.dataset['lbPrevOverflow'];
    }
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function readPrintScale(el: HTMLElement | null): number {
  const scaleEl = el?.closest('.lb-rich__scale') as HTMLElement | null;
  if (!scaleEl) return 1;
  const t = scaleEl.style.transform || getComputedStyle(scaleEl).transform || '';
  const m = /scale\(([\d.]+)\)/.exec(t) || /matrix\(([\d.]+)/.exec(t);
  return m ? Math.max(0.01, parseFloat(m[1])) : 1;
}

function clientPoint(e: Event): { x: number; y: number } | null {
  if ('touches' in e) {
    const te = e as TouchEvent;
    const t = te.touches[0] || te.changedTouches[0];
    return t ? { x: t.clientX, y: t.clientY } : null;
  }
  const p = e as PointerEvent;
  return { x: p.clientX, y: p.clientY };
}
