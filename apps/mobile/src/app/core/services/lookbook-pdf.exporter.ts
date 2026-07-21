import { Injectable } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { jsPDF } from 'jspdf';
import { lookbookToHtml, normalizeLookbookDocument } from '../models/lookbook-document';

export interface LookbookPdfExportResult {
  blob: Blob;
  /** JPEG previews of each A4 page (same layout as the PDF). */
  pages: string[];
}

export interface LookbookPdfExportOptions {
  contentWidth?: number;
}

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 40;

interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  bg?: string;
  size?: number;
}

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; runs: TextRun[]; align: Align }
  | { kind: 'para'; runs: TextRun[]; align: Align }
  | { kind: 'quote'; runs: TextRun[] }
  | { kind: 'list'; ordered: boolean; items: TextRun[][] }
  | { kind: 'hr' }
  | { kind: 'spacer'; h: number }
  | {
      kind: 'floatBand';
      side: 'left' | 'right';
      images: Array<{ src: string; widthPx: number }>;
      runs: TextRun[];
      align: Align;
    };

type Align = 'left' | 'center' | 'right';

/**
 * Layout-based lookbook PDF (no html2canvas).
 * Parses HTML → blocks → flows onto A4 with Noto fonts.
 */
@Injectable({ providedIn: 'root' })
export class LookbookPdfExporter {
  private fontReady: Promise<void> | null = null;
  private regularB64 = '';
  private boldB64 = '';

  async export(
    title: string,
    html: string | null | undefined,
    legacyJson?: unknown,
    options?: LookbookPdfExportOptions,
  ): Promise<LookbookPdfExportResult> {
    try {
      return await this.exportInner(title, html, legacyJson, options);
    } catch (err) {
      console.error('[LookbookPdf] export failed', err);
      throw err;
    }
  }

