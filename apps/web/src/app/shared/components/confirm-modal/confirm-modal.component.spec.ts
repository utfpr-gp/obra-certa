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
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmBtn = buttons[2]; // index 0 is close X, 1 is cancel, 2 is confirm
    confirmBtn?.click();
    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel when cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelBtn = buttons[1];
    cancelBtn?.click();
    expect(component.cancel.emit).toHaveBeenCalled();
  });
});
