import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import chroma from 'chroma-js';
import { firstValueFrom } from 'rxjs';
import { Palette, palettesObj } from '@rainbow/shared';
import { environment } from '../../../environments/environment';
import {
  buildColorAnchors,
  buildSearchQueries,
  isNeutralHex,
  nearestPexelsColor,
  nearestUnsplashColor,
  pexelsColorToUnsplash,
  subjectRelevanceDelta,
} from './stock-looks-query';
import {
  StockLookItem,
  StockLooksProvider,
  StockLooksSearchParams,
  StockLooksSearchResult,
} from './stock-looks.types';

interface PexelsPhoto {
  id: number;
  width?: number;
  height?: number;
  url: string;
  avg_color?: string;
  alt?: string;
  photographer: string;
  photographer_url: string;
  src: {
    medium: string;
    large: string;
    large2x?: string;
    original?: string;
  };
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
}

interface UnsplashPhoto {
  id: string;
  width?: number;
  height?: number;
  color?: string;
  description?: string | null;
  alt_description?: string | null;
  urls: {
    regular: string;
    full: string;
    raw?: string;
    small?: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    links?: {
      html?: string;
    };
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

type RawLook = Omit<StockLookItem, 'matchScore' | 'matchLabel' | 'matchedSwatches'>;

/** Curated mock looks with avg colors so scoring works without an API key. */
const MOCK_LOOKS: RawLook[] = [
  {
    id: 'mock-1',
    title: 'Soft knit layers',
    previewUrl:
      'https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=1600',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/7671166/',
    avgColor: '#C4A484',
    source: 'mock',
  },
  {
    id: 'mock-2',
    title: 'Muted rose blouse',
    previewUrl:
      'https://images.pexels.com/photos/7671184/pexels-photo-7671184.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/7671184/pexels-photo-7671184.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/7671184/',
    avgColor: '#C48A8F',
    source: 'mock',
  },
  {
    id: 'mock-3',
    title: 'Olive tailored look',
    previewUrl:
      'https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/532220/pexels-photo-532220.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/532220/',
    avgColor: '#6B7F5A',
    source: 'mock',
  },
  {
    id: 'mock-4',
    title: 'Cool grey coat',
    previewUrl:
      'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/1036623/',
    avgColor: '#8A8F98',
    source: 'mock',
  },
  {
    id: 'mock-5',
    title: 'Warm camel coat',
    previewUrl:
      'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/1183266/',
    avgColor: '#C49A6C',
    source: 'mock',
  },
  {
    id: 'mock-6',
    title: 'Dusty pink knit',
    previewUrl:
      'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/1926769/',
    avgColor: '#D4A5A5',
    source: 'mock',
  },
  {
    id: 'mock-7',
    title: 'Deep burgundy dress',
    previewUrl:
      'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/985635/',
    avgColor: '#6E2C3A',
    source: 'mock',
  },
  {
    id: 'mock-8',
    title: 'Soft teal scarf look',
    previewUrl:
      'https://images.pexels.com/photos/794062/pexels-photo-794062.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/794062/pexels-photo-794062.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/794062/',
    avgColor: '#4F7F7A',
    source: 'mock',
  },
  {
    id: 'mock-9',
    title: 'Ivory and blush',
    previewUrl:
      'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/291759/',
    avgColor: '#E8D9C8',
    source: 'mock',
  },
  {
    id: 'mock-10',
    title: 'Navy structured blazer',
    previewUrl:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/1043474/',
    avgColor: '#2C3E55',
    source: 'mock',
  },
  {
    id: 'mock-11',
    title: 'Warm terracotta layers',
    previewUrl:
      'https://images.pexels.com/photos/1381555/pexels-photo-1381555.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/1381555/pexels-photo-1381555.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/1381555/',
    avgColor: '#B86B4B',
    source: 'mock',
  },
  {
    id: 'mock-12',
    title: 'Soft sage ensemble',
    previewUrl:
      'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1200',
    largeUrl:
      'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1200',
    photographer: 'Pexels',
    photographerUrl: 'https://www.pexels.com',
    sourceUrl: 'https://www.pexels.com/photo/1488463/',
    avgColor: '#8FA888',
    source: 'mock',
  },
];

@Injectable({ providedIn: 'root' })
export class StockLooksService {
  constructor(private readonly http: HttpClient) {}

  get hasPexelsKey(): boolean {
    return Boolean(environment.pexelsApiKey?.trim());
  }

  get hasUnsplashKey(): boolean {
    return Boolean(environment.unsplashAccessKey?.trim());
  }

  /** True when at least one stock provider key is configured. */
  get hasApiKey(): boolean {
    return this.hasPexelsKey || this.hasUnsplashKey;
  }

  async search(params: StockLooksSearchParams): Promise<StockLooksSearchResult> {
    if ((params.mode ?? 'palette') === 'free') {
      return this.searchFree(params);
    }
    return this.searchByPalette(params);
  }

  private resolveProviders(provider?: StockLooksProvider): StockLooksProvider[] {
    const selected = provider ?? 'all';
    if (selected === 'pexels') return ['pexels'];
    if (selected === 'unsplash') return ['unsplash'];
    return ['pexels', 'unsplash'];
  }

  private async searchByPalette(
    params: StockLooksSearchParams,
  ): Promise<StockLooksSearchResult> {
    if (!params.paletteType || !params.category) {
      return { items: [], usedMock: false, querySummary: 'palette' };
    }

    const providers = this.resolveProviders(params.provider);
    const anchors = buildColorAnchors(
      params.paletteType,
      3,
      params.accentHexes,
    );
    const queries = buildSearchQueries(params.paletteType, params.category);
    const querySummary = [
      params.provider ?? 'all',
      params.paletteType,
      params.category,
      ...anchors.map((a) => a.pexelsColor),
    ].join(' · ');

    const perPage = params.perPage ?? 24;
    const requested = providers.filter((p) => p === 'pexels' || p === 'unsplash');
    const available = requested.filter(
      (p) => (p === 'pexels' && this.hasPexelsKey) || (p === 'unsplash' && this.hasUnsplashKey),
    );

    const jobs: Array<Promise<RawLook[]>> = [];
    if (available.includes('pexels')) {
      jobs.push(
        this.fetchMergedFromPexels(
          queries,
          anchors.map((a) => a.pexelsColor),
          perPage,
        ),
      );
    }
    if (available.includes('unsplash')) {
      jobs.push(
        this.fetchMergedFromUnsplash(
          queries,
          anchors.map((a) => pexelsColorToUnsplash(a.pexelsColor)),
          perPage,
        ),
      );
    }

    let raw: RawLook[] = [];
    let usedMock = false;
    let warningKey: StockLooksSearchResult['warningKey'];

    if (!available.length) {
      raw = [...MOCK_LOOKS];
      usedMock = true;
      warningKey = requested.length
        ? 'stockLooksProviderKeyMissing'
        : 'stockLooksMockMode';
    } else {
      const settled = await Promise.all(
        jobs.map(async (job) => {
          try {
            return { ok: true as const, value: await job };
          } catch {
            return { ok: false as const, value: [] as RawLook[] };
          }
        }),
      );
      const chunks = settled.filter((s) => s.ok).map((s) => s.value);
      const anyRejected = settled.some((s) => !s.ok);
      raw = this.dedupeLooks(chunks);
      if (!raw.length) {
        raw = [...MOCK_LOOKS];
        usedMock = true;
        warningKey = anyRejected ? 'stockLooksApiFailed' : 'stockLooksEmptyLive';
      }
    }

    const items = this.scoreAndRank(raw, params.paletteType);
    return {
      items,
      usedMock,
      querySummary,
      sourcesUsed: [...new Set(items.map((i) => i.source))],
      warningKey,
    };
  }

  /** Free text search: no palette scoring; optional color-picker filter. */
  private async searchFree(
    params: StockLooksSearchParams,
  ): Promise<StockLooksSearchResult> {
    const freeQuery = (params.freeQuery || '').trim();
    const freeColorHex = (params.freeColorHex || '').trim();
    const pexelsColor = freeColorHex ? nearestPexelsColor(freeColorHex) : null;
    const unsplashColor = freeColorHex ? nearestUnsplashColor(freeColorHex) : null;
    const providers = this.resolveProviders(params.provider);

    if (!freeQuery && !freeColorHex) {
      return { items: [], usedMock: false, querySummary: 'free' };
    }

    const queryText =
      freeQuery ||
      (pexelsColor ? `${pexelsColor} fashion clothing` : 'fashion clothing');
    const querySummary = [
      'free',
      params.provider ?? 'all',
      freeQuery || null,
      freeColorHex || null,
      pexelsColor || unsplashColor || null,
    ]
      .filter(Boolean)
      .join(' · ');

    const perPage = params.perPage ?? 24;
    const requested = providers.filter((p) => p === 'pexels' || p === 'unsplash');
    const available = requested.filter(
      (p) => (p === 'pexels' && this.hasPexelsKey) || (p === 'unsplash' && this.hasUnsplashKey),
    );

    const jobs: Array<Promise<RawLook[]>> = [];
    if (available.includes('pexels')) {
      jobs.push(this.fetchFromPexels(queryText, pexelsColor ?? undefined, perPage));
    }
    if (available.includes('unsplash')) {
      jobs.push(this.fetchFromUnsplash(queryText, unsplashColor ?? undefined, perPage));
    }

    let raw: RawLook[] = [];
    let usedMock = false;
    let warningKey: StockLooksSearchResult['warningKey'];

    if (!available.length) {
      raw = this.filterMocksByQuery(queryText);
      usedMock = true;
      warningKey = requested.length
        ? 'stockLooksProviderKeyMissing'
        : 'stockLooksMockMode';
    } else {
      const settled = await Promise.all(
        jobs.map(async (job) => {
          try {
            return { ok: true as const, value: await job };
          } catch {
            return { ok: false as const, value: [] as RawLook[] };
          }
        }),
      );
      const chunks = settled.filter((s) => s.ok).map((s) => s.value);
      const anyRejected = settled.some((s) => !s.ok);
      raw = this.dedupeLooks(chunks);
      if (!raw.length) {
        raw = this.filterMocksByQuery(queryText);
        usedMock = true;
        warningKey = anyRejected ? 'stockLooksApiFailed' : 'stockLooksEmptyLive';
      }
    }

    const items = this.rankFree(raw, queryText, freeColorHex);
    return {
      items,
      usedMock,
      querySummary,
      sourcesUsed: [...new Set(items.map((i) => i.source))],
      warningKey,
    };
  }

  private dedupeLooks(chunks: RawLook[][]): RawLook[] {
    const byId = new Map<string, RawLook>();
    for (const chunk of chunks) {
      for (const item of chunk) {
        if (!byId.has(item.id)) {
          byId.set(item.id, item);
        }
      }
    }
    return [...byId.values()];
  }

  private filterMocksByQuery(query: string): RawLook[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);
    if (!tokens.length) return [...MOCK_LOOKS];
    const matched = MOCK_LOOKS.filter((item) => {
      const hay = item.title.toLowerCase();
      return tokens.some((t) => hay.includes(t));
    });
    return matched.length ? matched : [...MOCK_LOOKS];
  }

  private rankFree(
    raw: RawLook[],
    query: string,
    freeColorHex?: string,
  ): StockLookItem[] {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);
    const hasPickerColor = Boolean(freeColorHex && chroma.valid(freeColorHex));

    return raw
      .map((item) => {
        const hay = item.title.toLowerCase();
        let matchScore = 40 + subjectRelevanceDelta(item.title);
        for (const token of tokens) {
          if (hay.includes(token)) matchScore += 10;
        }
        if (hasPickerColor && chroma.valid(item.avgColor)) {
          const dist = chroma.deltaE(freeColorHex!, item.avgColor);
          matchScore += Math.max(-20, Math.min(20, Math.round(20 - dist * 0.7)));
        }
        matchScore = Math.max(0, Math.min(100, matchScore));
        const matchLabel: StockLookItem['matchLabel'] =
          matchScore >= 72 ? 'excellent' : matchScore >= 48 ? 'good' : 'fair';
        return {
          ...item,
          matchScore,
          matchLabel,
          matchedSwatches: hasPickerColor ? [chroma(freeColorHex!).hex()] : [],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Score a photo against an RM palette using ΔE to the nearest palette swatches.
   */
  scoreAgainstPalette(
    avgColor: string,
    paletteType: Palette,
  ): Pick<StockLookItem, 'matchScore' | 'matchLabel' | 'matchedSwatches'> {
    const palette = palettesObj[paletteType] ?? [];
    if (!chroma.valid(avgColor) || !palette.length) {
      return { matchScore: 0, matchLabel: 'fair', matchedSwatches: [] };
    }

    const distances = palette
      .filter((hex) => chroma.valid(hex))
      .map((hex) => ({ hex, dist: chroma.deltaE(avgColor, hex) }))
      .sort((a, b) => a.dist - b.dist);

    // Prefer chromatic palette swatches so neutrals don't dominate the match.
    const chromatic = distances.filter((d) => !isNeutralHex(d.hex));
    const nearest = (chromatic.length ? chromatic : distances).slice(0, 5);
    const avgDist =
      nearest.reduce((sum, d) => sum + d.dist, 0) / Math.max(nearest.length, 1);

    // ΔE ~0 → 100, ΔE ≥40 → 0
    let matchScore = Math.max(0, Math.min(100, Math.round(100 - avgDist * 2.5)));
    // White / gray / black-dominated frames (studio BG, B&W) rank lower.
    if (isNeutralHex(avgColor)) {
      matchScore = Math.max(0, matchScore - 28);
    }
    const matchLabel: StockLookItem['matchLabel'] =
      matchScore >= 72 ? 'excellent' : matchScore >= 48 ? 'good' : 'fair';

    return {
      matchScore,
      matchLabel,
      matchedSwatches: nearest.slice(0, 4).map((d) => chroma(d.hex).hex()),
    };
  }

  private scoreAndRank(raw: RawLook[], paletteType: Palette): StockLookItem[] {
    return raw
      .map((item) => {
        const color = this.scoreAgainstPalette(item.avgColor, paletteType);
        const subjectDelta = subjectRelevanceDelta(item.title);
        const matchScore = Math.max(
          0,
          Math.min(100, color.matchScore + subjectDelta),
        );
        const matchLabel: StockLookItem['matchLabel'] =
          matchScore >= 72 ? 'excellent' : matchScore >= 48 ? 'good' : 'fair';
        return {
          ...item,
          matchScore,
          matchLabel,
          matchedSwatches: color.matchedSwatches,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Merge a few clothing-focused queries. First query is color-free for better
   * subject hits; later queries use palette color anchors.
   */
  private async fetchMergedFromPexels(
    queries: string[],
    colors: string[],
    perPage: number,
  ): Promise<RawLook[]> {
    const pageSize = Math.min(20, Math.max(8, Math.ceil(perPage / 2)));
    const jobs: Array<Promise<RawLook[]>> = [
      this.fetchFromPexels(queries[0], undefined, pageSize),
    ];
    if (queries[1]) {
      jobs.push(this.fetchFromPexels(queries[1], colors[0], pageSize));
    }
    if (queries[2] && colors[1]) {
      jobs.push(this.fetchFromPexels(queries[2], colors[1], pageSize));
    }

    const chunks = await Promise.all(
      jobs.map((job) => job.catch(() => [] as RawLook[])),
    );
    return this.dedupeLooks(chunks);
  }

  private async fetchFromPexels(
    query: string,
    color: string | undefined,
    perPage: number,
  ): Promise<RawLook[]> {
    const key = environment.pexelsApiKey.trim();
    let params = new HttpParams()
      .set('query', query)
      .set('per_page', String(perPage))
      .set('orientation', 'portrait')
      .set('size', 'large');
    if (color) {
      params = params.set('color', color);
    }

    const headers = new HttpHeaders({ Authorization: key });
    const response = await firstValueFrom(
      this.http.get<PexelsSearchResponse>('https://api.pexels.com/v1/search', {
        headers,
        params,
      }),
    );

    return (response.photos ?? [])
      .filter((photo) => (photo.width ?? 0) === 0 || (photo.width ?? 0) >= 1000)
      .map((photo) => ({
        id: `pexels:${photo.id}`,
        title: photo.alt?.trim() || `Pexels ${photo.id}`,
        previewUrl: photo.src.large2x || photo.src.large || photo.src.medium,
        largeUrl: photo.src.original || photo.src.large2x || photo.src.large,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
        avgColor: photo.avg_color || '#888888',
        source: 'pexels' as const,
      }));
  }

  private async fetchMergedFromUnsplash(
    queries: string[],
    colors: Array<string | null | undefined>,
    perPage: number,
  ): Promise<RawLook[]> {
    const pageSize = Math.min(20, Math.max(8, Math.ceil(perPage / 2)));
    const jobs: Array<Promise<RawLook[]>> = [
      this.fetchFromUnsplash(queries[0], undefined, pageSize),
    ];
    if (queries[1]) {
      jobs.push(this.fetchFromUnsplash(queries[1], colors[0] || undefined, pageSize));
    }
    if (queries[2] && colors[1]) {
      jobs.push(this.fetchFromUnsplash(queries[2], colors[1] || undefined, pageSize));
    }

    const chunks = await Promise.all(
      jobs.map((job) => job.catch(() => [] as RawLook[])),
    );
    return this.dedupeLooks(chunks);
  }

  private async fetchFromUnsplash(
    query: string,
    color: string | undefined,
    perPage: number,
  ): Promise<RawLook[]> {
    const key = environment.unsplashAccessKey.trim();
    let params = new HttpParams()
      .set('query', query)
      .set('per_page', String(Math.min(30, perPage)))
      .set('orientation', 'portrait')
      .set('content_filter', 'high');
    if (color) {
      params = params.set('color', color);
    }

    const headers = new HttpHeaders({
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    });
    const response = await firstValueFrom(
      this.http.get<UnsplashSearchResponse>('https://api.unsplash.com/search/photos', {
        headers,
        params,
      }),
    );

    return (response.results ?? [])
      .filter((photo) => (photo.width ?? 0) === 0 || (photo.width ?? 0) >= 1000)
      .map((photo) => ({
        id: `unsplash:${photo.id}`,
        title:
          photo.alt_description?.trim() ||
          photo.description?.trim() ||
          `Unsplash ${photo.id}`,
        previewUrl: photo.urls.regular,
        largeUrl: photo.urls.full || photo.urls.raw || photo.urls.regular,
        photographer: photo.user?.name || 'Unsplash',
        photographerUrl: photo.user?.links?.html || 'https://unsplash.com',
        sourceUrl: photo.links?.html || 'https://unsplash.com',
        avgColor: photo.color || '#888888',
        source: 'unsplash' as const,
      }));
  }
}
