import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertBannerComponent } from './alert-banner.component';

describe('AlertBannerComponent', () => {
  let component: AlertBannerComponent;
  let fixture: ComponentFixture<AlertBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertBannerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Atenção:');
    fixture.componentRef.setInput('message', 'Conta vencendo hoje.');
    fixture.detectChanges();
  });

  it('should create the alert banner', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Atenção:');
    expect(compiled.textContent).toContain('Conta vencendo hoje.');
  });

  it('should emit actionClick when action button is clicked', () => {
    fixture.componentRef.setInput('actionLabel', 'Ver Detalhes');
    fixture.detectChanges();

    spyOn(component.actionClick, 'emit');
    const btn = fixture.nativeElement.querySelector('button');
    btn?.click();
    expect(component.actionClick.emit).toHaveBeenCalled();
  });
});
