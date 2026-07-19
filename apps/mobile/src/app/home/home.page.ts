import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../core/services/auth.service';

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule],
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  goMain(): void {
    if (this.auth.isAuthenticated) {
      this.router.navigateByUrl('/tabs/characteristics');
    } else {
      this.router.navigateByUrl('/sign-in');
    }
  }
}
