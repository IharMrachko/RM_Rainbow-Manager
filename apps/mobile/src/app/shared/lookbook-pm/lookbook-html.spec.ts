import {
  LOOKBOOK_PM_FIXTURES,
  assertFixtureShape,
} from './fixtures';
import { roundTripLookbookHtml } from './lookbook-html';
import { buildLookbookTemplateHtml } from './template-html';

describe('lookbook PM HTML round-trip', () => {
  Object.keys(LOOKBOOK_PM_FIXTURES).forEach((name) => {
    it(`preserves shape for fixture "${name}"`, () => {
      const input = LOOKBOOK_PM_FIXTURES[name];
      const out = roundTripLookbookHtml(input);
      const errors = assertFixtureShape(name, out);
      expect(errors).withContext(`${name} → ${out.slice(0, 240)}`).toEqual([]);
    });
  });

  it('buildLookbookTemplateHtml emits lb-tpl contract', () => {
    const cover = buildLookbookTemplateHtml('cover', [
      { src: 'https://example.com/x.jpg', alt: 'x' },
    ]);
    expect(cover).toContain('lb-tpl--cover');
    expect(cover).toContain('lb-tpl__cover-img');
    expect(cover).toContain('https://example.com/x.jpg');

    const mosaic = buildLookbookTemplateHtml('collage-4', [
      { src: 'https://example.com/1.jpg' },
      { src: 'https://example.com/2.jpg' },
      { src: 'https://example.com/3.jpg' },
      { src: 'https://example.com/4.jpg' },
    ]);
    expect(mosaic).toContain('lb-tpl__mosaic4');
    expect((mosaic.match(/<img/g) || []).length).toBe(4);

    const photo = buildLookbookTemplateHtml('photo', [{ src: 'https://example.com/p.jpg' }]);
    expect(photo).toContain('lb-tpl--photo');
  });
});
