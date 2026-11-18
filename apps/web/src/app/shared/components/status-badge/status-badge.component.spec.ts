import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'pago');
    fixture.detectChanges();
  });

  it('should create the status badge', () => {
    expect(component).toBeTruthy();
  });

  it('should render default label Pago for status pago', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pago');
  });

  it('should render custom label when provided', () => {
    fixture.componentRef.setInput('label', 'Liquidado');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Liquidado');
  });

  it('should apply appropriate classes for status vencido', () => {
    fixture.componentRef.setInput('status', 'vencido');
    fixture.detectChanges();
    expect(component.badgeClasses()).toContain('bg-rose-100');
  });
});
