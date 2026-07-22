import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getGenerativeModel, ResponseModality } from 'firebase/ai';
import { addIcons } from 'ionicons';
import {
  bookmarkOutline,
  cameraOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  close,
  closeOutline,
  colorPaletteOutline,
  copyOutline,
  downloadOutline,
  imageOutline,
  imagesOutline,
  menuOutline,
  refreshOutline,
  send,
  sparklesOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { getFirebaseAi } from '../../core/firebase';
import { resolveLookbookHtml } from '../../core/models/lookbook-document';
import {
  AiChatExchange,
  AiChatHistoryService,
  AiChatSession,
} from '../../core/services/ai-chat-history.service';
import { AppMenuService } from '../../core/services/app-menu.service';
import { GalleryService } from '../../core/services/gallery.service';
import { LanguageService } from '../../core/services/language.service';
import { LookbookService } from '../../core/services/lookbook.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import { ToastService } from '../../core/services/toast.service';
import {
  AiColoristScenario,
  appendAiRecommendationHtml,
  buildAiColoristRequest,
  buildAiImageRequest,
  detectsImageIntent,
  safeAiMarkdownHtml,
  scenarioPrompt,
} from '../../core/utils/ai-colorist';
import {
  AiChatHistorySheetComponent,
  AiChatHistorySheetData,
} from '../../shared/components/ai-chat-history-sheet.component';
import {
  AiImagePreviewSheetComponent,
  AiImagePreviewSheetData,
} from '../../shared/components/ai-image-preview-sheet.component';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
  ChoiceSheetResult,
  isChoiceSheetFiles,
} from '../../shared/components/choice-sheet.component';
import {
  ColorPickerSheetComponent,
  ColorPickerSheetData,
  ColorPickerSheetResult,
} from '../../shared/components/color-picker-sheet.component';
import {
  LookbookGalleryPickerData,
  LookbookGalleryPickerResult,
  LookbookGalleryPickerSheetComponent,
} from '../../shared/components/lookbook-gallery-picker-sheet.component';

addIcons({
  bookmarkOutline,
  cameraOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  close,
  closeOutline,
  colorPaletteOutline,
  copyOutline,
  downloadOutline,
  imageOutline,
  imagesOutline,
  menuOutline,
  refreshOutline,
  send,
  sparklesOutline,
  timeOutline,
  trashOutline,
});

interface AiScenarioCard {
  id: AiColoristScenario;
  titleKey: string;
  hintKey: string;
  icon: string;
  kind: 'text' | 'image';
  needsPhoto?: boolean;
}

interface AiModelResult {
  markdown: string;
  images: string[];
}

type AiAttachedImage = {
  id: string;
  preview: string;
  base64: string;
  mimeType: string;
};

const AI_TEXT_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'] as const;
const AI_IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'] as const;
const MAX_ATTACHED_IMAGES = 4;

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonFooter,
    IonTextarea,
    IonSpinner,
  ],
  selector: 'app-ai-agent',
  templateUrl: './ai-agent.page.html',
  styleUrls: ['./ai-agent.page.scss'],
})
export class AiAgentPage implements OnInit {
  @ViewChild(IonContent) private content?: IonContent;

  readonly textScenarios: AiScenarioCard[] = [
    {
      id: 'season',
      titleKey: 'aiScenarioSeason',
      hintKey: 'aiScenarioSeasonHint',
      icon: 'sparkles-outline',
      kind: 'text',
      needsPhoto: true,
    },
    {
      id: 'wardrobe',
      titleKey: 'aiScenarioWardrobe',
      hintKey: 'aiScenarioWardrobeHint',
      icon: 'bookmark-outline',
      kind: 'text',
    },
    {
      id: 'makeup',
      titleKey: 'aiScenarioMakeup',
      hintKey: 'aiScenarioMakeupHint',
      icon: 'sparkles-outline',
      kind: 'text',
    },
    {
      id: 'avoid',
      titleKey: 'aiScenarioAvoid',
      hintKey: 'aiScenarioAvoidHint',
      icon: 'close',
      kind: 'text',
    },
    {
      id: 'color-check',
      titleKey: 'aiScenarioColorCheck',
      hintKey: 'aiScenarioColorCheckHint',
      icon: 'checkmark-circle-outline',
      kind: 'text',
      needsPhoto: true,
    },
  ];

