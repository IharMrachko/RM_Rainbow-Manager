import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';

const alignAttr = {
  align: { default: null as string | null },
  /** CSS clear — "both" parks a paragraph under floated photos. */
  clear: { default: null as string | null },
};

function alignDom(node: { attrs: Record<string, unknown> }): Record<string, string> {
  const attrs: Record<string, string> = {};
  const styles: string[] = [];
  const align = node.attrs['align'];
  if (typeof align === 'string' && align) {
    styles.push(`text-align: ${align}`);
  }
  const clear = node.attrs['clear'];
  if (typeof clear === 'string' && clear) {
    styles.push(`clear: ${clear}`);
    attrs['data-lb-clear'] = clear;
  }
  if (styles.length) {
    attrs['style'] = styles.join(';');
  }
  return attrs;
}

function getAlign(dom: HTMLElement): string | null {
  const style = dom.getAttribute('style') || '';
  const m = /text-align:\s*(left|center|right|justify)/i.exec(style);
  if (m) {
    return m[1].toLowerCase();
  }
  const align = (dom.getAttribute('align') || '').toLowerCase();
  return align === 'left' || align === 'center' || align === 'right' || align === 'justify'
    ? align
    : null;
}

function getClear(dom: HTMLElement): string | null {
  const data = dom.getAttribute('data-lb-clear');
  if (data === 'both' || data === 'left' || data === 'right') {
    return data;
  }
  const style = dom.getAttribute('style') || '';
  const m = /clear:\s*(both|left|right)/i.exec(style);
  return m ? m[1].toLowerCase() : null;
}

/** translate(...) then rotate(...) — matches editor NodeView. */
export function buildImageTransform(ox: string, oy: string, rot: string): string {
  const x = parseFloat(ox) || 0;
  const y = parseFloat(oy) || 0;
  const r = parseFloat(rot) || 0;
  const parts: string[] = [];
  if (x || y) {
    parts.push(`translate(${Math.round(x)}px, ${Math.round(y)}px)`);
  }
  if (r) {
    parts.push(`rotate(${r}deg)`);
  }
  return parts.join(' ');
}

function parseImageOffset(el: HTMLElement): { ox: string; oy: string } {
  const dataOx = el.dataset['lbOx'];
  const dataOy = el.dataset['lbOy'];
  if (dataOx != null || dataOy != null) {
    return { ox: dataOx || '0', oy: dataOy || '0' };
  }
  const t = el.style.transform || '';
  const m = /translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/i.exec(t);
  if (m) {
    return { ox: String(Math.round(parseFloat(m[1]) || 0)), oy: String(Math.round(parseFloat(m[2]) || 0)) };
  }
  return { ox: '0', oy: '0' };
}

function parseRotate(transform: string): string | null {
  const m = /rotate\(\s*([-\d.]+)deg\s*\)/i.exec(transform || '');
  return m ? String(m[1]) : null;
}

