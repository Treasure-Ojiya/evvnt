import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSpace } from './list-space';

describe('ListSpace', () => {
  let component: ListSpace;
  let fixture: ComponentFixture<ListSpace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSpace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSpace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
