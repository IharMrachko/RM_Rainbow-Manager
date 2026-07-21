/** Lookbook page layout templates (A4 section blocks). */

export type LookbookTemplateId =
  | 'cover'
  | 'article-left'
  | 'article-right'
  | 'overlay-3'
  | 'fan-3'
  | 'text-photo'
  | 'text-photo-right'
  | 'collage-text-4'
  | 'collage-text-3'
  | 'collage-2'
  | 'collage-4'
  | 'photo'
  | 'text-1col';

export interface LookbookTemplateDef {
  id: LookbookTemplateId;
  /** i18n key for title under the preview card */
  titleKey: string;
  /** How many photos to ask for (0 = text only). */
  photoCount: number;
  /** CSS modifier for the miniature preview in the picker. */
  previewClass: string;
}

export const LOOKBOOK_PAGE_TEMPLATES: LookbookTemplateDef[] = [
  {
    id: 'cover',
    titleKey: 'lookbookTplCover',
    photoCount: 1,
    previewClass: 'is-cover',
  },
  {
    id: 'article-left',
    titleKey: 'lookbookTplArticleLeft',
    photoCount: 1,
    previewClass: 'is-article-left',
  },
  {
    id: 'article-right',
    titleKey: 'lookbookTplArticleRight',
    photoCount: 1,
    previewClass: 'is-article-right',
  },
  {
    id: 'overlay-3',
    titleKey: 'lookbookTplOverlay3',
    photoCount: 3,
    previewClass: 'is-overlay-3',
  },
  {
    id: 'fan-3',
    titleKey: 'lookbookTplFan3',
    photoCount: 3,
    previewClass: 'is-fan-3',
  },
  {
    id: 'text-photo',
    titleKey: 'lookbookTplTextPhoto',
    photoCount: 1,
    previewClass: 'is-text-photo',
  },
  {
    id: 'text-photo-right',
    titleKey: 'lookbookTplTextPhotoRight',
    photoCount: 1,
    previewClass: 'is-text-photo-right',
  },
  {
    id: 'collage-text-4',
    titleKey: 'lookbookTplCollageText4',
    photoCount: 4,
    previewClass: 'is-collage-text-4',
  },
  {
    id: 'collage-text-3',
    titleKey: 'lookbookTplCollageText3',
    photoCount: 3,
    previewClass: 'is-collage-text-3',
  },
  {
    id: 'collage-2',
    titleKey: 'lookbookTplCollage2',
    photoCount: 2,
    previewClass: 'is-collage-2',
  },
  {
    id: 'collage-4',
    titleKey: 'lookbookTplCollage4',
    photoCount: 4,
    previewClass: 'is-collage-4',
  },
  {
    id: 'photo',
    titleKey: 'lookbookTplPhoto',
    photoCount: 1,
    previewClass: 'is-photo',
  },
  {
    id: 'text-1col',
    titleKey: 'lookbookTplText1Col',
    photoCount: 0,
    previewClass: 'is-text-1col',
  },
];

export function findLookbookTemplate(id: string): LookbookTemplateDef | undefined {
  return LOOKBOOK_PAGE_TEMPLATES.find((t) => t.id === id);
}

export interface LookbookTemplateCopy {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  body2?: string;
  bullet?: string;
}

export interface LookbookTemplatePhoto {
  src: string;
  alt?: string;
}
