import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { resolveLookbookHtml } from '../../core/models/lookbook-document';
import { AppMenuService } from '../../core/services/app-menu.service';
import { LookbookService } from '../../core/services/lookbook.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import {
  LookbookGalleryPickerData,
  LookbookGalleryPickerResult,
  LookbookGalleryPickerSheetComponent,
} from '../../shared/components/lookbook-gallery-picker-sheet.component';
import {
  LookbookTemplatePickerData,
  LookbookTemplatePickerResult,
  LookbookTemplatePickerSheetComponent,
} from '../../shared/components/lookbook-template-picker-sheet.component';
import {
  LookbookPdfPreviewData,
  LookbookPdfPreviewResult,
  LookbookPdfPreviewSheetComponent,
} from '../../shared/components/lookbook-pdf-preview-sheet.component';
import { LookbookPmEditorComponent } from '../../shared/components/lookbook-pm-editor.component';
import { findLookbookTemplate, LookbookTemplateId } from '../../core/utils/lookbook-page-templates';

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule, FormsModule, LookbookPmEditorComponent],
  selector: 'app-lookbook-editor',
  templateUrl: './lookbook-editor.page.html',
  styleUrls: ['./lookbook-editor.page.scss'],
})
export class LookbookEditorPage implements OnInit {
  @ViewChild('editor') private editor?: LookbookPmEditorComponent;

  lookbookId = '';
  title = '';
  contentHtml = '<p><br></p>';
  loading = true;
  saving = false;
  exporting = false;
  private isNewDocument = false;
  /** True while picking/uploading a device photo (not PDF export). */
  uploading = false;
  /** Swallow Android phantom clicks after the native photo picker closes. */
  private uiBlockedUntil = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly lookbooks: LookbookService,
    private readonly sheets: OverlaySheetService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get busy(): boolean {
    return this.loading || this.saving || this.exporting || this.uploading || this.isUiBlocked();
  }

  private isUiBlocked(): boolean {
    return Date.now() < this.uiBlockedUntil;
  }

  private blockUi(ms: number): void {
    this.uiBlockedUntil = Math.max(this.uiBlockedUntil, Date.now() + ms);
  }

  openAppMenu(): void {
    this.appMenu.open();
  }

