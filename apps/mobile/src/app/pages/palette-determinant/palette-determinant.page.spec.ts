import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaletteDeterminantPage } from './palette-determinant.page';

describe('PaletteDeterminantPage', () => {
  let component: PaletteDeterminantPage;
  let fixture: ComponentFixture<PaletteDeterminantPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PaletteDeterminantPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
