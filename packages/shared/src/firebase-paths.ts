/** Shared Firebase collection path constants (same as Vue app). */
export const FIREBASE_PATHS = {
  usersRoot: 'users',
  usersItems: 'Asbe4RDbnbYilRIWtx4F',
  galleryRoot: 'gallery',
  galleryItems: 'NoUcXcCCYhRoogXFHJfV',
  folderRoot: 'folder',
  folderItems: 'bCxB7W5QIQZQAOSBcbfa',
  paletteTemplatesRoot: 'palette-templates',
  paletteTemplatesItems: 'kFDy9AD2SVL64PG7hOl1',
  lookbookRoot: 'lookbooks',
  lookbookItems: 'RmLookbookItems01',
  aiChatRoot: 'ai-chats',
  aiChatItems: 'RmAiChatItems01',
  statisticsRoot: 'statistics',
} as const;

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AppUser {
  email: string;
  role?: UserRole;
  uid?: string;
}

export interface GalleryImageMeta {
  id?: string;
  title?: string;
  url: string;
  userId?: string;
  folderId?: string;
  createdAt?: number;
}
