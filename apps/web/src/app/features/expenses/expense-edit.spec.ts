import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ExpenseDetailComponent } from './expense-detail.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';

const saved = {id:'expense',projectId:'project',description:'Cimento',purchaseDate:'2030-01-01',categoryId:'category',
  categoryName:'Alvenaria',supplier:{id:'supplier',name:'Loja',document:null},paid:true,dueDate:null,
  quantity:null,unitPrice:null,totalPrice:1234.56,receiptState:'NONE'};
describe('Expense editing', () => {
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  let http: HttpTestingController;
  const api=`${environment.apiUrl}/api`;
  const el=(id:string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  function click(id:string) { expect(el(id)).withContext(id).not.toBeNull(); el(id)?.click(); fixture.detectChanges(); }
  function input(id:string,value:string) { const node=el(id) as HTMLInputElement; expect(node).not.toBeNull(); if(node) { node.value=value; node.dispatchEvent(new Event('input')); fixture.detectChanges(); } }
  function open() { click('edit-expense'); http.expectOne(`${api}/expense-categories`).flush([{id:'category',name:'Alvenaria'},{id:'other',name:'Pintura'}]); fixture.detectChanges(); }
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:new Map([['id','expense']])}}}]});
    TestBed.inject(ActiveProjectService).selectProject({id:'project',name:'Casa',type:'RENOVATION',status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''},'owner');
    http=TestBed.inject(HttpTestingController); fixture=TestBed.createComponent(ExpenseDetailComponent); fixture.detectChanges();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]}); fixture.detectChanges();
  });
  afterEach(() => {http.verify(); TestBed.inject(ActiveProjectService).clear();});
  it('opens prefilled without allowing project changes and sends the original monetary magnitude', () => {
    open(); expect((el('edit-description') as HTMLInputElement).value).toBe('Cimento');
    expect((el('edit-totalPrice') as HTMLInputElement).value.replace(/\s/g,' ')).toBe('R$ 1.234,56');
    expect((el('edit-project') as HTMLInputElement).disabled).toBeTrue();
    input('edit-description','Corrigida'); click('edit-save');
    const request=http.expectOne(`${api}/expenses/expense`); expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({description:'Corrigida',purchaseDate:'2030-01-01',categoryId:'category',valueMode:'DIRECT',totalPrice:1234.56});
    request.flush({...saved,description:'Corrigida'});
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[{categoryId:'category',plannedAmount:100,state:'EXCEEDED'}]});
    fixture.detectChanges(); expect(el('expense-edit-modal')).toBeNull(); expect(fixture.nativeElement.textContent).toContain('Corrigida');
    expect(el('budget-ceiling-alert')).not.toBeNull();
  });
  it('interprets typed monetary digits as cents and sends reais through the service', () => {
    open(); input('edit-totalPrice','123456');
    expect((el('edit-totalPrice') as HTMLInputElement).value.replace(/\s/g,' ')).toBe('R$ 1.234,56');
    click('edit-save');
    const request=http.expectOne(`${api}/expenses/expense`);
    expect(request.request.body.totalPrice).toBe(1234.56);
    request.flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]});
    fixture.detectChanges(); expect(el('expense-edit-modal')).toBeNull();
  });
  it('highlights invalid values and does not submit', () => {
    open(); input('edit-description','   '); input('edit-totalPrice','0'); click('edit-save');
    http.expectNone(request=>request.method==='PUT'); expect(el('edit-description-error')).not.toBeNull(); expect(el('edit-totalPrice-error')).not.toBeNull();
  });
  it('keeps confirmed changes when refreshing the budget fails', () => {
    open(); input('edit-description','Salva'); click('edit-save');
    http.expectOne(`${api}/expenses/expense`).flush({...saved,description:'Salva'});
    http.expectOne(`${api}/budgets?projectId=project`).flush({}, {status:500,statusText:'Error'}); fixture.detectChanges();
    expect(fixture.componentInstance.expense()?.description).toBe('Salva'); expect(el('expense-edit-modal')).toBeNull();
    expect(fixture.componentInstance.budgetError()).toContain('despesa está salva');
  });
});
