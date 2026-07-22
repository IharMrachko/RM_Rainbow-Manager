import chroma from 'chroma-js';
import { Palette, palettesObj } from '@rainbow/shared';
import {
  PexelsColorName,
  StockColorAnchor,
  StockLooksCategory,
} from './stock-looks.types';

const CATEGORY_QUERIES: Record<StockLooksCategory, string[]> = {
  outfit: ['women fashion outfit', 'elegant clothing look', 'seasonal fashion style'],
  portrait: ['fashion portrait', 'woman portrait style', 'editorial portrait'],
  accessories: ['fashion accessories', 'scarf jewelry bag', 'style accessories flatlay'],
};

/** Soft season wording hints layered onto the base query. */
const PALETTE_QUERY_HINTS: Partial<Record<Palette, string>> = {
  softSummerPalette: 'muted soft tones',
  softAutumnPalette: 'muted earth tones',
  darkAutumnPalette: 'deep warm earth',
  warmAutumnPalette: 'warm autumn colors',
  coldSummerPalette: 'cool soft colors',
  lightSummerPalette: 'light pastel cool',
  lightSpringPalette: 'light warm pastel',
  brightSpringPalette: 'bright clear spring',
  warmSpringPalette: 'warm spring colors',
  darkWinterPalette: 'deep cool contrast',
  coldWinterPalette: 'cool clear winter',
  brightWinterPalette: 'bright jewel tones',
};

const PEXELS_COLOR_HEX: Record<PexelsColorName, string> = {
  red: '#E53935',
  orange: '#FB8C00',
  yellow: '#FDD835',
  green: '#43A047',
  turquoise: '#26A69A',
  blue: '#1E88E5',
  violet: '#8E24AA',
  pink: '#EC407A',
  brown: '#8D6E63',
  black: '#212121',
  gray: '#9E9E9E',
  white: '#FAFAFA',
};

/**
 * Pick up to `count` distinct anchors from a RM palette, mapped to Pexels color names.
 */
export function buildColorAnchors(
  paletteType: Palette,
  count = 3,
  preferredHexes?: string[],
): StockColorAnchor[] {
  const palette = palettesObj[paletteType] ?? [];
  const source =
    preferredHexes?.length && preferredHexes.every((h) => chroma.valid(h))
      ? preferredHexes
      : pickSpreadHexes(palette, Math.max(count * 2, 6));

  const anchors: StockColorAnchor[] = [];
  const used = new Set<PexelsColorName>();

  for (const hex of source) {
    if (!chroma.valid(hex)) continue;
    const pexelsColor = nearestPexelsColor(hex);
    if (used.has(pexelsColor)) continue;
    used.add(pexelsColor);
    anchors.push({ hex: chroma(hex).hex(), pexelsColor });
    if (anchors.length >= count) break;
  }

  if (!anchors.length && palette.length) {
    const hex = chroma(palette[0]).hex();
    anchors.push({ hex, pexelsColor: nearestPexelsColor(hex) });
  }

  return anchors;
}

export function buildSearchQueries(
  paletteType: Palette,
  category: StockLooksCategory,
): string[] {
  const base = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES.outfit;
  const hint = PALETTE_QUERY_HINTS[paletteType];
  return base.map((q) => (hint ? `${q} ${hint}` : q));
}

export function nearestPexelsColor(hex: string): PexelsColorName {
  let best: PexelsColorName = 'gray';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [name, sample] of Object.entries(PEXELS_COLOR_HEX) as [
    PexelsColorName,
    string,
  ][]) {
    const dist = chroma.deltaE(hex, sample);
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

/** Spread sample across the palette array so anchors cover different segments. */
function pickSpreadHexes(palette: string[], count: number): string[] {
  if (!palette.length) return [];
  if (palette.length <= count) return [...palette];
  const step = (palette.length - 1) / (count - 1);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(palette[Math.round(i * step)]);
  }
  return out;
}
