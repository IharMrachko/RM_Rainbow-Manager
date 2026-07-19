import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { FIREBASE_PATHS } from '@rainbow/shared';
import { getFirebaseDb, getFirebaseStorage } from '../firebase';
import { AuthService } from './auth.service';

export interface GalleryImage {
  id: string;
  src: string;
  title: string;
  coloristicType?: string;
  maskType?: string;
  paletteType?: string;
  folderId?: string;
}

export interface GalleryQueryOptions {
  title?: string;
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  maskType?: string | null;
  folderId?: string | null;
  paletteType?: string | null;
  coloristicType?: string | null;
}

export interface GalleryPageResult {
  items: GalleryImage[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  total: number;
  /** True when the Firestore page was full — more docs may exist. */
  hasMore: boolean;
}

export interface SaveGalleryOptions {
  canvas: HTMLCanvasElement;
  path?: string;
  title?: string;
  coloristicType?: string;
  maskType?: string;
  paletteType?: string;
  folderId?: string;
  deprecated?: boolean;
}

function tokenizeTitle(title: string): string[] {
  const result: string[] = [];
  const words = title.toLowerCase().split(/\s+/).filter(Boolean);
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) {
      result.push(word.substring(0, i));
    }
    for (let i = 0; i < word.length; i++) {
      result.push(word[i]);
    }
  }
  return result;
}

@Injectable({ providedIn: 'root' })
export class GalleryService {
  constructor(private readonly auth: AuthService) {}

  private itemsCollection() {
    return collection(
      getFirebaseDb(),
      FIREBASE_PATHS.galleryRoot,
      FIREBASE_PATHS.galleryItems,
      'items',
    );
  }

  /**
   * Same Firestore query as Vue `gallery/initUserGalleryItems`.
   */
  async loadUserItems(
    options: GalleryQueryOptions = {},
  ): Promise<GalleryPageResult> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      return { items: [], lastDoc: null, total: 0, hasMore: false };
    }

    const {
      paletteType,
      maskType,
      coloristicType,
      title,
      pageSize = 50,
      lastDoc,
      folderId,
    } = options;

    const itemsRef = this.itemsCollection();
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];
    const constraintsForCount: QueryConstraint[] = [where('userId', '==', userId)];

    if (coloristicType) {
      constraints.push(where('coloristicType', '==', coloristicType));
      constraintsForCount.push(where('coloristicType', '==', coloristicType));
    }
    if (maskType) {
      constraints.push(where('maskType', '==', maskType));
      constraintsForCount.push(where('maskType', '==', maskType));
    }
    if (paletteType) {
      constraints.push(where('paletteType', '==', paletteType));
      constraintsForCount.push(where('paletteType', '==', paletteType));
    }
    if (folderId) {
      constraints.push(where('folderId', '==', folderId));
      constraintsForCount.push(where('folderId', '==', folderId));
    }
    if (title?.trim()) {
      const token = title.trim().toLowerCase();
      constraints.push(where('tokens', 'array-contains', token));
      constraintsForCount.push(where('tokens', 'array-contains', token));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(pageSize));

    const [countSnap, snapshot] = await Promise.all([
      getCountFromServer(query(itemsRef, ...constraintsForCount)),
      getDocs(query(itemsRef, ...constraints)),
    ]);

    const items = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        src: String(data['url'] ?? ''),
        title: data['title'] ? String(data['title']) : '',
        coloristicType: data['coloristicType'] ? String(data['coloristicType']) : undefined,
        maskType: data['maskType'] ? String(data['maskType']) : undefined,
        paletteType: data['paletteType'] ? String(data['paletteType']) : undefined,
        folderId: data['folderId'] ? String(data['folderId']) : undefined,
      } satisfies GalleryImage;
    }).filter((it) => !!it.src);

    return {
      items,
      lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
      total: countSnap.data().count,
      hasMore: snapshot.docs.length >= pageSize,
    };
  }

  async listMine(max = 50): Promise<GalleryImage[]> {
    const page = await this.loadUserItems({ pageSize: max });
    return page.items;
  }

  async saveImage(options: SaveGalleryOptions): Promise<string> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const {
      canvas,
      path = `avatar/${Date.now()}.png`,
      title = '',
      paletteType,
      coloristicType,
      maskType,
      folderId = '',
      deprecated = false,
    } = options;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob failed'))), 'image/png');
    });

    const fileRef = storageRef(getFirebaseStorage(), path);
    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);

    await addDoc(this.itemsCollection(), {
      userId,
      url: downloadURL,
      title: title || '',
      coloristicType: coloristicType ?? '',
      paletteType: paletteType ?? '',
      maskType: maskType ?? '',
      folderId: folderId || '',
      createdAt: serverTimestamp(),
      deprecated,
      tokens: tokenizeTitle(title || ''),
    });

    return downloadURL;
  }

  async updateImage(payload: {
    id: string;
    title?: string;
    coloristicType?: string;
    maskType?: string;
    paletteType?: string;
    folderId?: string | null;
  }): Promise<void> {
    const itemRef = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.galleryRoot,
      FIREBASE_PATHS.galleryItems,
      'items',
      payload.id,
    );

    // Firestore rejects `undefined` field values; never write `id` into the doc.
    const data: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (payload.title !== undefined) {
      data['title'] = payload.title;
      data['tokens'] = tokenizeTitle(payload.title);
    }
    if (payload.coloristicType !== undefined) {
      data['coloristicType'] = payload.coloristicType;
    }
    if (payload.maskType !== undefined) {
      data['maskType'] = payload.maskType;
    }
    if (payload.paletteType !== undefined) {
      data['paletteType'] = payload.paletteType;
    }
    if (payload.folderId !== undefined) {
      data['folderId'] = payload.folderId ?? '';
    }

    await updateDoc(itemRef, data);
  }

  async deleteImage(id: string): Promise<void> {
    const itemRef = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.galleryRoot,
      FIREBASE_PATHS.galleryItems,
      'items',
      id,
    );
    await deleteDoc(itemRef);
  }

  async deleteImages(ids: string[]): Promise<void> {
    await Promise.all(ids.map((id) => this.deleteImage(id)));
  }
}
