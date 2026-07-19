import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

  constructor(
    private readonly language: LanguageService,
    private readonly appMenu: AppMenuService,
  ) {}

  openAppMenu(): void {
    this.appMenu.open();
  }

  async onImage(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    this.imagePreview = dataUrl;
    this.imageBase64 = dataUrl.split(',')[1] || null;
  }

  clearImage(): void {
    this.imagePreview = null;
    this.imageBase64 = null;
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
    this.clearImage();
    await this.scrollToBottom();
    try {
      const model = getGenerativeModel(ai, { model: 'gemini-2.5-flash-lite' });
      const localeHint =
        this.language.language === 'en'
          ? `${ask}. Answer in English`
          : `${ask}. Ответь на русском`;
      const req = base64
        ? [localeHint, { inlineData: { mimeType: 'image/jpeg', data: base64 } }]
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
