import { randomUUID } from 'crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import puppeteer, { Browser, Page } from 'puppeteer';
import { jpegPagesToPdf } from './jpeg-pages-to-pdf';
import { paginateLookbookTemplatesInBrowser } from './paginate-lookbook';
import { buildPrintDocument } from './print-template';

const LOOKBOOK_ROOT = 'lookbooks';
const LOOKBOOK_ITEMS = 'RmLookbookItems01';

if (!getApps().length) {
  initializeApp();
}

export interface GenerateLookbookPdfRequest {
  lookbookId: string;
  title?: string;
  html?: string;
}

export interface GenerateLookbookPdfResponse {
  pdfUrl: string;
  pages: string[];
  pageCount: number;
}

export const generateLookbookPdf = onCall(
  {
    region: 'us-central1',
    memory: '2GiB',
    timeoutSeconds: 180,
    cpu: 1,
    cors: true,
  },
  async (request): Promise<GenerateLookbookPdfResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in required');
    }
    const uid = request.auth.uid;
    const data = (request.data || {}) as GenerateLookbookPdfRequest;
    const lookbookId = String(data.lookbookId || '').trim();
    if (!lookbookId) {
      throw new HttpsError('invalid-argument', 'lookbookId is required');
    }

    const db = getFirestore();
    const docRef = db
      .collection(LOOKBOOK_ROOT)
      .doc(LOOKBOOK_ITEMS)
      .collection('items')
      .doc(lookbookId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Lookbook not found');
    }
    const doc = snap.data() || {};
    if (String(doc['userId'] || '') !== uid) {
      throw new HttpsError('permission-denied', 'Not your lookbook');
    }

    const title = String(data.title || doc['title'] || 'Lookbook').trim() || 'Lookbook';
    const html = String(data.html || doc['contentHtml'] || '<p></p>');

    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();
      const pageWidth = 794;
      const pageHeight = 1123;
      const pagePadTop = 68;
      const pagePadBottom = 76;
      // deviceScaleFactor 1 → JPEG pixels == A4 bands (editor page marks / preview).
      await page.setViewport({ width: pageWidth, height: pageHeight, deviceScaleFactor: 1 });

      const documentHtml = buildPrintDocument({ title, bodyHtml: html });
      await page.setContent(documentHtml, {
        waitUntil: 'load',
        timeout: 120000,
      });

      // Mirror old rich-editor getHtml cleanup inside the print DOM.
      await page.evaluate(() => {
        const body = document.querySelector('.doc-body');
        if (!body) return;
        const q = (sel: string) => Array.from(body.querySelectorAll(sel));
        q(
          '.lb-img-handle, .lb-img-rotate, .lb-img-delete, .lb-img-move, .lb-img-placeholder, .lb-tpl-delete, .lb-tpl-height, .lb-tpl-ring, .lb-tpl-slot-handle, .lb-tpl-slot-resize, .lb-tpl-slot-actions'
        ).forEach((el) => el.remove());
        q('.lb-tpl-host').forEach((host) => {
          const tpl = host.querySelector(':scope > .lb-tpl');
          if (tpl) host.replaceWith(tpl);
          else {
            const parent = host.parentNode;
            if (!parent) {
              host.remove();
              return;
            }
            while (host.firstChild) parent.insertBefore(host.firstChild, host);
            host.remove();
          }
        });
        q('.lb-img-wrap, .lb-tpl-slot-wrap').forEach((wrapEl) => {
          const wrap = wrapEl as HTMLElement;
          const img = wrap.querySelector('img, .lb-tpl__ph') as HTMLElement | null;
          if (!img) {
            wrap.remove();
            return;
          }
          const inTpl = !!wrap.closest('.lb-tpl');
          if (inTpl) {
            img.style.float = 'none';
            img.style.display = 'block';
            img.style.width = img.style.width || '100%';
            img.style.maxWidth = '100%';
            img.style.margin = '0';
            img.style.height = 'auto';
            img.removeAttribute('width');
          }
          wrap.replaceWith(img);
        });
        q('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
        q('.is-selected').forEach((el) => el.classList.remove('is-selected'));
        // Kill leftover selection/chrome fills that look pink in export.
        q('.lb-tpl, .lb-tpl-host, [style*="background"]').forEach((el) => {
          const h = el as HTMLElement;
          const bg = (h.style.background || h.style.backgroundColor || '').toLowerCase();
          if (bg.includes('138') || bg.includes('8a4fa0') || bg.includes('rgba(138')) {
            h.style.setProperty('background', 'transparent', 'important');
            h.style.setProperty('background-color', 'transparent', 'important');
          }
        });
      });

      // Wait for Outfit/Syne so PDF metrics match the editor sheet.
      await page.evaluate(async () => {
        const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
        if (fonts?.ready) {
          await fonts.ready;
        }
      });
      await new Promise((r) => setTimeout(r, 250));
      await waitForImages(page);

      // Keep templates whole across A4 bands (same as mobile measure/live).
      await page.evaluate(
        paginateLookbookTemplatesInBrowser,
        pageHeight,
        pagePadTop,
        pagePadBottom
      );

      // Same A4 JPEG clips as in-app preview — PDF is stitched from those frames
      // so Chromium print fragmentation cannot diverge from editor page bands.
      const previewPages = await capturePreviewPages(page, pageWidth, pageHeight);
      const pdfBuffer = jpegPagesToPdf(previewPages, pageWidth, pageHeight);
      await browser.close();
      browser = null;

      const bucket = getStorage().bucket('rainbow-manager-2c361.firebasestorage.app');
      const stamp = Date.now();
      const pdfPath = `lookbooks/${uid}/${lookbookId}/lookbook.pdf`;
      const pdfUrl = await saveWithDownloadToken(bucket, pdfPath, pdfBuffer, 'application/pdf');

      const pages: string[] = [];
      for (let i = 0; i < previewPages.length; i++) {
        const previewPath = `lookbooks/${uid}/${lookbookId}/preview-${stamp}-${i + 1}.jpg`;
        const url = await saveWithDownloadToken(
          bucket,
          previewPath,
          previewPages[i]!,
          'image/jpeg'
        );
        pages.push(url);
      }

      await docRef.update({
        pdfUrl,
        updatedAt: new Date(),
      });

      logger.info('lookbook pdf ready', { lookbookId, uid, pages: pages.length });
      return { pdfUrl, pages, pageCount: pages.length };
    } catch (err) {
      logger.error('lookbook pdf failed', err);
      if (err instanceof HttpsError) {
        throw err;
      }
      throw new HttpsError(
        'internal',
        err instanceof Error ? err.message : 'PDF generation failed'
      );
    } finally {
      if (browser) {
        await browser.close().catch(() => undefined);
      }
    }
  }
);

