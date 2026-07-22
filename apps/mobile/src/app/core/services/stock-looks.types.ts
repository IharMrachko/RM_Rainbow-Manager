import { Palette } from '@rainbow/shared';

/** Stock search category presets for the prototype. */
export type StockLooksCategory = 'outfit' | 'portrait' | 'accessories';

/** Palette-matched search vs free text search without palette filters. */
export type StockLooksMode = 'palette' | 'free';

/** Named colors accepted by the Pexels search API. */
export type PexelsColorName =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'brown'
  | 'black'
  | 'gray'
  | 'white';

/** Pexels colors allowed as stock search filters (no white/gray/black). */
export type ChromaticPexelsColor = Exclude<PexelsColorName, 'white' | 'gray' | 'black'>;

export interface StockColorAnchor {
  hex: string;
  pexelsColor: ChromaticPexelsColor;
}

export interface StockLookItem {
  id: string;
  title: string;
  previewUrl: string;
  largeUrl: string;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  avgColor: string;
  /** 0–100, higher = closer to the RM palette. */
  matchScore: number;
  matchLabel: 'excellent' | 'good' | 'fair';
  matchedSwatches: string[];
  source: 'pexels' | 'mock';
}

export interface StockLooksSearchParams {
  mode?: StockLooksMode;
  /** Required for palette mode. */
  paletteType?: Palette;
  category?: StockLooksCategory;
  /** Free-text query for free mode (e.g. "red blazer", "linen shirt"). */
  freeQuery?: string;
  /** Optional hex from color picker for free mode (maps to Pexels color filter). */
  freeColorHex?: string;
  /** Optional user-picked accent hexes from the palette (1–3). */
  accentHexes?: string[];
  perPage?: number;
}

export interface StockLooksSearchResult {
  items: StockLookItem[];
  usedMock: boolean;
  querySummary: string;
}
