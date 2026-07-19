import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FIREBASE_PATHS } from '@rainbow/shared';
import { getFirebaseDb } from '../firebase';
import { AuthService } from './auth.service';

export interface PaletteTemplateSegment {
  color: string;
}

export interface PaletteTemplate {
  id: string;
  userId: string;
  name: string;
  segments: PaletteTemplateSegment[];
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PaletteTemplateService {
  constructor(private readonly auth: AuthService) {}

  private itemsCollection() {
    return collection(
      getFirebaseDb(),
      FIREBASE_PATHS.paletteTemplatesRoot,
      FIREBASE_PATHS.paletteTemplatesItems,
      'items',
    );
  }

  async listMine(): Promise<PaletteTemplate[]> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      return [];
    }
    const q = query(this.itemsCollection(), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      const segments = Array.isArray(data['segments'])
        ? data['segments'].map((s: { color?: string }) => ({
            color: String(s?.color ?? '#eeeeee'),
          }))
        : [];
      return {
        id: d.id,
        userId: String(data['userId'] ?? userId),
        name: String(data['name'] ?? ''),
        segments,
        createdAt: data['createdAt'] ? String(data['createdAt']) : undefined,
      };
    });
  }

  async create(name: string, segments: PaletteTemplateSegment[]): Promise<PaletteTemplate> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    const docRef = await addDoc(this.itemsCollection(), {
      userId,
      name,
      segments,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, userId, name, segments };
  }

  async update(id: string, name: string, segments: PaletteTemplateSegment[]): Promise<void> {
    const ref = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.paletteTemplatesRoot,
      FIREBASE_PATHS.paletteTemplatesItems,
      'items',
      id,
    );
    await updateDoc(ref, { name, segments });
  }

  async remove(id: string): Promise<void> {
    const ref = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.paletteTemplatesRoot,
      FIREBASE_PATHS.paletteTemplatesItems,
      'items',
      id,
    );
    await deleteDoc(ref);
  }
}
