import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function query<T extends Element>(testId: string): T | null {
    return page().querySelector<T>(`[data-testid="${testId}"]`);
  }

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

  it('disables confirmation while saving and guards direct repeated confirmation', () => {
    spyOn(component.confirm, 'emit');
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    expect(query<HTMLButtonElement>('confirm-confirmation')!.disabled).toBeTrue();
    query<HTMLButtonElement>('confirm-confirmation')!.click();
    component.onConfirm();
    expect(component.confirm.emit).not.toHaveBeenCalled();
    fixture.componentRef.setInput('saving', false);
    fixture.detectChanges();
    query<HTMLButtonElement>('confirm-confirmation')!.click();
    expect(component.confirm.emit).toHaveBeenCalledTimes(1);
  });

  it('still allows cancellation during saving', () => {
    spyOn(component.cancel, 'emit');
    fixture.componentRef.setInput('saving', true);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.cancel.emit).toHaveBeenCalledTimes(1);
  });

  it('should create the modal', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and description when open', () => {
    expect(page().textContent).toContain('Excluir Orçamento?');
    expect(page().textContent).toContain('Esta ação é irreversível.');
  });

  it('should emit confirm when confirm button is clicked', () => {
    spyOn(component.confirm, 'emit');
    const confirmBtn = query<HTMLButtonElement>('confirm-confirmation');
    expect(confirmBtn).not.toBeNull();

    confirmBtn!.click();

    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel when cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    const cancelBtn = query<HTMLButtonElement>('cancel-confirmation');
    expect(cancelBtn).not.toBeNull();

    cancelBtn!.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit cancel when the close button is clicked', () => {
    spyOn(component.cancel, 'emit');
    const closeBtn = query<HTMLButtonElement>('close-confirmation');
    expect(closeBtn).not.toBeNull();

    closeBtn!.click();

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should emit cancel when Escape is pressed', () => {
    spyOn(component.cancel, 'emit');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('does not confirm or cancel on an accidental backdrop click', () => {
    spyOn(component.confirm, 'emit');
    spyOn(component.cancel, 'emit');

    const backdrop = query<HTMLElement>('confirm-modal-backdrop');
    expect(backdrop).not.toBeNull();

    backdrop!.click();

    expect(component.confirm.emit).not.toHaveBeenCalled();
    expect(component.cancel.emit).not.toHaveBeenCalled();
  });

  it('does not confirm or cancel when the dialog content is clicked', () => {
    spyOn(component.confirm, 'emit');
    spyOn(component.cancel, 'emit');

    const content = query<HTMLElement>('confirm-modal-content');
    expect(content).not.toBeNull();

    content!.click();

    expect(component.confirm.emit).not.toHaveBeenCalled();
    expect(component.cancel.emit).not.toHaveBeenCalled();
  });
});
