import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'en' | 'ru';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly languageSubject = new BehaviorSubject<AppLanguage>(
    (localStorage.getItem('language') as AppLanguage) || 'en',
  );
  readonly language$ = this.languageSubject.asObservable();

  constructor(private readonly translate: TranslateService) {
    this.translate.addLangs(['en', 'ru']);
    this.translate.setDefaultLang('en');
    this.setLanguage(this.languageSubject.value);
  }

  get language(): AppLanguage {
    return this.languageSubject.value;
  }

  setLanguage(lang: AppLanguage): void {
    this.languageSubject.next(lang);
    localStorage.setItem('language', lang);
    this.translate.use(lang);
  }
}