  readonly imageScenarios: AiScenarioCard[] = [
    {
      id: 'palette-board',
      titleKey: 'aiScenarioPaletteBoard',
      hintKey: 'aiScenarioPaletteBoardHint',
      icon: 'color-palette-outline',
      kind: 'image',
    },
    {
      id: 'outfit-look',
      titleKey: 'aiScenarioOutfitLook',
      hintKey: 'aiScenarioOutfitLookHint',
      icon: 'image-outline',
      kind: 'image',
    },
  ];

  prompt = '';
  loading = false;
  booting = true;
  generatingImage = false;
  savingGalleryExchangeId: number | null = null;
  addingLookbookExchangeId: number | null = null;
  session!: AiChatSession;
  attachedImages: AiAttachedImage[] = [];
  private pendingScenario: AiColoristScenario | null = null;

  constructor(
    private readonly language: LanguageService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
    private readonly history: AiChatHistoryService,
    private readonly lookbooks: LookbookService,
    private readonly gallery: GalleryService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
  ) {}

  get exchanges(): AiChatExchange[] {
    return this.session?.exchanges || [];
  }

  get hasAttachedImages(): boolean {
    return this.attachedImages.length > 0;
  }

  get canAttachMoreImages(): boolean {
    return this.attachedImages.length < MAX_ATTACHED_IMAGES;
  }

  exchangePhotoPreviews(item: AiChatExchange): string[] {
    if (item.imagePreviews?.length) return item.imagePreviews;
    if (item.attachedImageUrls?.length) return item.attachedImageUrls;
    if (item.imagePreview) return [item.imagePreview];
    if (item.attachedImageUrl) return [item.attachedImageUrl];
    return [];
  }

  /** Our HTML is already sanitized in safeAiMarkdownHtml; trust it so HEX swatch styles survive. */
  trustedAnswerHtml(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  async ngOnInit(): Promise<void> {
    this.booting = true;
    try {
      const sessions = await this.history.listMine();
      this.session = sessions[0] ? this.hydrateSession(sessions[0]) : this.history.create();
    } catch {
      this.session = this.history.create();
    } finally {
      this.booting = false;
    }
    if (this.exchanges.length) {
      await this.scrollToBottom();
    }
  }

  openAppMenu(): void {
    this.appMenu.open();
  }

  async exitToWelcome(): Promise<void> {
    if (this.session?.exchanges.length) {
      await this.history.save(this.session);
    }
    this.session = this.history.create();
    this.prompt = '';
    this.pendingScenario = null;
    this.clearImages();
    void this.content?.scrollToTop(180);
  }

  async openHistory(): Promise<void> {
    const sessions = await this.history.listMine();
    const selected = await this.sheets.open<
      AiChatHistorySheetComponent,
      AiChatHistorySheetData,
      string | null
    >(AiChatHistorySheetComponent, {
      sessions,
      activeId: this.session.id,
    });
    if (!selected) return;
    if (selected === '__deleted_active__') {
      this.session = this.history.create();
      this.prompt = '';
      this.pendingScenario = null;
      this.clearImages();
      void this.content?.scrollToTop(180);
      return;
    }
    const refreshed = await this.history.listMine();
    const session = refreshed.find((item) => item.id === selected);
    if (session) {
      this.session = this.hydrateSession(session);
      this.prompt = '';
      this.pendingScenario = null;
      this.clearImages();
      await this.scrollToBottom();
    }
  }

  async chooseScenario(card: AiScenarioCard): Promise<void> {
    this.pendingScenario = card.id;
    this.prompt = scenarioPrompt(card.id, this.language.language);
    if (card.needsPhoto && !this.attachedImages.length) {
      await this.openImageSource();
    }
  }

  onComposerEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    keyboardEvent.preventDefault();
    void this.send();
  }

