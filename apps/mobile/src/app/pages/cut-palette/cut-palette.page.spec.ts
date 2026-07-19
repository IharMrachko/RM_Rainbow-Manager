import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CutPalettePage } from './cut-palette.page';

describe('CutPalettePage', () => {
  let component: CutPalettePage;
  let fixture: ComponentFixture<CutPalettePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CutPalettePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
