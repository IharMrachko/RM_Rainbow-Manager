import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CharacteristicColorsPage } from './characteristic-colors.page';

describe('CharacteristicColorsPage', () => {
  let component: CharacteristicColorsPage;
  let fixture: ComponentFixture<CharacteristicColorsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CharacteristicColorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
