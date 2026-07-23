import chroma from 'chroma-js';
import { Palette, palettesObj } from '@rainbow/shared';
import {
  ChromaticPexelsColor,
  PexelsColorName,
  PixabayColorName,
  StockColorAnchor,
  StockLooksCategory,
  UnsplashColorName,
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

/** Neutrals pull studio backgrounds / B&W scenes — never use as Pexels color filters. */
export const EXCLUDED_PEXELS_COLORS: ReadonlySet<PexelsColorName> = new Set([
  'white',
  'gray',
  'black',
]);

/** Hexes below this chroma (Lab C) are treated as white/gray/black-like neutrals. */
const NEUTRAL_CHROMA_MAX = 12;

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
 * Pick up to `count` distinct chromatic anchors from a RM palette.
 * White / gray / black (and near-neutrals) are skipped so stock search
 * does not filter by those Pexels color names.
 */
export function buildColorAnchors(
  paletteType: Palette,
  count = 3,
  preferredHexes?: string[],
): StockColorAnchor[] {
  const palette = palettesObj[paletteType] ?? [];
  const preferred =
    preferredHexes?.length && preferredHexes.every((h) => chroma.valid(h))
      ? preferredHexes
      : [];
  // Prefer user accents, then a wide spread, then the full palette as fallback.
  const source = [
    ...preferred,
    ...pickSpreadHexes(palette, Math.max(count * 4, 12)),
    ...palette,
  ];

  const anchors: StockColorAnchor[] = [];
  const used = new Set<PexelsColorName>();

  for (const hex of source) {
    if (!chroma.valid(hex) || isNeutralHex(hex)) continue;
    const pexelsColor = nearestPexelsColor(hex);
    if (!pexelsColor || EXCLUDED_PEXELS_COLORS.has(pexelsColor)) continue;
    if (used.has(pexelsColor)) continue;
    used.add(pexelsColor);
    anchors.push({ hex: chroma(hex).hex(), pexelsColor });
    if (anchors.length >= count) break;
  }

  return anchors;
}

/** True for white / gray / black-like swatches (low chroma). */
export function isNeutralHex(hex: string): boolean {
  if (!chroma.valid(hex)) return true;
  const c = chroma(hex).lch()[1];
  return c <= NEUTRAL_CHROMA_MAX;
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

/**
 * Nearest Pexels named color, excluding white/gray/black.
 * Returns null when no chromatic match is reasonable.
 */
export function nearestPexelsColor(hex: string): ChromaticPexelsColor | null {
  if (!chroma.valid(hex) || isNeutralHex(hex)) return null;

  let best: ChromaticPexelsColor | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const [name, sample] of Object.entries(PEXELS_COLOR_HEX) as [
    PexelsColorName,
    string,
  ][]) {
    if (EXCLUDED_PEXELS_COLORS.has(name)) continue;
    const dist = chroma.deltaE(hex, sample);
    if (dist < bestDist) {
      bestDist = dist;
      best = name as ChromaticPexelsColor;
    }
  }
  return best;
}

const PEXELS_TO_UNSPLASH: Partial<Record<ChromaticPexelsColor, UnsplashColorName>> = {
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  turquoise: 'teal',
  blue: 'blue',
  violet: 'purple',
  pink: 'magenta',
  // Unsplash has no brown — skip rather than force a wrong filter.
};

const PEXELS_TO_PIXABAY: Record<ChromaticPexelsColor, PixabayColorName> = {
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  turquoise: 'turquoise',
  blue: 'blue',
  violet: 'lilac',
  pink: 'pink',
  brown: 'brown',
};

/** Sample hexes for Pixabay named colors (used when API has no avg_color). */
export const PIXABAY_COLOR_HEX: Record<PixabayColorName, string> = {
  red: '#E53935',
  orange: '#FB8C00',
  yellow: '#FDD835',
  green: '#43A047',
  turquoise: '#26A69A',
  blue: '#1E88E5',
  lilac: '#8E24AA',
  pink: '#EC407A',
  brown: '#8D6E63',
};

/** Map a hex (or Pexels chromatic color) to an Unsplash color filter. */
export function nearestUnsplashColor(hex: string): UnsplashColorName | null {
  const pexels = nearestPexelsColor(hex);
  if (!pexels) return null;
  return PEXELS_TO_UNSPLASH[pexels] ?? null;
}

export function pexelsColorToUnsplash(
  color: ChromaticPexelsColor,
): UnsplashColorName | null {
  return PEXELS_TO_UNSPLASH[color] ?? null;
}

export function nearestPixabayColor(hex: string): PixabayColorName | null {
  const pexels = nearestPexelsColor(hex);
  if (!pexels) return null;
  return PEXELS_TO_PIXABAY[pexels];
}

export function pexelsColorToPixabay(color: ChromaticPexelsColor): PixabayColorName {
  return PEXELS_TO_PIXABAY[color];
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