  async openImageSource(): Promise<void> {
    if (!this.canAttachMoreImages) {
      await this.toasts.show(
        this.translate.instant('aiPhotosLimit', { count: MAX_ATTACHED_IMAGES }),
        'warning',
      );
      return;
    }
    type Source = 'gallery' | 'device' | 'camera';
    const remaining = MAX_ATTACHED_IMAGES - this.attachedImages.length;
    const result = await this.sheets.open<
      ChoiceSheetComponent<Source>,
      ChoiceSheetData<Source>,
      ChoiceSheetResult<Source> | null
    >(ChoiceSheetComponent, {
      titleKey: 'lookbookInsertPhoto',
      options: [
        { value: 'gallery', labelKey: 'lookbookAddFromGallery', ionIcon: 'images-outline' },
        {
          value: 'device',
          labelKey: 'lookbookAddFromDevice',
          ionIcon: 'image-outline',
          // File input on the option keeps the user gesture (needed on Android/Xiaomi).
          filePick: { accept: 'image/*', multiple: true },
        },
        { value: 'camera', labelKey: 'takePhoto', ionIcon: 'camera-outline' },
      ],
    });
    if (!result) return;
    if (isChoiceSheetFiles(result)) {
      for (const file of result.files.slice(0, remaining)) {
        if (!this.canAttachMoreImages) break;
        if (file.type && !file.type.startsWith('image/')) continue;
        await this.addAttachedBlob(file);
      }
      return;
    }
    if (result === 'gallery') {
      await this.pickFromAppGallery();
    } else if (result === 'device') {
      await this.pickFromDevice();
    } else if (result === 'camera') {
      await this.takePhoto();
    }
  }

  async openColorPicker(): Promise<void> {
    const result = await this.sheets.open<
      ColorPickerSheetComponent,
      ColorPickerSheetData,
      ColorPickerSheetResult
    >(
      ColorPickerSheetComponent,
      { hex: '#D4F880' },
      {
        closeOnBackdrop: true,
        hasBackdrop: true,
        backdropClass: 'rm-cdk-backdrop',
      },
    );
    if (!result?.hex) return;
    const hex = result.hex.trim();
    this.prompt = this.prompt.trim() ? `${this.prompt.trim()} ${hex}` : hex;
  }

  async send(question = this.prompt.trim()): Promise<void> {
    if ((!question && !this.attachedImages.length) || this.loading || this.booting) return;
    const ai = getFirebaseAi();
    if (!ai) {
      await this.toasts.show(this.translate.instant('aiUnavailable'), 'danger');
      return;
    }

    const scenario = this.pendingScenario;
    this.pendingScenario = null;
    const wantsImage = detectsImageIntent(question, scenario);
    this.loading = true;
    this.generatingImage = wantsImage;
    const id = Date.now();
    const ask = question || this.translate.instant('aiPhotoRequest');
    const previews = this.attachedImages.map((item) => item.preview);
    const attachments = this.attachedImages.map((item) => ({
      base64: item.base64,
      mimeType: item.mimeType,
    }));
    const context = [...this.exchanges];
    const exchange: AiChatExchange = {
      id,
      ask,
      answerMarkdown: null,
      answerHtml: null,
      state: 'loading',
      createdAt: id,
      imageAttached: previews.length > 0,
      imagePreview: previews[0],
      imagePreviews: previews.length ? previews : undefined,
      wantsImage,
    };
    this.session = {
      ...this.session,
      title: this.session.title || ask.slice(0, 48),
      exchanges: [...this.exchanges, exchange],
    };
    this.prompt = '';
    this.clearImages();
    await this.scrollToBottom();

    try {
      const result = wantsImage
        ? await this.generateImageAnswer(ai, context, ask, attachments)
        : await this.generateTextAnswer(ai, context, ask, attachments);
      this.updateExchange(id, {
        answerMarkdown: result.markdown,
        answerHtml: safeAiMarkdownHtml(result.markdown),
        generatedImages: result.images,
        hasGeneratedImage: result.images.length > 0,
        state: 'ready',
      });
    } catch (err) {
      console.error(err);
      this.updateExchange(id, {
        state: 'error',
        errorKey: this.aiErrorKey(err, wantsImage),
      });
    } finally {
      this.loading = false;
      this.generatingImage = false;
      try {
        const sessions = await this.history.save(this.session);
        const saved = sessions.find((item) => item.id === this.session.id);
        if (saved) {
          // Keep current on-screen image sources to avoid dataURL→https flicker.
          const byId = new Map(saved.exchanges.map((item) => [item.id, item]));
          this.session = {
            ...this.session,
            updatedAt: saved.updatedAt,
            exchanges: this.session.exchanges.map((item) => {
              const remote = byId.get(item.id);
              if (!remote) return item;
              const attachedUrls = remote.attachedImageUrls?.length
                ? remote.attachedImageUrls
                : remote.attachedImageUrl
                  ? [remote.attachedImageUrl]
                  : undefined;
              return {
                ...item,
                attachedImageUrl: remote.attachedImageUrl || item.attachedImageUrl,
                attachedImageUrls: attachedUrls || item.attachedImageUrls,
                imagePreview: item.imagePreview || remote.attachedImageUrl,
                imagePreviews: item.imagePreviews?.length
                  ? item.imagePreviews
                  : attachedUrls || (item.imagePreview ? [item.imagePreview] : undefined),
                imageAttached: !!(
                  item.imagePreview ||
                  item.imagePreviews?.length ||
                  remote.attachedImageUrl ||
                  remote.attachedImageUrls?.length ||
                  item.imageAttached
                ),
                generatedImageUrls: remote.generatedImageUrls?.length
                  ? remote.generatedImageUrls
                  : item.generatedImageUrls,
                generatedImages: item.generatedImages?.length
                  ? item.generatedImages
                  : remote.generatedImageUrls,
                hasGeneratedImage: !!(
                  item.generatedImages?.length ||
                  remote.generatedImageUrls?.length ||
                  remote.hasGeneratedImage ||
                  item.hasGeneratedImage
                ),
              };
            }),
          };
        }
      } catch (err) {
        console.error(err);
      }
      await this.scrollToBottom();
    }
  }