  private async exportInner(
    title: string,
    html: string | null | undefined,
    legacyJson?: unknown,
    options?: LookbookPdfExportOptions,
  ): Promise<LookbookPdfExportResult> {
    let content = (html || '').trim();
    if (!content || content === '<p></p>' || content === '<p><br></p>') {
      const doc = normalizeLookbookDocument(legacyJson, html);
      content = lookbookToHtml(doc);
    }

    const editorW = Math.max(280, Math.min(920, Math.round(options?.contentWidth || 360)));
    await this.ensureFonts();

    const blocks = this.parseBlocks(content);
    const imageUrls = this.collectImageUrls(blocks);
    const images = await this.loadImages(imageUrls);

    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    this.registerFonts(pdf);

    const contentW = A4_W - MARGIN * 2;
    const pxToPt = contentW / editorW;
    const pageBottom = A4_H - MARGIN;
    /** Allow short trailing blocks (hr + footer) into the margin instead of a nearly blank page. */
    const softBottom = A4_H - 16;

    let y = MARGIN;
    const previewPages: string[] = [];
    let preview = this.newPreviewCanvas();
    let pctx = preview.getContext('2d')!;

    const paintPreviewBg = (): void => {
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(0, 0, preview.width, preview.height);
    };
    paintPreviewBg();

    const finishPreviewPage = (): void => {
      previewPages.push(preview.toDataURL('image/jpeg', 0.9));
    };

    const newPage = (): void => {
      finishPreviewPage();
      pdf.addPage();
      preview = this.newPreviewCanvas();
      pctx = preview.getContext('2d')!;
      paintPreviewBg();
      y = MARGIN;
    };

    // Header on first page
    this.drawHeader(pdf, pctx, title?.trim() || 'Lookbook', contentW);
    y = MARGIN + 52;

    const ensure = (need: number, soft = false): void => {
      const limit = soft ? softBottom : pageBottom;
      if (y + need > limit) {
        // Prefer soft overflow for tiny leftovers over a blank next page
        if (!soft && need <= 52 && y + need <= softBottom) {
          return;
        }
        newPage();
      }
    };

    for (const block of blocks) {
      if (block.kind === 'spacer') {
        ensure(block.h);
        y += block.h;
        continue;
      }
      if (block.kind === 'hr') {
        ensure(18, true);
        this.line(pdf, pctx, MARGIN, y + 6, MARGIN + contentW, y + 6, '#c8cad4');
        y += 18;
        continue;
      }
      if (block.kind === 'heading') {
        const size = block.level === 1 ? 20 : block.level === 2 ? 16 : 13.5;
        const h = this.measureRuns(pdf, block.runs, contentW, size, true) + 10;
        ensure(h);
        y = this.drawRuns(
          pdf,
          pctx,
          block.runs,
          MARGIN,
          y,
          contentW,
          size,
          true,
          block.align,
        );
        y += 8;
        continue;
      }
      if (block.kind === 'para') {
        const size = 11;
        const h = this.measureRuns(pdf, block.runs, contentW, size, false) + 8;
        const soft = h <= 40 && block.align === 'center';
        ensure(Math.min(h, 80), soft);
        y = this.drawRunsFlow(
          pdf,
          pctx,
          block.runs,
          MARGIN,
          y,
          contentW,
          size,
          false,
          block.align,
          soft ? softBottom : pageBottom,
          () => {
            newPage();
            return MARGIN;
          },
        );
        y += 6;
        continue;
      }
      if (block.kind === 'quote') {
        const size = 11;
        const pad = 10;
        const innerW = contentW - pad * 2 - 4;
        const textH = this.measureRuns(pdf, block.runs, innerW, size, false);
        const boxH = textH + pad * 2;
        ensure(boxH + 8);
        pdf.setFillColor(243, 232, 248);
        pdf.rect(MARGIN, y, contentW, boxH, 'F');
        this.fillRectPreview(pctx, MARGIN, y, contentW, boxH, '#f3e8f8');
        pdf.setFillColor(138, 79, 160);
        pdf.rect(MARGIN, y, 4, boxH, 'F');
        this.fillRectPreview(pctx, MARGIN, y, 4, boxH, '#8a4fa0');
        this.drawRuns(pdf, pctx, block.runs, MARGIN + pad + 4, y + pad, innerW, size, false, 'left');
        y += boxH + 10;
        continue;
      }
      if (block.kind === 'list') {
        const size = 11;
        for (let i = 0; i < block.items.length; i++) {
          const bullet = block.ordered ? `${i + 1}.` : '•';
          const prefix = `${bullet} `;
          const runs: TextRun[] = [{ text: prefix, bold: true, size }, ...block.items[i]!];
          const h = this.measureRuns(pdf, runs, contentW - 8, size, false) + 4;
          ensure(Math.min(h, 60));
          y = this.drawRunsFlow(
            pdf,
            pctx,
            runs,
            MARGIN + 6,
            y,
            contentW - 8,
            size,
            false,
            'left',
            pageBottom,
            () => {
              newPage();
              return MARGIN;
            },
          );
          y += 3;
        }
        y += 6;
        continue;
      }
      if (block.kind === 'floatBand') {
        y = this.drawFloatBand(
          pdf,
          pctx,
          block,
          images,
          MARGIN,
          y,
          contentW,
          pxToPt,
          pageBottom,
          softBottom,
          newPage,
        );
        continue;
      }
    }

    finishPreviewPage();

    for (const img of images.values()) {
      const url = (img as HTMLImageElement & { _lbUrl?: string })._lbUrl;
      if (url) {
        URL.revokeObjectURL(url);
      }
    }

    return { blob: pdf.output('blob'), pages: previewPages };
  }

  // ─── fonts ───────────────────────────────────────────────

  private async ensureFonts(): Promise<void> {
    if (!this.fontReady) {
      this.fontReady = (async () => {
        const [reg, bold] = await Promise.all([
          this.fetchFontBase64('assets/fonts/NotoSans-Regular.ttf'),
          this.fetchFontBase64('assets/fonts/NotoSans-Bold.ttf'),
        ]);
        if (!reg || !bold || reg.length < 1000 || bold.length < 1000) {
          throw new Error('Noto font data is empty or truncated');
        }
        this.regularB64 = reg;
        this.boldB64 = bold;
      })().catch((err) => {
        this.fontReady = null;
        throw err;
      });
    }
    await this.fontReady;
  }

