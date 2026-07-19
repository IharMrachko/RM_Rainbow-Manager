import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

interface ToolTile {
  titleKey: string;
  hintKey: string;
  url: string;
  icon: string;
}

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule],
  selector: 'app-main-home',
  templateUrl: './main-home.page.html',
  styleUrls: ['./main-home.page.scss'],
})
export class MainHomePage {
  readonly tools: ToolTile[] = [
    {
      titleKey: 'characteristicColors',
      hintKey: 'toolHintMask',
      url: '/main/characteristic-colors',
      icon: 'color-palette',
    },
    {
      titleKey: 'paletteDeterminant',
      hintKey: 'toolHintDeterminant',
      url: '/main/palette-determinant',
      icon: 'brush',
    },
    {
      titleKey: 'analysisByPhoto',
      hintKey: 'toolHintAnalysis',
      url: '/tabs/palette',
      icon: 'camera',
    },
    {
      titleKey: 'pickColor',
      hintKey: 'toolHintChroma',
      url: '/main/chroma',
      icon: 'eyedrop',
    },
    {
      titleKey: 'cutPalette',
      hintKey: 'toolHintCut',
      url: '/main/cut-palette',
      icon: 'cut',
    },
    {
      titleKey: 'myPalette',
      hintKey: 'toolHintMyPalette',
      url: '/main/my-palette',
      icon: 'water',
    },
  ];

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  open(url: string): void {
    void this.router.navigateByUrl(url);
  }
}
