import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  LOOKBOOK_PAGE_TEMPLATES,
  LookbookTemplateDef,
  LookbookTemplateId,
} from '../../core/utils/lookbook-page-templates';
import {
  OVERLAY_SHEET_DATA,
  OVERLAY_SHEET_REF,
  OverlaySheetRef,
} from '../../core/services/overlay-sheet.service';

export type LookbookTemplatePickerData = Record<string, never>;

export type LookbookTemplatePickerResult = LookbookTemplateId | null;

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule],
  selector: 'app-lookbook-template-picker-sheet',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rm-lb-tpl" role="dialog" aria-modal="true">
      <header class="rm-lb-tpl__bar">
        <button type="button" class="rm-lb-tpl__icon" (click)="cancel()" aria-label="close">
          <ion-icon name="close-circle"></ion-icon>
        </button>
        <div class="rm-lb-tpl__title">{{ 'lookbookAddPage' | translate }}</div>
        <span class="rm-lb-tpl__spacer"></span>
      </header>

      <div class="rm-lb-tpl__grid">
        @for (tpl of templates; track tpl.id) {
          <button type="button" class="rm-lb-tpl__card" (click)="choose(tpl.id)">
            <div class="rm-lb-tpl__preview" [class]="tpl.previewClass" aria-hidden="true">
              @switch (tpl.id) {
                @case ('cover') {
                  <div class="pv-cover">
                    <span class="pv-cover__img"></span>
                    <span class="pv-cover__text">
                      <i></i><i></i><i class="short"></i>
                    </span>
                  </div>
                }
                @case ('article-left') {
                  <div class="pv-article">
                    <i class="title"></i><i></i>
                    <b class="pv-article__photo is-left"></b>
                    <i></i><i></i><i></i><i></i><i class="short"></i>
                  </div>
                }
                @case ('article-right') {
                  <div class="pv-article">
                    <i class="title"></i><i></i>
                    <b class="pv-article__photo is-right"></b>
                    <i></i><i></i><i></i><i></i><i class="short"></i>
                  </div>
                }
                @case ('overlay-3') {
                  <div class="pv-overlay">
                    <span class="pv-overlay__text"><i class="title"></i><i></i><i></i><i></i><i class="short"></i></span>
                    <span class="pv-overlay__photos"><b class="one"></b><b class="two"></b><b class="three"></b></span>
                  </div>
                }
                @case ('fan-3') {
                  <div class="pv-fan"><b class="one"></b><b class="two"></b><b class="three"></b></div>
                }
                @case ('text-photo') {
                  <div class="pv-split">
                    <span class="pv-split__text"><i></i><i></i><i></i><i class="short"></i></span>
                    <span class="pv-split__photo"></span>
                  </div>
                }
                @case ('text-photo-right') {
                  <div class="pv-split pv-split--rev">
                    <span class="pv-split__text"><i></i><i></i><i></i><i class="short"></i></span>
                    <span class="pv-split__photo"></span>
                  </div>
                }
                @case ('collage-text-4') {
                  <div class="pv-split">
                    <span class="pv-split__text"><i></i><i></i><i class="short"></i></span>
                    <span class="pv-grid4">
                      <b></b><b></b><b></b><b></b>
                    </span>
                  </div>
                }
                @case ('collage-text-3') {
                  <div class="pv-split">
                    <span class="pv-split__text"><i></i><i></i><i class="short"></i></span>
                    <span class="pv-mosaic3">
                      <b class="a"></b><b class="b"></b><b class="c"></b>
                    </span>
                  </div>
                }
                @case ('collage-2') {
                  <div class="pv-stack2"><b></b><b></b></div>
                }
                @case ('collage-4') {
                  <div class="pv-mosaic4">
                    <b class="a"></b><b class="b"></b><b class="c"></b><b class="d"></b>
                  </div>
                }
                @case ('photo') {
                  <div class="pv-photo"></div>
                }
                @case ('text-1col') {
                  <div class="pv-text">
                    <i class="title"></i><i></i><i></i><i></i><i class="short"></i>
                  </div>
                }
              }
            </div>
            <div class="rm-lb-tpl__label">{{ tpl.titleKey | translate }}</div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .rm-lb-tpl {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background: #f2f3f7;
        color: #16182a;
        box-sizing: border-box;
      }
      .rm-lb-tpl *,
      .rm-lb-tpl *::before,
      .rm-lb-tpl *::after {
        box-sizing: border-box;
      }
      .rm-lb-tpl__bar {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 12px;
        background: #fff;
        border-bottom: 1px solid rgba(22, 24, 42, 0.08);
      }
      .rm-lb-tpl__title {
        flex: 1;
        text-align: center;
        font-size: 1.05rem;
        font-weight: 750;
      }
      .rm-lb-tpl__icon {
        width: 40px;
        height: 40px;
        border: 0;
        background: transparent;
        color: #8a909f;
        font-size: 28px;
        display: grid;
        place-items: center;
      }
      .rm-lb-tpl__spacer {
        width: 40px;
      }
      .rm-lb-tpl__grid {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px 12px;
        padding: 16px 14px calc(24px + env(safe-area-inset-bottom, 0px));
        -webkit-overflow-scrolling: touch;
      }
      .rm-lb-tpl__card {
        border: 0;
        padding: 0;
        background: transparent;
        text-align: left;
        color: inherit;
        -webkit-tap-highlight-color: transparent;
      }
      .rm-lb-tpl__preview {
        aspect-ratio: 3 / 4;
        border-radius: 10px;
        overflow: hidden;
        background: #fff;
        border: 1px solid rgba(22, 24, 42, 0.08);
        box-shadow: 0 4px 14px rgba(22, 24, 42, 0.06);
      }
      .rm-lb-tpl__label {
        margin-top: 8px;
        font-size: 0.82rem;
        font-weight: 650;
        line-height: 1.25;
        color: #3a3f55;
      }

      /* —— Mini previews —— */
      .pv-cover,
      .pv-split,
      .pv-stack2,
      .pv-mosaic4,
      .pv-photo,
      .pv-text,
      .pv-article,
      .pv-overlay,
      .pv-fan {
        width: 100%;
        height: 100%;
      }
      .pv-cover {
        position: relative;
        background: #d9dde8;
      }
      .pv-cover__img {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #c5cad8, #9aa3b8 55%, #7d879c);
      }
      .pv-cover__text {
        position: absolute;
        left: 10%;
        top: 28%;
        width: 42%;
        display: grid;
        gap: 5px;
      }
      .pv-cover__text i {
        display: block;
        height: 6px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.92);
      }
      .pv-cover__text i.short {
        width: 55%;
      }

      .pv-article {
        display: block;
        padding: 13% 10%;
        background: #fff;
      }
      .pv-article i {
        display: block;
        height: 5px;
        margin-bottom: 5px;
        border-radius: 2px;
        background: #cfd3df;
      }
      .pv-article i.title {
        width: 68%;
        height: 8px;
        margin-bottom: 7px;
        background: #aeb4c4;
      }
      .pv-article i.short {
        width: 52%;
      }
      .pv-article__photo {
        width: 42%;
        aspect-ratio: 4 / 3;
        margin-top: 2px;
        margin-bottom: 5px;
        border-radius: 4px;
        background: linear-gradient(145deg, #b7becd, #7d879c);
      }
      .pv-article__photo.is-left {
        float: left;
        margin-right: 7px;
      }
      .pv-article__photo.is-right {
        float: right;
        margin-left: 7px;
      }

      .pv-overlay {
        display: flex;
        background: #fff;
      }
      .pv-overlay__text {
        flex: 0 0 43%;
        padding: 14% 4% 10% 8%;
        display: grid;
        align-content: start;
        gap: 5px;
      }
      .pv-overlay__text i {
        display: block;
        height: 5px;
        border-radius: 2px;
        background: #cfd3df;
      }
      .pv-overlay__text i.title {
        height: 8px;
        margin-bottom: 3px;
        background: #aeb4c4;
      }
      .pv-overlay__text i.short {
        width: 60%;
      }
      .pv-overlay__photos {
        position: relative;
        flex: 1;
        margin: 8% 5% 8% 0;
      }
      .pv-overlay__photos b {
        position: absolute;
        display: block;
        border: 2px solid #fff;
        border-radius: 4px;
        background: linear-gradient(145deg, #b9c0cf, #7d879c);
        box-shadow: 0 3px 7px rgba(30, 34, 54, 0.2);
      }
      .pv-overlay__photos .one {
        z-index: 3;
        top: 0;
        right: 2%;
        width: 39%;
        height: 31%;
      }
      .pv-overlay__photos .two {
        z-index: 2;
        top: 23%;
        left: 0;
        width: 59%;
        height: 45%;
      }
      .pv-overlay__photos .three {
        z-index: 1;
        right: 0;
        bottom: 0;
        width: 73%;
        height: 57%;
      }

      .pv-fan {
        position: relative;
        background: #f7f7fa;
        overflow: hidden;
      }
      .pv-fan b {
        position: absolute;
        bottom: 8%;
        display: block;
        width: 40%;
        height: 72%;
        transform-origin: 50% 100%;
        border: 3px solid #fff;
        border-radius: 5px;
        background: linear-gradient(145deg, #b9c0cf, #7d879c);
        box-shadow: 0 4px 9px rgba(30, 34, 54, 0.24);
      }
      .pv-fan .one {
        z-index: 1;
        left: 8%;
        transform: rotate(-10deg);
      }
      .pv-fan .two {
        z-index: 3;
        left: 30%;
        bottom: 4%;
      }
      .pv-fan .three {
        z-index: 2;
        right: 8%;
        transform: rotate(10deg);
      }

      .pv-split {
        display: flex;
        height: 100%;
      }
      .pv-split--rev {
        flex-direction: row-reverse;
      }
      .pv-split__text {
        flex: 1;
        padding: 12% 8%;
        display: grid;
        align-content: start;
        gap: 5px;
        background: #fff;
      }
      .pv-split__text i {
        display: block;
        height: 5px;
        border-radius: 2px;
        background: #cfd3df;
      }
      .pv-split__text i.short {
        width: 60%;
      }
      .pv-split__photo {
        flex: 0 0 46%;
        background: linear-gradient(160deg, #b7becd, #8b94a8);
      }

      .pv-grid4 {
        flex: 0 0 46%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 3px;
        padding: 3px;
        background: #fff;
      }
      .pv-grid4 b {
        display: block;
        background: #a8b0c0;
        border-radius: 2px;
      }

      .pv-mosaic3 {
        flex: 0 0 46%;
        position: relative;
        background: #eef0f5;
      }
      .pv-mosaic3 b {
        position: absolute;
        display: block;
        background: #a8b0c0;
        border-radius: 2px;
      }
      .pv-mosaic3 .a {
        top: 6%;
        left: 8%;
        width: 52%;
        height: 42%;
      }
      .pv-mosaic3 .b {
        top: 10%;
        right: 6%;
        width: 38%;
        height: 36%;
      }
      .pv-mosaic3 .c {
        bottom: 8%;
        right: 10%;
        width: 48%;
        height: 40%;
      }

      .pv-stack2 {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 4px;
        background: #fff;
      }
      .pv-stack2 b {
        flex: 1;
        display: block;
        background: #a8b0c0;
        border-radius: 3px;
      }

      .pv-mosaic4 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 3px;
        padding: 3px;
        background: #fff;
      }
      .pv-mosaic4 b {
        display: block;
        background: #a8b0c0;
        border-radius: 2px;
      }

      .pv-photo {
        background: linear-gradient(145deg, #b7becd, #7d879c);
      }

      .pv-text {
        padding: 14% 12%;
        display: grid;
        align-content: start;
        gap: 6px;
        background: #fff;
      }
      .pv-text i {
        display: block;
        height: 5px;
        border-radius: 2px;
        background: #cfd3df;
      }
      .pv-text i.title {
        height: 8px;
        width: 70%;
        background: #aeb4c4;
        margin-bottom: 4px;
      }
      .pv-text i.short {
        width: 45%;
      }
    `,
  ],
})
export class LookbookTemplatePickerSheetComponent {
  readonly templates: LookbookTemplateDef[] = LOOKBOOK_PAGE_TEMPLATES;

  constructor(
    @Inject(OVERLAY_SHEET_DATA) private readonly _data: LookbookTemplatePickerData,
    @Inject(OVERLAY_SHEET_REF)
    private readonly sheetRef: OverlaySheetRef<LookbookTemplatePickerResult>,
  ) {}

  choose(id: LookbookTemplateId): void {
    this.sheetRef.close(id);
  }

  cancel(): void {
    this.sheetRef.close(null);
  }
}
