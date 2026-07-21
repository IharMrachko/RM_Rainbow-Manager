import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { FIREBASE_PATHS } from '@rainbow/shared';
import { LookbookDocument, lookbookToHtml } from '../models/lookbook-document';
import { getFirebaseDb, getFirebaseFunctions, getFirebaseStorage } from '../firebase';
import { AuthService } from './auth.service';

export interface LookbookDoc {
  id: string;
  userId: string;
  title: string;
  folderId?: string | null;
  contentJson?: LookbookDocument | Record<string, unknown> | null;
  contentHtml?: string;
  pdfUrl?: string;
  updatedAt?: unknown;
  createdAt?: unknown;
}

export interface LookbookCloudPdfResult {
  pdfUrl: string;
  pages: string[];
  pageCount: number;
}

@Injectable({ providedIn: 'root' })
export class LookbookService {
  constructor(private readonly auth: AuthService) {}

  private itemsCollection() {
    return collection(
      getFirebaseDb(),
      FIREBASE_PATHS.lookbookRoot,
      FIREBASE_PATHS.lookbookItems,
      'items',
    );
  }

  private itemRef(id: string) {
    return doc(
      getFirebaseDb(),
      FIREBASE_PATHS.lookbookRoot,
      FIREBASE_PATHS.lookbookItems,
      'items',
      id,
    );
  }

