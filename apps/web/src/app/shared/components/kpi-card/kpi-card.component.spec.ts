import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Saldo Disponível');
    fixture.componentRef.setInput('value', 'R$ 48.500,00');
    fixture.componentRef.setInput('icon', 'piggy-bank');
    fixture.detectChanges();
  });

  it('should create the KPI card', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and value', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Saldo Disponível');
    expect(compiled.textContent).toContain('R$ 48.500,00');
  });

  it('should display subtitle when provided', () => {
    fixture.componentRef.setInput('subtitle', '/ 30 dias');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('/ 30 dias');
  });
});
