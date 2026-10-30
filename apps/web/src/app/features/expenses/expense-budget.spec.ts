import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ExpenseFormComponent } from './expense-form.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { BudgetCategory } from '../../core/models/budget.model';
import { environment } from '../../../environments/environment';

describe('Expense category without a budget (CA4)', () => {
  let fixture: ComponentFixture<ExpenseFormComponent>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  const category = (amount: number): BudgetCategory => ({categoryId:'category',categoryName:'Alvenaria',
    plannedAmount:amount,spentAmount:0,balanceAmount:amount,percentage:amount ? 0 : null,
    state:amount ? 'ON_TRACK' : 'NO_BUDGET',hasBudget:true});
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]});
    TestBed.inject(ActiveProjectService).selectProject({id:'project',name:'Casa',type:'RENOVATION',
      status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''}, 'owner');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.detectChanges();
    http.expectOne(`${api}/expense-categories`).flush([{id:'category',name:'Alvenaria'}]);
    http.expectOne(`${api}/suppliers`).flush([{id:'supplier',name:'Loja',document:'12345678000190'}]);
    fixture.componentInstance.form.patchValue({description:'Cimento',purchaseDate:'2030-01-01',
      categoryId:'category',supplierId:'supplier',totalPrice:100.25,paid:false,dueDate:'2030-02-01'});
  });
  afterEach(() => http.verify());
  function overview(categories: BudgetCategory[]) {
    http.expectOne(`${api}/budgets?projectId=project`).flush({projectId:'project',categories});
    fixture.detectChanges();
  }
  function element(id: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  }
  function click(id: string) {
    const target = element(id);
    expect(target).withContext(id).not.toBeNull();
    target?.click(); fixture.detectChanges();
  }
  for (const categories of [[],[category(0)]]) {
    it(`warns and permits saving with ${categories.length ? 'zero' : 'absent'} budget`, () => {
      // A missing overview entry also means no active ceiling.
      overview(categories);
      expect(element('no-category-budget')?.textContent).toContain('sem teto');
      click('save-expense');
      const request = http.expectOne(`${api}/expenses`);
      expect(request.request.body).toEqual(jasmine.objectContaining({paid:false,totalPrice:100.25}));
      request.flush({}, {status:500,statusText:'Error'});
      http.expectNone(request => request.method === 'PUT');
    });
  }
  it('does not warn for a positive ceiling or before choosing a category', () => {
    overview([category(1000)]);
    expect(element('no-category-budget')).toBeNull();
    fixture.componentInstance.form.controls.categoryId.setValue(''); fixture.detectChanges();
    expect(element('no-category-budget')).toBeNull();
  });
  it('preserves all expense fields on opening, closing and saving the existing budget modal', () => {
    overview([]);
    fixture.componentInstance.toggleSupplier();
    fixture.componentInstance.form.patchValue({supplierName:'Loja nova',supplierDocument:'12345678000190',
      valueMode:'CALCULATED',quantity:2,unitPrice:12.50});
    const before = fixture.componentInstance.form.getRawValue();
    click('define-category-budget');
    const selected = element('budget-form-category') as HTMLSelectElement;
    expect(selected.value).toBe('category');
    expect(fixture.componentInstance.form.getRawValue()).toEqual(before);
    click('budget-form-close');
    expect(fixture.componentInstance.form.getRawValue()).toEqual(before);
    expect(element('no-category-budget')).not.toBeNull();
    click('define-category-budget');
    const amount = element('budget-form-amount') as HTMLInputElement;
    amount.value = '100000'; amount.dispatchEvent(new Event('input')); fixture.detectChanges();
    click('budget-form-submit');
    const request = http.expectOne(`${api}/budgets/project/categories/category`);
    expect(request.request.body).toEqual({estimatedAmount:1000});
    request.flush(category(1000)); fixture.detectChanges();
    expect(element('budget-form-modal')).toBeNull();
    expect(element('no-category-budget')).toBeNull();
    expect(fixture.componentInstance.form.getRawValue()).toEqual(before);
    expect(fixture.componentInstance.inlineSupplier()).toBeTrue();
  });
  it('keeps a failed budget read identifiable and retries without discarding expense fields', () => {
    http.expectOne(`${api}/budgets?projectId=project`).flush({}, {status:500,statusText:'Error'});
    fixture.detectChanges();
    expect(element('no-category-budget')).toBeNull();
    expect(element('category-budget-error')?.textContent).toContain('Não foi possível');
    const before = fixture.componentInstance.form.getRawValue();
    click('retry-category-budget'); overview([]);
    expect(element('no-category-budget')).not.toBeNull();
    expect(fixture.componentInstance.form.getRawValue()).toEqual(before);
  });
});