  async listMine(): Promise<LookbookDoc[]> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      return [];
    }
    const q = query(this.itemsCollection(), where('userId', '==', userId));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => this.mapDoc(d.id, d.data()));
    return items.sort((a, b) => this.timeValue(b.updatedAt) - this.timeValue(a.updatedAt));
  }

  async getById(id: string): Promise<LookbookDoc | null> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      return null;
    }
    const snap = await getDoc(this.itemRef(id));
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    if (String(data['userId'] ?? '') !== userId) {
      return null;
    }
    return this.mapDoc(snap.id, data);
  }

  async create(payload: {
    title: string;
    folderId?: string | null;
    contentHtml?: string;
    contentJson?: LookbookDocument | Record<string, unknown> | null;
  }): Promise<string> {
    const id = doc(this.itemsCollection()).id;
    await this.createWithId(id, payload);
    return id;
  }

  reserveId(): string {
    return doc(this.itemsCollection()).id;
  }

  async createWithId(
    id: string,
    payload: {
      title: string;
      folderId?: string | null;
      contentHtml?: string;
      contentJson?: LookbookDocument | Record<string, unknown> | null;
    },
  ): Promise<void> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    const contentJson = payload.contentJson || { version: 2, format: 'html' };
    await setDoc(this.itemRef(id), {
      userId,
      title: payload.title.trim() || 'Lookbook',
      folderId: payload.folderId || '',
      contentHtml:
        payload.contentHtml ||
        (contentJson && typeof contentJson === 'object' && 'blocks' in contentJson
          ? lookbookToHtml(contentJson as LookbookDocument)
          : '<p><br></p>'),
      contentJson,
      pdfUrl: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async save(
    id: string,
    payload: {
      title?: string;
      folderId?: string | null;
      contentHtml?: string;
      contentJson?: LookbookDocument | Record<string, unknown> | null;
      pdfUrl?: string;
    },
  ): Promise<void> {
    await this.auth.whenReady();
    const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (payload.title !== undefined) {
      data['title'] = payload.title.trim() || 'Lookbook';
    }
    if (payload.folderId !== undefined) {
      data['folderId'] = payload.folderId || '';
    }
    if (payload.contentHtml !== undefined) {
      data['contentHtml'] = payload.contentHtml;
    }
    if (payload.contentJson !== undefined) {
      data['contentJson'] = payload.contentJson;
    }
    if (payload.pdfUrl !== undefined) {
      data['pdfUrl'] = payload.pdfUrl || '';
    }
    await updateDoc(this.itemRef(id), data);
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(this.itemRef(id));
  }

  async uploadAsset(lookbookId: string, file: Blob | File, fileName?: string): Promise<string> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    const name = fileName || `asset-${Date.now()}.jpg`;
    const path = `lookbooks/${userId}/${lookbookId}/${name}`;
    const fileRef = storageRef(getFirebaseStorage(), path);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  async uploadPdf(lookbookId: string, pdfBlob: Blob): Promise<string> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    if (!userId) {
      throw new Error('Not authenticated');
    }
    const path = `lookbooks/${userId}/${lookbookId}/lookbook.pdf`;
    const fileRef = storageRef(getFirebaseStorage(), path);
    await uploadBytes(fileRef, pdfBlob, { contentType: 'application/pdf' });
    return getDownloadURL(fileRef);
  }

  /** Server-side Chromium PDF (Cloud Function). */
  async generatePdfCloud(
    lookbookId: string,
    opts: { title: string; html: string },
  ): Promise<LookbookCloudPdfResult> {
    await this.auth.whenReady();
    if (!this.auth.userId) {
      throw new Error('Not authenticated');
    }
    const callable = httpsCallable(getFirebaseFunctions(), 'generateLookbookPdf', {
      timeout: 180000,
    });
    const result = await callable({
      lookbookId,
      title: opts.title,
      html: opts.html,
    });
    const data = result.data as LookbookCloudPdfResult;
    if (!data?.pdfUrl || !Array.isArray(data.pages)) {
      throw new Error('Invalid PDF response');
    }
    return data;
  }

  async downloadPdfBlob(pdfUrl: string): Promise<Blob> {
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.get({
        url: pdfUrl,
        responseType: 'blob',
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`PDF download failed (${response.status})`);
      }
      return this.httpDataToBlob(response.data, response.headers || {});
    }
    const res = await fetch(pdfUrl);
    if (!res.ok) {
      throw new Error(`PDF download failed (${res.status})`);
    }
    return res.blob();
  }

  async sharePdfBlob(pdfBlob: Blob, title: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'lookbook'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const uri = await this.writePdfTempFile(pdfBlob, title);
    // Use `files` (EXTRA_STREAM), not `url` — otherwise Telegram/etc. may open
    // the link inside the Capacitor WebView instead of as a native app.
    await Share.share({
      title: title || 'Lookbook',
      text: title || 'Lookbook PDF',
      files: [uri],
      dialogTitle: title || 'Lookbook PDF',
    });
  }

  /** Save PDF into device storage (Downloads when possible, else Documents). */
  async savePdfToDevice(pdfBlob: Blob, title: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      await this.sharePdfBlob(pdfBlob, title);
      return `${title || 'lookbook'}.pdf`;
    }

    const fileName = this.pdfFileName(title);
    const base64 = await this.blobToBase64(pdfBlob);

    try {
      await Filesystem.mkdir({
        path: 'Download',
        directory: Directory.ExternalStorage,
        recursive: true,
      }).catch(() => undefined);
      await Filesystem.writeFile({
        path: `Download/${fileName}`,
        data: base64,
        directory: Directory.ExternalStorage,
      });
      return `Download/${fileName}`;
    } catch {
      await Filesystem.mkdir({
        path: 'RainbowManager',
        directory: Directory.Documents,
        recursive: true,
      }).catch(() => undefined);
      await Filesystem.writeFile({
        path: `RainbowManager/${fileName}`,
        data: base64,
        directory: Directory.Documents,
      });
      return `RainbowManager/${fileName}`;
    }
  }

  private async writePdfTempFile(pdfBlob: Blob, title: string): Promise<string> {
    const base64 = await this.blobToBase64(pdfBlob);
    await Filesystem.mkdir({
      path: 'rainbow-lookbook',
      directory: Directory.Cache,
      recursive: true,
    }).catch(() => undefined);

    const fileName = this.pdfFileName(title);
    const written = await Filesystem.writeFile({
      path: `rainbow-lookbook/${fileName}`,
      data: base64,
      directory: Directory.Cache,
    });
    if (written.uri) {
      return written.uri;
    }
    const { uri } = await Filesystem.getUri({
      path: `rainbow-lookbook/${fileName}`,
      directory: Directory.Cache,
    });
    return uri;
  }

  private pdfFileName(title: string): string {
    const safe = (title || 'lookbook').replace(/[^\w\-]+/g, '_').slice(0, 40);
    return `${safe}-${Date.now()}.pdf`;
  }

  private mapDoc(id: string, data: Record<string, unknown>): LookbookDoc {
    return {
      id,
      userId: String(data['userId'] ?? ''),
      title: String(data['title'] ?? ''),
      folderId: data['folderId'] ? String(data['folderId']) : null,
      contentHtml: data['contentHtml'] ? String(data['contentHtml']) : '<p></p>',
      contentJson: (data['contentJson'] as LookbookDocument) || null,
      pdfUrl: data['pdfUrl'] ? String(data['pdfUrl']) : undefined,
      updatedAt: data['updatedAt'],
      createdAt: data['createdAt'],
    };
  }

  private timeValue(value: unknown): number {
    if (
      value &&
      typeof value === 'object' &&
      'toMillis' in value &&
      typeof (value as { toMillis: () => number }).toMillis === 'function'
    ) {
      return (value as { toMillis: () => number }).toMillis();
    }
    return 0;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1]! : result);
      };
      reader.onerror = () => reject(new Error('Failed to read PDF'));
      reader.readAsDataURL(blob);
    });
  }

  private httpDataToBlob(data: unknown, headers: Record<string, string>): Blob {
    const contentType =
      headers['Content-Type'] || headers['content-type'] || 'application/pdf';
    if (data instanceof Blob) {
      return data;
    }
    if (typeof data === 'string') {
      const base64 = data.includes(',') ? data.split(',')[1]! : data;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: contentType });
    }
    if (data instanceof ArrayBuffer) {
      return new Blob([data], { type: contentType });
    }
    throw new Error('Unsupported PDF response');
  }
}
