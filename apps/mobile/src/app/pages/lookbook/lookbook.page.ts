import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppMenuService } from '../../core/services/app-menu.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { LookbookDoc, LookbookService } from '../../core/services/lookbook.service';
import { ToastService } from '../../core/services/toast.service';
import { InputSearchComponent } from '../../shared/components/input-search.component';

@Component({
  standalone: true,
  imports: [IonicModule, TranslateModule, RouterModule, InputSearchComponent],
  selector: 'app-lookbook',
  templateUrl: './lookbook.page.html',
  styleUrls: ['./lookbook.page.scss'],
})
export class LookbookPage implements OnInit {
  items: LookbookDoc[] = [];
  loading = true;
  searchQuery = '';

  get filteredItems(): LookbookDoc[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    if (!query) {
      return this.items;
    }
    return this.items.filter((item) =>
      String(item.title || this.translate.instant('lookbook'))
        .toLocaleLowerCase()
        .includes(query),
    );
  }

  constructor(
    private readonly lookbooks: LookbookService,
    private readonly confirm: ConfirmService,
    private readonly toasts: ToastService,
    private readonly translate: TranslateService,
    private readonly appMenu: AppMenuService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  openAppMenu(): void {
    this.appMenu.open();
  }

  onSearch(value: string | null | undefined): void {
    this.searchQuery = String(value || '');
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.items = await this.lookbooks.listMine();
    } catch (err) {
      console.error(err);
      this.items = [];
      await this.toasts.show(this.translate.instant('lookbookLoadError'), 'danger');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  openItem(item: LookbookDoc): void {
    void this.router.navigateByUrl(`/tabs/lookbook/${item.id}`);
  }

  async createNew(): Promise<void> {
    const id = this.lookbooks.reserveId();
    await this.router.navigateByUrl(`/tabs/lookbook/${id}?new=1`);
  }

  async confirmDelete(item: LookbookDoc, event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.confirm.danger('lookbookDeleteConfirm', 'lookbook');
    if (!ok) {
      return;
    }
    try {
      await this.lookbooks.remove(item.id);
      this.items = this.items.filter((it) => it.id !== item.id);
      this.cdr.markForCheck();
      await this.toasts.show(this.translate.instant('lookbookDeleted'), 'success');
    } catch (err) {
      console.error(err);
      await this.toasts.show(this.translate.instant('lookbookSaveError'), 'danger');
    }
  }
}