  private registerFonts(pdf: jsPDF): void {
    pdf.addFileToVFS('NotoSans-Regular.ttf', this.regularB64);
    pdf.addFileToVFS('NotoSans-Bold.ttf', this.boldB64);
    pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    pdf.setFont('NotoSans', 'normal');
  }

  /** Local assets must use WebView fetch — CapacitorHttp cannot read https://localhost assets. */
  private async fetchFontBase64(path: string): Promise<string> {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Font load failed: ${path} (${res.status})`);
    }
    return this.blobToBase64(await res.blob());
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const s = String(reader.result || '');
        resolve(s.includes(',') ? s.split(',')[1]! : s);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  // ─── HTML → blocks ───────────────────────────────────────

  private parseBlocks(html: string): Block[] {
    const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
    const root = doc.getElementById('root');
    if (!root) {
      return [];
    }

    const blocks: Block[] = [];
    const nodes = Array.from(root.childNodes);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      if (node.nodeType === Node.TEXT_NODE) {
        const t = (node.textContent || '').replace(/\u00a0/g, ' ').trim();
        if (t) {
          blocks.push({ kind: 'para', runs: [{ text: t }], align: 'left' });
        }
        continue;
      }
      if (!(node instanceof HTMLElement)) {
        continue;
      }

      const tag = node.tagName.toLowerCase();

      if (this.isClearFix(node)) {
        blocks.push({ kind: 'spacer', h: 4 });
        continue;
      }

      if (tag === 'hr') {
        blocks.push({ kind: 'hr' });
        continue;
      }

      if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
        const level = Number(tag[1]) as 1 | 2 | 3;
        blocks.push({
          kind: 'heading',
          level,
          runs: this.extractRuns(node),
          align: this.readAlign(node),
        });
        continue;
      }

      if (tag === 'blockquote') {
        blocks.push({ kind: 'quote', runs: this.extractRuns(node) });
        continue;
      }

      if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(node.children)
          .filter((c) => c.tagName.toLowerCase() === 'li')
          .map((li) => this.extractRuns(li as HTMLElement));
        blocks.push({ kind: 'list', ordered: tag === 'ol', items });
        continue;
      }

      if (tag === 'p' || tag === 'div') {
        const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
        if (imgs.length >= 1) {
          const clone = node.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('img').forEach((el) => el.remove());
          const side =
            imgs.length === 1
              ? this.isFloat(imgs[0]!)
                ? this.floatSide(imgs[0]!)
                : 'left'
              : this.floatSide(imgs[0]!);
          blocks.push({
            kind: 'floatBand',
            side,
            images: imgs.map((img) => ({
              src: img.getAttribute('src') || '',
              widthPx: this.readWidth(img),
            })),
            runs: this.extractRuns(clone),
            align: this.readAlign(node),
          });
          continue;
        }

        const runs = this.extractRuns(node);
        if (!runs.length || runs.every((r) => !r.text.replace(/\s/g, ''))) {
          blocks.push({ kind: 'spacer', h: 8 });
          continue;
        }
        blocks.push({ kind: 'para', runs, align: this.readAlign(node) });
        continue;
      }

      // Fallback: treat as paragraph
      const runs = this.extractRuns(node);
      if (runs.some((r) => r.text.trim())) {
        blocks.push({ kind: 'para', runs, align: this.readAlign(node) });
      }
    }

    return blocks;
  }

  private extractRuns(el: HTMLElement): TextRun[] {
    const runs: TextRun[] = [];

    const walk = (node: Node, style: Partial<TextRun>): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const raw = (node.textContent || '').replace(/\u00a0/g, ' ');
        if (!raw) {
          return;
        }
        // Keep single spaces; normalize exotic separators so jsPDF metrics stay stable
        const text = raw
          .replace(/[\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\u00b7/g, '·');
        if (!text) {
          return;
        }
        runs.push({
          text,
          bold: style.bold,
          italic: style.italic,
          underline: style.underline,
          strike: style.strike,
          color: style.color,
          bg: style.bg,
          size: style.size,
        });
        return;
      }
      if (!(node instanceof HTMLElement)) {
        return;
      }
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') {
        runs.push({ text: '\n', ...style });
        return;
      }
      if (tag === 'img') {
        return;
      }
      const next: Partial<TextRun> = { ...style };
      if (tag === 'b' || tag === 'strong') {
        next.bold = true;
      }
      if (tag === 'i' || tag === 'em') {
        next.italic = true;
      }
      if (tag === 'u') {
        next.underline = true;
      }
      if (tag === 's' || tag === 'strike' || tag === 'del') {
        next.strike = true;
      }
      const color = node.style?.color;
      if (color) {
        next.color = this.cssColorToHex(color) || next.color;
      }
      const bg = node.style?.backgroundColor;
      if (bg && bg !== 'transparent') {
        next.bg = this.cssColorToHex(bg) || next.bg;
      }
      const fs = node.style?.fontSize;
      if (fs) {
        const px = parseFloat(fs);
        if (px > 0) {
          next.size = Math.max(8, Math.min(28, px * 0.75));
        }
      }
      Array.from(node.childNodes).forEach((ch) => walk(ch, next));
    };

    Array.from(el.childNodes).forEach((ch) => walk(ch, {}));

    // Merge adjacent same-style runs so spaces between spans survive as one string
    const merged: TextRun[] = [];
    for (const r of runs) {
      const prev = merged[merged.length - 1];
      if (
        prev &&
        prev.bold === r.bold &&
        prev.italic === r.italic &&
        prev.underline === r.underline &&
        prev.strike === r.strike &&
        prev.color === r.color &&
        prev.bg === r.bg &&
        prev.size === r.size &&
        !prev.text.endsWith('\n') &&
        !r.text.startsWith('\n')
      ) {
        prev.text += r.text;
      } else {
        merged.push({ ...r });
      }
    }

    return merged
      .map((r, i) => {
        let t = r.text;
        if (i === 0) {
          t = t.replace(/^\s+/, '');
        }
        if (i === merged.length - 1) {
          t = t.replace(/\s+$/, '');
        }
        return { ...r, text: t };
      })
      .filter((r) => r.text.length > 0);
  }

  private readAlign(el: HTMLElement): Align {
    const a = (el.style.textAlign || el.getAttribute('align') || '').toLowerCase();
    if (a.includes('center')) {
      return 'center';
    }
    if (a.includes('right')) {
      return 'right';
    }
    return 'left';
  }

  private isFloat(img: HTMLImageElement): boolean {
    const f = (img.style.float || img.getAttribute('data-lb-float') || '').toLowerCase();
    const style = (img.getAttribute('style') || '').toLowerCase();
    return f === 'left' || f === 'right' || style.includes('float:left') || style.includes('float: left') || style.includes('float:right') || style.includes('float: right');
  }

  private floatSide(img: HTMLImageElement): 'left' | 'right' {
    const f = (img.style.float || img.getAttribute('data-lb-float') || '').toLowerCase();
    const style = (img.getAttribute('style') || '').toLowerCase();
    if (f === 'right' || style.includes('float:right') || style.includes('float: right')) {
      return 'right';
    }
    return 'left';
  }

  private readWidth(img: HTMLImageElement): number {
    const attr = parseInt(img.getAttribute('width') || '0', 10);
    if (attr > 0) {
      return attr;
    }
    const styleW = parseFloat(String(img.style.width || '').replace('px', ''));
    if (styleW > 0) {
      return styleW;
    }
    return 180;
  }

  private isClearFix(el: HTMLElement): boolean {
    const style = (el.getAttribute('style') || '').toLowerCase();
    return style.includes('clear:both') || style.includes('clear: both');
  }

  private cssColorToHex(input: string): string | null {
    const s = input.trim().toLowerCase();
    if (s.startsWith('#') && (s.length === 7 || s.length === 4)) {
      if (s.length === 4) {
        return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
      }
      return s;
    }
    const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
    if (!m) {
      return null;
    }
    const hex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${hex(+m[1]!)}${hex(+m[2]!)}${hex(+m[3]!)}`;
  }

