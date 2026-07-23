import { Palette } from '@rainbow/shared';

/** Stock search category presets for the prototype. */
export type StockLooksCategory = 'outfit' | 'portrait' | 'accessories';

/** Palette-matched search vs free text search without palette filters. */
export type StockLooksMode = 'palette' | 'free';

/** Which stock provider(s) to query. */
export type StockLooksProvider = 'all' | 'pexels' | 'unsplash' | 'pixabay';

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

/** Chromatic Unsplash color filter names (no black/white). */
export type UnsplashColorName =
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'magenta'
  | 'green'
  | 'teal'
  | 'blue';

/** Pixabay chromatic color filters (excludes white/gray/black/grayscale/transparent). */
export type PixabayColorName =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'lilac'
  | 'pink'
  | 'brown';

/** Chromatic Pexels colors allowed as stock search filters (no white/gray/black). */
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
  source: 'pexels' | 'unsplash' | 'pixabay' | 'mock';
}

export interface StockLooksSearchParams {
  mode?: StockLooksMode;
  provider?: StockLooksProvider;
  /** Required for palette mode. */
  paletteType?: Palette;
  category?: StockLooksCategory;
  /** Free-text query for free mode (e.g. "red blazer", "linen shirt"). */
  freeQuery?: string;
  /** Optional hex from color picker for free mode (maps to color filters). */
  freeColorHex?: string;
  /** Optional user-picked accent hexes from the palette (1–3). */
  accentHexes?: string[];
  perPage?: number;
  /** 1-based page for infinite scroll (default 1). */
  page?: number;
}

export interface StockLooksSearchResult {
  items: StockLookItem[];
  usedMock: boolean;
  querySummary: string;
  /** True when another live page may be available. */
  hasMore?: boolean;
  /** Page that was fetched. */
  page?: number;
  /** Providers that returned at least one photo. */
  sourcesUsed?: Array<'pexels' | 'unsplash' | 'pixabay' | 'mock'>;
  /** Why mock/empty happened — for UI banner. */
  warningKey?:
    | 'stockLooksMockMode'
    | 'stockLooksFallbackMock'
    | 'stockLooksProviderKeyMissing'
    | 'stockLooksApiFailed'
    | 'stockLooksEmptyLive';
}