const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },

  paragraph: {
    content: 'inline*',
    group: 'block',
    attrs: alignAttr,
    parseDOM: [
      {
        tag: 'p',
        getAttrs: (dom) => ({
          align: getAlign(dom as HTMLElement),
          clear: getClear(dom as HTMLElement),
        }),
      },
    ],
    toDOM(node) {
      return ['p', alignDom(node), 0];
    },
  },

  heading: {
    content: 'inline*',
    group: 'block',
    defining: true,
    attrs: { level: { default: 1 }, ...alignAttr },
    parseDOM: [
      { tag: 'h1', getAttrs: (dom) => ({ level: 1, align: getAlign(dom as HTMLElement) }) },
      { tag: 'h2', getAttrs: (dom) => ({ level: 2, align: getAlign(dom as HTMLElement) }) },
      { tag: 'h3', getAttrs: (dom) => ({ level: 3, align: getAlign(dom as HTMLElement) }) },
    ],
    toDOM(node) {
      return [`h${node.attrs['level']}`, alignDom(node), 0];
    },
  },

  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0];
    },
  },

  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr'];
    },
  },

  /**
   * Page layout template — stored as HTML atom so cloud PDF / old editor
   * keep the exact `lb-tpl*` contract.
   */
  lookbook_template: {
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,
    attrs: {
      html: { default: '' },
      kind: { default: '' },
      /** Optional min-height in unscaled page px; 0 = auto. */
      heightPx: { default: '0' },
    },
    parseDOM: [
      {
        tag: 'div.lb-tpl',
        getAttrs(dom) {
          const el = dom as HTMLElement;
          const clone = el.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('.lb-img-wrap, .lb-tpl-slot-wrap').forEach((wrap) => {
            const img = wrap.querySelector('img');
            if (img) {
              wrap.replaceWith(img);
            } else {
              wrap.remove();
            }
          });
          clone
            .querySelectorAll(
              '.lb-img-handle, .lb-img-rotate, .lb-img-delete, .lb-img-move, .lb-tpl-delete, .lb-tpl-height, .lb-tpl-slot-handle',
            )
            .forEach((h) => h.remove());
          const hRaw = clone.style.minHeight || clone.getAttribute('data-lb-h') || '0';
          const heightPx = String(parseInt(hRaw, 10) || 0);
          clone.style.minHeight = '';
          clone.removeAttribute('data-lb-h');
          return {
            html: clone.outerHTML,
            kind: clone.dataset['lbTpl'] || '',
            heightPx,
          };
        },
      },
    ],
    toDOM(node) {
      const holder = document.createElement('div');
      holder.innerHTML = String(node.attrs['html'] || '');
      const el = holder.firstElementChild as HTMLElement | null;
      const h = parseInt(String(node.attrs['heightPx'] || '0'), 10) || 0;
      if (el) {
        if (h > 0) {
          el.style.minHeight = `${h}px`;
          el.setAttribute('data-lb-h', String(h));
        }
        return el;
      }
      return [
        'div',
        {
          class: 'lb-tpl',
          'data-lb-tpl': String(node.attrs['kind'] || ''),
          ...(h > 0 ? { 'data-lb-h': String(h), style: `min-height:${h}px` } : {}),
        },
      ];
    },
  },

  /** Side-by-side images row — HTML atom (imgs stay wire-compatible). */
  image_row: {
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,
    attrs: {
      html: { default: '' },
    },
    parseDOM: [
      {
        tag: 'div.lb-img-row',
        getAttrs(dom) {
          const el = (dom as HTMLElement).cloneNode(true) as HTMLElement;
          el.querySelectorAll('.lb-img-wrap').forEach((wrap) => {
            const img = wrap.querySelector('img');
            if (img) wrap.replaceWith(img);
            else wrap.remove();
          });
          return { html: el.outerHTML };
        },
      },
    ],
    toDOM(node) {
      const holder = document.createElement('div');
      holder.innerHTML = String(node.attrs['html'] || '');
      const el = holder.firstElementChild as HTMLElement | null;
      if (el) {
        return el;
      }
      return ['div', { class: 'lb-img-row' }];
    },
  },

  /** Free photo — block by default (caret above/below). Legacy float left/right still parse. */
  image: {
    inline: false,
    group: 'block',
    atom: true,
    draggable: false,
    selectable: true,
    attrs: {
      src: { default: '' },
      alt: { default: '' },
      title: { default: null as string | null },
      float: { default: 'none' as string },
      width: { default: null as string | null },
      rot: { default: '0' },
      /** Free drag offset X (px, unscaled page coords). */
      ox: { default: '0' },
      /** Free drag offset Y (px, unscaled page coords). */
      oy: { default: '0' },
      row: { default: false },
      rowW: { default: null as string | null },
    },
    parseDOM: [
      {
        tag: 'img[src]',
        getAttrs(dom) {
          const el = dom as HTMLImageElement;
          // Templates and rows own their imgs.
          if (el.closest('.lb-tpl') || el.closest('.lb-img-row')) {
            return false;
          }
          const rawFloat =
            el.dataset['lbFloat'] ||
            (el.style.float === 'right' ? 'right' : el.style.float === 'left' ? 'left' : 'none');
          const float = rawFloat === 'left' || rawFloat === 'right' ? rawFloat : 'none';
          const width =
            el.getAttribute('width') ||
            (el.style.width && el.style.width.endsWith('px')
              ? el.style.width.replace('px', '')
              : null);
          const { ox, oy } = parseImageOffset(el);
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt') || '',
            title: el.getAttribute('title'),
            float,
            width,
            rot: el.dataset['lbRot'] || parseRotate(el.style.transform) || '0',
            ox,
            oy,
            row: false,
            rowW: null,
          };
        },
      },
    ],
    toDOM(node) {
      const attrs: Record<string, string> = {
        src: String(node.attrs['src'] || ''),
        alt: String(node.attrs['alt'] || ''),
      };
      if (node.attrs['title']) {
        attrs['title'] = String(node.attrs['title']);
      }
      const rot = String(node.attrs['rot'] || '0');
      const ox = String(node.attrs['ox'] || '0');
      const oy = String(node.attrs['oy'] || '0');
      attrs['data-lb-rot'] = rot;
      attrs['data-lb-ox'] = ox;
      attrs['data-lb-oy'] = oy;
      const side = String(node.attrs['float'] || 'none');
      const xf = buildImageTransform(ox, oy, rot);

      if (side === 'left' || side === 'right') {
        attrs['data-lb-float'] = side;
        const margin =
          side === 'right' ? '0.35em 0 0.5em 12px' : '0.35em 12px 0.5em 0';
        let style = `float:${side};display:block;height:auto;margin:${margin};max-width:100%;border-radius:12px;`;
        if (node.attrs['width']) {
          attrs['width'] = String(node.attrs['width']);
          style += `width:${node.attrs['width']}px;`;
        }
        if (xf) {
          style += `transform:${xf};transform-origin:center center;`;
        }
        attrs['style'] = style;
      } else {
        attrs['data-lb-float'] = 'none';
        let style =
          'float:none;display:block;width:100%;max-width:100%;height:auto;margin:0.55em 0;border-radius:12px;';
        if (node.attrs['width']) {
          attrs['width'] = String(node.attrs['width']);
          style = `float:none;display:block;width:${node.attrs['width']}px;max-width:100%;height:auto;margin:0.55em auto;border-radius:12px;`;
        }
        if (xf) {
          style += `transform:${xf};transform-origin:center center;`;
        }
        attrs['style'] = style;
      }
      return ['img', attrs];
    },
  },

  text: {
    group: 'inline',
  },

  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br'];
    },
  },
};

