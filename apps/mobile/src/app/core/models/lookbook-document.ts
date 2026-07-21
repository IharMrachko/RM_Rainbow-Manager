export type LookbookBlockType = 'paragraph' | 'heading' | 'image';

export interface LookbookParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
}

export interface LookbookHeadingBlock {
  id: string;
  type: 'heading';
  level: 1 | 2;
  text: string;
}

export interface LookbookImageBlock {
  id: string;
  type: 'image';
  src: string;
  alt?: string;
  /** Share of content width, 30–100. */
  widthPercent: number;
  /** Shown beside the photo when widthPercent < 90. */
  sideText?: string;
}

export type LookbookBlock =
  | LookbookParagraphBlock
  | LookbookHeadingBlock
  | LookbookImageBlock;

export interface LookbookDocument {
  version: 1;
  blocks: LookbookBlock[];
}

export function emptyLookbookDocument(): LookbookDocument {
  return {
    version: 1,
    blocks: [createParagraphBlock('')],
  };
}

/** Prefer stored HTML; fall back to block/TipTap migration. */
export function resolveLookbookHtml(
  contentJson: unknown,
  contentHtml?: string | null,
): string {
  const html = (contentHtml || '').trim();
  if (html && html !== '<p></p>' && html !== '<p><br></p>') {
    return html;
  }
  return lookbookToHtml(normalizeLookbookDocument(contentJson, contentHtml));
}

export function createParagraphBlock(text = ''): LookbookParagraphBlock {
  return { id: newBlockId(), type: 'paragraph', text };
}

export function createHeadingBlock(text = '', level: 1 | 2 = 2): LookbookHeadingBlock {
  return { id: newBlockId(), type: 'heading', level, text };
}

export function createImageBlock(
  src: string,
  opts?: { alt?: string; widthPercent?: number; sideText?: string },
): LookbookImageBlock {
  return {
    id: newBlockId(),
    type: 'image',
    src,
    alt: opts?.alt || '',
    widthPercent: clampPercent(opts?.widthPercent ?? 48),
    sideText: opts?.sideText || '',
  };
}

export function newBlockId(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 48;
  }
  return Math.max(30, Math.min(100, Math.round(value)));
}

export function lookbookToHtml(doc: LookbookDocument): string {
  const parts = (doc.blocks || []).map((block) => {
    if (block.type === 'heading') {
      const tag = block.level === 1 ? 'h1' : 'h2';
      return `<${tag}>${escapeHtml(block.text)}</${tag}>`;
    }
    if (block.type === 'image') {
      const w = clampPercent(block.widthPercent);
      const img = `<img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt || '')}" width="${Math.round((w / 100) * 360)}" />`;
      const side = (block.sideText || '').trim();
      if (side && w < 90) {
        return `<div class="lb-row">${img}<p>${escapeHtml(side)}</p></div>`;
      }
      return `${img}${side ? `<p>${escapeHtml(side)}</p>` : ''}`;
    }
    return `<p>${escapeHtml(block.text).replace(/\n/g, '<br>')}</p>`;
  });
  return parts.join('') || '<p></p>';
}

/** Normalize any stored payload (v1 blocks, TipTap JSON, or HTML). */
export function normalizeLookbookDocument(
  contentJson: unknown,
  contentHtml?: string | null,
): LookbookDocument {
  const fromJson = parseLookbookJson(contentJson);
  if (fromJson) {
    return fromJson;
  }
  if (contentHtml && contentHtml.trim()) {
    return htmlToLookbookDocument(contentHtml);
  }
  return emptyLookbookDocument();
}

export function parseLookbookJson(raw: unknown): LookbookDocument | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const obj = raw as Record<string, unknown>;

  if (obj['version'] === 1 && Array.isArray(obj['blocks'])) {
    const blocks = (obj['blocks'] as unknown[])
      .map((b) => coerceBlock(b))
      .filter((b): b is LookbookBlock => !!b);
    return { version: 1, blocks: blocks.length ? blocks : [createParagraphBlock('')] };
  }

  // TipTap / ProseMirror doc
  if (obj['type'] === 'doc' && Array.isArray(obj['content'])) {
    return tipTapToLookbook(obj['content'] as unknown[]);
  }

  return null;
}

function coerceBlock(raw: unknown): LookbookBlock | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const b = raw as Record<string, unknown>;
  const type = String(b['type'] || '');
  const id = typeof b['id'] === 'string' && b['id'] ? b['id'] : newBlockId();

  if (type === 'paragraph') {
    return { id, type: 'paragraph', text: String(b['text'] ?? '') };
  }
  if (type === 'heading') {
    const level = Number(b['level']) === 1 ? 1 : 2;
    return { id, type: 'heading', level, text: String(b['text'] ?? '') };
  }
  if (type === 'image') {
    const src = String(b['src'] ?? '');
    if (!src) {
      return null;
    }
    return {
      id,
      type: 'image',
      src,
      alt: String(b['alt'] ?? ''),
      widthPercent: clampPercent(Number(b['widthPercent'] ?? 48)),
      sideText: String(b['sideText'] ?? ''),
    };
  }
  return null;
}

