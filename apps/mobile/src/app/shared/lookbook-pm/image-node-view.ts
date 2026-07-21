import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import { NodeSelection } from 'prosemirror-state';
import { LOOKBOOK_A4 } from '../../core/utils/lookbook-print-layout';
import { LookbookInsertAnchor } from './insert-anchor';

const MIN_W = 72;
const TAP_PX = 10;

function contentMaxWidth(): number {
  return Math.max(200, LOOKBOOK_A4.widthPx - LOOKBOOK_A4.padXPx * 2);
}

/**
 * Plain image: select, width resize, delete. No drag / offset / float.
 */
export class LookbookImageNodeView implements NodeView {
  dom: HTMLElement;
  private readonly img: HTMLImageElement;
  private readonly handleW: HTMLElement;
  private readonly handleE: HTMLElement;
  private readonly deleteBtn: HTMLButtonElement;
  private node: PMNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private selected = false;
  private tap: { x: number; y: number; pointerId: number } | null = null;

  constructor(node: PMNode, view: EditorView, getPos: () => number | undefined) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement('div');
    this.dom.className = 'lb-img-wrap lb-pm-img';
    this.dom.setAttribute('contenteditable', 'false');
    this.dom.draggable = false;

    this.img = document.createElement('img');
    this.img.draggable = false;
    this.img.alt = String(node.attrs['alt'] || '');
    this.dom.appendChild(this.img);

    this.handleW = document.createElement('span');
    this.handleW.className = 'lb-img-handle lb-img-handle--w';
    this.handleE = document.createElement('span');
    this.handleE.className = 'lb-img-handle lb-img-handle--e';

    this.deleteBtn = document.createElement('button');
    this.deleteBtn.type = 'button';
    this.deleteBtn.className = 'lb-img-delete';
    this.deleteBtn.setAttribute('aria-label', 'Delete');
    this.deleteBtn.textContent = '×';

    this.dom.appendChild(this.handleW);
    this.dom.appendChild(this.handleE);
    this.dom.appendChild(this.deleteBtn);

    this.applyNode(node);

