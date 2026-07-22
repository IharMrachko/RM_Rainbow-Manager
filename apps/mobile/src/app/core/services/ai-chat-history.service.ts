import { Injectable } from '@angular/core';
import { FIREBASE_PATHS } from '@rainbow/shared';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { getFirebaseDb, getFirebaseStorage } from '../firebase';
import { AuthService } from './auth.service';

export type AiMessageState = 'loading' | 'ready' | 'error';

export interface AiChatExchange {
  id: number;
  ask: string;
  answerMarkdown: string | null;
  answerHtml?: string | null;
  state: AiMessageState;
  createdAt: number;
  imageAttached?: boolean;
  /** Runtime preview for the first attached ask photo (legacy / convenience). */
  imagePreview?: string;
  /** Runtime previews for all attached ask photos. */
  imagePreviews?: string[];
  /** Persisted remote URL for the first attached ask photo (legacy). */
  attachedImageUrl?: string;
  /** Persisted remote URLs for all attached ask photos. */
  attachedImageUrls?: string[];
  /** In-memory / hydrated display sources (data URLs or remote URLs). */
  generatedImages?: string[];
  /** Persisted remote URLs for generated images. */
  generatedImageUrls?: string[];
  hasGeneratedImage?: boolean;
  wantsImage?: boolean;
  errorKey?: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
  exchanges: AiChatExchange[];
}

@Injectable({ providedIn: 'root' })
export class AiChatHistoryService {
  static readonly STORAGE_KEY = 'rm.ai.chatHistory.v1';
  private static readonly MAX_SESSIONS = 12;
  private static readonly MAX_EXCHANGES = 30;

