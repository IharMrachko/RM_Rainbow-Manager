import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import chroma from 'chroma-js';
import { firstValueFrom } from 'rxjs';
import { Palette, palettesObj } from '@rainbow/shared';
import { environment } from '../../../environments/environment';
import {
  buildColorAnchors,
  buildSearchQueries,
  subjectRelevanceDelta,
} from './stock-looks-query';
import {
  StockLookItem,
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

  /** True when a Pexels API key is configured in environment. */
  get hasApiKey(): boolean {
    return Boolean(environment.pexelsApiKey?.trim());
  }

  async search(params: StockLooksSearchParams): Promise<StockLooksSearchResult> {
    const anchors = buildColorAnchors(
      params.paletteType,
      3,
      params.accentHexes,
    );
    const queries = buildSearchQueries(params.paletteType, params.category);
    const querySummary = [
      params.paletteType,
      params.category,
      ...anchors.map((a) => a.pexelsColor),
    ].join(' · ');

    let raw: RawLook[] = [];
    let usedMock = false;

    if (this.hasApiKey) {
      try {
        raw = await this.fetchMergedFromPexels(
          queries,
          anchors.map((a) => a.pexelsColor),
          params.perPage ?? 24,
        );
      } catch {
        raw = [];
      }
      if (!raw.length) {
        raw = [...MOCK_LOOKS];
        usedMock = true;
      }
    } else {
      raw = [...MOCK_LOOKS];
      usedMock = true;
    }

    const items = this.scoreAndRank(raw, params.paletteType);
    return { items, usedMock, querySummary };
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

    const nearest = distances.slice(0, 5);
    const avgDist =
      nearest.reduce((sum, d) => sum + d.dist, 0) / Math.max(nearest.length, 1);

    // ΔE ~0 → 100, ΔE ≥40 → 0
    const matchScore = Math.max(0, Math.min(100, Math.round(100 - avgDist * 2.5)));
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
        id: String(photo.id),
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
}
