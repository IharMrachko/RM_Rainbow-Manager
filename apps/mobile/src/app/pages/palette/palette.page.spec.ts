import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PalettePage } from './palette.page';

describe('PalettePage', () => {
  let component: PalettePage;
  let fixture: ComponentFixture<PalettePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PalettePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
