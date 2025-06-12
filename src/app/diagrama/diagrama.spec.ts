import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Diagrama } from './diagrama';

describe('Diagrama', () => {
  let component: Diagrama;
  let fixture: ComponentFixture<Diagrama>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Diagrama]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Diagrama);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
