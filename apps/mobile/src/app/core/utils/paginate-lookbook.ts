/**
 * Push `.lb-tpl` / `.lb-img-row` so they do not straddle A4 band boundaries.
 * Same algorithm in Cloud Puppeteer and mobile measure/live sheet.
 *
 * Templates taller than one page are left alone (would loop forever).
 */

export interface LookbookTemplateShift {
  /** Index among blocks of the same kind (tpl or row). */
  index: number;
  marginTopPx: number;
  kind: 'tpl' | 'row';
}

const BLOCK_SEL = '.lb-tpl, .lb-img-row';

function documentY(el: HTMLElement): number {
  const win = el.ownerDocument?.defaultView;
  const rect = el.getBoundingClientRect();
  const scrollY = win
    ? win.scrollY || win.document.documentElement.scrollTop || win.document.body.scrollTop || 0
    : 0;
  return rect.top + scrollY;
}

function blockKind(el: HTMLElement): 'tpl' | 'row' {
  return el.classList.contains('lb-img-row') ? 'row' : 'tpl';
}

/**
 * Mutates layout on `root` (or document.body): adds margin-top push so blocks
 * that would cross an A4 boundary move to the next page.
 * Returns per-block push amounts (not including CSS base margin).
 */
export function paginateLookbookTemplates(
  root: ParentNode | Document,
  pageHeightPx: number,
  pagePadTopPx = 0,
  pagePadBottomPx = 0,
): LookbookTemplateShift[] {
  // `root` can be a Document from a hidden iframe. Cross-realm Documents fail
  // `instanceof Document`, so detect them by nodeType instead.
  const isDocument = (root as Node).nodeType === 9;
  const doc = isDocument ? (root as Document) : (root as HTMLElement).ownerDocument;
  const scope: ParentNode =
    isDocument ? doc?.body || doc?.documentElement || root : root;
  const win = doc?.defaultView || null;
  if (!scope || !win || pageHeightPx <= 0) {
    return [];
  }

  const blocks = Array.from(scope.querySelectorAll(BLOCK_SEL)) as HTMLElement[];
  if (!blocks.length) {
    return [];
  }

  for (const el of blocks) {
    el.style.marginTop = '';
  }
  for (const el of blocks) {
    const base = parseFloat(win.getComputedStyle(el).marginTop) || 0;
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

  const tplCount = { tpl: 0, row: 0 };
  return blocks.map((el) => {
    const kind = blockKind(el);
    const index = tplCount[kind]++;
    return {
      index,
      kind,
      marginTopPx: parseFloat(el.dataset['lbPagePush'] || '0') || 0,
    };
  });
}

/**
 * Apply previously computed pushes onto live editor hosts (`.lb-tpl-host`),
 * in document order. Clears push when marginTopPx is 0.
 * Returns true if any host margin actually changed (avoids reflow thrash).
 */
export function applyLookbookTemplateShiftsToHosts(
  sheet: ParentNode,
  shifts: LookbookTemplateShift[],
): boolean {
  const hosts = Array.from(sheet.querySelectorAll('.lb-tpl-host')) as HTMLElement[];
  const tplShifts = shifts.filter((s) => s.kind === 'tpl');
  let changed = false;
  for (let i = 0; i < hosts.length; i++) {
    const host = hosts[i]!;
    const shift = tplShifts.find((s) => s.index === i) || tplShifts[i];
    const push = Math.max(0, Math.round(shift?.marginTopPx || 0));
    const prev = Math.round(parseFloat(host.dataset['lbPagePush'] || '0') || 0);
    if (Math.abs(prev - push) < 1) {
      continue;
    }
    changed = true;
    if (push > 0.5) {
      host.style.setProperty('margin-top', `${push}px`, 'important');
      host.dataset['lbPagePush'] = String(push);
    } else {
      host.style.removeProperty('margin-top');
      delete host.dataset['lbPagePush'];
    }
  }
  return changed;
}

/** Nearest scrollable ancestor (ion-content inner scroll / overflow). */
export function findLookbookScrollParent(el: HTMLElement | null): HTMLElement | null {
  let cur: HTMLElement | null = el;
  while (cur) {
    if (cur.tagName === 'ION-CONTENT') {
      const root = (cur as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
      const inner =
        (root?.querySelector('.inner-scroll') as HTMLElement | null) ||
        (root?.querySelector('.scroll-y') as HTMLElement | null);
      if (inner) return inner;
    }
    const style = window.getComputedStyle(cur);
    const oy = style.overflowY;
    if (
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
      cur.scrollHeight > cur.clientHeight + 1
    ) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

/**
 * Keep an anchor element visually fixed after layout shifts by adjusting scroll.
 */
export function stabilizeLookbookScroll(
  anchor: HTMLElement | null,
  topBefore: number | null,
): void {
  if (!anchor || topBefore == null || !anchor.isConnected) return;
  const scroller = findLookbookScrollParent(anchor);
  if (!scroller) return;
  const delta = anchor.getBoundingClientRect().top - topBefore;
  if (Math.abs(delta) < 1) return;
  scroller.scrollTop += delta;
}
