import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recommended } from './recommended';

describe('Recommended', () => {
  let component: Recommended;
  let fixture: ComponentFixture<Recommended>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recommended]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Recommended);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