    this.dom.addEventListener('pointerdown', (ev) => this.onPointerDown(ev), { passive: false });
    this.dom.addEventListener('pointerup', (ev) => this.onPointerUp(ev), { passive: true });
    this.deleteBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.deleteSelf();
    });
  }

  selectNode(): void {
    this.selected = true;
    this.dom.classList.add('is-selected');
  }

  deselectNode(): void {
    this.selected = false;
    this.dom.classList.remove('is-selected');
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.applyNode(node);
    return true;
  }

  stopEvent(event: Event): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    if (
      target === this.deleteBtn ||
      this.deleteBtn.contains(target) ||
      target === this.handleW ||
      this.handleW.contains(target) ||
      target === this.handleE ||
      this.handleE.contains(target)
    ) {
      return true;
    }
    return event.type === 'dragstart';
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy(): void {
    /* no-op */
  }

  private applyNode(node: PMNode): void {
    const src = String(node.attrs['src'] || '');
    if (this.img.getAttribute('src') !== src) {
      this.img.src = src;
    }
    this.img.alt = String(node.attrs['alt'] || '');
    this.img.style.cssText =
      'display:block;width:100%;height:auto;max-width:100%;border-radius:12px;margin:0;float:none;pointer-events:none;transform:none;';

    this.dom.style.transform = '';
    this.dom.style.setProperty('float', 'none', 'important');
    this.dom.style.setProperty('clear', 'both', 'important');
    this.dom.style.setProperty('display', 'block', 'important');

    const width = node.attrs['width'] ? String(node.attrs['width']) : '';
    if (width) {
      this.dom.style.width = `${width}px`;
      this.dom.style.maxWidth = '100%';
      this.dom.style.margin = '0.55em auto';
    } else {
      this.dom.style.width = '100%';
      this.dom.style.maxWidth = '100%';
      this.dom.style.margin = '0.55em 0';
    }
  }

  private pos(): number | null {
    const p = this.getPos();
    return typeof p === 'number' ? p : null;
  }

  private selectSelf(): void {
    const pos = this.pos();
    if (pos == null) return;
    LookbookInsertAnchor.set(pos + this.node.nodeSize);
    this.view.dispatch(
      this.view.state.tr.setSelection(NodeSelection.create(this.view.state.doc, pos)),
    );
  }

  private deleteSelf(): void {
    const pos = this.pos();
    if (pos == null) return;
    this.view.dispatch(this.view.state.tr.delete(pos, pos + this.node.nodeSize));
  }

  private setWidth(widthPx: number): void {
    const pos = this.pos();
    if (pos == null) return;
    const w = Math.round(Math.max(MIN_W, Math.min(contentMaxWidth(), widthPx)));
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        width: String(w),
        float: 'none',
        ox: '0',
        oy: '0',
      }),
    );
  }

  private onPointerDown(ev: PointerEvent): void {
    const editable = this.view.props.editable?.(this.view.state) ?? true;
    if (!editable || ev.button > 0) return;
    const target = ev.target as HTMLElement;
    if (target === this.deleteBtn || this.deleteBtn.contains(target)) return;

    const onResize =
      target === this.handleW ||
      target === this.handleE ||
      this.handleW.contains(target) ||
      this.handleE.contains(target);

    if (onResize) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!this.selected) this.selectSelf();
      this.startResize(ev, target === this.handleW || this.handleW.contains(target) ? 'w' : 'e');
      return;
    }

    this.tap = { x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId };
  }

  private onPointerUp(ev: PointerEvent): void {
    const tap = this.tap;
    this.tap = null;
    if (!tap || tap.pointerId !== ev.pointerId) return;
    if (Math.hypot(ev.clientX - tap.x, ev.clientY - tap.y) > TAP_PX) return;
    this.selectSelf();
  }

  private startResize(ev: PointerEvent, side: 'w' | 'e'): void {
    const startX = ev.clientX;
    const startW =
      this.dom.getBoundingClientRect().width / Math.max(0.01, this.printScale()) ||
      parseInt(String(this.node.attrs['width'] || '0'), 10) ||
      Math.round(contentMaxWidth() * 0.6);
    const pointerId = ev.pointerId;
    try {
      this.dom.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }

    const onMove = (e: Event): void => {
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPoint(e);
      if (!pt) return;
      const dx = (pt.x - startX) / Math.max(0.01, this.printScale());
      this.setWidth(side === 'e' ? startW + dx : startW - dx);
    };
    const onUp = (): void => {
      try {
        this.dom.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      window.removeEventListener('touchmove', onMove, true);
      window.removeEventListener('touchend', onUp, true);
      window.removeEventListener('touchcancel', onUp, true);
    };
    window.addEventListener('pointermove', onMove, { passive: false, capture: true });
    window.addEventListener('pointerup', onUp, { capture: true });
    window.addEventListener('pointercancel', onUp, { capture: true });
    window.addEventListener('touchmove', onMove, { passive: false, capture: true });
    window.addEventListener('touchend', onUp, { capture: true });
    window.addEventListener('touchcancel', onUp, { capture: true });
  }

  private printScale(): number {
    const scaleEl = this.dom.closest('.lb-rich__scale') as HTMLElement | null;
    if (!scaleEl) return 1;
    const t = scaleEl.style.transform || getComputedStyle(scaleEl).transform || '';
    const m = /scale\(([\d.]+)\)/.exec(t) || /matrix\(([\d.]+)/.exec(t);
    return m ? Math.max(0.01, parseFloat(m[1])) : 1;
  }
}

function clientPoint(e: Event): { x: number; y: number } | null {
  if ('touches' in e) {
    const t = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
    return t ? { x: t.clientX, y: t.clientY } : null;
  }
  const p = e as PointerEvent;
  return { x: p.clientX, y: p.clientY };
}
