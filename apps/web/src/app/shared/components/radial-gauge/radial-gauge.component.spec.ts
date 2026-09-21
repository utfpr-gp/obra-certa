import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RadialGaugeComponent } from './radial-gauge.component';

describe('RadialGaugeComponent', () => {
  let component: RadialGaugeComponent;
  let fixture: ComponentFixture<RadialGaugeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RadialGaugeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RadialGaugeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('percent', 73);
    fixture.componentRef.setInput('currentValue', 'R$ 131.500,00');
    fixture.componentRef.setInput('totalValue', 'R$ 180.000,00');
    fixture.detectChanges();
  });

  it('should create the radial gauge', () => {
    expect(component).toBeTruthy();
  });

  it('should render percentage and values', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('73%');
    expect(compiled.textContent).toContain('R$ 131.500,00');
    expect(compiled.textContent).toContain('de R$ 180.000,00');
  });

  it('should calculate appropriate stroke color based on percent', () => {
    expect(component.strokeColor()).toBe('#007A80');

    fixture.componentRef.setInput('percent', 85);
    fixture.detectChanges();
    expect(component.strokeColor()).toBe('#F59E0B');

    fixture.componentRef.setInput('percent', 98);
    fixture.detectChanges();
    expect(component.strokeColor()).toBe('#EF4444');
  });
});
