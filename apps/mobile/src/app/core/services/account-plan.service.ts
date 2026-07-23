import { Injectable } from '@angular/core';

export type AccountPlanId = 'free' | 'pro' | 'studio';

export interface AccountPlan {
  id: AccountPlanId;
  titleKey: string;
  priceKey: string;
  featuresKeys: string[];
}

export interface AccountUsageLimit {
  id: string;
  titleKey: string;
  used: number;
  limit: number;
  unitKey: string;
}

/** Local stub until billing/usage lives in Firestore/backend. */
@Injectable({ providedIn: 'root' })
export class AccountPlanService {
  /** Current plan — replace with server value later. */
  readonly currentPlanId: AccountPlanId = 'free';

  readonly plans: AccountPlan[] = [
    {
      id: 'free',
      titleKey: 'accountPlanFree',
      priceKey: 'accountPlanFreePrice',
      featuresKeys: [
        'accountPlanFreeFeature1',
        'accountPlanFreeFeature2',
        'accountPlanFreeFeature3',
      ],
    },
    {
      id: 'pro',
      titleKey: 'accountPlanPro',
      priceKey: 'accountPlanProPrice',
      featuresKeys: [
        'accountPlanProFeature1',
        'accountPlanProFeature2',
        'accountPlanProFeature3',
      ],
    },
    {
      id: 'studio',
      titleKey: 'accountPlanStudio',
      priceKey: 'accountPlanStudioPrice',
      featuresKeys: [
        'accountPlanStudioFeature1',
        'accountPlanStudioFeature2',
        'accountPlanStudioFeature3',
      ],
    },
  ];

  /** Usage meters — stub numbers for UI; wire to real counters later. */
  getUsageLimits(): AccountUsageLimit[] {
    return [
      {
        id: 'aiPhotoTokens',
        titleKey: 'accountLimitAiPhoto',
        used: 0,
        limit: 10,
        unitKey: 'accountLimitUnitTokens',
      },
      {
        id: 'aiChat',
        titleKey: 'accountLimitAiChat',
        used: 0,
        limit: 50,
        unitKey: 'accountLimitUnitMessages',
      },
      {
        id: 'gallerySaves',
        titleKey: 'accountLimitGallery',
        used: 0,
        limit: 100,
        unitKey: 'accountLimitUnitItems',
      },
    ];
  }

  get currentPlan(): AccountPlan {
    return this.plans.find((p) => p.id === this.currentPlanId) ?? this.plans[0];
  }

  usagePercent(limit: AccountUsageLimit): number {
    if (limit.limit <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((limit.used / limit.limit) * 100)));
  }
}
