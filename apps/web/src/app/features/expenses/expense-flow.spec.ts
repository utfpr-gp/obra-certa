import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { authGuard } from '../../core/guards/auth-guard';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';

describe('Expense registration and individual consultation', () => {
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  beforeEach(() => {
    const layout = routes.find(route => route.canActivate?.includes(authGuard))!;
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting(),
      provideRouter(layout.children!)]});
    TestBed.inject(ActiveProjectService).activeProject.set({id:'project',name:'Casa',type:'RENOVATION',
      status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''});
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  async function pendingForm() {
    const harness = await open();
    input(harness,'description','Cimento a prazo'); input(harness,'purchaseDate','2030-01-01');
    input(harness,'categoryId','category'); input(harness,'supplierId','supplier');
    input(harness,'totalPrice','10025');
    const select = harness.routeNativeElement!.querySelector('[formControlName="paid"]') as HTMLSelectElement;
    expect(select).withContext('payment choice must be available').not.toBeNull();
    const pending = Array.from(select.options).find(option => option.textContent?.includes('Não quitada'))!;
    input(harness,'paid',pending.value);
    return harness;
  }
  it('requires a due date and highlights an earlier date, including after changing purchase date', async () => {
    const harness = await pendingForm();
    click(harness,'save-expense');
    expect(harness.routeNativeElement!.querySelector('[formControlName="dueDate"]')!.getAttribute('aria-invalid')).toBe('true');
    expect(harness.routeNativeElement!.textContent).toContain('Informe o vencimento');
    input(harness,'dueDate','2029-12-31'); click(harness,'save-expense');
    expect(harness.routeNativeElement!.textContent).toContain('O vencimento não pode ser anterior');
    input(harness,'dueDate','2030-01-02');
    input(harness,'purchaseDate','2030-01-03'); click(harness,'save-expense');
    expect(harness.routeNativeElement!.querySelector('[formControlName="dueDate"]')!.getAttribute('aria-invalid')).toBe('true');
    http.expectNone(`${api}/expenses`);
  });
  for (const dueDate of ['2030-01-01','2030-02-01']) {
    it(`saves a pending expense with due date ${dueDate} and displays its confirmed due date`, async () => {
      const harness = await pendingForm(); input(harness,'dueDate',dueDate);
      click(harness,'save-expense');
      const request = http.expectOne(`${api}/expenses`);
      expect(request.request.body).toEqual(jasmine.objectContaining({paid:false,dueDate}));
      const saved = {...request.request.body,id:'pending',categoryName:'Alvenaria',
        supplier:{id:'supplier',name:'Loja',document:'12345678000190'},quantity:null,unitPrice:null};
      request.flush(saved,{status:201,statusText:'Created'});
      await harness.fixture.whenStable();
      http.expectOne(`${api}/expenses/pending`).flush(saved); harness.detectChanges();
      expect(harness.routeNativeElement!.textContent).toContain('Pendente');
      expect(harness.routeNativeElement!.textContent).toContain(dueDate.split('-').reverse().join('/'));
    });
  }
  it('removes the due-date requirement and omits stale dueDate when switched back to paid', async () => {
    const harness = await pendingForm(); input(harness,'dueDate','2029-12-31');
    const select = harness.routeNativeElement!.querySelector('[formControlName="paid"]') as HTMLSelectElement;
    input(harness,'paid',Array.from(select.options).find(option => option.textContent?.trim() === 'Quitada')!.value);
    click(harness,'save-expense');
    const request = http.expectOne(`${api}/expenses`);
    expect(request.request.body.paid).toBeTrue(); expect(request.request.body.dueDate).toBeUndefined();
    request.flush({}, {status:400,statusText:'Bad Request'});
  });
  async function open() {
    const harness = await RouterTestingHarness.create('/despesas/nova');
    http.expectOne(`${api}/expense-categories`).flush([{id:'category',name:'Alvenaria'}]);
    http.expectOne(`${api}/suppliers`).flush([{id:'supplier',name:'Loja',document:'12345678000190'}]);
    http.expectOne(`${api}/budgets?projectId=project`).flush({projectId:'project',categories:[]});
    harness.detectChanges();
    return harness;
  }
  function input(harness: RouterTestingHarness, name: string, value: string) {
    const element = harness.routeNativeElement!.querySelector(`[formControlName="${name}"]`) as HTMLInputElement;
    element.value = value;
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input'));
    harness.detectChanges();
  }
  function click(harness: RouterTestingHarness, id: string) {
    (harness.routeNativeElement!.querySelector(`[data-testid="${id}"]`) as HTMLElement).click();
    harness.detectChanges();
  }
  it('shows required errors and does not send an invalid form', async () => {
    const harness = await open();
    click(harness,'save-expense');
    expect(harness.routeNativeElement!.querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThan(3);
    http.expectNone(`${api}/expenses`);
  });
  it('saves a direct paid expense and loads its confirmed individual URL from the API', async () => {
    const harness = await open();
    input(harness,'description','Cimento'); input(harness,'purchaseDate','2030-01-01');
    input(harness,'categoryId','category'); input(harness,'supplierId','supplier');
    input(harness,'totalPrice','10025');
    click(harness,'save-expense');
    const request = http.expectOne(`${api}/expenses`);
    expect(request.request.body).toEqual(jasmine.objectContaining({projectId:'project',paid:true,
      valueMode:'DIRECT',totalPrice:100.25,supplierId:'supplier'}));
    expect(request.request.body.quantity).toBeUndefined();
    const saved = {id:'expense',projectId:'project',description:'Cimento',purchaseDate:'2030-01-01',
      categoryId:'category',categoryName:'Alvenaria',supplier:{id:'supplier',name:'Loja',document:'12345678000190'},
      totalPrice:100.25,quantity:null,unitPrice:null,paid:true};
    request.flush(saved,{status:201,statusText:'Created'});
    await harness.fixture.whenStable();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/despesas/expense');
    expect(harness.routeNativeElement!.textContent).toContain('Cimento');
    expect(harness.routeNativeElement!.textContent).toContain('Quitada');
  });
  it('calculates total and sends an inline supplier with only the selected mode fields', async () => {
    const harness = await open();
    input(harness,'description','Tijolos'); input(harness,'purchaseDate','2020-01-01');
    input(harness,'categoryId','category'); input(harness,'valueMode','CALCULATED');
    input(harness,'quantity','1.5'); input(harness,'unitPrice','101');
    click(harness,'inline-supplier');
    input(harness,'supplierName','Loja nova'); input(harness,'supplierDocument','12.345.678/0001-90');
    expect(harness.routeNativeElement!.querySelector('[data-testid="calculated-total"]')!.textContent).toContain('1,52');
    click(harness,'save-expense');
    const request = http.expectOne(`${api}/expenses`);
    expect(request.request.body.newSupplier).toEqual({name:'Loja nova',document:'12.345.678/0001-90'});
    expect(request.request.body.quantity).toBe(1.5);
    expect(request.request.body.unitPrice).toBe(1.01);
    expect(request.request.body.totalPrice).toBeUndefined();
    request.flush({}, {status:400,statusText:'Bad Request'});
  });
  it('requires both positive calculated fields and inline supplier name and CNPJ', async () => {
    const harness = await open();
    input(harness,'description','Cimento'); input(harness,'purchaseDate','2026-10-27');
    input(harness,'categoryId','category'); input(harness,'valueMode','CALCULATED');
    click(harness,'inline-supplier'); input(harness,'quantity','0');
    click(harness,'save-expense');
    expect(harness.routeNativeElement!.querySelectorAll('[aria-invalid="true"]').length).toBeGreaterThanOrEqual(4);
    http.expectNone(`${api}/expenses`);
  });
});
