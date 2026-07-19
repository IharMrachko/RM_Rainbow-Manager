import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AppMenuService } from '../../core/services/app-menu.service';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule],
  selector: 'app-consult',
  templateUrl: './consult.page.html',
  styleUrls: ['./consult.page.scss'],
})
export class ConsultPage {
  constructor(
    private readonly router: Router,
    private readonly appMenu: AppMenuService,
  ) {}

  openAppMenu(): void {
    this.appMenu.open();
  }

  get showMenu(): boolean {
    return this.router.url.includes('/tabs/');
  }

  openTelegram(): void {
    window.open('https://t.me/Yuliyaa_S', '_blank');
  }
}