  async ngOnInit(): Promise<void> {
    this.lookbookId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.lookbookId) {
      await this.router.navigateByUrl('/tabs/lookbook');
      return;
    }
    this.isNewDocument = this.route.snapshot.queryParamMap.get('new') === '1';
    if (this.isNewDocument) {
      this.title = this.translate.instant('lookbook');
      this.contentHtml = '<p><br></p>';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    try {
      const doc = await this.lookbooks.getById(this.lookbookId);
      if (!doc) {
        await this.toasts.show(this.translate.instant('lookbookLoadError'), 'danger');
        await this.router.navigateByUrl('/tabs/lookbook');
        return;
      }
      this.title = doc.title || '';
      this.contentHtml = resolveLookbookHtml(doc.contentJson, doc.contentHtml);
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('lookbookLoadError'), 'danger');
      await this.router.navigateByUrl('/tabs/lookbook');
      return;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onHtmlChange(html: string): void {
    this.contentHtml = html;
  }

  async openInsertMenu(): Promise<void> {
    // Toolbar already force-booked; only book if missing (e.g. future callers).
    this.editor?.captureInsertPoint(false);
    type Action = 'gallery' | 'device';
    const action = await this.sheets.open<
      ChoiceSheetComponent<Action>,
      ChoiceSheetData<Action>,
      Action
    >(
      ChoiceSheetComponent,
      {
        titleKey: 'lookbookInsertPhoto',
        options: [
          { value: 'gallery', labelKey: 'lookbookAddFromGallery', ionIcon: 'images-outline' },
          { value: 'device', labelKey: 'lookbookAddFromDevice', ionIcon: 'camera-outline' },
        ],
      },
      { stack: true }
    );
    if (action === 'gallery') {
      await this.insertFromGallery();
    } else if (action === 'device') {
      await this.insertFromDevice();
    } else {
      this.editor?.clearInsertPoint();
    }
  }

  async openTemplateMenu(): Promise<void> {
    // Keep caret booked by toolbar click; don't overwrite after focus loss.
    this.editor?.captureInsertPoint(false);

    const kind = await this.sheets.open<
      LookbookTemplatePickerSheetComponent,
      LookbookTemplatePickerData,
      LookbookTemplatePickerResult
    >(LookbookTemplatePickerSheetComponent, {}, { fullscreen: true });
    if (!kind) {
      this.editor?.clearInsertPoint();
      return;
    }

    const def = findLookbookTemplate(kind);
    if (!def) {
      this.editor?.clearInsertPoint();
      return;
    }

    if (def.photoCount <= 0) {
      this.applyTemplate(kind, []);
      return;
    }

    type Source = 'gallery' | 'device';
    const source = await this.sheets.open<
      ChoiceSheetComponent<Source>,
      ChoiceSheetData<Source>,
      Source
    >(ChoiceSheetComponent, {
      titleKey: 'lookbookInsertPhoto',
      options: [
        { value: 'gallery', labelKey: 'lookbookAddFromGallery', ionIcon: 'images-outline' },
        { value: 'device', labelKey: 'lookbookAddFromDevice', ionIcon: 'camera-outline' },
      ],
    });
    if (!source) {
      this.editor?.clearInsertPoint();
      return;
    }

    if (source === 'gallery') {
      await this.insertTemplateFromGallery(kind, def.photoCount);
    } else {
      await this.insertTemplateFromDevice(kind, def.photoCount);
    }
  }

  private applyTemplate(
    kind: LookbookTemplateId,
    photos: Array<{ src: string; alt?: string }>
  ): void {
    const editor = this.editor;
    if (!editor) {
      void this.toasts.show(this.translate.instant('lookbookSaveError'), 'danger');
      return;
    }
    // Keep caret saved before overlays (do not re-capture here — focus is gone).
    editor.insertPageTemplate(kind, photos, {
      eyebrow: this.translate.instant('lookbookTemplateEyebrow'),
      heading: this.translate.instant('lookbookTemplateHeading'),
      subheading: this.translate.instant('lookbookTemplateSubheading'),
      body: this.translate.instant('lookbookTemplateBody'),
      body2: this.translate.instant('lookbookTemplateBody2'),
      bullet: this.translate.instant('lookbookTemplateBullet'),
    });
    this.contentHtml = this.snapshotHtml();
    this.cdr.markForCheck();
  }

  private async insertTemplateFromGallery(
    kind: LookbookTemplateId,
    photoCount: number
  ): Promise<void> {
    const result = await this.sheets.open<
      LookbookGalleryPickerSheetComponent,
      LookbookGalleryPickerData,
      LookbookGalleryPickerResult | null
    >(
      LookbookGalleryPickerSheetComponent,
      { folderId: null, maxCount: photoCount },
      { fullscreen: true }
    );
    if (!result?.items?.length) {
      this.editor?.clearInsertPoint();
      return;
    }
    this.cdr.detectChanges();
    const photos = result.items
      .filter((it) => !!it.src)
      .slice(0, photoCount)
      .map((it) => ({ src: it.src, alt: it.title || '' }));
    this.applyTemplate(kind, photos);
  }

  private async insertTemplateFromDevice(
    kind: LookbookTemplateId,
    photoCount: number
  ): Promise<void> {
    this.blockUi(1200);
    this.cdr.detectChanges();
    try {
      if (Capacitor.isNativePlatform()) {
        await Camera.requestPermissions({ permissions: ['camera', 'photos'] }).catch(
          () => undefined
        );
      }
      if (photoCount > 1) {
        const picked = await Camera.pickImages({
          quality: 90,
          limit: photoCount,
        });
        const selected = (picked.photos || []).slice(0, photoCount);
        if (!selected.length) {
          this.editor?.clearInsertPoint();
          return;
        }

        this.uploading = true;
        this.cdr.detectChanges();
        const photos: Array<{ src: string }> = [];
        for (const item of selected) {
          const blob = await (await fetch(item.webPath)).blob();
          photos.push({ src: await this.lookbooks.uploadAsset(this.lookbookId, blob) });
        }
        this.uploading = false;
        this.cdr.detectChanges();
        this.applyTemplate(kind, photos);
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1600,
      });

      this.blockUi(800);
      await new Promise<void>((resolve) => setTimeout(resolve, 400));

      const dataUrl = photo.dataUrl || null;
      const webPath = photo.webPath || null;
      if (!dataUrl && !webPath) {
        this.editor?.clearInsertPoint();
        return;
      }

      this.uploading = true;
      this.cdr.detectChanges();

      const blob = await (await fetch(dataUrl || webPath!)).blob();
      const src = await this.lookbooks.uploadAsset(this.lookbookId, blob);

      this.uploading = false;
      this.cdr.detectChanges();
      this.applyTemplate(kind, [{ src }]);
    } catch (err) {
      this.editor?.clearInsertPoint();
      const msg = String((err as { message?: string })?.message || err || '').toLowerCase();
      if (!msg.includes('cancel') && !msg.includes('dismiss') && !msg.includes('user denied')) {
        console.error(err);
        await this.toasts.show(this.translate.instant('cameraError'), 'danger');
      }
    } finally {
      this.uploading = false;
      this.blockUi(500);
      this.cdr.markForCheck();
    }
  }

