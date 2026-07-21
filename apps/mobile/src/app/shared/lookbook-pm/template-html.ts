import {
  LookbookTemplateCopy,
  LookbookTemplateId,
  LookbookTemplatePhoto,
  findLookbookTemplate,
} from '../../core/utils/lookbook-page-templates';

function esc(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imgTag(
  photo: LookbookTemplatePhoto | undefined,
  slot: number,
  extraClass = '',
  widthPct?: number | null,
): string {
  if (!photo?.src?.trim()) {
    const phClass = extraClass ? `lb-tpl__ph ${extraClass}` : 'lb-tpl__ph';
    return `<div class="${phClass}" contenteditable="false" data-lb-slot="${slot}"></div>`;
  }
  const cls = extraClass ? ` class="${extraClass}"` : '';
  const w =
    widthPct != null && widthPct > 0 && widthPct < 100
      ? Math.round(Math.max(30, Math.min(100, widthPct)))
      : null;
  const wAttr = w != null ? ` data-lb-w="${w}"` : '';
  const wStyle =
    w != null
      ? `width:${w}% !important;max-width:100% !important;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0.35em auto;float:none;--lb-w:${w}%;`
      : `width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;`;
  return `<img${cls} src="${esc(photo.src.trim())}" alt="${esc(photo.alt || '')}" data-lb-slot="${slot}"${wAttr} data-lb-rot="0" style="${wStyle}" />`;
}

function textCol(
  copy: Required<LookbookTemplateCopy>,
  opts?: { withList?: boolean; chapter?: boolean },
): string {
  const parts: string[] = ['<div class="lb-tpl__col lb-tpl__col--text">'];
  if (opts?.chapter) {
    parts.push(`<p class="lb-tpl__eyebrow">${esc(copy.eyebrow)}</p>`);
  }
  parts.push(`<h2>${esc(copy.heading)}</h2>`);
  parts.push(`<p class="lb-tpl__sub">${esc(copy.subheading)}</p>`);
  parts.push(`<p>${esc(copy.body)}</p>`);
  parts.push(`<p>${esc(copy.body2)}</p>`);
  if (opts?.withList) {
    parts.push(`<ul><li>${esc(copy.bullet)}</li></ul>`);
  }
  parts.push('</div>');
  return parts.join('');
}

function defaults(copy?: LookbookTemplateCopy): Required<LookbookTemplateCopy> {
  return {
    eyebrow: copy?.eyebrow || 'LOOKBOOK',
    heading: copy?.heading || 'Заголовок',
    subheading: copy?.subheading || 'Подзаголовок',
    body: copy?.body || 'Напишите текст…',
    body2: copy?.body2 || 'Дополнительный абзац.',
    bullet: copy?.bullet || 'Короткий акцент или совет',
  };
}

function pad(
  shots: Array<LookbookTemplatePhoto | undefined>,
  n: number,
): Array<LookbookTemplatePhoto | undefined> {
  const out: Array<LookbookTemplatePhoto | undefined> = [];
  for (let i = 0; i < n; i++) {
    out.push(shots[i]);
  }
  return out;
}

function slotCountForKind(kind: string): number {
  return findLookbookTemplate(kind)?.photoCount ?? 0;
}

/** Build wire-format HTML for a page template (matches rich-editor getHtml shape). */
export function buildLookbookTemplateHtml(
  kind: LookbookTemplateId,
  photos: LookbookTemplatePhoto[] = [],
  copy?: LookbookTemplateCopy,
): string {
  const c = defaults(copy);
  // Keep empty slots so indices stay stable for swap/replace.
  const shots = photos.map((p) => (p?.src?.trim() ? p : undefined));

  if (kind === 'cover') {
    return `<div class="lb-tpl lb-tpl--cover" data-lb-tpl="cover"><div class="lb-tpl__cover-media">${imgTag(shots[0], 0, 'lb-tpl__cover-img')}</div><div class="lb-tpl__cover-text"><p class="lb-tpl__eyebrow">${esc(c.eyebrow)}</p><h1>${esc(c.heading)}</h1><p>${esc(c.body)}</p></div></div>`;
  }

  if (kind === 'article-left' || kind === 'article-right') {
    const side = kind === 'article-left' ? 'left' : 'right';
    return `<div class="lb-tpl lb-tpl--article lb-tpl--article-${side}" data-lb-tpl="${kind}" data-lb-side="${side}"><div class="lb-tpl__article-content"><p class="lb-tpl__eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.heading)}</h2><p class="lb-tpl__sub">${esc(c.subheading)}</p><p>${esc(c.body)}</p>${imgTag(shots[0], 0, 'lb-tpl__article-img')}<p>${esc(c.body2)}</p><p>${esc(c.body)} ${esc(c.body2)}</p><p>${esc(c.bullet)}. ${esc(c.body2)}</p><div class="lb-tpl__article-clear" aria-hidden="true"></div></div></div>`;
  }

  if (kind === 'overlay-3') {
    const cells = pad(shots, 3)
      .map((p, i) => imgTag(p, i, `lb-tpl__overlay-img lb-tpl__overlay-img--${i + 1}`))
      .join('');
    return `<div class="lb-tpl lb-tpl--split lb-tpl--text-left lb-tpl--overlay3" data-lb-tpl="overlay-3">${textCol(c, { withList: true, chapter: true })}<div class="lb-tpl__col lb-tpl__col--media"><div class="lb-tpl__overlay">${cells}</div></div></div>`;
  }

  if (kind === 'fan-3') {
    const cells = pad(shots, 3)
      .map((p, i) => imgTag(p, i, `lb-tpl__fan-img lb-tpl__fan-img--${i + 1}`))
      .join('');
    return `<div class="lb-tpl lb-tpl--fan3" data-lb-tpl="fan-3"><div class="lb-tpl__fan">${cells}</div></div>`;
  }

  if (kind === 'text-photo' || kind === 'text-photo-right') {
    const side = kind === 'text-photo' ? 'text-left' : 'text-right';
    return `<div class="lb-tpl lb-tpl--split lb-tpl--${side}" data-lb-tpl="${kind}" data-lb-side="${side}">${textCol(c, { withList: true, chapter: true })}<div class="lb-tpl__col lb-tpl__col--media"><div class="lb-tpl__mosaic lb-tpl__mosaic--n1">${imgTag(shots[0], 0)}</div></div></div>`;
  }

  if (kind === 'collage-text-4') {
    const cells = pad(shots, 4)
      .map((p, i) => imgTag(p, i))
      .join('');
    return `<div class="lb-tpl lb-tpl--split lb-tpl--text-left lb-tpl--collage-text-4" data-lb-tpl="collage-text-4">${textCol(c, { chapter: true })}<div class="lb-tpl__col lb-tpl__col--media"><div class="lb-tpl__grid4">${cells}</div></div></div>`;
  }

  if (kind === 'collage-text-3') {
    const cells = pad(shots, 3)
      .map((p, i) => imgTag(p, i))
      .join('');
    return `<div class="lb-tpl lb-tpl--split lb-tpl--text-left lb-tpl--collage-text-3" data-lb-tpl="collage-text-3">${textCol(c, { chapter: true })}<div class="lb-tpl__col lb-tpl__col--media"><div class="lb-tpl__mosaic lb-tpl__mosaic--n3 lb-tpl__mosaic--fancy">${cells}</div></div></div>`;
  }

  if (kind === 'collage-2') {
    const cells = pad(shots, 2)
      .map((p, i) => imgTag(p, i))
      .join('');
    return `<div class="lb-tpl lb-tpl--stack2" data-lb-tpl="collage-2">${cells}</div>`;
  }

  if (kind === 'collage-4') {
    const cells = pad(shots, 4)
      .map((p, i) => imgTag(p, i))
      .join('');
    return `<div class="lb-tpl lb-tpl--mosaic4" data-lb-tpl="collage-4"><div class="lb-tpl__mosaic4">${cells}</div></div>`;
  }

  if (kind === 'photo') {
    return `<div class="lb-tpl lb-tpl--photo" data-lb-tpl="photo">${imgTag(shots[0], 0)}</div>`;
  }

  // text-1col
  return `<div class="lb-tpl lb-tpl--text" data-lb-tpl="text-1col">${textCol(c, { chapter: true })}</div>`;
}

function parseRoot(html: string): HTMLElement | null {
  const holder = document.createElement('div');
  holder.innerHTML = String(html || '').trim();
  return (holder.querySelector('.lb-tpl') as HTMLElement | null) || (holder.firstElementChild as HTMLElement | null);
}

/** Ensure every media cell has data-lb-slot (legacy HTML). */
export function ensureTemplateSlots(html: string): string {
  const root = parseRoot(html);
  if (!root) return html;
  const kind = root.dataset['lbTpl'] || '';
  const expected = slotCountForKind(kind);
  const media = collectSlotEls(root);
  if (!media.length && expected === 0) {
    return root.outerHTML;
  }
  if (media.every((el, i) => el.getAttribute('data-lb-slot') === String(i))) {
    return root.outerHTML;
  }
  media.forEach((el, i) => el.setAttribute('data-lb-slot', String(i)));
  return root.outerHTML;
}

function collectSlotEls(root: HTMLElement): HTMLElement[] {
  const tagged = Array.from(
    root.querySelectorAll<HTMLElement>('img[data-lb-slot], .lb-tpl__ph[data-lb-slot]'),
  );
  if (tagged.length) {
    return tagged.sort(
      (a, b) =>
        (parseInt(a.getAttribute('data-lb-slot') || '0', 10) || 0) -
        (parseInt(b.getAttribute('data-lb-slot') || '0', 10) || 0),
    );
  }
  // Legacy: media imgs + placeholders in document order (skip text-only icons none).
  const cover = root.querySelectorAll<HTMLElement>(
    '.lb-tpl__cover-media > img, .lb-tpl__cover-media > .lb-tpl__ph',
  );
  if (cover.length) return Array.from(cover);

  const mosaic = root.querySelectorAll<HTMLElement>(
    '.lb-tpl__mosaic > img, .lb-tpl__mosaic > .lb-tpl__ph, .lb-tpl__grid4 > img, .lb-tpl__grid4 > .lb-tpl__ph, .lb-tpl__mosaic4 > img, .lb-tpl__mosaic4 > .lb-tpl__ph, .lb-tpl--stack2 > img, .lb-tpl--stack2 > .lb-tpl__ph, .lb-tpl--photo > img, .lb-tpl--photo > .lb-tpl__ph',
  );
  if (mosaic.length) return Array.from(mosaic);

  return Array.from(root.querySelectorAll<HTMLElement>('img, .lb-tpl__ph')).filter((el) => {
    // Skip images nested in text chrome if any.
    return !el.closest('.lb-tpl__col--text, .lb-tpl__cover-text');
  });
}

function photoFromEl(el: HTMLElement): LookbookTemplatePhoto | undefined {
  if (el.tagName === 'IMG') {
    const src = (el as HTMLImageElement).getAttribute('src') || '';
    if (!src.trim()) return undefined;
    return { src, alt: (el as HTMLImageElement).getAttribute('alt') || '' };
  }
  return undefined;
}

function widthFromEl(el: HTMLElement): number | null {
  const raw = el.getAttribute('data-lb-w');
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function slotNodeHtml(
  photo: LookbookTemplatePhoto | undefined,
  slot: number,
  extraClass = '',
  widthPct?: number | null,
): string {
  return imgTag(photo, slot, extraClass, widthPct);
}

export function readTemplatePhotos(html: string): LookbookTemplatePhoto[] {
  const root = parseRoot(ensureTemplateSlots(html));
  if (!root) return [];
  const els = collectSlotEls(root);
  const kind = root.dataset['lbTpl'] || '';
  const n = Math.max(els.length, slotCountForKind(kind));
  const out: LookbookTemplatePhoto[] = [];
  for (let i = 0; i < n; i++) {
    const el = els.find((e) => e.getAttribute('data-lb-slot') === String(i)) || els[i];
    const p = el ? photoFromEl(el) : undefined;
    out.push(p || { src: '', alt: '' });
  }
  return out;
}

export function swapTemplateSlots(html: string, a: number, b: number): string {
  if (a === b || a < 0 || b < 0) return ensureTemplateSlots(html);
  const root = parseRoot(ensureTemplateSlots(html));
  if (!root) return html;
  const els = collectSlotEls(root);
  const elA = els.find((e) => e.getAttribute('data-lb-slot') === String(a));
  const elB = els.find((e) => e.getAttribute('data-lb-slot') === String(b));
  if (!elA || !elB) return root.outerHTML;

  const classA = elA.className || '';
  const classB = elB.className || '';
  // Preserve cover/special classes that belong to the slot position, not the photo.
  const posClassA = classA.includes('lb-tpl__cover-img') ? 'lb-tpl__cover-img' : '';
  const posClassB = classB.includes('lb-tpl__cover-img') ? 'lb-tpl__cover-img' : '';

  const photoA = photoFromEl(elA);
  const photoB = photoFromEl(elB);
  const wA = widthFromEl(elA);
  const wB = widthFromEl(elB);
  const nextA = document.createElement('div');
  nextA.innerHTML = slotNodeHtml(photoB, a, posClassA, wB);
  const nextB = document.createElement('div');
  nextB.innerHTML = slotNodeHtml(photoA, b, posClassB, wA);
  const nodeA = nextA.firstElementChild as HTMLElement;
  const nodeB = nextB.firstElementChild as HTMLElement;
  elA.replaceWith(nodeA);
  elB.replaceWith(nodeB);
  return root.outerHTML;
}

export function replaceTemplateSlot(
  html: string,
  index: number,
  photo: LookbookTemplatePhoto,
): string {
  if (index < 0) return ensureTemplateSlots(html);
  const root = parseRoot(ensureTemplateSlots(html));
  if (!root) return html;
  const els = collectSlotEls(root);
  const el = els.find((e) => e.getAttribute('data-lb-slot') === String(index)) || els[index];
  if (!el) return root.outerHTML;
  const posClass = (el.className || '').includes('lb-tpl__cover-img') ? 'lb-tpl__cover-img' : '';
  const keepW = widthFromEl(el);
  const next = document.createElement('div');
  next.innerHTML = slotNodeHtml(photo?.src?.trim() ? photo : undefined, index, posClass, keepW);
  const node = next.firstElementChild as HTMLElement;
  el.replaceWith(node);
  return root.outerHTML;
}

/** Set slot image width as percent of the template content column (30–100). */
export function setTemplateSlotWidth(html: string, index: number, widthPct: number): string {
  if (index < 0) return ensureTemplateSlots(html);
  const root = parseRoot(ensureTemplateSlots(html));
  if (!root) return html;
  const els = collectSlotEls(root);
  const el = els.find((e) => e.getAttribute('data-lb-slot') === String(index)) || els[index];
  if (!el || el.tagName !== 'IMG') return root.outerHTML;
  const photo = photoFromEl(el);
  if (!photo) return root.outerHTML;
  const posClass = (el.className || '').includes('lb-tpl__cover-img') ? 'lb-tpl__cover-img' : '';
  const w = Math.round(Math.max(30, Math.min(100, widthPct)));
  const next = document.createElement('div');
  next.innerHTML = slotNodeHtml(photo, index, posClass, w);
  el.replaceWith(next.firstElementChild as HTMLElement);
  return root.outerHTML;
}

/** Strip NodeView chrome and return clean wire HTML from a live template root. */
export function serializeTemplateDom(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      '.lb-tpl-slot-handle, .lb-tpl-slot-resize, .lb-tpl-slot-actions, .lb-tpl-delete, .lb-tpl-height, .lb-img-handle, .lb-img-delete, .lb-img-move, .lb-img-rotate',
    )
    .forEach((n) => n.remove());
  clone.querySelectorAll('.lb-tpl-slot-wrap, .lb-img-wrap').forEach((wrap) => {
    const media = wrap.querySelector('img, .lb-tpl__ph') as HTMLElement | null;
    if (!media) {
      wrap.remove();
      return;
    }
    const slot = wrap.getAttribute('data-lb-slot') || media.getAttribute('data-lb-slot');
    if (slot != null) media.setAttribute('data-lb-slot', slot);
    wrap.replaceWith(media);
  });
  clone.querySelectorAll('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
  });
  return clone.outerHTML;
}