  // ─── measure / draw text ─────────────────────────────────

  private setFont(pdf: jsPDF, bold?: boolean, size = 11): void {
    pdf.setFont('NotoSans', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
  }

  private measureRuns(
    pdf: jsPDF,
    runs: TextRun[],
    maxW: number,
    baseSize: number,
    heading: boolean,
  ): number {
    const lines = this.buildLines(pdf, runs, maxW, baseSize, heading);
    let h = 0;
    for (const line of lines) {
      const size = line.reduce((m, s) => Math.max(m, s.size), baseSize);
      h += size * 1.35;
    }
    return Math.max(baseSize * 1.35, h);
  }

  private buildLines(
    pdf: jsPDF,
    runs: TextRun[],
    maxW: number,
    baseSize: number,
    heading: boolean,
  ): Array<
    Array<{
      text: string;
      bold?: boolean;
      color?: string;
      bg?: string;
      size: number;
      underline?: boolean;
      strike?: boolean;
    }>
  > {
    type Seg = {
      text: string;
      bold?: boolean;
      color?: string;
      bg?: string;
      size: number;
      underline?: boolean;
      strike?: boolean;
    };
    const pieces: Seg[] = [];
    for (const run of runs) {
      const size = run.size || baseSize;
      const parts = run.text.split('\n');
      parts.forEach((part, idx) => {
        if (idx > 0) {
          pieces.push({
            text: '\n',
            size,
            bold: !!(run.bold || heading),
            color: run.color,
            bg: run.bg,
            underline: run.underline,
            strike: run.strike,
          });
        }
        for (const tok of part.split(/(\s+)/).filter(Boolean)) {
          pieces.push({
            text: tok,
            bold: !!(run.bold || heading),
            color: run.color,
            bg: run.bg,
            size,
            underline: run.underline,
            strike: run.strike,
          });
        }
      });
    }

    const lines: Seg[][] = [[]];
    let lineW = 0;
    for (const piece of pieces) {
      if (piece.text === '\n') {
        lines.push([]);
        lineW = 0;
        continue;
      }
      this.setFont(pdf, piece.bold, piece.size);
      const w = pdf.getTextWidth(piece.text);
      if (lineW + w > maxW + 0.01 && lines[lines.length - 1]!.length && !/^\s+$/.test(piece.text)) {
        lines.push([]);
        lineW = 0;
      }
      if (/^\s+$/.test(piece.text) && lineW === 0) {
        continue;
      }
      lines[lines.length - 1]!.push(piece);
      lineW += w;
    }
    return lines;
  }

  private drawRuns(
    pdf: jsPDF,
    ctx: CanvasRenderingContext2D,
    runs: TextRun[],
    x: number,
    y: number,
    maxW: number,
    baseSize: number,
    heading: boolean,
    align: Align,
  ): number {
    return this.drawRunsFlow(
      pdf,
      ctx,
      runs,
      x,
      y,
      maxW,
      baseSize,
      heading,
      align,
      Number.POSITIVE_INFINITY,
      () => y,
    );
  }

  private drawRunsFlow(
    pdf: jsPDF,
    ctx: CanvasRenderingContext2D,
    runs: TextRun[],
    x: number,
    startY: number,
    maxW: number,
    baseSize: number,
    heading: boolean,
    align: Align,
    pageBottom: number,
    newPageY: () => number,
  ): number {
    const lines = this.buildLines(pdf, runs, maxW, baseSize, heading);
    let y = startY;
    const scale = this.previewScale();

    for (const line of lines) {
      const size = line.reduce((m, s) => Math.max(m, s.size), baseSize);
      const lh = size * 1.35;
      if (y + lh > pageBottom) {
        y = newPageY();
      }
      let tw = 0;
      for (const seg of line) {
        this.setFont(pdf, seg.bold, seg.size);
        tw += pdf.getTextWidth(seg.text);
      }
      let cursorX = x;
      if (align === 'center') {
        cursorX = x + (maxW - tw) / 2;
      } else if (align === 'right') {
        cursorX = x + (maxW - tw);
      }

      for (const seg of line) {
        this.setFont(pdf, seg.bold, seg.size);
        const w = pdf.getTextWidth(seg.text);
        const baseline = y + size;

        if (seg.bg) {
          const rgb = this.hexToRgb(seg.bg);
          if (rgb) {
            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.rect(cursorX - 1, y - 1, w + 2, lh, 'F');
            this.fillRectPreview(ctx, cursorX - 1, y - 1, w + 2, lh, seg.bg);
          }
        }

        const color = seg.color || '#16182a';
        const rgb = this.hexToRgb(color) || { r: 22, g: 24, b: 42 };
        pdf.setTextColor(rgb.r, rgb.g, rgb.b);
        pdf.text(seg.text, cursorX, baseline);

        ctx.font = `${seg.bold ? '700' : '400'} ${size * scale}px Arial, Helvetica, sans-serif`;
        ctx.fillStyle = color;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(seg.text, cursorX * scale, baseline * scale);

        if (seg.underline) {
          this.line(pdf, ctx, cursorX, baseline + 1.2, cursorX + w, baseline + 1.2, color);
        }
        if (seg.strike) {
          const mid = y + size * 0.55;
          this.line(pdf, ctx, cursorX, mid, cursorX + w, mid, color);
        }

        cursorX += w;
      }
      y += lh;
    }
    return y;
  }

  /**
   * CSS-float-like band: primary image + optional secondary grid + text beside.
   * Keeps short captions (e.g. "Прооо") next to the photo instead of below.
   */
  private drawFloatBand(
    pdf: jsPDF,
    ctx: CanvasRenderingContext2D,
    block: Extract<Block, { kind: 'floatBand' }>,
    images: Map<string, HTMLImageElement>,
    originX: number,
    startY: number,
    contentW: number,
    pxToPt: number,
    pageBottom: number,
    softBottom: number,
    newPage: () => void,
  ): number {
    const gap = 10;
    let y = startY;
    const imgs = block.images.filter((im) => !!im.src);
    if (!imgs.length) {
      if (!block.runs.length) {
        return y;
      }
      return (
        this.drawRunsFlow(
          pdf,
          ctx,
          block.runs,
          originX,
          y,
          contentW,
          11,
          false,
          block.align,
          pageBottom,
          () => {
            newPage();
            return MARGIN;
          },
        ) + 6
      );
    }

    const maxW = Math.max(...imgs.map((im) => im.widthPx));
    let primaryIdx = imgs.findIndex((im) => im.widthPx >= maxW * 0.9);
    if (primaryIdx < 0) {
      primaryIdx = 0;
    }
    const primary = imgs[primaryIdx]!;
    const secondary = imgs.filter((_, i) => i !== primaryIdx);

    const primaryW = Math.min(
      Math.max(64, primary.widthPx * pxToPt),
      contentW * (secondary.length ? 0.42 : 0.48),
    );
    const primaryBmp = images.get(primary.src);
    const primaryH = primaryBmp
      ? (primaryBmp.naturalHeight / Math.max(1, primaryBmp.naturalWidth)) * primaryW
      : primaryW * 1.2;

    const thumbMax = Math.min(
      contentW * 0.22,
      Math.max(36, Math.min(...(secondary.map((s) => s.widthPx * pxToPt).concat([72]))), 72),
    );
    const cols =
      secondary.length <= 1 ? 1 : secondary.length <= 4 ? 2 : 3;
    const thumbGap = 6;
    type Thumb = { src: string; w: number; h: number; col: number; row: number };
    const thumbs: Thumb[] = secondary.map((im, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const w = Math.min(thumbMax, Math.max(28, im.widthPx * pxToPt));
      const bmp = images.get(im.src);
      const h = bmp ? (bmp.naturalHeight / Math.max(1, bmp.naturalWidth)) * w : w;
      return { src: im.src, w, h, col, row };
    });

    let gridH = 0;
    let gridW = 0;
    const colW: number[] = Array.from({ length: cols }, () => 0);
    const rowH: number[] = [];
    for (const t of thumbs) {
      colW[t.col] = Math.max(colW[t.col]!, t.w);
      rowH[t.row] = Math.max(rowH[t.row] || 0, t.h);
    }
    if (thumbs.length) {
      gridW = colW.reduce((a, b) => a + b, 0) + thumbGap * Math.max(0, cols - 1);
      gridH = rowH.reduce((a, b) => a + b, 0) + thumbGap * Math.max(0, rowH.length - 1);
    }

    const hasText = block.runs.some((r) => r.text.trim());
    const textSize = 10.5;
    const side = block.side;

    let textColW = 0;
    if (hasText) {
      const used = primaryW + (thumbs.length ? gridW + gap : 0) + gap;
      textColW = Math.max(0, contentW - used);
      if (textColW < 56) {
        textColW = 0;
      }
    }

    const textHBeside =
      textColW > 0 ? this.measureRuns(pdf, block.runs, textColW, textSize, false) : 0;
    const textHBelow =
      textColW === 0 && hasText
        ? this.measureRuns(pdf, block.runs, contentW, textSize, false)
        : 0;

    const bandH =
      Math.max(primaryH, textHBeside, gridH) + (textHBelow ? textHBelow + 6 : 0) + 8;

    if (y + Math.min(bandH, Math.max(primaryH, 90)) > pageBottom && y > MARGIN + 10) {
      if (y + Math.min(bandH, 48) <= softBottom && bandH <= 48) {
        // soft: keep tiny band
      } else {
        newPage();
        y = MARGIN;
      }
    }

    const top = y;
    const drawThumbsAt = (baseX: number, baseY: number): void => {
      if (!thumbs.length) {
        return;
      }
      const colX: number[] = [];
      let cx = baseX;
      for (let c = 0; c < cols; c++) {
        colX[c] = cx;
        cx += colW[c]! + thumbGap;
      }
      const rowY: number[] = [];
      let ry = baseY;
      for (let r = 0; r < rowH.length; r++) {
        rowY[r] = ry;
        ry += (rowH[r] || 0) + thumbGap;
      }
      for (const t of thumbs) {
        const bmp = images.get(t.src);
        if (bmp) {
          this.drawImage(pdf, ctx, bmp, colX[t.col]!, rowY[t.row]!, t.w, t.h);
        }
      }
    };

    if (side === 'left') {
      let x = originX;
      if (primaryBmp) {
        this.drawImage(pdf, ctx, primaryBmp, x, top, primaryW, primaryH);
      } else {
        this.strokeRectPreview(ctx, x, top, primaryW, primaryH, '#ccc');
      }
      x += primaryW + gap;

      if (textColW > 0) {
        this.drawRuns(pdf, ctx, block.runs, x, top, textColW, textSize, false, 'left');
        x += textColW + gap;
      }

      drawThumbsAt(x, top);
    } else {
      const primaryX = originX + contentW - primaryW;
      if (primaryBmp) {
        this.drawImage(pdf, ctx, primaryBmp, primaryX, top, primaryW, primaryH);
      } else {
        this.strokeRectPreview(ctx, primaryX, top, primaryW, primaryH, '#ccc');
      }
      let x = originX;
      if (thumbs.length) {
        drawThumbsAt(x, top);
        x += gridW + gap;
      }
      if (textColW > 0) {
        this.drawRuns(pdf, ctx, block.runs, x, top, textColW, textSize, false, 'left');
      }
    }

    let nextY = top + Math.max(primaryH, textHBeside, gridH) + 8;
    if (textHBelow > 0) {
      nextY =
        this.drawRuns(
          pdf,
          ctx,
          block.runs,
          originX,
          nextY,
          contentW,
          textSize,
          false,
          block.align,
        ) + 6;
    }
    return nextY;
  }

  // ─── images / geometry ───────────────────────────────────

  private collectImageUrls(blocks: Block[]): string[] {
    const urls = new Set<string>();
    for (const b of blocks) {
      if (b.kind === 'floatBand') {
        b.images.forEach((im) => im.src && urls.add(im.src));
      }
    }
    return [...urls];
  }

  private async loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
    const map = new Map<string, HTMLImageElement>();
    await Promise.all(
      urls.map(async (src) => {
        try {
          let objectUrl = src;
          const revoke: string[] = [];
          if (!src.startsWith('data:') && !src.startsWith('blob:')) {
            const blob = await this.fetchBlob(src);
            objectUrl = URL.createObjectURL(blob);
            revoke.push(objectUrl);
          }
          const img = await this.decodeImage(objectUrl);
          map.set(src, img);
          // Keep object URL alive until export ends — store on img
          (img as HTMLImageElement & { _lbUrl?: string })._lbUrl = revoke[0];
        } catch (err) {
          console.warn('[LookbookPdf] image load failed', src, err);
        }
      }),
    );
    return map;
  }

