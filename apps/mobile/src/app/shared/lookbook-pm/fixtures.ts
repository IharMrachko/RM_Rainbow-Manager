/**
 * Golden wire-HTML fixtures for ProseMirror round-trip checks.
 * Keep shapes aligned with the persisted Lookbook HTML contract.
 */
export const LOOKBOOK_PM_FIXTURES: Record<string, string> = {
  empty: '<p><br></p>',

  basicText:
    '<p>Hello <strong>world</strong></p><h2>Title</h2><p style="text-align: center">Centered</p>',

  floatImage:
    '<p>Before</p><img src="https://example.com/a.jpg" alt="a" data-lb-rot="0" data-lb-float="left" style="float:left;display:block;height:auto;margin:0.35em 12px 0.5em 0;max-width:100%;width:180px;" width="180" /><p>After</p>',

  imageRow:
    '<div class="lb-img-row"><img src="https://example.com/a.jpg" alt="" data-lb-rot="0" data-lb-row="1" data-lb-row-w="200" width="200" style="float:none;display:inline-block;vertical-align:top;height:auto;margin:0;width:200px;max-width:200px;" /><img src="https://example.com/b.jpg" alt="" data-lb-rot="0" data-lb-row="1" data-lb-row-w="200" width="200" style="float:none;display:inline-block;vertical-align:top;height:auto;margin:0;width:200px;max-width:200px;" /></div><p><br></p>',

  cover:
    '<div class="lb-tpl lb-tpl--cover" data-lb-tpl="cover"><div class="lb-tpl__cover-media"><img class="lb-tpl__cover-img" src="https://example.com/c.jpg" alt="" data-lb-rot="0" style="width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;" /></div><div class="lb-tpl__cover-text"><p class="lb-tpl__eyebrow">LOOKBOOK</p><h1>Заголовок</h1><p>Напишите текст…</p></div></div><p><br></p>',

  collage4:
    '<div class="lb-tpl lb-tpl--mosaic4" data-lb-tpl="collage-4"><div class="lb-tpl__mosaic4"><img src="https://example.com/1.jpg" alt="" data-lb-rot="0" style="width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;" /><img src="https://example.com/2.jpg" alt="" data-lb-rot="0" style="width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;" /><img src="https://example.com/3.jpg" alt="" data-lb-rot="0" style="width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;" /><img src="https://example.com/4.jpg" alt="" data-lb-rot="0" style="width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;" /></div></div><p><br></p>',

  photo:
    '<div class="lb-tpl lb-tpl--photo" data-lb-tpl="photo"><img src="https://example.com/p.jpg" alt="" data-lb-rot="0" style="width:100%;height:auto;object-fit:contain;object-position:center center;border-radius:12px;display:block;margin:0;float:none;" /></div><p><br></p>',
};

/** Structural checks that survive serializer style-attribute reordering. */
export function assertFixtureShape(name: string, html: string): string[] {
  const errors: string[] = [];
  const h = html || '';
  switch (name) {
    case 'empty':
      if (!/<p/.test(h)) errors.push('missing p');
      break;
    case 'basicText':
      if (!/<strong>/.test(h) && !/<b>/.test(h)) errors.push('missing bold');
      if (!/<h2>/.test(h)) errors.push('missing h2');
      break;
    case 'floatImage':
      if (!/data-lb-float/.test(h)) errors.push('missing data-lb-float');
      if (!/<img[^>]+src=/.test(h)) errors.push('missing img');
      break;
    case 'imageRow':
      if (!/lb-img-row/.test(h)) errors.push('missing lb-img-row');
      if (!/data-lb-row/.test(h)) errors.push('missing data-lb-row');
      break;
    case 'cover':
      if (!/lb-tpl--cover/.test(h)) errors.push('missing cover class');
      if (!/lb-tpl__cover-img/.test(h)) errors.push('missing cover img class');
      break;
    case 'collage4':
      if (!/lb-tpl__mosaic4/.test(h)) errors.push('missing mosaic4');
      break;
    case 'photo':
      if (!/lb-tpl--photo/.test(h)) errors.push('missing photo class');
      break;
    default:
      break;
  }
  return errors;
}
