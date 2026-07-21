import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from './choice-sheet.component';
import { baseKeymap, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { gapCursor } from 'prosemirror-gapcursor';
import { history, redo, undo } from 'prosemirror-history';
import { inputRules, wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorState, NodeSelection, Plugin, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Fragment, Node as PMNode } from 'prosemirror-model';
import {
  LOOKBOOK_A4,
  ensureEditorPrintParityCss,
  measureLookbookPrintPages,
} from '../../core/utils/lookbook-print-layout';
import {
  applyLookbookTemplateShiftsToHosts,
  stabilizeLookbookScroll,
} from '../../core/utils/paginate-lookbook';
import {
  LookbookTemplateCopy,
  LookbookTemplateId,
  LookbookTemplatePhoto,
} from '../../core/utils/lookbook-page-templates';
import { LookbookEditorSurface } from '../lookbook-pm/lookbook-editor-api';
import {
  normalizeLookbookHtml,
  parseLookbookHtml,
  serializeLookbookHtml,
} from '../lookbook-pm/lookbook-html';
import { lookbookSchema } from '../lookbook-pm/lookbook-schema';
import { buildLookbookTemplateHtml } from '../lookbook-pm/template-html';
import { LookbookImageNodeView } from '../lookbook-pm/image-node-view';
import { LookbookTemplateNodeView } from '../lookbook-pm/template-node-view';
import { ImageOffsetDrag } from '../lookbook-pm/image-offset-drag';
import { LookbookInsertAnchor } from '../lookbook-pm/insert-anchor';

type Align = 'left' | 'center' | 'right';

@Component({
  standalone: true,
  selector: 'app-lookbook-pm-editor',
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  templateUrl: './lookbook-pm-editor.component.html',
  styleUrls: ['./lookbook-pm-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LookbookPmEditorComponent
  implements AfterViewInit, OnDestroy, LookbookEditorSurface
{
  @ViewChild('mount', { static: true }) private mountRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasHost', { static: true }) private canvasHostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('sheet', { static: true }) private sheetRef!: ElementRef<HTMLDivElement>;

  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() set documentTitle(value: string | null | undefined) {
    const next = (value || '').trim();
    if (next === this._documentTitle) {
      return;
    }
    this._documentTitle = next;
    if (this.ready) {
      this.schedulePageMarks();
    }
  }
  get documentTitle(): string {
    return this._documentTitle;
  }
  @Input() set html(value: string | null | undefined) {
    const next = value && value.trim() ? value : '<p><br></p>';
    this.pendingHtml = next;
    if (this.ready && !this.dirtyFromUser) {
      this.setHtml(next);
    }
  }

  @Output() readonly htmlChange = new EventEmitter<string>();
  @Output() readonly requestPhoto = new EventEmitter<void>();
  @Output() readonly requestTemplate = new EventEmitter<void>();

  fontFamily = '';
  fontSize = '16';
  textColor = '#8a4fa0';
  fillColor = '#f1c40f';
  showTextColor = false;
  showFillColor = false;
  palettePos = { top: 0, left: 0 };

  printScale = LookbookPmEditorComponent.guessScale();
  scaledHostHeight = Math.ceil(LOOKBOOK_A4.heightPx * LookbookPmEditorComponent.guessScale());
  layoutReady = false;

  active = {
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    block: '' as '' | 'p' | 'h1' | 'h2' | 'h3' | 'blockquote',
  };

  readonly fonts = [
    { value: '', label: 'Default' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, Times, serif', label: 'Times' },
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
    { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet' },
    { value: 'Courier New, monospace', label: 'Courier' },
  ];

  readonly sizes = ['12', '14', '16', '18', '20', '24', '28', '32'];

  pageMarks: Array<{ n: number; top: number; height: number }> = [];

  readonly palette = [
    '#16182a',
    '#5c6178',
    '#ffffff',
    '#c0392b',
    '#e67e22',
    '#f1c40f',
    '#27ae60',
    '#2980b9',
    '#8a4fa0',
    '#e91e63',
  ];

  private view: EditorView | null = null;
  private ready = false;
  private dirtyFromUser = false;
  private pendingHtml = '<p><br></p>';
  private _documentTitle = '';
  private savedInsertPos: number | null = null;
  private pageMarkTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeObs: ResizeObserver | null = null;
  private suppressEmit = false;
  private readonly onLayoutIdle = (): void => this.schedulePageMarks();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly sheets: OverlaySheetService,
  ) {}

  private static guessScale(): number {
    const w = typeof window !== 'undefined' ? window.innerWidth : 390;
    return Math.min(1, Math.max(0.42, (w - 32) / LOOKBOOK_A4.widthPx));
  }

  ngAfterViewInit(): void {
    ImageOffsetDrag.clearStuckScrollLock();
    ensureEditorPrintParityCss();
    this.createView(this.pendingHtml);
    this.ready = true;
    this.syncScale();
    this.schedulePageMarks();
    this.resizeObs = new ResizeObserver(() => this.syncScale());
    this.resizeObs.observe(this.canvasHostRef.nativeElement);
    document.addEventListener('lb-lookbook-layout-idle', this.onLayoutIdle);
  }

  ngOnDestroy(): void {
    document.removeEventListener('lb-lookbook-layout-idle', this.onLayoutIdle);
    this.resizeObs?.disconnect();
    if (this.pageMarkTimer) {
      clearTimeout(this.pageMarkTimer);
    }
    this.view?.destroy();
    this.view = null;
    ImageOffsetDrag.clearStuckScrollLock();
  }

  getHtml(): string {
    if (!this.view) {
      return normalizeLookbookHtml(this.pendingHtml);
    }
    return serializeLookbookHtml(this.view.state.doc);
  }

  captureInsertPoint(force = false): void {
    if (!this.view) {
      return;
    }
    // Re-book on every new insert gesture (force). Keeping a stale numeric pos
    // after cancel / edits is what made later template inserts silently fail.
    if (!force && this.savedInsertPos != null) {
      return;
    }
    // Prefer last DOM tap (scale-safe). Selection alone often resolves to doc top
    // under CSS transform: scale(...).
    const tapped = LookbookInsertAnchor.get();
    if (tapped != null && tapped >= 0 && tapped <= this.view.state.doc.content.size) {
      this.savedInsertPos = this.topLevelInsertPos(this.view.state, tapped);
      return;
    }
    this.savedInsertPos = this.blockInsertPos(this.view.state);
  }

  /** Drop a booked caret (call when the user cancels gallery / template sheets). */
  clearInsertPoint(): void {
    this.savedInsertPos = null;
    LookbookInsertAnchor.clear();
  }

  insertImage(src: string, alt = ''): void {
    if (!this.view || !src?.trim()) {
      return;
    }
    const maxW = Math.max(200, LOOKBOOK_A4.widthPx - LOOKBOOK_A4.padXPx * 2);
    const width = String(Math.round(Math.min(maxW, maxW * 0.85)));
    const img = lookbookSchema.nodes['image'].create({
      src: src.trim(),
      alt: alt || '',
      float: 'none',
      width,
      rot: '0',
      ox: '0',
      oy: '0',
      row: false,
      rowW: null,
    });
    const under = lookbookSchema.nodes['paragraph'].create();
    this.insertNodes([img, under], { caretInLastParagraph: true });
  }

  insertPageTemplate(
    kind: LookbookTemplateId,
    photos: LookbookTemplatePhoto[] = [],
    copy?: LookbookTemplateCopy,
  ): void {
    if (!this.view) {
      return;
    }
    const html = buildLookbookTemplateHtml(kind, photos, copy);
    const tpl = lookbookSchema.nodes['lookbook_template'].create({
      html,
      kind,
      heightPx: '0',
    });
    const after = lookbookSchema.nodes['paragraph'].create();
    this.insertNodes([tpl, after], { caretInLastParagraph: true });
  }

  onToolbarPointerDown(ev: Event): void {
    const target = ev.target as HTMLElement | null;
    // Interactive fields must receive their default pointer action.
    if (target?.closest('.lb-rich__field, ion-select, input, textarea')) {
      return;
    }
    // Keep PM / contenteditable selection when tapping toolbar.
    ev.preventDefault();
  }

  requestPhotoClick(): void {
    this.captureInsertPoint(true);
    this.requestPhoto.emit();
  }

  requestTemplateClick(): void {
    this.captureInsertPoint(true);
    this.requestTemplate.emit();
  }

  undo(): void {
    if (this.view) {
      undo(this.view.state, this.view.dispatch.bind(this.view));
    }
  }

  redo(): void {
    if (this.view) {
      redo(this.view.state, this.view.dispatch.bind(this.view));
    }
  }

  toggleBold(): void {
    if (LookbookTemplateNodeView.formatText('bold')) return;
    this.runMark('strong');
  }

  toggleItalic(): void {
    if (LookbookTemplateNodeView.formatText('italic')) return;
    this.runMark('em');
  }

  toggleUnderline(): void {
    if (LookbookTemplateNodeView.formatText('underline')) return;
    this.runMark('underline');
  }

  toggleStrike(): void {
    if (LookbookTemplateNodeView.formatText('strikeThrough')) return;
    this.runMark('strike');
  }

  toggleBulletList(): void {
    if (LookbookTemplateNodeView.formatText('insertUnorderedList')) return;
    if (!this.view) return;
    wrapInList(lookbookSchema.nodes['bullet_list'])(
      this.view.state,
      this.view.dispatch.bind(this.view),
    );
    this.refreshActive();
  }

  toggleOrderedList(): void {
    if (LookbookTemplateNodeView.formatText('insertOrderedList')) return;
    if (!this.view) return;
    wrapInList(lookbookSchema.nodes['ordered_list'])(
      this.view.state,
      this.view.dispatch.bind(this.view),
    );
    this.refreshActive();
  }

  setAlign(align: Align): void {
    const cmd =
      align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : 'justifyLeft';
    if (LookbookTemplateNodeView.formatText(cmd)) return;
    if (!this.view) return;
    const { state, dispatch } = this.view;
    const { from, to } = state.selection;
    let tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, align });
      }
    });
    dispatch(tr);
    this.refreshActive();
  }

  formatBlock(block: 'p' | 'h1' | 'h2' | 'h3' | 'blockquote'): void {
    if (block === 'blockquote') {
      if (LookbookTemplateNodeView.formatText('formatBlock', 'blockquote')) return;
    } else {
      const tag = block === 'p' ? 'p' : block;
      if (LookbookTemplateNodeView.formatText('formatBlock', tag)) return;
    }
    if (!this.view) return;
    const { state, dispatch } = this.view;
    if (block === 'p') {
      setBlockType(lookbookSchema.nodes['paragraph'])(state, dispatch);
    } else if (block === 'blockquote') {
      wrapIn(lookbookSchema.nodes['blockquote'])(state, dispatch);
    } else {
      const level = Number(block.slice(1));
      setBlockType(lookbookSchema.nodes['heading'], { level })(state, dispatch);
    }
    this.refreshActive();
  }

  insertHr(): void {
    if (!this.view) return;
    const hr = lookbookSchema.nodes['horizontal_rule'].create();
    const p = lookbookSchema.nodes['paragraph'].create();
    this.insertNodes([hr, p]);
  }

  clearFormat(): void {
    if (LookbookTemplateNodeView.formatText('removeFormat')) return;
    if (!this.view) return;
    const { state, dispatch } = this.view;
    const { from, to, empty } = state.selection;
    if (empty) return;
    dispatch(state.tr.removeMark(from, to));
    this.refreshActive();
  }

  indent(): void {
    if (!this.view) return;
    sinkListItem(lookbookSchema.nodes['list_item'])(
      this.view.state,
      this.view.dispatch.bind(this.view),
    );
  }

  outdent(): void {
    if (!this.view) return;
    liftListItem(lookbookSchema.nodes['list_item'])(
      this.view.state,
      this.view.dispatch.bind(this.view),
    );
  }

  applyFontFamily(family: string): void {
    this.fontFamily = family;
    if (family && LookbookTemplateNodeView.formatText('fontName', family)) return;
    this.applyAttrMark('fontFamily', family ? { family } : null);
  }

  get fontFamilyLabel(): string {
    return this.fonts.find((font) => font.value === this.fontFamily)?.label || 'Default';
  }

  async openFontPicker(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const value = await this.sheets.open<
      ChoiceSheetComponent<string>,
      ChoiceSheetData<string>,
      string | null
    >(
      ChoiceSheetComponent,
      {
        titleKey: 'lookbookFont',
        options: this.fonts.map((font) => ({ value: font.value, labelKey: font.label })),
      },
      { stack: true },
    );
    if (value !== null && value !== undefined) {
      this.applyFontFamily(value);
    }
  }

  applyFontSize(size: string): void {
    this.fontSize = size;
    if (size && LookbookTemplateNodeView.formatText('fontSizePx', size)) return;
    this.applyAttrMark('fontSize', size ? { size: `${size}px` } : null);
  }

  async openFontSizePicker(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const value = await this.sheets.open<
      ChoiceSheetComponent<string>,
      ChoiceSheetData<string>,
      string | null
    >(
      ChoiceSheetComponent,
      {
        titleKey: 'lookbookFontSize',
        options: this.sizes.map((size) => ({ value: size, labelKey: `${size} px` })),
      },
      { stack: true },
    );
    if (value !== null && value !== undefined) {
      this.applyFontSize(value);
    }
  }

  toggleTextColor(ev: MouseEvent): void {
    ev.stopPropagation();
    this.showFillColor = false;
    this.showTextColor = !this.showTextColor;
    if (this.showTextColor) {
      this.anchorPalette(ev);
    }
  }

  toggleFillColor(ev: MouseEvent): void {
    ev.stopPropagation();
    this.showTextColor = false;
    this.showFillColor = !this.showFillColor;
    if (this.showFillColor) {
      this.anchorPalette(ev);
    }
  }

  pickTextColor(color: string): void {
    this.textColor = color;
    this.showTextColor = false;
    if (LookbookTemplateNodeView.formatText('foreColor', color)) return;
    this.applyAttrMark('textColor', { color });
  }

  pickFillColor(color: string): void {
    this.fillColor = color;
    this.showFillColor = false;
    if (LookbookTemplateNodeView.formatText('hiliteColor', color)) return;
    this.applyAttrMark('highlight', { color });
  }

  closePalettes(): void {
    this.showTextColor = false;
    this.showFillColor = false;
  }

  private createView(html: string): void {
    const doc = parseLookbookHtml(html);
    const state = EditorState.create({
      doc,
      schema: lookbookSchema,
      plugins: [
        history(),
        gapCursor(),
        inputRules({
          rules: [
            wrappingInputRule(/^\s*\*\s$/, lookbookSchema.nodes['bullet_list']),
            wrappingInputRule(/^\s*1\.\s$/, lookbookSchema.nodes['ordered_list']),
          ],
        }),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo,
          'Mod-b': toggleMark(lookbookSchema.marks['strong']),
          'Mod-i': toggleMark(lookbookSchema.marks['em']),
          'Mod-u': toggleMark(lookbookSchema.marks['underline']),
          Enter: baseKeymap['Enter'],
          Backspace: baseKeymap['Backspace'],
          'Mod-Enter': baseKeymap['Mod-Enter'],
        }),
        keymap(baseKeymap),
        new Plugin({
          view: () => ({
            update: () => {
              this.refreshActive();
            },
          }),
        }),
      ],
    });

    this.view = new EditorView(this.mountRef.nativeElement, {
      state,
      editable: () => !this.disabled,
      // Keep ion-content in charge of scrolling — PM must not yank the viewport.
      handleScrollToSelection: () => true,
      handleDOMEvents: {
        pointerup: (_view, event) => {
          if ((event as PointerEvent).button === 2) return false;
          this.bookInsertFromClientPoint(
            (event as PointerEvent).clientX,
            (event as PointerEvent).clientY,
          );
          return false;
        },
        click: (_view, event) => {
          this.bookInsertFromClientPoint(
            (event as MouseEvent).clientX,
            (event as MouseEvent).clientY,
          );
          return false;
        },
      },
      nodeViews: {
        image: (node, view, getPos) =>
          new LookbookImageNodeView(node, view, getPos as () => number | undefined),
        lookbook_template: (node, view, getPos) =>
          new LookbookTemplateNodeView(node, view, getPos as () => number | undefined),
      },
      attributes: {
        class: 'lb-rich__surface lb-pm__surface ProseMirror',
        'data-placeholder': this.placeholder || '',
      },
      dispatchTransaction: (tr: Transaction) => {
        if (!this.view) return;
        const next = this.view.state.apply(tr);
        this.view.updateState(next);
        if (tr.docChanged && !this.suppressEmit) {
          this.dirtyFromUser = true;
          this.htmlChange.emit(serializeLookbookHtml(next.doc));
          this.schedulePageMarks();
        }
        this.refreshActive();
        this.cdr.markForCheck();
      },
    });
  }

  private setHtml(html: string): void {
    if (!this.view) return;
    this.suppressEmit = true;
    const doc = parseLookbookHtml(html);
    const next = EditorState.create({
      doc,
      plugins: this.view.state.plugins,
      schema: lookbookSchema,
    });
    this.view.updateState(next);
    this.suppressEmit = false;
    this.schedulePageMarks();
    this.refreshActive();
  }

  private insertNodes(
    nodes: PMNode[],
    opts?: { caretInLastParagraph?: boolean },
  ): void {
    if (!this.view || !nodes.length) return;

    const tryInsertAt = (insertPos: number): boolean => {
      if (!this.view) return false;
      const { state } = this.view;
      const safePos = Math.min(Math.max(0, insertPos), state.doc.content.size);
      const frag = Fragment.fromArray(nodes);
      let tr = state.tr.insert(safePos, frag);

      try {
        if (opts?.caretInLastParagraph) {
          const last = nodes[nodes.length - 1];
          if (last?.type.name === 'paragraph') {
            const caret = safePos + frag.size - last.nodeSize + 1;
            tr = tr.setSelection(
              TextSelection.create(tr.doc, Math.min(Math.max(1, caret), tr.doc.content.size)),
            );
          } else {
            tr = tr.setSelection(
              TextSelection.near(
                tr.doc.resolve(Math.min(safePos + frag.size, tr.doc.content.size)),
              ),
            );
          }
        } else {
          const selPos = Math.min(safePos + frag.size, tr.doc.content.size);
          tr = tr.setSelection(TextSelection.near(tr.doc.resolve(selPos)));
        }
      } catch (selErr) {
        console.warn('lookbook insert selection failed, using near()', selErr);
        try {
          tr = tr.setSelection(
            TextSelection.near(
              tr.doc.resolve(Math.min(safePos + frag.size, tr.doc.content.size)),
            ),
          );
        } catch {
          /* keep insert without caret move */
        }
      }

      this.view.dispatch(tr);
      return true;
    };

    try {
      LookbookTemplateNodeView.clearSelection();
      const booked =
        this.savedInsertPos ??
        LookbookInsertAnchor.get();
      const primary =
        booked != null && booked >= 0 && booked <= this.view.state.doc.content.size
          ? this.topLevelInsertPos(this.view.state, booked)
          : this.blockInsertPos(this.view.state);

      if (!tryInsertAt(primary)) {
        throw new Error('primary insert returned false');
      }
    } catch (err) {
      console.error('lookbook insertNodes failed, appending at end', err);
      try {
        if (this.view) {
          tryInsertAt(this.view.state.doc.content.size);
        }
      } catch (err2) {
        console.error('lookbook insertNodes fallback failed', err2);
      }
    } finally {
      this.savedInsertPos = null;
      LookbookInsertAnchor.clear();
      this.dirtyFromUser = true;
      // Bring the caret into view inside ion-content (PM scrollIntoView is disabled).
      requestAnimationFrame(() => this.revealCaret());
    }
  }

  /**
   * Resolve insert position from the visual hit target.
   * Avoids ProseMirror posAtCoords under CSS scale (maps mid-page taps to doc top).
   */
  private bookInsertFromClientPoint(clientX: number, clientY: number): void {
    if (!this.view) return;
    const pm = this.view.dom;
    const hit = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!hit || !pm.contains(hit)) return;

    const tplHost = hit.closest('.lb-tpl-host') as HTMLElement | null;
    if (tplHost && pm.contains(tplHost)) {
      try {
        const before = this.view.posAtDOM(tplHost, 0);
        const node = this.view.state.doc.nodeAt(before);
        if (node) {
          LookbookInsertAnchor.set(before + node.nodeSize);
          return;
        }
      } catch {
        /* fall through */
      }
    }

    const imgHost = hit.closest('.lb-pm-img') as HTMLElement | null;
    if (imgHost && pm.contains(imgHost)) {
      try {
        const before = this.view.posAtDOM(imgHost, 0);
        const node = this.view.state.doc.nodeAt(before);
        if (node) {
          LookbookInsertAnchor.set(before + node.nodeSize);
          return;
        }
      } catch {
        /* fall through */
      }
    }

    // Top-level block under the tap (paragraph between templates, headings, …).
    let block: HTMLElement | null = hit;
    while (block && block.parentElement && block.parentElement !== pm) {
      block = block.parentElement;
    }
    if (!block || block.parentElement !== pm || block === pm) return;

    try {
      const before = this.view.posAtDOM(block, 0);
      const node = this.view.state.doc.nodeAt(before);
      if (!node) return;
      const emptyP =
        block.tagName === 'P' &&
        !(block.textContent || '').trim() &&
        !block.querySelector('img, .lb-tpl, .lb-tpl-host, .lb-pm-img');
      // Empty spacer between templates: insert HERE (before it), not at doc top.
      LookbookInsertAnchor.set(emptyP ? before : before + node.nodeSize);
    } catch {
      /* ignore */
    }
  }

  /** Top-level gap after the block that contains `pos` (or after a node selection). */
  private blockInsertPos(state: EditorState): number {
    const sel = state.selection;
    if (sel instanceof NodeSelection) {
      return Math.min(sel.to, state.doc.content.size);
    }
    return this.topLevelInsertPos(state, sel.to);
  }

  private topLevelInsertPos(state: EditorState, pos: number): number {
    const docSize = state.doc.content.size;
    const clamped = Math.min(Math.max(0, pos), docSize);
    const $pos = state.doc.resolve(clamped);
    const insertPos = $pos.depth === 0 ? $pos.pos : $pos.after(1);
    return Math.min(Math.max(0, insertPos), docSize);
  }

  private revealCaret(): void {
    if (!this.view) return;
    try {
      const dom = this.view.domAtPos(this.view.state.selection.head);
      const node = dom.node instanceof HTMLElement ? dom.node : dom.node.parentElement;
      node
        ?.closest('.lb-tpl-host, .lb-pm-img, p, h1, h2, h3')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch {
      /* ignore */
    }
  }

  private runMark(name: string): void {
    if (!this.view) return;
    const mark = lookbookSchema.marks[name];
    if (!mark) return;
    toggleMark(mark)(this.view.state, this.view.dispatch.bind(this.view));
    this.refreshActive();
  }

  private applyAttrMark(name: string, attrs: Record<string, string> | null): void {
    if (!this.view) return;
    const markType = lookbookSchema.marks[name];
    if (!markType) return;
    const { state, dispatch } = this.view;
    const { from, to, empty } = state.selection;
    let tr = state.tr;
    if (empty) {
      tr = tr.removeStoredMark(markType);
      if (attrs) {
        tr = tr.addStoredMark(markType.create(attrs));
      }
      dispatch(tr);
      this.view.focus();
      this.refreshActive();
      return;
    }
    tr = tr.removeMark(from, to, markType);
    if (attrs) {
      tr = tr.addMark(from, to, markType.create(attrs));
    }
    dispatch(tr);
    this.view.focus();
    this.refreshActive();
  }

  private refreshActive(): void {
    if (!this.view) return;
    const { state } = this.view;
    const { from, $from, empty } = state.selection;
    const isMark = (name: string) => {
      const type = lookbookSchema.marks[name];
      if (!type) return false;
      return empty
        ? !!type.isInSet(state.storedMarks || $from.marks())
        : state.doc.rangeHasMark(from, state.selection.to, type);
    };
    this.active.bold = isMark('strong');
    this.active.italic = isMark('em');
    this.active.underline = isMark('underline');
    this.active.strikeThrough = isMark('strike');

    const parent = $from.parent;
    this.active.block = '';
    if (parent.type.name === 'paragraph') this.active.block = 'p';
    if (parent.type.name === 'heading') {
      this.active.block = `h${parent.attrs['level']}` as 'h1' | 'h2' | 'h3';
    }
    if ($from.node(-1)?.type.name === 'blockquote' || parent.type.name === 'blockquote') {
      this.active.block = 'blockquote';
    }

    const align = (parent.attrs['align'] as string) || 'left';
    this.active.justifyLeft = align === 'left' || !parent.attrs['align'];
    this.active.justifyCenter = align === 'center';
    this.active.justifyRight = align === 'right';

    let listName = '';
    for (let d = $from.depth; d > 0; d--) {
      const n = $from.node(d).type.name;
      if (n === 'bullet_list' || n === 'ordered_list') {
        listName = n;
        break;
      }
    }
    this.active.insertUnorderedList = listName === 'bullet_list';
    this.active.insertOrderedList = listName === 'ordered_list';
  }

  private anchorPalette(ev: MouseEvent): void {
    const btn = ev.currentTarget as HTMLElement;
    const r = btn.getBoundingClientRect();
    this.palettePos = { top: r.bottom + 6, left: Math.max(8, r.left) };
  }

  private syncScale(): void {
    const host = this.canvasHostRef?.nativeElement;
    if (!host) return;
    const w = host.clientWidth || host.offsetWidth || 0;
    if (w <= 0) return;
    this.printScale = Math.min(1, Math.max(0.42, w / LOOKBOOK_A4.widthPx));
    // Keep multi-page height; ResizeObserver must not collapse back to 1 page.
    const totalUnscaled =
      this.pageMarks.length > 0
        ? this.pageMarks[this.pageMarks.length - 1].top +
          this.pageMarks[this.pageMarks.length - 1].height
        : LOOKBOOK_A4.heightPx;
    this.scaledHostHeight = Math.ceil(Math.max(LOOKBOOK_A4.heightPx, totalUnscaled) * this.printScale);
    this.layoutReady = true;
    this.cdr.markForCheck();
  }

  private pageMeasureSeq = 0;

  private schedulePageMarks(): void {
    if (this.pageMarkTimer) {
      clearTimeout(this.pageMarkTimer);
    }
    // Longer debounce — many templates + iframe measure must not thrash under the finger.
    this.pageMarkTimer = setTimeout(() => {
      this.pageMarkTimer = null;
      void this.refreshPageMarks();
    }, 420);
  }

  private async refreshPageMarks(): Promise<void> {
    if (!this.ready) {
      return;
    }
    const seq = ++this.pageMeasureSeq;
    const pageH = LOOKBOOK_A4.heightPx;

    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (seq !== this.pageMeasureSeq) return;

    // Freeze live margin pushes while selecting / deleting / typing / resizing.
    const uiBusy = LookbookTemplateNodeView.isUiBusy();

    const sheet = this.sheetRef.nativeElement;
    let totalH = Math.max(pageH, sheet.scrollHeight, sheet.offsetHeight);

    try {
      const measure = await measureLookbookPrintPages({
        title: this._documentTitle || 'Lookbook',
        bodyHtml: this.getHtml(),
      });
      if (seq !== this.pageMeasureSeq) return;
      totalH = Math.max(pageH, measure.totalHeight);

      if (!uiBusy && !LookbookTemplateNodeView.isUiBusy()) {
        const anchor =
          LookbookTemplateNodeView.getSelectedDom() ||
          (sheet.querySelector('.lb-tpl-host.is-selected') as HTMLElement | null);
        const topBefore = anchor?.getBoundingClientRect().top ?? null;
        const changed = applyLookbookTemplateShiftsToHosts(
          sheet,
          measure.templateShifts || [],
        );
        if (changed) {
          stabilizeLookbookScroll(anchor, topBefore);
        }
      }
    } catch {
      /* keep live height */
    }

    const count = Math.max(1, Math.ceil(totalH / pageH));
    sheet.style.minHeight = `${count * pageH}px`;
    this.pageMarks = Array.from({ length: count }, (_, i) => ({
      n: i + 1,
      top: i * pageH,
      height: pageH,
    }));
    this.scaledHostHeight = Math.ceil(count * pageH * this.printScale);
    this.cdr.markForCheck();
  }
}
