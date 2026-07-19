import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyPalettePage } from './my-palette.page';

describe('MyPalettePage', () => {
  let component: MyPalettePage;
  let fixture: ComponentFixture<MyPalettePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MyPalettePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
