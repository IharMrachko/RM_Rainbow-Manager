/**
 * Normalize lookbook wire HTML the same way the old rich-editor getHtml did,
 * so Cloud PDF layout matches what the editor intends (bare imgs inside .lb-tpl).
 */
export function sanitizeLookbookHtmlForPrint(html: string): string {
  const raw = String(html || '').trim() || '<p><br></p>';
  // Prefer DOM when available (browser / Puppeteer). Node Cloud Function
  // sanitizes after setContent via sanitizePrintDomInPage.
  if (typeof document === 'undefined') {
    return raw;
  }
  const holder = document.createElement('div');
  holder.innerHTML = raw;
  sanitizePrintDom(holder);
  return holder.innerHTML.trim() || '<p><br></p>';
}

/** In-place DOM cleanup shared by mobile + Puppeteer. */
export function sanitizePrintDom(root: ParentNode): void {
  const q = (sel: string) => Array.from(root.querySelectorAll(sel));

  // Editor chrome / NodeView shells.
  q(
    '.lb-img-handle, .lb-img-rotate, .lb-img-delete, .lb-img-move, .lb-img-placeholder, .lb-tpl-delete, .lb-tpl-height, .lb-tpl-ring, .lb-tpl-slot-handle, .lb-tpl-slot-resize, .lb-tpl-slot-actions, .lb-pm-badge',
  ).forEach((el) => el.remove());

  // Unwrap NodeView hosts: keep .lb-tpl child, drop the shell.
  q('.lb-tpl-host').forEach((host) => {
    const tpl = host.querySelector(':scope > .lb-tpl');
    if (tpl) {
      host.replaceWith(tpl);
    } else {
      const parent = host.parentNode;
      if (!parent) {
        host.remove();
        return;
      }
      while (host.firstChild) {
        parent.insertBefore(host.firstChild, host);
      }
      host.remove();
    }
  });

  // Flatten image wraps (old rich-editor getHtml).
  q('.lb-img-wrap, .lb-tpl-slot-wrap').forEach((wrapEl) => {
    const wrap = wrapEl as HTMLElement;
    const img = wrap.querySelector('img, .lb-tpl__ph') as HTMLElement | null;
    if (!img) {
      wrap.remove();
      return;
    }
    const inTpl = !!wrap.closest('.lb-tpl');
    const inRow = !!wrap.closest('.lb-img-row');
    if (inTpl) {
      img.style.float = 'none';
      img.style.display = 'block';
      img.style.width = img.style.width || '100%';
      img.style.maxWidth = '100%';
      img.style.margin = '0';
      img.style.height = 'auto';
      img.removeAttribute('width');
      delete (img as HTMLElement).dataset['lbFloat'];
      delete (img as HTMLElement).dataset['lbRow'];
      delete (img as HTMLElement).dataset['lbRowW'];
    } else if (inRow) {
      img.style.float = 'none';
      img.style.display = 'inline-block';
      img.style.verticalAlign = 'top';
      img.style.margin = '0';
      img.style.height = 'auto';
      (img as HTMLElement).dataset['lbRow'] = '1';
    }
    const slot = wrap.getAttribute('data-lb-slot') || img.getAttribute('data-lb-slot');
    if (slot != null) img.setAttribute('data-lb-slot', slot);
    wrap.replaceWith(img);
  });

  q('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
  q('.is-selected').forEach((el) => el.classList.remove('is-selected'));
  q('[data-lb-insert]').forEach((el) => el.removeAttribute('data-lb-insert'));

  // Empty paragraphs → <br> for stable height.
  q('p').forEach((p) => {
    if (!(p.textContent || '').trim() && !p.querySelector('img,br,.lb-tpl,.lb-img-row')) {
      p.innerHTML = '<br>';
    }
  });
}
