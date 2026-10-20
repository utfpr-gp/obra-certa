import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Excluir Orçamento?');
    fixture.componentRef.setInput('description', 'Esta ação é irreversível.');
    fixture.detectChanges();
  });

  it('should create the modal', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and description when open', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Excluir Orçamento?');
    expect(compiled.textContent).toContain('Esta ação é irreversível.');
  });

  it('should emit confirm when confirm button is clicked', () => {
    spyOn(component.confirm, 'emit');
    const confirmBtn = fixture.nativeElement.querySelector('[data-testid="confirm-confirmation"]') as HTMLButtonElement;
    confirmBtn.click();
    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel when cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    const cancelBtn = fixture.nativeElement.querySelector('[data-testid="cancel-confirmation"]') as HTMLButtonElement;
    cancelBtn.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('does not emit an action when the backdrop is clicked', () => {
    spyOn(component.confirm, 'emit');
    spyOn(component.cancel, 'emit');

    const backdrop = fixture.nativeElement.querySelector('[data-testid="confirm-modal-backdrop"]') as HTMLElement;
    backdrop.click();

    expect(component.confirm.emit).not.toHaveBeenCalled();
    expect(component.cancel.emit).not.toHaveBeenCalled();
  });
});
