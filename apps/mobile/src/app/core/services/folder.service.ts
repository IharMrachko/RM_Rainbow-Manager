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

export interface GalleryFolder {
  id: string;
  userId: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FolderService {
  constructor(private readonly auth: AuthService) {}

  private itemsCollection() {
    return collection(
      getFirebaseDb(),
      FIREBASE_PATHS.folderRoot,
      FIREBASE_PATHS.folderItems,
      'items',
    );
  }

  async listMine(): Promise<GalleryFolder[]> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      return [];
    }
    const q = query(this.itemsCollection(), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: String(data['userId'] ?? userId),
        name: String(data['name'] ?? ''),
      };
    });
  }

  async create(name: string): Promise<GalleryFolder> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    const docRef = await addDoc(this.itemsCollection(), {
      userId,
      name,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, userId, name };
  }

  async rename(id: string, name: string): Promise<void> {
    const folderRef = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.folderRoot,
      FIREBASE_PATHS.folderItems,
      'items',
      id,
    );
    await updateDoc(folderRef, { name });
  }

  async remove(id: string): Promise<void> {
    const folderRef = doc(
      getFirebaseDb(),
      FIREBASE_PATHS.folderRoot,
      FIREBASE_PATHS.folderItems,
      'items',
      id,
    );
    await deleteDoc(folderRef);
  }
}
