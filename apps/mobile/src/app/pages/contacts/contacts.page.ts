import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

addIcons({ arrowBackOutline });

@Component({
  standalone: true,
  imports: [
    TranslateModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
  ],
  selector: 'app-contacts',
  templateUrl: './contacts.page.html',
  styleUrls: ['./contacts.page.scss'],
})
export class ContactsPage {
  constructor(private readonly router: Router) {}

  goBack(): void {
    // Prefer the page that opened Contacts. Leaving /tabs for /contacts
    // used to remount tabs on the default Characteristics route.
    if (this.router.url.startsWith('/tabs/')) {
      void this.router.navigateByUrl('/tabs/account');
      return;
    }
    void this.router.navigateByUrl('/home');
  }
}
