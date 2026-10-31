import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ExpenseEditModalComponent } from './expense-edit-modal.component';
import { ActiveProjectService } from '../../../../core/services/active-project.service';
import { ExpenseResponse } from '../../../../core/models/expense-registration.model';
import { environment } from '../../../../../environments/environment';

describe('Expense edit modal', () => {
  let fixture: ComponentFixture<ExpenseEditModalComponent>;
  let http: HttpTestingController;
  const api=`${environment.apiUrl}/api`;
  const expense: ExpenseResponse={id:'expense',projectId:'project',description:'Cimento',purchaseDate:'2030-01-01',
    categoryId:'category',categoryName:'Alvenaria',supplier:{id:'supplier',name:'Loja',document:null},paid:false,
    dueDate:'2030-01-10',quantity:2,unitPrice:12.50,totalPrice:25,receiptState:'NONE'};
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    TestBed.inject(ActiveProjectService).selectProject({id:'project',name:'Casa',type:'RENOVATION',status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''},'owner');
    http=TestBed.inject(HttpTestingController); fixture=TestBed.createComponent(ExpenseEditModalComponent);
    fixture.componentRef.setInput('expense',expense); fixture.detectChanges();
    http.expectOne(`${api}/expense-categories`).flush([{id:'category',name:'Alvenaria'}]); fixture.detectChanges();
  });
  afterEach(() => { http.verify(); TestBed.inject(ActiveProjectService).clear(); });
  it('prefills calculated values in their original magnitude and submits only once while saving', () => {
    const modal=fixture.componentInstance;
    expect(modal.form.getRawValue()).toEqual(jasmine.objectContaining({quantity:2,unitPrice:12.5,valueMode:'CALCULATED'}));
    expect((fixture.nativeElement.querySelector('[data-testid="edit-unitPrice"]') as HTMLInputElement).value.replace(/\s/g,' ')).toBe('R$ 12,50');
    modal.save(); modal.save();
    const request=http.expectOne(`${api}/expenses/expense`);
    expect(request.request.body).toEqual({description:'Cimento',purchaseDate:'2030-01-01',categoryId:'category',valueMode:'CALCULATED',quantity:2,unitPrice:12.5});
    request.flush(expense);
  });
  it('masks unit price digits as BRL and keeps the numeric value in reais', () => {
    const input=fixture.nativeElement.querySelector('[data-testid="edit-unitPrice"]') as HTMLInputElement;
    input.value='123456'; input.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(input.value.replace(/\s/g,' ')).toBe('R$ 1.234,56');
    expect(fixture.componentInstance.form.controls.unitPrice.value).toBe(1234.56);
    fixture.componentInstance.save();
    const request=http.expectOne(`${api}/expenses/expense`);
    expect(request.request.body.unitPrice).toBe(1234.56);
    request.flush(expense);
  });
  for (const field of ['totalPrice','unitPrice'] as const) {
    it(`rejects empty and zero masked ${field}`, () => {
      const modal=fixture.componentInstance;
      modal.form.controls.valueMode.setValue(field === 'totalPrice' ? 'DIRECT' : 'CALCULATED');
      fixture.detectChanges();
      const input=fixture.nativeElement.querySelector(`[data-testid="edit-${field}"]`) as HTMLInputElement;
      for (const value of ['', '0']) {
        input.value=value; input.dispatchEvent(new Event('input')); modal.save(); fixture.detectChanges();
        expect(modal.form.controls[field].value).toBe(value ? 0 : null);
        expect(modal.form.controls[field].invalid).toBeTrue();
        expect(fixture.nativeElement.querySelector(`[data-testid="edit-${field}-error"]`)).not.toBeNull();
        http.expectNone(request=>request.method==='PUT');
      }
    });
  }
  for (const quantity of [1e307, Infinity, NaN, -1, 0, 1.001, 100000000]) {
    it(`validates invalid quantity ${quantity} without throwing or submitting`, () => {
      const modal=fixture.componentInstance;
      expect(() => modal.form.patchValue({quantity,unitPrice:1})).not.toThrow();
      expect(() => modal.save()).not.toThrow(); fixture.detectChanges();
      expect(modal.form.controls.quantity.invalid).toBeTrue();
      expect(fixture.nativeElement.querySelector('[data-testid="edit-quantity-error"]')).not.toBeNull();
      http.expectNone(request=>request.method==='PUT');
    });
  }
  it('rejects dates after the existing due date and accepts equality', () => {
    const modal=fixture.componentInstance;
    modal.form.controls.purchaseDate.setValue('2030-01-11'); modal.save();
    expect(modal.form.controls.purchaseDate.invalid).toBeTrue(); http.expectNone(r=>r.method==='PUT');
    modal.form.controls.purchaseDate.setValue('2030-01-10'); modal.save(); http.expectOne(`${api}/expenses/expense`).flush(expense);
  });
  it('preserves fields on failure and allows an explicit state check', () => {
    const modal=fixture.componentInstance; const checked=jasmine.createSpy(); modal.checkState.subscribe(checked);
    modal.form.controls.description.setValue('Corrigida'); modal.save();
    http.expectOne(`${api}/expenses/expense`).flush({}, {status:500,statusText:'Error'}); fixture.detectChanges();
    expect(modal.saving()).toBeFalse(); expect(modal.form.controls.description.value).toBe('Corrigida');
    (fixture.nativeElement.querySelector('[data-testid="edit-check-state"]') as HTMLElement).click(); expect(checked).toHaveBeenCalledTimes(1);
  });
  it('ignores backdrop and closes by cancel, X or Escape without saving', () => {
    const canceled=jasmine.createSpy(); fixture.componentInstance.cancel.subscribe(canceled);
    (fixture.nativeElement.querySelector('[data-testid="expense-edit-backdrop"]') as HTMLElement).click(); expect(canceled).not.toHaveBeenCalled();
    for (const id of ['edit-cancel','edit-close']) (fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); expect(canceled).toHaveBeenCalledTimes(3); http.expectNone(r=>r.method==='PUT');
  });
  it('does not submit after project context changes', () => {
    TestBed.inject(ActiveProjectService).clear(); fixture.componentInstance.save(); http.expectNone(r=>r.method==='PUT');
  });
});