const marks: Record<string, MarkSpec> = {
  strong: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b' },
      { style: 'font-weight=bold' },
      { style: 'font-weight=700' },
    ],
    toDOM() {
      return ['strong', 0];
    },
  },
  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
      return ['em', 0];
    },
  },
  underline: {
    parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }],
    toDOM() {
      return ['u', 0];
    },
  },
  strike: {
    parseDOM: [
      { tag: 's' },
      { tag: 'del' },
      { tag: 'strike' },
      { style: 'text-decoration=line-through' },
    ],
    toDOM() {
      return ['s', 0];
    },
  },
  textColor: {
    attrs: { color: { default: '' } },
    parseDOM: [
      {
        style: 'color',
        getAttrs: (value) => {
          const color = String(value || '').trim();
          return color ? { color } : false;
        },
      },
    ],
    toDOM(mark) {
      return ['span', { style: `color: ${mark.attrs['color']}` }, 0];
    },
  },
  highlight: {
    attrs: { color: { default: '#f1c40f' } },
    parseDOM: [
      {
        style: 'background-color',
        getAttrs: (value) => {
          const color = String(value || '').trim();
          return color ? { color } : false;
        },
      },
      {
        tag: 'mark',
        getAttrs: (dom) => {
          const el = dom as HTMLElement;
          return { color: el.style.backgroundColor || '#f1c40f' };
        },
      },
    ],
    toDOM(mark) {
      return ['mark', { style: `background-color: ${mark.attrs['color']}` }, 0];
    },
  },
  fontSize: {
    attrs: { size: { default: '16px' } },
    parseDOM: [
      {
        style: 'font-size',
        getAttrs: (value) => {
          const size = String(value || '').trim();
          return size ? { size } : false;
        },
      },
    ],
    toDOM(mark) {
      return ['span', { style: `font-size: ${mark.attrs['size']}` }, 0];
    },
  },
  fontFamily: {
    attrs: { family: { default: '' } },
    parseDOM: [
      {
        style: 'font-family',
        getAttrs: (value) => {
          const family = String(value || '').trim();
          return family ? { family } : false;
        },
      },
    ],
    toDOM(mark) {
      return ['span', { style: `font-family: ${mark.attrs['family']}` }, 0];
    },
  },
};

const baseSchema = new Schema({ nodes, marks });

export const lookbookSchema = new Schema({
  nodes: addListNodes(baseSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: baseSchema.spec.marks,
});

export type LookbookSchema = typeof lookbookSchema;
