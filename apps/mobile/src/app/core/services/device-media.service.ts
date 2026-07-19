import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Share } from '@capacitor/share';

const ALBUM_NAME = 'Rainbow Manager';

/**
 * Reliable save-to-device for Android/iOS.
 * Avoids getAlbums() (can hang/NPE on some OEMs) and huge Filesystem bridge writes.
 */
@Injectable({ providedIn: 'root' })
export class DeviceMediaService {
  private albumIdCache: string | null = null;

  async saveCanvas(canvas: HTMLCanvasElement, fileBase: string): Promise<void> {
    // JPEG has no alpha — transparent pixels become black. Flatten onto white first.
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.9);
    await this.saveDataUrl(dataUrl, fileBase);
  }

  async saveDataUrl(dataUrl: string, fileBase: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${fileBase}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    if (!base64) {
      throw new Error('Empty image data');
    }

    let lastError: unknown;

    // Primary: Media.savePhoto with data URL + resolved album path (no getAlbums).
    try {
      const albumIdentifier = await withTimeout(this.resolveAlbumId(), 8000, 'resolveAlbum');
      await withTimeout(
        Media.savePhoto({
          path: dataUrl,
          albumIdentifier,
          fileName: `${fileBase}-${Date.now()}`,
        }),
        15000,
        'savePhoto',
      );
      return;
    } catch (err) {
      lastError = err;
      this.albumIdCache = null;
      console.warn('[DeviceMedia] Media.savePhoto failed, trying Share fallback', err);
    }

    // Fallback: write cache file + system share sheet (user can Save to gallery).
    try {
      await withTimeout(this.shareViaSheet(base64, fileBase), 20000, 'share');
      return;
    } catch (err) {
      lastError = err;
    }

    throw lastError instanceof Error ? lastError : new Error('savePhoto failed');
  }

  /**
   * Build album identifier without Media.getAlbums() which can hang on Xiaomi/MIUI
   * when listFiles() returns null or MediaStore cursors stall.
   */
  private async resolveAlbumId(): Promise<string> {
    if (this.albumIdCache) {
      return this.albumIdCache;
    }

    if (Capacitor.getPlatform() === 'android') {
      const { path } = await Media.getAlbumsPath();
      const albumIdentifier = `${path.replace(/\/$/, '')}/${ALBUM_NAME}`;
      try {
        await withTimeout(Media.createAlbum({ name: ALBUM_NAME }), 5000, 'createAlbum');
      } catch {
        // Album already exists — fine, folder should still be there.
      }
      this.albumIdCache = albumIdentifier;
      return albumIdentifier;
    }

    // iOS: identifier comes from getAlbums (required for named album).
    try {
      await withTimeout(Media.createAlbum({ name: ALBUM_NAME }), 5000, 'createAlbum');
    } catch {
      // exists
    }
    const { albums } = await withTimeout(Media.getAlbums(), 8000, 'getAlbums');
    const album = albums.find((a) => a.name === ALBUM_NAME && a.identifier);
    if (!album?.identifier) {
      throw new Error('Album not found');
    }
    this.albumIdCache = album.identifier;
    return album.identifier;
  }

  private async shareViaSheet(base64: string, fileBase: string): Promise<void> {
    await Filesystem.mkdir({
      path: 'rainbow-save',
      directory: Directory.Cache,
      recursive: true,
    }).catch(() => undefined);

    const fileName = `${fileBase}-${Date.now()}.jpg`;
    const written = await Filesystem.writeFile({
      path: `rainbow-save/${fileName}`,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({
      title: fileBase,
      url: written.uri,
      dialogTitle: 'Save image',
    });
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }) as Promise<T>;
}
