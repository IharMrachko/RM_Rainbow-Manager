import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChromaPage } from './chroma.page';

describe('ChromaPage', () => {
  let component: ChromaPage;
  let fixture: ComponentFixture<ChromaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChromaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