  /** Deduplicate http(s) URLs; same path with different tokens counts as one image. */
  static uniqueHttpUrls(urls: string[] | undefined | null): string[] {
    if (!urls?.length) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const url of urls) {
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) continue;
      let key = url;
      try {
        const parsed = new URL(url);
        parsed.search = '';
        parsed.hash = '';
        key = parsed.toString();
      } catch {
        // Keep raw url as key.
      }
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(url);
    }
    return result;
  }

  constructor(private readonly auth: AuthService) {}

  create(title = ''): AiChatSession {
    const now = Date.now();
    return {
      id: `ai-${now}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      createdAt: now,
      updatedAt: now,
      exchanges: [],
    };
  }

  async listMine(): Promise<AiChatSession[]> {
    await this.auth.whenReady();
    const userId = this.auth.userId;
    const local = this.loadLocal(userId);

    if (!userId) {
      return local;
    }

    try {
      const q = query(this.itemsCollection(), where('userId', '==', userId));
      const snap = await getDocs(q);
      const remote = snap.docs
        .map((entry) => this.normalizeSession({ id: entry.id, ...entry.data() }))
        .filter((item): item is AiChatSession => !!item);

      const merged = this.mergeSessions(remote, local).slice(0, AiChatHistoryService.MAX_SESSIONS);
      this.writeLocal(merged, userId);
      return merged;
    } catch (err) {
      console.error('AiChatHistoryService.listMine failed', err);
      return local;
    }
  }

  async save(session: AiChatSession): Promise<AiChatSession[]> {
    await this.auth.whenReady();
    const userId = this.auth.userId || undefined;

    let withUrls = session;
    if (userId) {
      try {
        withUrls = await this.ensureImageUrls(session, userId);
      } catch (err) {
        console.error('AiChatHistoryService image upload failed', err);
      }
    }

    const clean = this.cleanSession(withUrls);
    if (userId) {
      clean.userId = userId;
    }

    // Always keep a local copy so history works even if Firestore/Storage rules block.
    const localSessions = this.saveLocal(clean, userId);

    if (!userId) {
      return localSessions;
    }

    try {
      await setDoc(this.itemRef(clean.id), this.toFirestoreDoc(clean, userId), { merge: true });
      const sessions = await this.listMine();
      const excess = sessions.slice(AiChatHistoryService.MAX_SESSIONS);
      await Promise.all(
        excess.map(async (item) => {
          try {
            await deleteDoc(this.itemRef(item.id));
          } catch (err) {
            console.error('AiChatHistoryService prune failed', err);
          }
        }),
      );
      return sessions.slice(0, AiChatHistoryService.MAX_SESSIONS);
    } catch (err) {
      console.error('AiChatHistoryService.save firestore failed', err);
      return localSessions;
    }
  }

  async remove(id: string): Promise<AiChatSession[]> {
    await this.auth.whenReady();
    const userId = this.auth.userId || undefined;
    const local = this.removeLocal(id, userId);

    if (!userId) {
      return local;
    }

    try {
      await deleteDoc(this.itemRef(id));
      return this.listMine();
    } catch (err) {
      console.error('AiChatHistoryService.remove failed', err);
      return local;
    }
  }

  /** Visible for unit tests — strips runtime-only fields before persistence. */
  cleanSession(session: AiChatSession): AiChatSession {
    const exchanges = session.exchanges
      .filter((item) => item.state !== 'loading')
      .slice(-AiChatHistoryService.MAX_EXCHANGES)
      .map((item) => {
        const urls = AiChatHistoryService.uniqueHttpUrls(item.generatedImageUrls);
        const attachedUrls = AiChatHistoryService.uniqueHttpUrls([
          ...(item.attachedImageUrls || []),
          item.attachedImageUrl || '',
          ...(item.imagePreviews || []).filter((src) => /^https?:\/\//i.test(src)),
          item.imagePreview && /^https?:\/\//i.test(item.imagePreview) ? item.imagePreview : '',
        ]);
        const cleaned: AiChatExchange = {
          id: item.id,
          ask: item.ask,
          answerMarkdown: item.answerMarkdown,
          state: item.state === 'error' ? 'error' : 'ready',
          createdAt: item.createdAt,
          imageAttached: !!(item.imageAttached || attachedUrls.length),
          hasGeneratedImage: !!(item.hasGeneratedImage || urls.length || item.generatedImages?.length),
          wantsImage: !!item.wantsImage,
        };
        if (attachedUrls.length) {
          cleaned.attachedImageUrls = attachedUrls;
          cleaned.attachedImageUrl = attachedUrls[0];
        }
        if (urls.length) {
          cleaned.generatedImageUrls = urls;
        }
        if (item.errorKey) {
          cleaned.errorKey = item.errorKey;
        }
        return cleaned;
      });
    return {
      id: session.id,
      title: session.title || exchanges[0]?.ask.slice(0, 48) || '',
      createdAt: session.createdAt,
      updatedAt: Date.now(),
      userId: session.userId,
      exchanges,
    };
  }

  private toFirestoreDoc(session: AiChatSession, userId: string): Record<string, unknown> {
    return {
      userId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      updatedAtServer: serverTimestamp(),
      exchanges: session.exchanges.map((item) => {
        const row: Record<string, unknown> = {
          id: item.id,
          ask: item.ask,
          answerMarkdown: item.answerMarkdown,
          state: item.state,
          createdAt: item.createdAt,
          imageAttached: !!item.imageAttached,
          hasGeneratedImage: !!item.hasGeneratedImage,
          wantsImage: !!item.wantsImage,
        };
        if (item.attachedImageUrl) {
          row['attachedImageUrl'] = item.attachedImageUrl;
        }
        if (item.attachedImageUrls?.length) {
          row['attachedImageUrls'] = item.attachedImageUrls;
        }
        if (item.generatedImageUrls?.length) {
          row['generatedImageUrls'] = item.generatedImageUrls;
        }
        if (item.errorKey) {
          row['errorKey'] = item.errorKey;
        }
        return row;
      }),
    };
  }

  private itemsCollection() {
    return collection(
      getFirebaseDb(),
      FIREBASE_PATHS.aiChatRoot,
      FIREBASE_PATHS.aiChatItems,
      'items',
    );
  }

  private itemRef(id: string) {
    return doc(
      getFirebaseDb(),
      FIREBASE_PATHS.aiChatRoot,
      FIREBASE_PATHS.aiChatItems,
      'items',
      id,
    );
  }

  private async ensureImageUrls(session: AiChatSession, userId: string): Promise<AiChatSession> {
    const exchanges: AiChatExchange[] = [];
    for (const exchange of session.exchanges) {
      const attachSources = [
        ...(exchange.imagePreviews || []),
        ...(exchange.attachedImageUrls || []),
        exchange.imagePreview || '',
        exchange.attachedImageUrl || '',
      ].filter(Boolean);
      const existingAttached = AiChatHistoryService.uniqueHttpUrls(
        attachSources.filter((src) => /^https?:\/\//i.test(src)),
      );
      const dataAttached = attachSources.filter((src) => src.startsWith('data:'));
      let attachedUrls = [...existingAttached];

      if (dataAttached.length && existingAttached.length >= dataAttached.length) {
        attachedUrls = existingAttached.slice(0, Math.max(dataAttached.length, 1));
      } else if (dataAttached.length) {
        for (const [index, src] of dataAttached.entries()) {
          if (existingAttached[index]) continue;
          try {
            attachedUrls.push(
              await this.uploadDataUrl(userId, session.id, exchange.id, `ask-${index}`, src),
            );
          } catch (err) {
            console.error('AiChatHistoryService attached upload failed', err);
          }
        }
        attachedUrls = AiChatHistoryService.uniqueHttpUrls(attachedUrls);
      }

      const existing = AiChatHistoryService.uniqueHttpUrls(exchange.generatedImageUrls);
      const sources = exchange.generatedImages || [];
      const dataSources = sources.filter((src) => !!src && src.startsWith('data:'));
      const httpSources = sources.filter((src) => !!src && /^https?:\/\//i.test(src));
      let uploaded: string[] = [...existing];

      // In-memory data URLs are kept after save to avoid UI flicker. They must not be
      // re-uploaded — that appended a second remote URL and duplicated photos in history.
      if (dataSources.length && existing.length) {
        uploaded = existing.slice(0, Math.max(dataSources.length, 1));
      } else {
        for (const [index, src] of sources.entries()) {
          if (!src) continue;
          if (/^https?:\/\//i.test(src)) {
            continue;
          }
          if (src.startsWith('data:')) {
            if (existing[index]) continue;
            try {
              uploaded.push(await this.uploadDataUrl(userId, session.id, exchange.id, index, src));
            } catch (err) {
              console.error('AiChatHistoryService.uploadDataUrl failed', err);
            }
          }
        }
      }

      uploaded = AiChatHistoryService.uniqueHttpUrls([...uploaded, ...httpSources]);

      exchanges.push({
        ...exchange,
        attachedImageUrls: attachedUrls.length ? attachedUrls : undefined,
        attachedImageUrl: attachedUrls[0],
        imagePreviews: attachedUrls.length
          ? attachedUrls
          : exchange.imagePreviews?.length
            ? exchange.imagePreviews
            : exchange.imagePreview
              ? [exchange.imagePreview]
              : undefined,
        imagePreview: attachedUrls[0] || exchange.imagePreview,
        imageAttached: !!(exchange.imageAttached || attachedUrls.length),
        generatedImageUrls: uploaded,
        generatedImages: uploaded.length ? uploaded : exchange.generatedImages,
        hasGeneratedImage: uploaded.length > 0 || !!exchange.hasGeneratedImage,
      });
    }
    return { ...session, exchanges };
  }

  private async uploadDataUrl(
    userId: string,
    sessionId: string,
    exchangeId: number,
    index: number | string,
    dataUrl: string,
  ): Promise<string> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    // Keep under `ai/` prefix used by gallery uploads (likely covered by Storage rules).
    const path = `ai/${userId}/chat/${sessionId}/${exchangeId}-${index}.jpg`;
    const fileRef = storageRef(getFirebaseStorage(), path);
    await uploadBytes(fileRef, blob);
    return getDownloadURL(fileRef);
  }

  private mergeSessions(primary: AiChatSession[], secondary: AiChatSession[]): AiChatSession[] {
    const map = new Map<string, AiChatSession>();
    for (const session of [...primary, ...secondary]) {
      const prev = map.get(session.id);
      if (!prev || session.updatedAt >= prev.updatedAt) {
        map.set(session.id, session);
      }
    }
    return [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  private storageKey(userId?: string | null): string {
    return userId
      ? `${AiChatHistoryService.STORAGE_KEY}.${userId}`
      : AiChatHistoryService.STORAGE_KEY;
  }

  private loadLocal(userId?: string | null): AiChatSession[] {
    try {
      const keys = [this.storageKey(userId)];
      if (userId) {
        keys.push(AiChatHistoryService.STORAGE_KEY);
      }
      const merged: AiChatSession[] = [];
      for (const key of keys) {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(parsed)) continue;
        for (const item of parsed) {
          const session = this.normalizeSession(item);
          if (session) merged.push(session);
        }
      }
      return this.mergeSessions(merged, []).slice(0, AiChatHistoryService.MAX_SESSIONS);
    } catch {
      return [];
    }
  }

  private saveLocal(session: AiChatSession, userId?: string | null): AiChatSession[] {
    const sessions = [session, ...this.loadLocal(userId).filter((item) => item.id !== session.id)].slice(
      0,
      AiChatHistoryService.MAX_SESSIONS,
    );
    this.writeLocal(sessions, userId);
    return sessions;
  }

  private removeLocal(id: string, userId?: string | null): AiChatSession[] {
    const sessions = this.loadLocal(userId).filter((item) => item.id !== id);
    this.writeLocal(sessions, userId);
    // Purge legacy + scoped keys so a merge cannot resurrect the deleted chat.
    this.purgeIdFromKey(AiChatHistoryService.STORAGE_KEY, id);
    if (userId) {
      this.purgeIdFromKey(this.storageKey(userId), id);
      this.writeLocal(sessions, userId);
    }
    return sessions;
  }

  private purgeIdFromKey(key: string, id: string): void {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(parsed)) return;
      localStorage.setItem(
        key,
        JSON.stringify(parsed.filter((item) => item && (item as { id?: string }).id !== id)),
      );
    } catch {
      // ignore
    }
  }

  private writeLocal(sessions: AiChatSession[], userId?: string | null): void {
    try {
      localStorage.setItem(this.storageKey(userId), JSON.stringify(sessions));
    } catch {
      // History is a convenience. The active chat must keep working if storage is full.
    }
  }

  private normalizeSession(value: unknown): AiChatSession | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const item = value as Partial<AiChatSession> & { id?: string };
    if (!item.id || !Array.isArray(item.exchanges)) {
      return null;
    }
    const createdAt = typeof item.createdAt === 'number' ? item.createdAt : Date.now();
    const updatedAt = typeof item.updatedAt === 'number' ? item.updatedAt : createdAt;
    return {
      id: String(item.id),
      title: String(item.title || ''),
      createdAt,
      updatedAt,
      userId: item.userId ? String(item.userId) : undefined,
      exchanges: item.exchanges
        .map((exchange) => this.normalizeExchange(exchange))
        .filter((exchange): exchange is AiChatExchange => !!exchange),
    };
  }

  private normalizeExchange(value: unknown): AiChatExchange | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const item = value as Partial<AiChatExchange>;
    if (typeof item.id !== 'number' || typeof item.ask !== 'string') {
      return null;
    }
    const urls = Array.isArray(item.generatedImageUrls)
      ? AiChatHistoryService.uniqueHttpUrls(
          item.generatedImageUrls.filter((url): url is string => typeof url === 'string'),
        )
      : undefined;
    const attachedImageUrls = Array.isArray(item.attachedImageUrls)
      ? AiChatHistoryService.uniqueHttpUrls(
          item.attachedImageUrls.filter((url): url is string => typeof url === 'string'),
        )
      : undefined;
    const attachedImageUrl =
      (typeof item.attachedImageUrl === 'string' && /^https?:\/\//i.test(item.attachedImageUrl)
        ? item.attachedImageUrl
        : undefined) || attachedImageUrls?.[0];
    const attachedList =
      attachedImageUrls?.length
        ? attachedImageUrls
        : attachedImageUrl
          ? [attachedImageUrl]
          : undefined;
    return {
      id: item.id,
      ask: item.ask,
      answerMarkdown: typeof item.answerMarkdown === 'string' ? item.answerMarkdown : null,
      state: item.state === 'error' ? 'error' : 'ready',
      createdAt: typeof item.createdAt === 'number' ? item.createdAt : item.id,
      imageAttached: !!(item.imageAttached || attachedList?.length),
      attachedImageUrl,
      attachedImageUrls: attachedList,
      imagePreview: attachedImageUrl,
      imagePreviews: attachedList,
      hasGeneratedImage: !!(item.hasGeneratedImage || urls?.length),
      generatedImageUrls: urls?.length ? urls : undefined,
      wantsImage: !!item.wantsImage,
      errorKey: typeof item.errorKey === 'string' ? item.errorKey : undefined,
    };
  }
}