async function saveWithDownloadToken(
  bucket: ReturnType<ReturnType<typeof getStorage>['bucket']>,
  path: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const token = randomUUID();
  const file = bucket.file(path);
  await file.save(data, {
    contentType,
    metadata: {
      cacheControl:
        contentType === 'application/pdf' ? 'private, max-age=0' : 'private, max-age=3600',
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });
  const encoded = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
}

async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );
  });
  await new Promise((r) => setTimeout(r, 400));
}

async function capturePreviewPages(
  page: Page,
  pageWidth: number,
  pageHeight: number
): Promise<Buffer[]> {
  const contentBottom = await page.evaluate((fallbackHeight: number) => {
    const scrollY =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const elements = [
      document.querySelector('.doc-header'),
      ...Array.from(document.querySelectorAll('.doc-body > *')),
    ].filter((el): el is Element => !!el);
    if (!elements.length) {
      return fallbackHeight;
    }
    return Math.max(
      ...elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 ? rect.bottom + scrollY : 0;
      })
    );
  }, pageHeight);

  // Do not use document.scrollHeight here: .sheet has bottom padding and a
  // minimum A4 height, which can spill by a few pixels and create a blank
  // trailing page. Count only bands containing painted content.
  const count = Math.max(1, Math.ceil((contentBottom + 1) / pageHeight));
  // Full demo contains every template plus the editor showcase.
  const maxPages = Math.min(count, 30);
  const pages: Buffer[] = [];

  // Full A4 bands (always pageHeight) so JPEG dims match PDF MediaBox.
  // clip is relative to the document origin (not the scrolled viewport).
  for (let i = 0; i < maxPages; i++) {
    const y = i * pageHeight;
    const shot = await page.screenshot({
      type: 'jpeg',
      quality: 82,
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y,
        width: pageWidth,
        height: pageHeight,
      },
    });
    pages.push(Buffer.from(shot));
  }
  return pages;
}
