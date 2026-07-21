/**
 * Push `.lb-tpl` / `.lb-img-row` so they do not straddle A4 band boundaries.
 * Keep in sync with apps/mobile/src/app/core/utils/paginate-lookbook.ts
 *
 * Intended to run inside Puppeteer `page.evaluate` (no outer closures).
 */

export interface LookbookTemplateShift {
  index: number;
  marginTopPx: number;
  kind: 'tpl' | 'row';
}

/**
 * Browser-side paginator — pass this function into page.evaluate(...).
 * Must stay self-contained (Puppeteer serializes the function body).
 */
export function paginateLookbookTemplatesInBrowser(
  pageHeightPx: number,
  pagePadTopPx: number,
  pagePadBottomPx: number,
): LookbookTemplateShift[] {
  const BLOCK_SEL = '.lb-tpl, .lb-img-row';

  const documentY = (el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const scrollY =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return rect.top + scrollY;
  };

  const blocks = Array.from(document.querySelectorAll(BLOCK_SEL)) as HTMLElement[];
  if (!blocks.length || pageHeightPx <= 0) {
    return [];
  }

  for (const el of blocks) {
    el.style.marginTop = '';
  }
  for (const el of blocks) {
    const base = parseFloat(getComputedStyle(el).marginTop) || 0;
    el.dataset['lbPageBaseMargin'] = String(base);
    el.dataset['lbPagePush'] = '0';
  }

  let changed = true;
  let guard = 0;
  while (changed && guard < 48) {
    guard += 1;
    changed = false;
    for (const el of blocks) {
      const top = documentY(el);
      const height = el.getBoundingClientRect().height;
      if (height <= 1) continue;
      const usableHeight = pageHeightPx - pagePadTopPx - pagePadBottomPx;
      if (height > usableHeight) continue;

      const pageIndex = Math.floor(top / pageHeightPx);
      const contentStart = pageIndex * pageHeightPx + pagePadTopPx;
      const contentEnd = (pageIndex + 1) * pageHeightPx - pagePadBottomPx;
      const bottom = top + height;
      if (top >= contentStart - 0.5 && bottom <= contentEnd + 0.5) continue;

      const base = parseFloat(el.dataset['lbPageBaseMargin'] || '0') || 0;
      const push = parseFloat(el.dataset['lbPagePush'] || '0') || 0;
      const targetTop =
        top < contentStart - 0.5
          ? contentStart
          : (pageIndex + 1) * pageHeightPx + pagePadTopPx;
      const gap = targetTop - top;
      if (gap <= 0.5) continue;

      const newPush = push + gap;
      el.dataset['lbPagePush'] = String(newPush);
      el.style.marginTop = `${base + newPush}px`;
      changed = true;
      break;
    }
  }

  const counts = { tpl: 0, row: 0 };
  return blocks.map((el) => {
    const kind: 'tpl' | 'row' = el.classList.contains('lb-img-row') ? 'row' : 'tpl';
    const index = counts[kind]++;
    return {
      index,
      kind,
      marginTopPx: parseFloat(el.dataset['lbPagePush'] || '0') || 0,
    };
  });
}