  async retry(item: AiChatExchange): Promise<void> {
    if (this.loading || this.booting) return;

    if (item.wantsImage) {
      if (/outfit|образ|look/i.test(item.ask)) {
        this.pendingScenario = 'outfit-look';
      } else if (/palette|палитр|борд|moodboard/i.test(item.ask)) {
        this.pendingScenario = 'palette-board';
      } else {
        this.pendingScenario = 'palette-board';
      }
    }

    // Restore attached photos first while the chat stays on screen (avoids welcome flash).
    const attachedSrcs = this.exchangePhotoPreviews(item);
    this.clearImages();
    if (attachedSrcs.length) {
      try {
        for (const attachedSrc of attachedSrcs.slice(0, MAX_ATTACHED_IMAGES)) {
          if (attachedSrc.startsWith('data:')) {
            this.addAttachedDataUrl(attachedSrc);
          } else {
            const blob = await this.fetchImageBlob(attachedSrc);
            await this.addAttachedBlob(blob);
          }
        }
      } catch (err) {
        console.error(err);
        this.clearImages();
        await this.toasts.show(this.translate.instant('aiImageLoadError'), 'danger');
        return;
      }
    }

    // Drop the old turn and start the new one in the same sync turn so welcome never flashes.
    this.session = {
      ...this.session,
      exchanges: this.exchanges.filter((exchange) => exchange.id !== item.id),
    };
    await this.send(item.ask);
  }

  async copyAsk(item: AiChatExchange): Promise<void> {
    const ask = String(item.ask || '').trim();
    if (!ask) return;
    this.prompt = ask;
    try {
      await navigator.clipboard.writeText(ask);
      await this.toasts.show(this.translate.instant('aiAskCopied'), 'success');
    } catch {
      await this.toasts.show(this.translate.instant('aiAskCopied'), 'success');
    }
  }

  async copyAnswer(item: AiChatExchange): Promise<void> {
    if (!item.answerMarkdown) return;
    try {
      await navigator.clipboard.writeText(item.answerMarkdown);
      await this.toasts.show(this.translate.instant('aiCopied'), 'success');
    } catch {
      await this.toasts.show(this.translate.instant('copyError'), 'danger');
    }
  }

  async previewImage(src: string, titleKey = 'aiImagePreview'): Promise<void> {
    if (!src) return;
    await this.sheets.open<AiImagePreviewSheetComponent, AiImagePreviewSheetData, null>(
      AiImagePreviewSheetComponent,
      { src, titleKey },
      { fullscreen: true, closeOnBackdrop: true, hasBackdrop: true, backdropClass: 'rm-cdk-backdrop' },
    );
  }

