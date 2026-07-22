import chroma from 'chroma-js';
import { Palette, palettesObj } from '@rainbow/shared';
import {
  PexelsColorName,
  StockColorAnchor,
  StockLooksCategory,
} from './stock-looks.types';

/**
 * Clothing / subject-first queries. Avoid lifestyle / interior / landscape wording
 * that makes backgrounds dominate avg_color matching.
 */
const CATEGORY_QUERIES: Record<StockLooksCategory, string[]> = {
  outfit: [
    'studio fashion model outfit clothing',
    'woman wearing dress blazer apparel',
    'fashion lookbook clothing close up',
    'editorial fashion garment on model',
  ],
  portrait: [
    'fashion model portrait clothing studio',
    'beauty fashion portrait outfit close up',
    'editorial fashion face portrait apparel',
  ],
  accessories: [
    'fashion accessories product close up studio',
    'scarf handbag jewelry flat lay',
    'fashion shoes bag product photography',
  ],
};

/** Light clothing-oriented color hints (not nature/interior scenes). */
const PALETTE_QUERY_HINTS: Partial<Record<Palette, string>> = {
  softSummerPalette: 'soft muted colors',
  softAutumnPalette: 'soft earthy colors',
  darkAutumnPalette: 'deep warm colors',
  warmAutumnPalette: 'warm autumn colors',
  coldSummerPalette: 'cool muted colors',
  lightSummerPalette: 'light cool colors',
  lightSpringPalette: 'light warm colors',
  brightSpringPalette: 'bright clear colors',
  warmSpringPalette: 'warm spring colors',
  darkWinterPalette: 'deep cool colors',
  coldWinterPalette: 'cool clear colors',
  brightWinterPalette: 'bright jewel colors',
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

const SUBJECT_BOOST_TERMS = [
  'dress',
  'outfit',
  'clothing',
  'clothes',
  'apparel',
  'garment',
  'blazer',
  'jacket',
  'coat',
  'sweater',
  'knit',
  'blouse',
  'shirt',
  'skirt',
  'pants',
  'trousers',
  'suit',
  'fashion',
  'model',
  'wearing',
  'lookbook',
  'runway',
  'scarf',
  'handbag',
  'jewelry',
  'shoes',
  'heels',
  'bag',
];

const SUBJECT_PENALTY_TERMS = [
  'landscape',
  'mountain',
  'forest',
  'beach',
  'ocean',
  'sky',
  'sunset',
  'sunrise',
  'interior',
  'living room',
  'bedroom',
  'kitchen',
  'architecture',
  'building',
  'cityscape',
  'wall',
  'wallpaper',
  'background',
  'nature',
  'tree',
  'flower field',
  'coffee shop',
  'restaurant',
  'street view',
];

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
  // Keep one plain clothing query first (better subject hit), then hinted variants.
  const withHint = hint ? base.map((q) => `${q} ${hint}`) : base;
  return [base[0], ...withHint].filter((q, i, arr) => arr.indexOf(q) === i);
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

/**
 * Bias ranking toward clothing/subject photos and away from background-heavy scenes
 * using Pexels alt/title text.
 */
export function subjectRelevanceDelta(text: string): number {
  const hay = (text || '').toLowerCase();
  if (!hay.trim()) return -4;

  let delta = 0;
  for (const term of SUBJECT_BOOST_TERMS) {
    if (hay.includes(term)) delta += 4;
  }
  for (const term of SUBJECT_PENALTY_TERMS) {
    if (hay.includes(term)) delta -= 8;
  }
  return Math.max(-24, Math.min(18, delta));
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
