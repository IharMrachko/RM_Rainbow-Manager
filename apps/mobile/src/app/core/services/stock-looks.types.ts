import { Palette } from '@rainbow/shared';

/** Stock search category presets for the prototype. */
export type StockLooksCategory = 'outfit' | 'portrait' | 'accessories';

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

export interface StockColorAnchor {
  hex: string;
  pexelsColor: PexelsColorName;
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
  paletteType: Palette;
  category: StockLooksCategory;
  /** Optional user-picked accent hexes from the palette (1–3). */
  accentHexes?: string[];
  perPage?: number;
}

export interface StockLooksSearchResult {
  items: StockLookItem[];
  usedMock: boolean;
  querySummary: string;
}