  async saveGeneratedToGallery(item: AiChatExchange): Promise<void> {
    const src = item.generatedImages?.[0];
    if (!src || this.savingGalleryExchangeId != null) return;
    this.savingGalleryExchangeId = item.id;
    try {
      const blob = await this.dataUrlToBlob(src);
      await this.gallery.saveBlob({
        blob,
        path: `ai/${Date.now()}.jpg`,
        title: item.ask.slice(0, 80) || this.translate.instant('aiGeneratedImage'),
        coloristicType: 'ai',
      });
      await this.toasts.show(this.translate.instant('successImage'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('saveError'), 'danger');
    } finally {
      this.savingGalleryExchangeId = null;
    }
  }

  async addToLookbook(item: AiChatExchange): Promise<void> {
    if ((!item.answerMarkdown && !item.generatedImages?.length) || this.addingLookbookExchangeId != null) {
      return;
    }
    try {
      const docs = await this.lookbooks.listMine();
      if (!docs.length) {
        type EmptyAction = 'open';
        const action = await this.sheets.open<
          ChoiceSheetComponent<EmptyAction>,
          ChoiceSheetData<EmptyAction>,
          EmptyAction | null
        >(ChoiceSheetComponent, {
          titleKey: 'aiNoLookbooks',
          options: [{ value: 'open', labelKey: 'aiOpenLookbooks', ionIcon: 'book-outline' }],
        });
        if (action === 'open') {
          await this.router.navigateByUrl('/tabs/lookbook');
        }
        return;
      }

      // Choose target first — spinner only during the actual save/upload.
      const id = await this.sheets.open<
        ChoiceSheetComponent<string>,
        ChoiceSheetData<string>,
        string | null
      >(ChoiceSheetComponent, {
        titleKey: 'aiChooseLookbook',
        options: docs.map((doc) => ({
          value: doc.id,
          labelKey: doc.title || this.translate.instant('lookbook'),
          ionIcon: 'book-outline',
        })),
      });
      if (!id) return;
      const doc = docs.find((entry) => entry.id === id);
      if (!doc) return;

      this.addingLookbookExchangeId = item.id;
      let images = item.generatedImages || [];
      if (images.length) {
        const uploaded: string[] = [];
        for (const [index, src] of images.entries()) {
          const blob = await this.dataUrlToBlob(src);
          uploaded.push(
            await this.lookbooks.uploadAsset(id, blob, `ai-${Date.now()}-${index}.jpg`),
          );
        }
        images = uploaded;
      }
      const html = appendAiRecommendationHtml(
        resolveLookbookHtml(doc.contentJson, doc.contentHtml),
        item.answerMarkdown || '',
        this.translate.instant('aiLookbookHeading'),
        images,
      );
      await this.lookbooks.save(id, { contentHtml: html });
      await this.toasts.show(this.translate.instant('aiAddedToLookbook'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('lookbookSaveError'), 'danger');
    } finally {
      this.addingLookbookExchangeId = null;
    }
  }

  clearImages(): void {
    this.attachedImages = [];
  }

  removeAttachedImage(id: string): void {
    this.attachedImages = this.attachedImages.filter((item) => item.id !== id);
  }

  private async pickFromAppGallery(): Promise<void> {
    try {
      const remaining = MAX_ATTACHED_IMAGES - this.attachedImages.length;
      if (remaining <= 0) return;
      const result = await this.sheets.open<
        LookbookGalleryPickerSheetComponent,
        LookbookGalleryPickerData,
        LookbookGalleryPickerResult | null
      >(
        LookbookGalleryPickerSheetComponent,
        { folderId: null, maxCount: remaining },
        { fullscreen: true },
      );
      const items = result?.items || [];
      for (const item of items) {
        if (!this.canAttachMoreImages) break;
        const src = item.src;
        if (!src) continue;
        const blob = await this.fetchImageBlob(src);
        await this.addAttachedBlob(blob, src);
      }
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('aiImageLoadError'), 'danger');
    }
  }

  /** Fallback for platforms where ChoiceSheet filePick is not used. */
  private async pickFromDevice(): Promise<void> {
    try {
      const remaining = MAX_ATTACHED_IMAGES - this.attachedImages.length;
      if (remaining <= 0) return;
      const picked = await Camera.pickImages({
        quality: 90,
        limit: Math.max(remaining, 2),
      });
      const selected = (picked.photos || []).slice(0, remaining);
      for (const item of selected) {
        if (!this.canAttachMoreImages) break;
        const path = item.webPath || item.path;
        if (!path) continue;
        const blob = await fetch(path).then((r) => r.blob());
        await this.addAttachedBlob(blob);
      }
    } catch (err) {
      const message = String((err as { message?: string })?.message || err || '').toLowerCase();
      if (!message.includes('cancel') && !message.includes('dismiss')) {
        console.error(err);
        await this.toasts.show(this.translate.instant('aiImageLoadError'), 'danger');
      }
    }
  }

  private async takePhoto(): Promise<void> {
    try {
      if (!this.canAttachMoreImages) return;
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await Camera.requestPermissions({ permissions: ['camera'] });
          if (perm.camera !== 'granted' && perm.camera !== 'limited') {
            await this.toasts.show(this.translate.instant('cameraError'), 'danger');
            return;
          }
        } catch {
          // System camera may still prompt.
        }
      }
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true,
        width: 1600,
      });
      if (photo.dataUrl) this.addAttachedDataUrl(photo.dataUrl);
    } catch (err) {
      const message = String((err as { message?: string })?.message || err || '').toLowerCase();
      if (!message.includes('cancel') && !message.includes('dismiss')) {
        console.error(err);
        await this.toasts.show(this.translate.instant('cameraError'), 'danger');
      }
    }
  }

  private async addAttachedBlob(blob: Blob, previewFallback?: string): Promise<void> {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    this.addAttachedDataUrl(dataUrl, previewFallback);
  }

  private addAttachedDataUrl(dataUrl: string, previewFallback?: string): void {
    if (!this.canAttachMoreImages) return;
    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
    if (!base64) return;
    this.attachedImages = [
      ...this.attachedImages,
      {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        preview: previewFallback || dataUrl,
        base64,
        mimeType: /^data:([^;,]+)/.exec(dataUrl)?.[1] || 'image/jpeg',
      },
    ];
  }

  private async fetchImageBlob(url: string): Promise<Blob> {
    if (!Capacitor.isNativePlatform()) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.blob();
    }
    const response = await CapacitorHttp.get({ url, responseType: 'blob' });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType =
      response.headers?.['Content-Type'] || response.headers?.['content-type'] || 'image/jpeg';
    if (response.data instanceof Blob) return response.data;
    if (typeof response.data === 'string') {
      const base64 = response.data.includes(',') ? response.data.split(',')[1]! : response.data;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: contentType });
    }
    if (response.data instanceof ArrayBuffer) {
      return new Blob([response.data], { type: contentType });
    }
    return new Blob([response.data as BlobPart], { type: contentType });
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    if (dataUrl.startsWith('http')) {
      return this.fetchImageBlob(dataUrl);
    }
    const response = await fetch(dataUrl);
    return response.blob();
  }

  private updateExchange(id: number, patch: Partial<AiChatExchange>): void {
    this.session = {
      ...this.session,
      updatedAt: Date.now(),
      exchanges: this.exchanges.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    };
  }

  private async generateTextAnswer(
    ai: NonNullable<ReturnType<typeof getFirebaseAi>>,
    context: AiChatExchange[],
    ask: string,
    attachments: Array<{ base64: string; mimeType: string }>,
  ): Promise<AiModelResult> {
    const requestText = buildAiColoristRequest(this.language.language, context, ask);
    const request: Array<string | { inlineData: { mimeType: string; data: string } }> = [requestText];
    for (const item of attachments) {
      request.push({ inlineData: { mimeType: item.mimeType, data: item.base64 } });
    }
    const markdown = await this.generateWithModels(ai, AI_TEXT_MODELS, request);
    return { markdown, images: [] };
  }

  private async generateImageAnswer(
    ai: NonNullable<ReturnType<typeof getFirebaseAi>>,
    context: AiChatExchange[],
    ask: string,
    attachments: Array<{ base64: string; mimeType: string }>,
  ): Promise<AiModelResult> {
    const requestText = buildAiImageRequest(this.language.language, context, ask);
    const request: Array<string | { inlineData: { mimeType: string; data: string } }> = [requestText];
    for (const item of attachments) {
      request.push({ inlineData: { mimeType: item.mimeType, data: item.base64 } });
    }

    let lastError: unknown;
    for (const modelName of AI_IMAGE_MODELS) {
      try {
        const model = getGenerativeModel(ai, {
          model: modelName,
          generationConfig: {
            responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
          },
        });
        const response = await model.generateContent(request);
        const markdown =
          response.response.text()?.trim() ||
          this.translate.instant('aiGeneratedImageCaption');
        const images = this.extractGeneratedImages(response.response);
        if (!images.length) {
          throw new Error('AI image response contained no image parts');
        }
        return { markdown, images };
      } catch (err) {
        lastError = err;
        if (!this.isUnavailableModelError(err) && !this.isBillingError(err)) {
          throw err;
        }
      }
    }
    throw lastError;
  }

  private extractGeneratedImages(response: {
    inlineDataParts?: () => Array<{ inlineData?: { mimeType?: string; data?: string } }> | undefined;
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> };
    }>;
  }): string[] {
    const images: string[] = [];
    try {
      const parts = response.inlineDataParts?.() || [];
      for (const part of parts) {
        const mime = part.inlineData?.mimeType || 'image/jpeg';
        const data = part.inlineData?.data;
        if (data) images.push(`data:${mime};base64,${data}`);
      }
    } catch {
      // Fall through to candidates parsing.
    }
    if (!images.length) {
      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          const mime = part.inlineData?.mimeType || 'image/jpeg';
          const data = part.inlineData?.data;
          if (data) images.push(`data:${mime};base64,${data}`);
        }
      }
    }
    return images.slice(0, 3);
  }

  private async generateWithModels(
    ai: NonNullable<ReturnType<typeof getFirebaseAi>>,
    models: readonly string[],
    request: Parameters<ReturnType<typeof getGenerativeModel>['generateContent']>[0],
  ): Promise<string> {
    let lastError: unknown;
    for (const modelName of models) {
      try {
        const model = getGenerativeModel(ai, { model: modelName });
        const response = await model.generateContent(request);
        return response.response.text();
      } catch (err) {
        lastError = err;
        if (!this.isUnavailableModelError(err)) {
          throw err;
        }
      }
    }
    throw lastError;
  }

  private isUnavailableModelError(err: unknown): boolean {
    const message = String((err as { message?: string })?.message || err || '').toLowerCase();
    return message.includes('404') || message.includes('not found') || message.includes('model');
  }

  private isBillingError(err: unknown): boolean {
    const message = String((err as { message?: string })?.message || err || '').toLowerCase();
    return (
      message.includes('billing') ||
      message.includes('blaze') ||
      message.includes('payment') ||
      message.includes('permission_denied') ||
      message.includes('403')
    );
  }

  private aiErrorKey(err: unknown, wantsImage = false): string {
    const message = String((err as { message?: string })?.message || err || '').toLowerCase();
    if (this.isBillingError(err) && wantsImage) {
      return 'aiImageBillingError';
    }
    if (message.includes('429') || message.includes('quota') || message.includes('rate')) {
      return 'aiRateLimitError';
    }
    if (
      message.includes('network') ||
      message.includes('failed to fetch') ||
      message.includes('name_not_resolved')
    ) {
      return 'aiNetworkError';
    }
    if (wantsImage && (message.includes('no image') || this.isUnavailableModelError(err))) {
      return 'aiImageUnavailable';
    }
    if (this.isUnavailableModelError(err)) {
      return 'aiModelUnavailable';
    }
    return 'aiRequestError';
  }

  private hydrateSession(session: AiChatSession): AiChatSession {
    return {
      ...session,
      exchanges: session.exchanges.map((item) => {
        const urls = AiChatHistoryService.uniqueHttpUrls(
          item.generatedImageUrls?.length
            ? item.generatedImageUrls
            : item.generatedImages?.filter((src) => /^https?:\/\//i.test(src)),
        );
        const attachedList = AiChatHistoryService.uniqueHttpUrls([
          ...(item.attachedImageUrls || []),
          item.attachedImageUrl || '',
          ...(item.imagePreviews || []).filter((src) => /^https?:\/\//i.test(src)),
          item.imagePreview && /^https?:\/\//i.test(item.imagePreview) ? item.imagePreview : '',
        ]);
        const previews =
          item.imagePreviews?.length
            ? item.imagePreviews
            : attachedList.length
              ? attachedList
              : item.imagePreview
                ? [item.imagePreview]
                : undefined;
        return {
          ...item,
          answerHtml: item.answerMarkdown ? safeAiMarkdownHtml(item.answerMarkdown) : null,
          attachedImageUrl: attachedList[0] || item.attachedImageUrl,
          attachedImageUrls: attachedList.length ? attachedList : item.attachedImageUrls,
          imagePreview: previews?.[0] || item.imagePreview,
          imagePreviews: previews,
          imageAttached: !!(item.imageAttached || previews?.length),
          generatedImages: urls.length ? urls : undefined,
          generatedImageUrls: urls.length ? urls : item.generatedImageUrls,
        };
      }),
    };
  }

  private async scrollToBottom(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 40));
    await this.content?.scrollToBottom(280);
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    await this.content?.scrollToBottom(180);
  }
}