  private decodeImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = src;
    });
  }

  private drawImage(
    pdf: jsPDF,
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const c = canvas.getContext('2d')!;
      c.drawImage(img, 0, 0);
      const data = canvas.toDataURL('image/jpeg', 0.86);
      pdf.addImage(data, 'JPEG', x, y, w, h);
    } catch {
      // fallback placeholder
      pdf.setDrawColor(200);
      pdf.rect(x, y, w, h);
    }
    const s = this.previewScale();
    ctx.save();
    ctx.beginPath();
    const r = 8 * s;
    this.roundRect(ctx, x * s, y * s, w * s, h * s, r);
    ctx.clip();
    ctx.drawImage(img, x * s, y * s, w * s, h * s);
    ctx.restore();
  }

  private drawHeader(pdf: jsPDF, ctx: CanvasRenderingContext2D, title: string, contentW: number): void {
    this.setFont(pdf, true, 10);
    pdf.setTextColor(138, 79, 160);
    pdf.text('Rainbow Manager', MARGIN, MARGIN + 10);
    const s = this.previewScale();
    ctx.font = `700 ${10 * s}px Arial`;
    ctx.fillStyle = '#8a4fa0';
    ctx.fillText('Rainbow Manager', MARGIN * s, (MARGIN + 10) * s);

    this.setFont(pdf, true, 18);
    pdf.setTextColor(22, 24, 42);
    const lines = pdf.splitTextToSize(title, contentW) as string[];
    let y = MARGIN + 28;
    for (const line of lines.slice(0, 2)) {
      pdf.text(line, MARGIN, y);
      ctx.font = `800 ${18 * s}px Arial`;
      ctx.fillStyle = '#16182a';
      ctx.fillText(line, MARGIN * s, y * s);
      y += 20;
    }
  }

  private newPreviewCanvas(): HTMLCanvasElement {
    const scale = this.previewScale();
    const c = document.createElement('canvas');
    c.width = Math.round(A4_W * scale);
    c.height = Math.round(A4_H * scale);
    return c;
  }

  private previewScale(): number {
    return 2;
  }

  private fillRectPreview(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): void {
    const s = this.previewScale();
    ctx.fillStyle = color;
    ctx.fillRect(x * s, y * s, w * s, h * s);
  }

  private strokeRectPreview(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): void {
    const s = this.previewScale();
    ctx.strokeStyle = color;
    ctx.strokeRect(x * s, y * s, w * s, h * s);
  }

  private line(
    pdf: jsPDF,
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    skipPdf = false,
  ): void {
    const rgb = this.hexToRgb(color) || { r: 200, g: 200, b: 200 };
    if (!skipPdf) {
      pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
      pdf.setLineWidth(0.8);
      pdf.line(x1, y1, x2, y2);
    }
    const s = this.previewScale();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1 * s, y1 * s);
    ctx.lineTo(x2 * s, y2 * s);
    ctx.stroke();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const h = hex.replace('#', '');
    if (h.length !== 6) {
      return null;
    }
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  private async fetchBlob(url: string): Promise<Blob> {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.get({ url, responseType: 'blob' });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP ${response.status}`);
      }
      return this.httpDataToBlob(response.data, response.headers || {});
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.blob();
  }

  private httpDataToBlob(data: unknown, headers: Record<string, string>): Blob {
    const contentType =
      headers['Content-Type'] || headers['content-type'] || 'image/jpeg';
    if (data instanceof Blob) {
      return data;
    }
    if (typeof data === 'string') {
      const base64 = data.includes(',') ? data.split(',')[1]! : data;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: contentType });
    }
    if (data instanceof ArrayBuffer) {
      return new Blob([data], { type: contentType });
    }
    throw new Error('Unsupported image response');
  }
}
