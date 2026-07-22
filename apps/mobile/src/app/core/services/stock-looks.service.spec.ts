import chroma from 'chroma-js';
import {
  buildColorAnchors,
  buildSearchQueries,
  EXCLUDED_PEXELS_COLORS,
  isNeutralHex,
  nearestPexelsColor,
  subjectRelevanceDelta,
} from './stock-looks-query';
import { StockLooksService } from './stock-looks.service';

describe('stock-looks-query', () => {
  it('maps hex colors to a chromatic Pexels named color', () => {
    expect(nearestPexelsColor('#EC407A')).toBe('pink');
    expect(nearestPexelsColor('#43A047')).toBe('green');
    expect(nearestPexelsColor('#1E88E5')).toBe('blue');
  });

  it('rejects white / gray / black as search colors', () => {
    expect(nearestPexelsColor('#FFFFFF')).toBeNull();
    expect(nearestPexelsColor('#9E9E9E')).toBeNull();
    expect(nearestPexelsColor('#111111')).toBeNull();
    expect(isNeutralHex('#F5F5F5')).toBeTrue();
    expect(isNeutralHex('#C48A8F')).toBeFalse();
  });

  it('builds distinct chromatic anchors for a RM palette', () => {
    const anchors = buildColorAnchors('softAutumnPalette', 3);
    expect(anchors.length).toBeGreaterThan(0);
    expect(anchors.length).toBeLessThanOrEqual(3);
    const names = new Set(anchors.map((a) => a.pexelsColor));
    expect(names.size).toBe(anchors.length);
    for (const anchor of anchors) {
      expect(chroma.valid(anchor.hex)).toBeTrue();
      expect(EXCLUDED_PEXELS_COLORS.has(anchor.pexelsColor)).toBeFalse();
      expect(isNeutralHex(anchor.hex)).toBeFalse();
    }
  });

  it('keeps clothing-focused search queries', () => {
    const queries = buildSearchQueries('softAutumnPalette', 'outfit');
    expect(queries[0].toLowerCase()).toContain('clothing');
    expect(queries.some((q) => q.toLowerCase().includes('studio'))).toBeTrue();
  });

  it('boosts clothing alts and penalizes background scenes', () => {
    expect(subjectRelevanceDelta('Woman wearing blazer dress clothing')).toBeGreaterThan(
      subjectRelevanceDelta('Mountain landscape sunset sky'),
    );
    expect(subjectRelevanceDelta('Mountain landscape sunset sky')).toBeLessThan(0);
  });
});

describe('StockLooksService scoring', () => {
  it('scores a soft autumn avg color higher than a neon blue', () => {
    const service = new StockLooksService({} as never);
    const warm = service.scoreAgainstPalette('#C4A484', 'softAutumnPalette');
    const neon = service.scoreAgainstPalette('#00E5FF', 'softAutumnPalette');
    expect(warm.matchScore).toBeGreaterThan(neon.matchScore);
    expect(warm.matchedSwatches.length).toBeGreaterThan(0);
  });

  it('penalizes white/gray/black dominated photos', () => {
    const service = new StockLooksService({} as never);
    const warm = service.scoreAgainstPalette('#C4A484', 'softAutumnPalette');
    const gray = service.scoreAgainstPalette('#B0B0B0', 'softAutumnPalette');
    expect(warm.matchScore).toBeGreaterThan(gray.matchScore);
  });
});
