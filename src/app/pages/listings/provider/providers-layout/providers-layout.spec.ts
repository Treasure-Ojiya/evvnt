import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvidersLayout } from './providers-layout';

describe('ProvidersLayout', () => {
  let component: ProvidersLayout;
  let fixture: ComponentFixture<ProvidersLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProvidersLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProvidersLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
