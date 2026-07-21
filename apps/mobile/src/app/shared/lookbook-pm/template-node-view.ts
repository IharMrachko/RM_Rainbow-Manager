import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import { NodeSelection } from 'prosemirror-state';
import { LOOKBOOK_A4 } from '../../core/utils/lookbook-print-layout';
import { ensureTemplateSlots, serializeTemplateDom } from './template-html';
import { LookbookInsertAnchor } from './insert-anchor';

const TAP_PX = 14;
const LONG_PRESS_MS = 420;
const MIN_H = 120;
const MAX_H = LOOKBOOK_A4.heightPx * 3;

/** WebView ignores !important inside cssText — must use setProperty(..., 'important'). */
function setImportant(el: HTMLElement, props: Record<string, string>): void {
  for (const [key, value] of Object.entries(props)) {
    el.style.setProperty(key, value, 'important');
  }
}

function clearImportant(el: HTMLElement, keys: string[]): void {
  for (const key of keys) {
    el.style.removeProperty(key);
  }
}

/** Inject once — beats imported layout CSS that can clip chrome. */
function ensureTemplateChromeCss(): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('lb-tpl-chrome-css');
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = 'lb-tpl-chrome-css';
  style.textContent = `
.lb-tpl-host {
  position: relative !important;
  overflow: visible !important;
  box-sizing: border-box !important;
  /* Leave margin-top free for A4 pagination push from the editor. */
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  padding: 0 !important;
  min-height: 0 !important;
  background: transparent !important;
  background-color: transparent !important;
}
.lb-tpl-host.is-selected {
  z-index: 8 !important;
  outline: 3px solid #8a4fa0 !important;
  outline-offset: 2px !important;
  border-radius: 14px !important;
  background: transparent !important;
  background-color: transparent !important;
  box-shadow: none !important;
}
.lb-tpl-host .lb-tpl-ring {
  display: none !important;
  position: absolute !important;
  inset: -4px !important;
  border: 3px solid #8a4fa0 !important;
  border-radius: 16px !important;
  pointer-events: none !important;
  z-index: 20 !important;
  box-sizing: border-box !important;
}
.lb-tpl-host.is-selected .lb-tpl-ring {
  display: block !important;
}
.lb-tpl-host .lb-tpl-delete,
.lb-tpl-host .lb-tpl-height {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  z-index: 30 !important;
  position: absolute !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 2px solid #fff !important;
  border-radius: 999px !important;
  color: #fff !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 3px 12px rgba(0,0,0,.35) !important;
  -webkit-appearance: none !important;
  appearance: none !important;
}
.lb-tpl-host.is-selected .lb-tpl-delete,
.lb-tpl-host.is-selected .lb-tpl-height {
  display: flex !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}
.lb-tpl-host .lb-tpl-delete {
  top: 10px !important;
  right: 10px !important;
  width: 44px !important;
  height: 44px !important;
  background: #c62828 !important;
  font: 700 28px/1 system-ui,sans-serif !important;
  cursor: pointer !important;
  touch-action: manipulation !important;
}
.lb-tpl-host .lb-tpl-height {
  left: 50% !important;
  bottom: 10px !important;
  transform: translateX(-50%) !important;
  width: 88px !important;
  height: 36px !important;
  background: #8a4fa0 !important;
  font: 700 11px/1 system-ui,sans-serif !important;
  letter-spacing: .04em !important;
  cursor: ns-resize !important;
  touch-action: none !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}
.lb-pm__mount,
.lb-pm__mount .ProseMirror,
.lb-rich__surface,
.lb-rich__sheet,
.lb-rich__scale,
.lb-rich__canvas {
  overflow: visible !important;
}
.lb-tpl-host .lb-tpl__cover-text {
  pointer-events: none !important;
}
.lb-tpl-host .lb-tpl__cover-text > * {
  pointer-events: auto !important;
}
`;
  document.head.appendChild(style);
}

