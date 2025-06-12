import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Configuraciones } from './configuraciones';

describe('Configuraciones', () => {
  let component: Configuraciones;
  let fixture: ComponentFixture<Configuraciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Configuraciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Configuraciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