  async insertFromGallery(): Promise<void> {
    const result = await this.sheets.open<
      LookbookGalleryPickerSheetComponent,
      LookbookGalleryPickerData,
      LookbookGalleryPickerResult | null
    >(
      LookbookGalleryPickerSheetComponent,
      // Don't filter by lookbook folder — user expects all gallery photos.
      { folderId: null },
      { fullscreen: true }
    );
    if (!result?.items?.length) {
      this.editor?.clearInsertPoint();
      return;
    }
    this.cdr.detectChanges();
    const editor = this.editor;
    if (!editor) {
      console.error('Lookbook editor is not ready');
      await this.toasts.show(this.translate.instant('lookbookSaveError'), 'danger');
      return;
    }
    for (const item of result.items) {
      if (item.src) {
        editor.insertImage(item.src, item.title || '');
      }
    }
    this.contentHtml = this.snapshotHtml();
    this.cdr.markForCheck();
  }

  async insertFromDevice(): Promise<void> {
    // Swallow Android phantom clicks on "Generate PDF" when the picker closes.
    this.blockUi(1200);
    this.cdr.detectChanges();
    try {
      if (Capacitor.isNativePlatform()) {
        await Camera.requestPermissions({ permissions: ['camera', 'photos'] }).catch(
          () => undefined
        );
      }
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1600,
      });

      this.blockUi(800);
      await new Promise<void>((resolve) => setTimeout(resolve, 400));

      const dataUrl = photo.dataUrl || null;
      const webPath = photo.webPath || null;
      if (!dataUrl && !webPath) {
        this.editor?.clearInsertPoint();
        return;
      }

      // Show overlay while compressing/uploading (this is the slow part).
      this.uploading = true;
      this.cdr.detectChanges();

      const blob = await (await fetch(dataUrl || webPath!)).blob();
      const src = await this.lookbooks.uploadAsset(this.lookbookId, blob);

      this.uploading = false;
      this.cdr.detectChanges();