/**
 * Template atom: tap media (or long-press text) → outline + delete + height.
 * Photos locked. Chrome via class + setProperty(..., 'important') — WebView
 * ignores !important inside cssText assignments.
 */
export class LookbookTemplateNodeView implements NodeView {
  static activeText: LookbookTemplateNodeView | null = null;
  /** Currently selected template host (for scroll stabilize / chrome). */
  static getSelectedDom(): HTMLElement | null {
    return LookbookTemplateNodeView.selectedHost?.dom ?? null;
  }

  private static selectedHost: LookbookTemplateNodeView | null = null;

  /** Drop visual selection before programmatic inserts. */
  static clearSelection(): void {
    if (LookbookTemplateNodeView.selectedHost) {
      LookbookTemplateNodeView.selectedHost.setSelected(false);
    }
  }

  /** Freeze page pushes only during an active edit/resize, not normal selection. */
  static isUiBusy(): boolean {
    return !!(LookbookTemplateNodeView.activeText || LookbookTemplateNodeView.heightDragCount > 0);
  }

  private static heightDragCount = 0;

  dom: HTMLElement;
  private node: PMNode;
  private readonly view: EditorView;
  private readonly getPos: () => number | undefined;
  private selected = false;
  private suppressCommit = false;
  private textTimer: ReturnType<typeof setTimeout> | null = null;
  private savedRange: Range | null = null;
  private heightDragging = false;
  private tap: { x: number; y: number; pointerId: number; onText: boolean } | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly ring: HTMLElement;
  private readonly deleteBtn: HTMLButtonElement;
  private readonly heightHandle: HTMLElement;
  private readonly onSelChange = (): void => this.captureTextSelection();

