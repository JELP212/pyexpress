import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Intereses } from './intereses';

describe('Intereses', () => {
  let component: Intereses;
  let fixture: ComponentFixture<Intereses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Intereses]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Intereses);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
