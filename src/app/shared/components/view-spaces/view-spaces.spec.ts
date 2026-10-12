import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSpaces } from './view-spaces';

describe('ViewSpaces', () => {
  let component: ViewSpaces;
  let fixture: ComponentFixture<ViewSpaces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewSpaces]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSpaces);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