      const editor = this.editor;
      if (!editor) {
        console.error('Lookbook editor is not ready');
        this.editor?.clearInsertPoint();
        await this.toasts.show(this.translate.instant('lookbookSaveError'), 'danger');
        return;
      }
      editor.insertImage(src);
      this.contentHtml = this.snapshotHtml();
    } catch (err) {
      this.editor?.clearInsertPoint();
      const msg = String((err as { message?: string })?.message || err || '').toLowerCase();
      if (!msg.includes('cancel') && !msg.includes('dismiss') && !msg.includes('user denied')) {
        console.error(err);
        await this.toasts.show(this.translate.instant('cameraError'), 'danger');
      }
    } finally {
      this.uploading = false;
      this.blockUi(500);
      this.cdr.markForCheck();
    }
  }

  private snapshotHtml(): string {
    return this.editor?.getHtml() || this.contentHtml || '<p><br></p>';
  }

  private async persistDocument(html: string): Promise<void> {
    const payload = {
      title: this.title,
      folderId: null,
      contentHtml: html,
      contentJson: { version: 2, format: 'html' },
    };
    if (this.isNewDocument) {
      await this.lookbooks.createWithId(this.lookbookId, payload);
      this.isNewDocument = false;
      await this.router.navigateByUrl(`/tabs/lookbook/${this.lookbookId}`, { replaceUrl: true });
      return;
    }
    await this.lookbooks.save(this.lookbookId, payload);
  }

  async openSaveMenu(): Promise<void> {
    if (this.busy || this.isUiBlocked()) {
      return;
    }
    type Action = 'device' | 'preview' | 'draft';
    const action = await this.sheets.open<
      ChoiceSheetComponent<Action>,
      ChoiceSheetData<Action>,
      Action
    >(ChoiceSheetComponent, {
      titleKey: 'lookbookSaveMenu',
      options: [
        { value: 'device', labelKey: 'lookbookDownloadPdf', ionIcon: 'download-outline' },
        { value: 'preview', labelKey: 'lookbookViewPdf', ionIcon: 'eye-outline' },
        { value: 'draft', labelKey: 'lookbookSaveDraft', ionIcon: 'save-outline' },
      ],
    });
    if (action === 'draft') {
      await this.saveDraft();
    } else if (action === 'preview') {
      await this.generatePdf('preview');
    } else if (action === 'device') {
      await this.generatePdf('device');
    }
  }

  async saveDraft(): Promise<void> {
    if (this.busy || this.isUiBlocked()) {
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const html = this.snapshotHtml();
      this.contentHtml = html;
      await this.persistDocument(html);
      await this.toasts.show(this.translate.instant('lookbookSaved'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('lookbookSaveError'), 'danger');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async generatePdf(mode: 'preview' | 'device' = 'preview'): Promise<void> {
    if (this.busy || this.isUiBlocked()) {
      return;
    }
    this.exporting = true;
    this.cdr.markForCheck();
    try {
      const html = this.snapshotHtml();
      this.contentHtml = html;
      await this.persistDocument(html);

      const { pdfUrl, pages } = await this.lookbooks.generatePdfCloud(this.lookbookId, {
        title: this.title?.trim() || 'Lookbook',
        html,
      });

      if (mode === 'device') {
        const blob = await this.lookbooks.downloadPdfBlob(pdfUrl);
        await this.lookbooks.savePdfToDevice(blob, this.title || 'lookbook');
        await this.toasts.show(this.translate.instant('lookbookPdfSaved'), 'success');
        return;
      }

      this.exporting = false;
      this.cdr.markForCheck();

      const action = await this.sheets.open<
        LookbookPdfPreviewSheetComponent,
        LookbookPdfPreviewData,
        LookbookPdfPreviewResult
      >(
        LookbookPdfPreviewSheetComponent,
        { title: this.title?.trim() || 'Lookbook', pages },
        { fullscreen: true, closeOnBackdrop: false }
      );
      if (action !== 'share' && action !== 'save') {
        return;
      }

      this.exporting = true;
      this.cdr.markForCheck();
      const blob = await this.lookbooks.downloadPdfBlob(pdfUrl);
      if (action === 'share') {
        await this.lookbooks.sharePdfBlob(blob, this.title || 'lookbook');
        await this.toasts.show(this.translate.instant('lookbookPdfReady'), 'success');
      } else {
        await this.lookbooks.savePdfToDevice(blob, this.title || 'lookbook');
        await this.toasts.show(this.translate.instant('lookbookPdfSaved'), 'success');
      }
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('lookbookPdfError'), 'danger');
    } finally {
      this.exporting = false;
      this.cdr.markForCheck();
    }
  }

  goBack(): void {
    void this.router.navigateByUrl('/tabs/lookbook');
  }
}
