import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { TranslateModule } from '@ngx-translate/core';
import { getGenerativeModel } from 'firebase/ai';
import { marked } from 'marked';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  close,
  imageOutline,
  menuOutline,
  send,
} from 'ionicons/icons';
import { getFirebaseAi } from '../../core/firebase';
import { AppMenuService } from '../../core/services/app-menu.service';
import { LanguageService } from '../../core/services/language.service';
import { OverlaySheetService } from '../../core/services/overlay-sheet.service';
import {
  ChoiceSheetComponent,
  ChoiceSheetData,
} from '../../shared/components/choice-sheet.component';
import {
  LookbookGalleryPickerData,
  LookbookGalleryPickerResult,
  LookbookGalleryPickerSheetComponent,
} from '../../shared/components/lookbook-gallery-picker-sheet.component';

addIcons({ chatbubbleEllipsesOutline, close, imageOutline, menuOutline, send });

interface ChatItem {
  id: number;
  ask: string;
  url?: string;
  answerHtml: string | null;
}

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
export class AiAgentPage {
  @ViewChild(IonContent) private content?: IonContent;

  prompt = '';
  loading = false;
  answers: ChatItem[] = [];
  imagePreview: string | null = null;
  imageBase64: string | null = null;
  imageMimeType = 'image/jpeg';

  constructor(
    private readonly language: LanguageService,
    private readonly appMenu: AppMenuService,
    private readonly sheets: OverlaySheetService,
  ) {}

  openAppMenu(): void {
    this.appMenu.open();
  }

  async openImageSource(): Promise<void> {
    type Source = 'gallery' | 'device';
    const source = await this.sheets.open<
      ChoiceSheetComponent<Source>,
      ChoiceSheetData<Source>,
      Source | null
    >(ChoiceSheetComponent, {
      titleKey: 'lookbookInsertPhoto',
      options: [
        { value: 'gallery', labelKey: 'lookbookAddFromGallery', ionIcon: 'images-outline' },
        { value: 'device', labelKey: 'lookbookAddFromDevice', ionIcon: 'camera-outline' },
      ],
    });
    if (source === 'gallery') {
      await this.pickFromAppGallery();
    } else if (source === 'device') {
      await this.pickFromDevice();
    }
  }

  private async pickFromAppGallery(): Promise<void> {
    const result = await this.sheets.open<
      LookbookGalleryPickerSheetComponent,
      LookbookGalleryPickerData,
      LookbookGalleryPickerResult | null
    >(
      LookbookGalleryPickerSheetComponent,
      { folderId: null, maxCount: 1 },
      { fullscreen: true },
    );
    const src = result?.items?.[0]?.src;
    if (!src) {
      return;
    }
    this.imagePreview = src;
    const blob = await this.fetchImageBlob(src);
    await this.setImageBlob(blob);
  }

  private async pickFromDevice(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true,
        width: 1600,
      });
      if (photo.dataUrl) {
        this.setImageDataUrl(photo.dataUrl);
      }
    } catch (err) {
      const message = String((err as { message?: string })?.message || err || '').toLowerCase();
      if (!message.includes('cancel') && !message.includes('dismiss')) {
        console.error(err);
      }
    }
  }

  private async setImageBlob(blob: Blob): Promise<void> {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    this.setImageDataUrl(dataUrl);
  }

  private setImageDataUrl(dataUrl: string): void {
    this.imagePreview = dataUrl;
    this.imageBase64 = dataUrl.split(',')[1] || null;
    this.imageMimeType = /^data:([^;,]+)/.exec(dataUrl)?.[1] || 'image/jpeg';
  }

  private async fetchImageBlob(url: string): Promise<Blob> {
    if (!Capacitor.isNativePlatform()) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.blob();
    }

    const response = await CapacitorHttp.get({ url, responseType: 'blob' });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType =
      response.headers?.['Content-Type'] || response.headers?.['content-type'] || 'image/jpeg';
    if (response.data instanceof Blob) {
      return response.data;
    }
    if (typeof response.data === 'string') {
      const base64 = response.data.includes(',') ? response.data.split(',')[1]! : response.data;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: contentType });
    }
    if (response.data instanceof ArrayBuffer) {
      return new Blob([response.data], { type: contentType });
    }
    return new Blob([response.data as BlobPart], { type: contentType });
  }

  clearImage(): void {
    this.imagePreview = null;
    this.imageBase64 = null;
    this.imageMimeType = 'image/jpeg';
  }

  async send(): Promise<void> {
    const text = this.prompt.trim();
    if ((!text && !this.imageBase64) || this.loading) {
      return;
    }
    const ai = getFirebaseAi();
    if (!ai) {
      return;
    }
    this.loading = true;
    const id = Date.now();
    const ask = text || '[image]';
    const url = this.imagePreview || undefined;
    this.answers = [...this.answers, { id, ask, url, answerHtml: null }];
    this.prompt = '';
    const base64 = this.imageBase64;
    const mimeType = this.imageMimeType;
    this.clearImage();
    await this.scrollToBottom();
    try {
      const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash' });
      const localeHint =
        this.language.language === 'en'
          ? `${ask}. Answer in English`
          : `${ask}. Ответь на русском`;
      const req = base64
        ? [localeHint, { inlineData: { mimeType, data: base64 } }]
        : [localeHint];
      const response = await model.generateContent(req);
      const answer = response.response.text();
      const answerHtml = marked.parse(answer) as string;
      this.answers = this.answers.map((a) => (a.id === id ? { ...a, answerHtml } : a));
    } catch (err) {
      this.answers = this.answers.map((a) =>
        a.id === id ? { ...a, answerHtml: `<p>${String(err)}</p>` } : a,
      );
    } finally {
      this.loading = false;
      await this.scrollToBottom();
    }
  }

  private async scrollToBottom(): Promise<void> {
    // Wait for Angular to paint the new message/answer, then scroll.
    await new Promise<void>((resolve) => setTimeout(resolve, 40));
    await this.content?.scrollToBottom(280);
    await new Promise<void>((resolve) => setTimeout(resolve, 120));
    await this.content?.scrollToBottom(200);
  }
}