function tipTapToLookbook(nodes: unknown[]): LookbookDocument {
  const blocks: LookbookBlock[] = [];
  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i] as Record<string, unknown> | undefined;
    const type = String(node?.['type'] || '');

    if (type === 'heading') {
      const level = Number((node?.['attrs'] as { level?: number } | undefined)?.level) === 1 ? 1 : 2;
      blocks.push(createHeadingBlock(plainFromTipTap(node), level));
      i += 1;
      continue;
    }

    if (type === 'image' || type === 'resizableImage') {
      const attrs = (node?.['attrs'] || {}) as Record<string, unknown>;
      const src = String(attrs['src'] || '');
      const alt = String(attrs['alt'] || '');
      const widthPx = Number(attrs['width']);
      const widthPercent = Number.isFinite(widthPx) && widthPx > 0
        ? clampPercent((widthPx / 360) * 100)
        : 48;

      let sideText = '';
      let j = i + 1;
      if (widthPercent < 90 && j < nodes.length) {
        const next = nodes[j] as Record<string, unknown> | undefined;
        if (String(next?.['type']) === 'paragraph') {
          sideText = plainFromTipTap(next);
          j += 1;
        }
      }
      if (src) {
        blocks.push(createImageBlock(src, { alt, widthPercent, sideText }));
      }
      i = j;
      continue;
    }

    if (type === 'paragraph') {
      blocks.push(createParagraphBlock(plainFromTipTap(node)));
      i += 1;
      continue;
    }

    if (type === 'bulletList' || type === 'orderedList') {
      const items = (node?.['content'] as unknown[]) || [];
      for (const item of items) {
        blocks.push(createParagraphBlock(`• ${plainFromTipTap(item as Record<string, unknown>)}`));
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  return { version: 1, blocks: blocks.length ? blocks : [createParagraphBlock('')] };
}

function plainFromTipTap(node: Record<string, unknown> | undefined): string {
  if (!node) {
    return '';
  }
  if (node['type'] === 'text') {
    return String(node['text'] ?? '');
  }
  if (node['type'] === 'hardBreak') {
    return '\n';
  }
  const content = (node['content'] as unknown[]) || [];
  return content.map((c) => plainFromTipTap(c as Record<string, unknown>)).join('');
}

export function htmlToLookbookDocument(html: string): LookbookDocument {
  const root = document.createElement('div');
  root.innerHTML = html || '';
  const blocks: LookbookBlock[] = [];

  const walk = (el: Element): void => {
    Array.from(el.children).forEach((child) => {
      const tag = child.tagName.toLowerCase();
      if (tag === 'h1' || tag === 'h2') {
        blocks.push(createHeadingBlock(child.textContent || '', tag === 'h1' ? 1 : 2));
        return;
      }
      if (tag === 'img') {
        const img = child as HTMLImageElement;
        const widthPx = parseInt(img.getAttribute('width') || '0', 10);
        blocks.push(
          createImageBlock(img.getAttribute('src') || '', {
            alt: img.getAttribute('alt') || '',
            widthPercent: widthPx > 0 ? clampPercent((widthPx / 360) * 100) : 48,
          }),
        );
        return;
      }
      if (tag === 'div' && child.classList.contains('lb-row')) {
        const img = child.querySelector('img');
        const p = child.querySelector('p');
        if (img?.getAttribute('src')) {
          const widthPx = parseInt(img.getAttribute('width') || '0', 10);
          blocks.push(
            createImageBlock(img.getAttribute('src') || '', {
              alt: img.getAttribute('alt') || '',
              widthPercent: widthPx > 0 ? clampPercent((widthPx / 360) * 100) : 48,
              sideText: p?.textContent || '',
            }),
          );
        }
        return;
      }
      if (tag === 'p') {
        const imgs = Array.from(child.querySelectorAll('img'));
        if (imgs.length && !(child.textContent || '').trim()) {
          for (const img of imgs) {
            blocks.push(
              createImageBlock(img.getAttribute('src') || '', {
                alt: img.getAttribute('alt') || '',
              }),
            );
          }
          return;
        }
        blocks.push(createParagraphBlock((child.textContent || '').replace(/\u00a0/g, ' ')));
        return;
      }
      if (child.children.length) {
        walk(child);
      } else if ((child.textContent || '').trim()) {
        blocks.push(createParagraphBlock(child.textContent || ''));
      }
    });
  };

  walk(root);
  return { version: 1, blocks: blocks.length ? blocks : [createParagraphBlock('')] };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
