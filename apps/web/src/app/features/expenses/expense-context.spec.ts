import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';
import { ExpenseFormComponent } from './expense-form.component';
import { ExpenseDetailComponent } from './expense-detail.component';

describe('Expense project context (CA11)', () => {
  const api = `${environment.apiUrl}/api`;
  const project = (id: string, name = id) => ({id,name,type:'RENOVATION' as const,
    status:'IN_PROGRESS' as const,location:null,createdAt:'',updatedAt:''});
  let active: ActiveProjectService;
  let http: HttpTestingController;
  let fixture: ComponentFixture<ExpenseFormComponent>;
  const saved = {id:'expense',projectId:'A',description:'Original',purchaseDate:'2030-01-01',
    categoryId:'category',categoryName:'Material',supplier:{id:'supplier',name:'Loja',document:'12345678000190'},
    totalPrice:10,quantity:null,unitPrice:null,paid:true,dueDate:null,receiptState:'PENDING'};
  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:convertToParamMap({id:'expense'})}}}]});
    active=TestBed.inject(ActiveProjectService); active.selectProject(project('A'),'owner');
    http=TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function open() {
    fixture=TestBed.createComponent(ExpenseFormComponent); fixture.detectChanges();
    http.expectOne(`${api}/expense-categories`).flush([{id:'category',name:'Material'}]);
    http.expectOne(`${api}/suppliers`).flush([{id:'supplier',name:'Loja'}]);
    http.expectOne(`${api}/budgets?projectId=A`).flush({categories:[]});
    fixture.componentInstance.form.patchValue({description:'Original',purchaseDate:'2030-01-01',
      categoryId:'category',supplierId:'supplier',totalPrice:10});
    fixture.componentInstance.receiptFile.set(new File(['x'],'receipt.pdf',{type:'application/pdf'}));
    fixture.detectChanges(); return fixture.componentInstance;
  }
  it('clears all form context on a real project change before any new POST', () => {
    const component=open(); component.openBudget(); component.receiptError.set('old');
    active.selectProject(project('B'),'owner'); fixture.detectChanges();
    expect(component.form.controls.description.value).toBe('');
    expect(component.receiptFile()).toBeNull(); expect(component.budgetContext()).toBeNull();
    expect(component.receiptError()).toBe(''); expect(component.saving()).toBeFalse();
    component.save(); http.expectNone(request => request.method==='POST');
    http.expectOne(`${api}/budgets?projectId=B`).flush({categories:[]});
  });
  it('preserves fields and attachment when only project metadata changes', () => {
    const component=open(), before=component.form.getRawValue(), file=component.receiptFile();
    active.selectProject(project('A','Updated'),'owner'); fixture.detectChanges();
    expect(component.form.getRawValue()).toEqual(before); expect(component.receiptFile()).toBe(file);
    http.expectNone(request => request.url.includes('/budgets'));
  });
  for (const returnToA of [false,true]) {
    it(`ignores an old financial response after A → B${returnToA ? ' → A before effects run' : ''}`, () => {
      const component=open(); const navigate=spyOn(TestBed.inject(Router),'navigate');
      component.save(); const post=http.expectOne(`${api}/expenses`);
      expect(post.request.body.projectId).toBe('A');
      active.selectProject(project('B'),'owner');
      if (returnToA) active.selectProject(project('A'),'owner');
      post.flush(saved); fixture.detectChanges();
      expect(navigate).not.toHaveBeenCalled(); expect(component.savedExpenseId()).toBeNull();
      expect(component.form.controls.description.value).toBe('');
      http.expectNone(request => request.method==='PUT');
      http.expectOne(`${api}/budgets?projectId=${returnToA ? 'A':'B'}`).flush({categories:[]});
    });
  }
  for (const returnToA of [false,true]) {
  for (const fails of [false,true]) {
    it(`ignores post-save budget ${fails ? 'failure' : 'ceiling alert'} after A → B${returnToA ? ' → A' : ''} (AF-01)`, () => {
      const component=open(); component.save();
      http.expectOne(`${api}/expenses`).flush(saved,{status:201,statusText:'Created'});
      const upload=http.expectOne(`${api}/expenses/expense/receipt`);
      upload.flush({}, {status:503,statusText:'Unavailable'});
      const budgets=http.match(`${api}/budgets?projectId=A`);
      expect(budgets.length).withContext('post-save aggregate pending before switching context').toBe(1);
      active.selectProject(project('B'),'owner');
      if (returnToA) active.selectProject(project('A'),'owner');
      // Deliver before effects run: checking only project ID would miss A → B → A.
      for (const budget of budgets) {
        if (fails) budget.flush({}, {status:503,statusText:'Unavailable'});
        else budget.flush({categories:[{categoryId:'category',plannedAmount:10,spentAmount:10,
          state:'EXCEEDED',percentage:100,hasBudget:true}]});
      }
      fixture.detectChanges();
      http.expectOne(`${api}/budgets?projectId=${returnToA ? 'A' : 'B'}`).flush({categories:[]});
      fixture.detectChanges();
      expect(component.savedExpenseId()).toBeNull(); expect(component.budgetError()).toBe('');
      expect(component.errorMessage()).toBe(''); expect(component.budgetCategories()).toEqual([]);
      expect(fixture.nativeElement.querySelector('[data-testid="budget-ceiling-alert"]')).toBeNull();
      http.expectNone(request => request.method==='POST');
    });
  }
  }
  it('shows selection guidance and does not submit without a project', () => {
    const component=open(); active.clear(); fixture.detectChanges(); component.save();
    expect(fixture.nativeElement.textContent).toContain('Selecione ou cadastre uma obra');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    http.expectNone(request => request.method==='POST');
  });
  it('cancel and page destruction before submission create no expense', () => {
    open(); const navigate=spyOn(TestBed.inject(Router),'navigate');
    const cancel=fixture.nativeElement.querySelector('[data-testid="cancel-expense"]') as HTMLElement;
    expect(cancel).not.toBeNull(); cancel?.click(); fixture.destroy();
    expect(navigate).toHaveBeenCalledWith(['/orcamentos']);
    http.expectNone(request => request.method==='POST');
  });
  it('page destruction alone before submission creates no expense', () => {
    open(); fixture.destroy(); http.expectNone(request => request.method==='POST');
  });
  it('ignores a budget response from an earlier A context', () => {
    const component=open(); component.loadBudgets(); const old=http.expectOne(`${api}/budgets?projectId=A`);
    active.selectProject(project('B'),'owner'); active.selectProject(project('A'),'owner');
    fixture.detectChanges(); http.expectOne(`${api}/budgets?projectId=A`).flush({categories:[]});
    old.flush({categories:[{categoryId:'old'}]}); expect(component.budgetCategories()).toEqual([]);
  });
  it('ignores an upload response and resets progress after changing project', () => {
    const component=open(); const navigate=spyOn(TestBed.inject(Router),'navigate'); component.save();
    http.expectOne(`${api}/expenses`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=A`).flush({categories:[]});
    const upload=http.expectOne(`${api}/expenses/expense/receipt`);
    active.selectProject(project('B'),'owner'); fixture.detectChanges();
    upload.event({type:1,loaded:5,total:10}); upload.flush({...saved,receiptState:'UPLOADED'});
    expect(component.uploadProgress()).toBeNull(); expect(component.saving()).toBeFalse();
    expect(navigate).not.toHaveBeenCalled();
    http.expectOne(`${api}/budgets?projectId=B`).flush({categories:[]});
  });
  for (const initializeLater of [false,true]) {
  for (const operation of ['get','upload','download','budget']) {
    it(`clears the individual expense and ignores late ${operation} after A → B → A (initialized later: ${initializeLater})`, () => {
      if (initializeLater) active.clear();
      const detail=TestBed.createComponent(ExpenseDetailComponent); detail.detectChanges();
      if (initializeLater) {
        http.expectNone(`${api}/expenses/expense`);
        active.initialize([project('A')],'owner'); detail.detectChanges();
      }
      const get=http.expectOne(`${api}/expenses/expense`);
      if (operation!=='get') get.flush({...saved,receiptState:operation==='download'?'UPLOADED':'PENDING'});
      const budget=operation==='get'?null:http.expectOne(`${api}/budgets?projectId=A`);
      if (operation==='upload') {
        detail.componentInstance.receiptFile.set(new File(['x'],'receipt.pdf',{type:'application/pdf'}));
        detail.componentInstance.uploadReceipt();
      }
      const createUrl=spyOn(URL,'createObjectURL').and.returnValue('blob:test');
      if (operation==='download') detail.componentInstance.downloadReceipt();
      const receipt=['upload','download'].includes(operation)?http.expectOne(`${api}/expenses/expense/receipt`):null;
      active.selectProject(project('B'),'owner'); active.selectProject(project('A'),'owner');
      detail.detectChanges();
      if (operation==='get') get.flush(saved);
      budget?.flush({categories:[{categoryId:'category',state:'EXCEEDED'}]});
      receipt?.flush(operation==='download'?new Blob(['x']):{...saved,receiptState:'UPLOADED'});
      expect(detail.componentInstance.expense()).toBeNull(); expect(detail.componentInstance.budgetExceeded()).toBeFalse();
      expect(detail.componentInstance.uploading()).toBeFalse(); expect(detail.componentInstance.downloading()).toBeFalse();
      expect(createUrl).not.toHaveBeenCalled(); http.expectNone(`${api}/budgets?projectId=A`);
    });
  }
  }
});