  constructor(node: PMNode, view: EditorView, getPos: () => number | undefined) {
    ensureTemplateChromeCss();
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement('div');
    this.dom.className = 'lb-tpl-host';
    this.dom.setAttribute('contenteditable', 'false');
    setImportant(this.dom, {
      position: 'relative',
      display: 'block',
      'margin-left': '0',
      'margin-right': '0',
      'margin-bottom': '0',
      padding: '0',
      'min-height': '0',
      overflow: 'visible',
      'box-sizing': 'border-box',
    });

    this.ring = document.createElement('div');
    this.ring.className = 'lb-tpl-ring';
    this.ring.setAttribute('aria-hidden', 'true');

    this.deleteBtn = document.createElement('button');
    this.deleteBtn.type = 'button';
    this.deleteBtn.className = 'lb-tpl-delete';
    this.deleteBtn.setAttribute('aria-label', 'Delete template');
    this.deleteBtn.textContent = '×';

    this.heightHandle = document.createElement('div');
    this.heightHandle.className = 'lb-tpl-height';
    this.heightHandle.setAttribute('aria-label', 'Resize height');
    this.heightHandle.textContent = '↕';

    this.renderHtml(String(node.attrs['html'] || ''));
    this.dom.appendChild(this.ring);
    this.dom.appendChild(this.deleteBtn);
    this.dom.appendChild(this.heightHandle);
    this.applyHeight(parseInt(String(node.attrs['heightPx'] || '0'), 10) || 0);
    this.syncChrome();

    this.deleteBtn.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      // Delete immediately: Android WebView can lose pointerup if pagination
      // shifts the selected host while the finger is still down.
      this.deleteSelf();
    });
    this.deleteBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    });
    this.heightHandle.addEventListener('pointerdown', (ev) => this.startHeightDrag(ev), {
      passive: false,
    });

    this.dom.addEventListener('pointerdown', (ev) => this.onPointerDown(ev), { passive: false });
    this.dom.addEventListener('pointerup', (ev) => this.onPointerUp(ev), { passive: true });
    this.dom.addEventListener('pointercancel', () => this.clearTap());
    this.dom.addEventListener('click', (ev) => this.onClick(ev));
    this.dom.addEventListener('focusin', () => {
      LookbookTemplateNodeView.activeText = this;
      this.captureTextSelection();
    });
    this.dom.addEventListener('focusout', () => {
      this.scheduleTextCommit();
      // Defer so focus moving within the same host does not clear activeText.
      setTimeout(() => {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && this.dom.contains(ae)) return;
        if (LookbookTemplateNodeView.activeText === this) {
          LookbookTemplateNodeView.activeText = null;
          if (!LookbookTemplateNodeView.selectedHost) {
            LookbookTemplateNodeView.emitLayoutIdle();
          }
        }
      }, 0);
    });
    this.dom.addEventListener('input', () => this.scheduleTextCommit());
    document.addEventListener('selectionchange', this.onSelChange);
  }

  static formatText(command: string, value?: string): boolean {
    const host = LookbookTemplateNodeView.activeText;
    if (!host) return false;
    const ae = document.activeElement as HTMLElement | null;
    const focusedInHost = !!(ae && host.dom.contains(ae));
    if (!host.restoreTextSelection() && !focusedInHost) return false;
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      /* ignore */
    }
    if (command === 'fontSizePx' && value) {
      host.applyInlineStyle('font-size', `${value}px`);
    } else if (command === 'fontName' && value) {
      document.execCommand('fontName', false, value);
    } else if (command === 'foreColor' && value) {
      document.execCommand('foreColor', false, value);
    } else if (command === 'hiliteColor' && value) {
      document.execCommand('hiliteColor', false, value) ||
        document.execCommand('backColor', false, value);
    } else if (command === 'formatBlock' && value) {
      const tag = value.startsWith('<') ? value : `<${value}>`;
      document.execCommand('formatBlock', false, tag);
    } else {
      document.execCommand(command, false, value);
    }
    host.captureTextSelection();
    host.scheduleTextCommit();
    return true;
  }

  selectNode(): void {
    this.setSelected(true);
  }

  deselectNode(): void {
    this.flushTextCommit();
    // Ignore spurious deselect while NodeSelection still points at us.
    const pos = this.pos();
    const sel = this.view.state.selection;
    if (
      pos != null &&
      sel instanceof NodeSelection &&
      sel.from === pos &&
      LookbookTemplateNodeView.selectedHost === this
    ) {
      this.setSelected(true);
      return;
    }
    this.setSelected(false);
  }

  stopEvent(event: Event): boolean {
    const t = event.target as HTMLElement | null;
    if (!t) return false;
    if (
      t === this.deleteBtn ||
      this.deleteBtn.contains(t) ||
      t === this.heightHandle ||
      this.heightHandle.contains(t)
    ) {
      return true;
    }
    if (t.closest('[contenteditable="true"]')) {
      return (
        event.type.startsWith('pointer') ||
        event.type.startsWith('touch') ||
        event.type.startsWith('mouse') ||
        event.type.startsWith('key') ||
        event.type === 'input' ||
        event.type === 'beforeinput' ||
        event.type === 'compositionstart' ||
        event.type === 'compositionend' ||
        event.type === 'paste' ||
        event.type === 'cut' ||
        event.type === 'dragstart'
      );
    }
    return (
      event.type.startsWith('pointer') ||
      event.type.startsWith('touch') ||
      event.type.startsWith('mouse') ||
      event.type === 'click' ||
      event.type === 'dragstart'
    );
  }

  update(node: PMNode): boolean {
    if (node.type !== this.node.type) return false;
    const prevHtml = String(this.node.attrs['html'] || '');
    const nextHtml = String(node.attrs['html'] || '');
    const prevH = String(this.node.attrs['heightPx'] || '0');
    const nextH = String(node.attrs['heightPx'] || '0');
    this.node = node;
    if (
      prevHtml !== nextHtml &&
      !this.suppressCommit &&
      !(document.activeElement && this.dom.contains(document.activeElement))
    ) {
      this.renderHtml(nextHtml);
    }
    if (prevH !== nextH && !this.heightDragging) {
      this.applyHeight(parseInt(nextH, 10) || 0);
    }
    this.syncChrome();
    return true;
  }

  ignoreMutation(): boolean {
    return true;
  }

  destroy(): void {
    document.removeEventListener('selectionchange', this.onSelChange);
    this.clearTap();
    if (LookbookTemplateNodeView.activeText === this) {
      LookbookTemplateNodeView.activeText = null;
    }
    if (LookbookTemplateNodeView.selectedHost === this) {
      LookbookTemplateNodeView.selectedHost = null;
    }
    this.flushTextCommit();
  }

  private renderHtml(html: string): void {
    const normalized = ensureTemplateSlots(html);
    this.dom.querySelectorAll('.lb-tpl').forEach((n) => n.remove());
    const holder = document.createElement('div');
    holder.innerHTML = normalized;
    const root = holder.firstElementChild as HTMLElement | null;
    if (root) {
      this.dom.insertBefore(root, this.deleteBtn.isConnected ? this.deleteBtn : null);
      this.wrapTemplateMedia(root);
      root
        .querySelectorAll<HTMLElement>(
          '.lb-tpl__col--text, .lb-tpl__cover-text, .lb-tpl--text .lb-tpl__col, .lb-tpl__article-content',
        )
        .forEach((col) => {
          col.setAttribute('contenteditable', 'true');
          col.spellcheck = true;
        });
      // Media containers receive taps for selection; images do not.
      root.querySelectorAll('img, .lb-tpl__ph').forEach((el) => {
        (el as HTMLElement).style.pointerEvents = 'none';
      });
      root
        .querySelectorAll<HTMLElement>(
          '.lb-img-wrap, .lb-tpl__cover-media, .lb-tpl__col--media, .lb-tpl__mosaic, .lb-tpl__grid4, .lb-tpl__mosaic4',
        )
        .forEach((el) => {
          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
        });
    }
    if (!this.ring.isConnected) this.dom.appendChild(this.ring);
    if (!this.deleteBtn.isConnected) this.dom.appendChild(this.deleteBtn);
    if (!this.heightHandle.isConnected) this.dom.appendChild(this.heightHandle);
  }

  private wrapTemplateMedia(root: HTMLElement): void {
    const mediaParents = root.querySelectorAll(
      '.lb-tpl__mosaic, .lb-tpl__grid4, .lb-tpl__mosaic4, .lb-tpl__overlay, .lb-tpl__fan, .lb-tpl--stack2, .lb-tpl--photo',
    );
    mediaParents.forEach((parent) => {
      Array.from(parent.children).forEach((child) => {
        const el = child as HTMLElement;
        if (el.classList.contains('lb-img-wrap') || el.classList.contains('lb-tpl__frame')) {
          return;
        }
        if (el.tagName === 'IMG' || el.classList.contains('lb-tpl__ph')) {
          const wrap = document.createElement('div');
          wrap.className = 'lb-img-wrap';
          if ((parent as HTMLElement).classList.contains('lb-tpl__overlay')) {
            const slot = parseInt(el.getAttribute('data-lb-slot') || '0', 10) || 0;
            wrap.classList.add('lb-tpl__overlay-slot', `lb-tpl__overlay-slot--${slot + 1}`);
          }
          if ((parent as HTMLElement).classList.contains('lb-tpl__fan')) {
            const slot = parseInt(el.getAttribute('data-lb-slot') || '0', 10) || 0;
            wrap.classList.add('lb-tpl__fan-slot', `lb-tpl__fan-slot--${slot + 1}`);
          }
          wrap.setAttribute('contenteditable', 'false');
          wrap.style.cssText =
            'float:none;margin:0;display:block;width:100%;max-width:100%;position:relative;pointer-events:auto;cursor:pointer;';
          parent.insertBefore(wrap, el);
          wrap.appendChild(el);
          if (el.tagName === 'IMG') {
            (el as HTMLImageElement).style.cssText =
              'width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;pointer-events:none;';
          }
        }
      });
    });
  }

  private applyHeight(heightPx: number): void {
    const root = this.dom.querySelector('.lb-tpl') as HTMLElement | null;
    if (!root) return;
    if (heightPx > 0) {
      root.style.minHeight = `${heightPx}px`;
      this.dom.dataset['lbH'] = String(heightPx);
    } else {
      root.style.minHeight = '';
      delete this.dom.dataset['lbH'];
    }
  }

  private setSelected(on: boolean): void {
    if (on) {
      if (
        LookbookTemplateNodeView.selectedHost &&
        LookbookTemplateNodeView.selectedHost !== this
      ) {
        LookbookTemplateNodeView.selectedHost.setSelected(false);
      }
      LookbookTemplateNodeView.selectedHost = this;
    } else if (LookbookTemplateNodeView.selectedHost === this) {
      LookbookTemplateNodeView.selectedHost = null;
      LookbookTemplateNodeView.emitLayoutIdle();
    }
    this.selected = on;
    this.syncChrome();
  }

  /** Notify editor to re-apply A4 pushes after chrome interaction ends. */
  static emitLayoutIdle(): void {
    if (typeof document === 'undefined') return;
    document.dispatchEvent(new CustomEvent('lb-lookbook-layout-idle'));
  }

  private syncChrome(): void {
    const on = this.selected;
    this.dom.classList.toggle('is-selected', on);

    // Never tint the template — only outline + chrome controls when selected.
    this.dom.style.removeProperty('background');
    this.dom.style.removeProperty('background-color');
    this.dom.style.removeProperty('box-shadow');
    setImportant(this.dom, {
      background: 'transparent',
      'background-color': 'transparent',
      'box-shadow': 'none',
    });

    if (on) {
      setImportant(this.dom, {
        'z-index': '8',
        'border-radius': '14px',
        background: 'transparent',
        'background-color': 'transparent',
        'box-shadow': 'none',
      });
      setImportant(this.ring, {
        display: 'block',
        position: 'absolute',
        inset: '-4px',
        border: '3px solid #8a4fa0',
        'border-radius': '16px',
        background: 'transparent',
        'background-color': 'transparent',
        'pointer-events': 'none',
        'z-index': '20',
        'box-sizing': 'border-box',
      });
      setImportant(this.deleteBtn, {
        display: 'flex',
        position: 'absolute',
        top: '10px',
        right: '10px',
        'z-index': '30',
        width: '44px',
        height: '44px',
        margin: '0',
        padding: '0',
        border: '2px solid #fff',
        'border-radius': '999px',
        background: '#c62828',
        color: '#fff',
        font: '700 28px/1 system-ui,sans-serif',
        'align-items': 'center',
        'justify-content': 'center',
        'box-shadow': '0 3px 12px rgba(0,0,0,.35)',
        cursor: 'pointer',
        'touch-action': 'manipulation',
        '-webkit-appearance': 'none',
        appearance: 'none',
        opacity: '1',
        'pointer-events': 'auto',
      });
      setImportant(this.heightHandle, {
        display: 'flex',
        position: 'absolute',
        left: '50%',
        bottom: '10px',
        transform: 'translateX(-50%)',
        'z-index': '30',
        width: '88px',
        height: '36px',
        margin: '0',
        padding: '0',
        border: '2px solid #fff',
        'border-radius': '999px',
        background: '#8a4fa0',
        color: '#fff',
        font: '700 11px/1 system-ui,sans-serif',
        'letter-spacing': '.04em',
        'align-items': 'center',
        'justify-content': 'center',
        'box-shadow': '0 3px 12px rgba(0,0,0,.3)',
        cursor: 'ns-resize',
        'touch-action': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        opacity: '1',
        'pointer-events': 'auto',
      });
    } else {
      clearImportant(this.dom, ['z-index', 'border-radius']);
      setImportant(this.dom, {
        background: 'transparent',
        'background-color': 'transparent',
        'box-shadow': 'none',
      });
      setImportant(this.ring, { display: 'none', background: 'transparent' });
      setImportant(this.deleteBtn, {
        display: 'none',
        opacity: '0',
        'pointer-events': 'none',
      });
      setImportant(this.heightHandle, {
        display: 'none',
        opacity: '0',
        'pointer-events': 'none',
      });
    }
  }

  private pos(): number | null {
    try {
      const p = this.getPos();
      if (typeof p === 'number' && p >= 0) return p;
    } catch {
      /* fall through */
    }
    const kind = String(this.node.attrs['kind'] || '');
    const html = String(this.node.attrs['html'] || '');
    let found: number | null = null;
    this.view.state.doc.descendants((n, pos) => {
      if (
        n.type.name === 'lookbook_template' &&
        String(n.attrs['kind'] || '') === kind &&
        String(n.attrs['html'] || '') === html
      ) {
        found = pos;
      }
      return true;
    });
    return found;
  }

  private selectSelf(): void {
    this.setSelected(true);
    const pos = this.pos();
    if (pos == null) return;
    // Book insert AFTER this template (between it and the next block).
    LookbookInsertAnchor.set(pos + this.node.nodeSize);
    try {
      const sel = NodeSelection.create(this.view.state.doc, pos);
      if (!sel.eq(this.view.state.selection)) {
        this.view.dispatch(this.view.state.tr.setSelection(sel).scrollIntoView());
      }
      // Re-assert chrome after PM update — some WebViews clear NodeSelection immediately.
      requestAnimationFrame(() => {
        if (LookbookTemplateNodeView.selectedHost === this) {
          this.setSelected(true);
        }
      });
    } catch (err) {
      console.warn('template select failed', err);
    }
  }

  private deleteSelf(): void {
    const pos = this.pos();
    if (pos == null) return;
    this.setSelected(false);
    LookbookTemplateNodeView.activeText = null;
    this.view.dispatch(this.view.state.tr.delete(pos, pos + this.node.nodeSize));
  }

  private commitAttrs(patch: { html?: string; heightPx?: number }): void {
    const pos = this.pos();
    if (pos == null) return;
    const html = patch.html ?? String(this.node.attrs['html'] || '');
    const kind = String(this.node.attrs['kind'] || '');
    const heightPx =
      patch.heightPx != null
        ? patch.heightPx
        : parseInt(String(this.node.attrs['heightPx'] || '0'), 10) || 0;
    this.suppressCommit = true;
    this.view.dispatch(
      this.view.state.tr.setNodeMarkup(pos, undefined, {
        html,
        kind,
        heightPx: String(heightPx || 0),
      }),
    );
    this.suppressCommit = false;
  }

  private scheduleTextCommit(): void {
    if (this.textTimer) clearTimeout(this.textTimer);
    this.textTimer = setTimeout(() => {
      this.textTimer = null;
      this.flushTextCommit();
    }, 280);
  }

  private flushTextCommit(): void {
    if (this.textTimer) {
      clearTimeout(this.textTimer);
      this.textTimer = null;
    }
    const root = this.dom.querySelector('.lb-tpl') as HTMLElement | null;
    if (!root) return;
    const html = serializeTemplateDom(root);
    if (html === String(this.node.attrs['html'] || '')) return;
    this.commitAttrs({ html });
  }

  private captureTextSelection(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!this.dom.contains(range.commonAncestorContainer)) return;
    const anchor = range.commonAncestorContainer;
    const el = (anchor.nodeType === 1 ? anchor : anchor.parentElement) as HTMLElement | null;
    if (!el?.closest('[contenteditable="true"]')) return;
    this.savedRange = range.cloneRange();
    LookbookTemplateNodeView.activeText = this;
  }

  private restoreTextSelection(): boolean {
    if (!this.savedRange) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    try {
      sel.removeAllRanges();
      sel.addRange(this.savedRange);
      return true;
    } catch {
      return false;
    }
  }

  private applyInlineStyle(prop: string, value: string): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style.setProperty(prop, value);
    try {
      range.surroundContents(span);
    } catch {
      const frag = range.extractContents();
      span.appendChild(frag);
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(span);
    sel.addRange(next);
    this.savedRange = next.cloneRange();
    return true;
  }

  private isChromeTarget(t: HTMLElement): boolean {
    return (
      t === this.deleteBtn ||
      this.deleteBtn.contains(t) ||
      t === this.heightHandle ||
      this.heightHandle.contains(t)
    );
  }

  private clearTap(): void {
    this.tap = null;
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private onPointerDown(ev: PointerEvent): void {
    const t = ev.target as HTMLElement;
    if (this.isChromeTarget(t)) return;
    const onText = !!t.closest('[contenteditable="true"]');
    this.tap = { x: ev.clientX, y: ev.clientY, pointerId: ev.pointerId, onText };
    if (this.longPressTimer) clearTimeout(this.longPressTimer);
    this.longPressTimer = null;

    // Not selected yet → any tap (incl. text) selects the template.
    if (!this.selected) {
      if (onText && ev.cancelable) {
        // Block caret until we decide; short tap will select, not edit.
        ev.preventDefault();
      } else if (!onText && ev.cancelable) {
        ev.preventDefault();
      }
      return;
    }

    if (onText) {
      // Already selected: text edits normally; long-press re-asserts chrome.
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        if (!this.tap || this.tap.pointerId !== ev.pointerId) return;
        this.selectSelf();
        this.tap = null;
      }, LONG_PRESS_MS);
      return;
    }
    if (ev.cancelable) ev.preventDefault();
  }

  private onPointerUp(ev: PointerEvent): void {
    const tap = this.tap;
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.tap = null;
    if (!tap || tap.pointerId !== ev.pointerId) return;
    if (Math.hypot(ev.clientX - tap.x, ev.clientY - tap.y) > TAP_PX) return;

    if (!this.selected) {
      this.selectSelf();
      return;
    }
    if (tap.onText) {
      // Selected + text: leave for editing.
      return;
    }
    this.selectSelf();
  }

  private onClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (this.isChromeTarget(t)) return;
    if (this.selected && t.closest('[contenteditable="true"]')) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.selectSelf();
  }

  private startHeightDrag(ev: PointerEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.selectSelf();
    const root = this.dom.querySelector('.lb-tpl') as HTMLElement | null;
    if (!root) return;
    const scale = readPrintScale(this.dom);
    const startY = ev.clientY;
    const startH = Math.max(
      MIN_H,
      root.getBoundingClientRect().height / Math.max(0.01, scale),
    );
    this.heightDragging = true;
    LookbookTemplateNodeView.heightDragCount += 1;
    try {
      this.heightHandle.setPointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }

    const onMove = (e: Event): void => {
      e.preventDefault();
      const pt = clientPoint(e);
      if (!pt) return;
      const dy = (pt.y - startY) / Math.max(0.01, scale);
      const next = Math.round(Math.max(MIN_H, Math.min(MAX_H, startH + dy)));
      this.applyHeight(next);
    };
    const onUp = (e: Event): void => {
      if (this.heightDragging) {
        this.heightDragging = false;
        LookbookTemplateNodeView.heightDragCount = Math.max(
          0,
          LookbookTemplateNodeView.heightDragCount - 1,
        );
      }
      const pe = e as PointerEvent;
      try {
        this.heightHandle.releasePointerCapture(pe.pointerId);
      } catch {
        /* ignore */
      }
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      window.removeEventListener('touchmove', onMove, true);
      window.removeEventListener('touchend', onUp, true);
      const h = parseInt(this.dom.dataset['lbH'] || '0', 10) || 0;
      this.commitAttrs({ heightPx: h });
      LookbookTemplateNodeView.emitLayoutIdle();
    };
    window.addEventListener('pointermove', onMove, { passive: false, capture: true });
    window.addEventListener('pointerup', onUp, { capture: true });
    window.addEventListener('pointercancel', onUp, { capture: true });
    window.addEventListener('touchmove', onMove, { passive: false, capture: true });
    window.addEventListener('touchend', onUp, { capture: true });
  }
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
