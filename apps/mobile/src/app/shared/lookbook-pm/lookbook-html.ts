import { DOMParser, DOMSerializer, Node as PMNode } from 'prosemirror-model';
import { lookbookSchema } from './lookbook-schema';

const parser = DOMParser.fromSchema(lookbookSchema);
const serializer = DOMSerializer.fromSchema(lookbookSchema);

export function normalizeLookbookHtml(html: string): string {
  const trimmed = (html || '').trim();
  if (!trimmed || trimmed === '<br>' || trimmed === '<div><br></div>') {
    return '<p><br></p>';
  }
  return trimmed;
}

/** Parse lookbook wire HTML into a ProseMirror document. */
export function parseLookbookHtml(html: string): PMNode {
  const body = document.createElement('div');
  body.innerHTML = normalizeLookbookHtml(html);

  // Flatten legacy .lb-img-wrap before parse (same as rich-editor getHtml).
  body.querySelectorAll('.lb-img-wrap').forEach((wrapEl) => {
    const wrap = wrapEl as HTMLElement;
    const img = wrap.querySelector('img');
    if (img) {
      wrap.replaceWith(img);
    } else {
      wrap.remove();
    }
  });
  body
    .querySelectorAll(
      '.lb-img-handle, .lb-img-rotate, .lb-img-delete, .lb-img-move, .lb-img-placeholder',
    )
    .forEach((el) => el.remove());

  // Ensure at least one block.
  if (!body.childNodes.length) {
    body.innerHTML = '<p><br></p>';
  }

  // Floated photos collapse the next empty line beside them — insert a clear:both
  // paragraph under each float so the caret has a real hit target below the image.
  ensureClearParagraphsUnderFloats(body);

  return parser.parse(body);
}

function ensureClearParagraphsUnderFloats(root: HTMLElement): void {
  const floats = Array.from(
    root.querySelectorAll('img[data-lb-float="left"], img[data-lb-float="right"], img[style*="float: left"], img[style*="float:left"], img[style*="float: right"], img[style*="float:right"]'),
  ) as HTMLImageElement[];
  for (const img of floats) {
    if (img.closest('.lb-tpl') || img.closest('.lb-img-row')) {
      continue;
    }
    const block =
      img.parentElement?.tagName === 'P' ? (img.parentElement as HTMLElement) : img;
    const next = block.nextElementSibling as HTMLElement | null;
    const nextClears =
      !!next &&
      (next.getAttribute('data-lb-clear') === 'both' ||
        /clear\s*:\s*both/i.test(next.getAttribute('style') || ''));
    if (nextClears) {
      continue;
    }
    const clearP = document.createElement('p');
    clearP.setAttribute('data-lb-clear', 'both');
    clearP.setAttribute('style', 'clear:both');
    clearP.innerHTML = '<br>';
    block.insertAdjacentElement('afterend', clearP);
  }
}

/** Serialize a ProseMirror document to lookbook wire HTML. */
export function serializeLookbookHtml(doc: PMNode): string {
  const frag = serializer.serializeFragment(doc.content);
  const holder = document.createElement('div');
  holder.appendChild(frag);

  // Same cleanup as old rich-editor getHtml — PDF must see bare wire DOM.
  holder
    .querySelectorAll(
      '.lb-img-handle, .lb-img-rotate, .lb-img-delete, .lb-img-move, .lb-img-placeholder, .lb-tpl-delete, .lb-tpl-height, .lb-tpl-ring',
    )
    .forEach((el) => el.remove());
  holder.querySelectorAll('.lb-tpl-host').forEach((host) => {
    const tpl = host.querySelector(':scope > .lb-tpl');
    if (tpl) host.replaceWith(tpl);
  });
  holder.querySelectorAll('.lb-img-wrap, .lb-tpl-slot-wrap').forEach((wrapEl) => {
    const wrap = wrapEl as HTMLElement;
    const img = wrap.querySelector('img, .lb-tpl__ph');
    if (img) {
      const inTpl = !!wrap.closest('.lb-tpl');
      if (inTpl && img instanceof HTMLElement) {
        img.style.float = 'none';
        img.style.display = 'block';
        img.style.width = img.style.width || '100%';
        img.style.maxWidth = '100%';
        img.style.margin = '0';
        img.style.height = 'auto';
      }
      wrap.replaceWith(img);
    } else {
      wrap.remove();
    }
  });
  holder.querySelectorAll('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
  });

  // Normalize empty paragraphs for contenteditable-compat.
  holder.querySelectorAll('p').forEach((p) => {
    if (!p.textContent?.trim() && !p.querySelector('img,br,.lb-tpl,.lb-img-row')) {
      p.innerHTML = '<br>';
    }
  });

  let html = normalizeLookbookHtml(holder.innerHTML);
  // Always keep a trailing empty paragraph for typing room (matches rich editor).
  if (!/<p[^>]*>\s*(<br\s*\/?>)?\s*<\/p>\s*$/i.test(html)) {
    html = `${html}<p><br></p>`;
  }
  return html;
}

/** Round-trip helper for fixtures / diagnostics. */
export function roundTripLookbookHtml(html: string): string {
  return serializeLookbookHtml(parseLookbookHtml(html));
}
