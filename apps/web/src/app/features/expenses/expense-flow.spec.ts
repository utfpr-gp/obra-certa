import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ExpenseFormComponent } from './expense-form.component';
import { routes } from '../../app.routes';
import { authGuard } from '../../core/guards/auth-guard';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { environment } from '../../../environments/environment';

describe('Expense registration and individual consultation', () => {
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  function configure() {
    const layout = routes.find(route => route.canActivate?.includes(authGuard))!;
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting(),
      provideRouter(layout.children!)]});
    TestBed.inject(ActiveProjectService).selectProject({id:'project',name:'Casa',type:'RENOVATION',
      status:'IN_PROGRESS',location:null,createdAt:'',updatedAt:''}, 'owner');
    http = TestBed.inject(HttpTestingController);
  }
  beforeEach(configure);
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
      http.expectOne(`${api}/expenses/pending`).flush(saved);
      http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]}); harness.detectChanges();
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

  function selectDetailReceipt(harness: RouterTestingHarness, file: File) {
    const element=harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement;
    expect(element).withContext('the expense must allow selecting a receipt again').not.toBeNull();
    const files=new DataTransfer(); files.items.add(file); element.files=files.files;
    element.dispatchEvent(new Event('change')); harness.detectChanges();
    return element;
  }
  const detailExpense={id:'saved',projectId:'project',description:'Cimento',purchaseDate:'2030-01-01',
    categoryId:'category',categoryName:'Alvenaria',supplier:{id:'supplier',name:'Loja',document:'12345678000190'},
    paid:false,dueDate:'2030-01-02',totalPrice:100.25,quantity:null,unitPrice:null};
  for (const state of ['NONE','PENDING','UPLOADED']) {
    it(`opens the direct expense URL before project initialization and restores ${state} receipt actions`, async () => {
      const active=TestBed.inject(ActiveProjectService);
      active.clear();
      const harness=await RouterTestingHarness.create('/despesas/saved');
      expect(harness.routeNativeElement!.textContent).toContain('Selecione ou cadastre uma obra');
      http.expectNone(`${api}/expenses/saved`);
      active.initialize([{id:'project',name:'Casa',type:'RENOVATION',status:'IN_PROGRESS',
        location:null,createdAt:'',updatedAt:''}], 'owner');
      harness.detectChanges();
      http.expectOne(`${api}/expenses/saved`).flush({...detailExpense,receiptState:state});
      http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]});
      harness.detectChanges();
      expect(harness.routeNativeElement!.textContent).toContain('Cimento');
      expect(harness.routeNativeElement!.textContent).not.toContain('A obra foi alterada');
      active.initialize([{id:'project',name:'Casa atualizada',type:'RENOVATION',status:'IN_PROGRESS',
        location:null,createdAt:'',updatedAt:''}], 'owner');
      harness.detectChanges();
      http.expectNone(request => request.url.includes('/budgets') || request.url.endsWith('/expenses/saved'));
      if (state==='UPLOADED') {
        expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')).toBeNull();
        spyOn(URL,'createObjectURL').and.returnValue('blob:restored');
        spyOn(URL,'revokeObjectURL'); spyOn(HTMLAnchorElement.prototype,'click');
        click(harness,'download-receipt');
        http.expectOne(`${api}/expenses/saved/receipt`).flush(new Blob(['receipt'],{type:'application/pdf'}));
        expect(URL.createObjectURL).toHaveBeenCalled();
      } else {
        expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')?.textContent).toContain('Sem comprovante');
        selectDetailReceipt(harness,new File(['receipt'],'receipt.pdf',{type:'application/pdf'}));
        click(harness,'upload-receipt');
        const upload=http.expectOne(`${api}/expenses/saved/receipt`);
        expect(upload.request.method).toBe('PUT');
        upload.flush({...detailExpense,receiptState:'UPLOADED'}); harness.detectChanges();
        expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')).toBeNull();
      }
      http.expectNone(request => request.method==='POST');
    });
  }
  async function detail(state: string) {
    const harness=await RouterTestingHarness.create('/despesas/saved');
    http.expectOne(`${api}/expenses/saved`).flush({...detailExpense,receiptState:state});
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]}); harness.detectChanges();
    return harness;
  }
  for (const state of ['NONE','PENDING']) {
    it(`shows the missing receipt tag for ${state} without claiming an upload failed`, async () => {
      const harness=await detail(state);
      expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')?.textContent).toContain('Sem comprovante');
      expect(harness.routeNativeElement!.textContent).not.toContain('mas o comprovante não foi enviado');
      expect(harness.routeNativeElement!.querySelector('[data-testid="upload-receipt"]')).not.toBeNull();
      http.expectNone(request => request.method==='POST' || request.method==='PUT');
    });
  }
  for (const status of [0,503]) {
    it(`reopens a saved expense after upload failure ${status} and retries only its receipt`, async () => {
      let harness=await detail('PENDING');
      const file=new File(['receipt'],'receipt.pdf',{type:'application/pdf'});
      selectDetailReceipt(harness,file); click(harness,'upload-receipt');
      const first=http.expectOne(`${api}/expenses/saved/receipt`);
      expect(first.request.method).toBe('PUT');
      expect((harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement).disabled).toBeTrue();
      expect((harness.routeNativeElement!.querySelector('[data-testid="upload-receipt"]') as HTMLButtonElement).disabled).toBeTrue();
      first.event({type:1,loaded:5,total:10}); harness.detectChanges();
      expect(harness.routeNativeElement!.querySelector('progress')?.value).toBe(50);
      if (status===0) first.error(new ProgressEvent('error'));
      else first.flush({}, {status,statusText:'Unavailable'});
      harness.detectChanges();
      expect(harness.routeNativeElement!.textContent).toContain('Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.');
      expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')).not.toBeNull();
      harness.fixture.destroy();
      http.verify(); TestBed.resetTestingModule(); configure();
      harness=await detail('PENDING');
      expect((harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement).files?.length).toBe(0);
      click(harness,'upload-receipt'); http.expectNone(request => request.method==='PUT');
      selectDetailReceipt(harness,file); click(harness,'upload-receipt');
      http.expectOne(`${api}/expenses/saved/receipt`).flush({}, {status:503,statusText:'Unavailable'});
      harness.detectChanges();
      expect(harness.routeNativeElement!.textContent).toContain('Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.');
      expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')).not.toBeNull();
      selectDetailReceipt(harness,file); click(harness,'upload-receipt');
      http.expectOne(`${api}/expenses/saved/receipt`).flush({...detailExpense,receiptState:'UPLOADED'}); harness.detectChanges();
      expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')).toBeNull();
      expect(harness.routeNativeElement!.querySelector('[data-testid="download-receipt"]')).not.toBeNull();
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]')).toBeNull();
      expect(harness.routeNativeElement!.textContent).not.toContain('mas o comprovante não foi enviado');
      http.expectNone(request => request.method==='POST');
    });
  }
  for (const status of [400,413]) {
    it(`keeps format guidance and clears an invalid replacement on receipt retry ${status}`, async () => {
      const harness=await detail('NONE');
      selectDetailReceipt(harness,new File(['receipt'],'receipt.pdf',{type:'application/pdf'}));
      const element=selectDetailReceipt(harness,new File(['bad'],'receipt.png',{type:'application/pdf'}));
      expect(element.value).toBe(''); click(harness,'upload-receipt');
      http.expectNone(request => request.method==='PUT');
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-error"]')?.textContent).toContain('JPEG, PNG ou PDF');
      selectDetailReceipt(harness,new File(['receipt'],'receipt.pdf',{type:'application/pdf'})); click(harness,'upload-receipt');
      http.expectOne(`${api}/expenses/saved/receipt`).flush({}, {status,statusText:'Rejected'}); harness.detectChanges();
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-error"]')?.textContent).toContain('10 MB (10 MiB)');
      expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')).not.toBeNull();
      http.expectNone(request => request.method==='POST');
    });
  }

  for (const file of [new File(['text'],'bad.txt',{type:'text/plain'}),
    new File([],'empty.pdf',{type:'application/pdf'}),
    new File(['text'],'bad.jpg',{type:'image/png'}),
    new File(['text'],'bad.gif',{type:'image/gif'}),
    new File(['text'],'missing.pdf'),
    new File(['%PDF-1.7\n%%EOF'],'bad.png',{type:'application/pdf'}),
    new File([new Uint8Array(10485761)],'large.pdf',{type:'application/pdf'})]) {
    it(`rejects selected ${file.name} and clears the previous attachment while allowing financial save`, async () => {
      const harness=await open();
      input(harness,'description','Sem anexo válido'); input(harness,'purchaseDate','2030-01-01');
      input(harness,'categoryId','category'); input(harness,'supplierId','supplier'); input(harness,'totalPrice','100');
      const fileInput=harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement;
      const select=async (chosen: File) => {
        const files=new DataTransfer(); files.items.add(chosen); fileInput.files=files.files;
        await (harness.routeDebugElement!.componentInstance as ExpenseFormComponent).selectReceipt({target:fileInput} as unknown as Event); await harness.fixture.whenStable(); harness.detectChanges();
      };
      await select(new File(['%PDF-1.7\n%%EOF'],'receipt.pdf',{type:'application/pdf'}));
      await select(file);
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-error"]')?.textContent).toContain('JPEG, PNG ou PDF');
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-error"]')?.textContent).toContain('10 MB');
      expect(fileInput.value).toBe('');
      click(harness,'save-expense');
      const post=http.expectOne(`${api}/expenses`); expect(post.request.body.receiptExpected).toBeUndefined();
      post.flush({},{status:400,statusText:'Bad Request'}); http.expectNone(request => request.method==='PUT');
    });
  }
  for (const [name,type,size] of [['receipt.JPG','image/jpeg',5], ['receipt.JPEG','image/jpeg',5],
    ['receipt.PNG','image/png',5], ['receipt.PDF','application/pdf',10485760]] as const) {
    it(`accepts ${name} by declared type and size without reading its bytes`, async () => {
      const harness=await open();
      const file=new File([new Uint8Array(size)],name,{type});
      const read=spyOn(file,'arrayBuffer').and.rejectWith(new Error('must not inspect content'));
      const fileInput=harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement;
      const files=new DataTransfer(); files.items.add(file); fileInput.files=files.files;
      const component=harness.routeDebugElement!.componentInstance as ExpenseFormComponent;
      component.selectReceipt({target:fileInput} as unknown as Event);
      await harness.fixture.whenStable(); harness.detectChanges();
      expect(read).not.toHaveBeenCalled();
      expect(component.receiptFile()).toBe(file);
      expect(component.receiptError()).toBe('');
    });
  }
  for (const status of [400,413]) {
    it(`shows a specific receipt error for API ${status} and keeps the saved expense`, async () => {
      const harness=await open();
      input(harness,'description','Com recibo'); input(harness,'purchaseDate','2030-01-01');
      input(harness,'categoryId','category'); input(harness,'supplierId','supplier'); input(harness,'totalPrice','100');
      const fileInput=harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement;
      const files=new DataTransfer(); files.items.add(new File(['%PDF-1.7\n%%EOF'],'receipt.pdf',{type:'application/pdf'}));
      fileInput.files=files.files; await (harness.routeDebugElement!.componentInstance as ExpenseFormComponent).selectReceipt({target:fileInput} as unknown as Event); await harness.fixture.whenStable();
      click(harness,'save-expense');
      http.expectOne(`${api}/expenses`).flush({id:'saved',receiptState:'PENDING'},{status:201,statusText:'Created'});
      http.expectOne(`${api}/expenses/saved/receipt`).flush({message:'Arquivo rejeitado.'},{status,statusText:'Rejected'});
      harness.detectChanges();
      expect(harness.routeNativeElement!.textContent).toContain('Despesa salva');
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-error"]')?.textContent).toContain('JPEG, PNG ou PDF');
      expect(harness.routeNativeElement!.querySelector('[data-testid="receipt-error"]')?.textContent).toContain('10 MB (10 MiB)');
      expect(harness.routeNativeElement!.textContent).toContain('Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.');
      expect(harness.routeNativeElement!.querySelector('progress')).toBeNull();
      expect(TestBed.inject(Router).url).toBe('/despesas/nova');
      expect(harness.routeNativeElement!.querySelector('a[href="/despesas/saved"]')).not.toBeNull();
      click(harness,'save-expense'); http.expectNone(request => request.method==='POST');
    });
  }
  it('explains formats and size, uploads only after confirmation and displays progress', async () => {
    const harness = await open();
    expect(harness.routeNativeElement!.textContent).toContain('JPEG, PNG e PDF');
    expect(harness.routeNativeElement!.textContent).toContain('10 MB');
    input(harness,'description','Com recibo'); input(harness,'purchaseDate','2030-01-01');
    input(harness,'categoryId','category'); input(harness,'supplierId','supplier'); input(harness,'totalPrice','100');
    const fileInput = harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();
    const files=new DataTransfer(); files.items.add(new File(['%PDF-1.7\n%%EOF'],'recibo.pdf',{type:'application/pdf'}));
    fileInput.files=files.files; await (harness.routeDebugElement!.componentInstance as ExpenseFormComponent).selectReceipt({target:fileInput} as unknown as Event); await harness.fixture.whenStable(); harness.detectChanges();
    click(harness,'save-expense');
    http.expectNone(`${api}/expenses/receipt/receipt`);
    const post=http.expectOne(`${api}/expenses`); expect(post.request.body.receiptExpected).toBeTrue();
    http.expectNone(request => request.method === 'PUT');
    const saved={...post.request.body,id:'receipt',supplier:{name:'Loja'},receiptState:'PENDING'};
    post.flush(saved,{status:201,statusText:'Created'});
    const upload=http.expectOne(`${api}/expenses/receipt/receipt`);
    expect(upload.request.method).toBe('PUT'); expect(upload.request.body instanceof FormData).toBeTrue();
    upload.event({type:1,loaded:5,total:10}); harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('progress')?.value).toBe(50);
    upload.flush({...saved,receiptState:'UPLOADED'});
    await harness.fixture.whenStable(); http.expectOne(`${api}/expenses/receipt`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]});
  });  it('downloads a confirmed receipt through the API service as a blob', async () => {
    spyOn(URL,'createObjectURL').and.returnValue('blob:receipt-test');
    spyOn(URL,'revokeObjectURL'); spyOn(HTMLAnchorElement.prototype,'click');
    const harness=await RouterTestingHarness.create('/despesas/confirmed');
    http.expectOne(`${api}/expenses/confirmed`).flush({id:'confirmed',projectId:'project',description:'Com recibo',
      purchaseDate:'2030-01-01',categoryId:'category',categoryName:'Alvenaria',supplier:{name:'Loja'},
      totalPrice:1,quantity:null,unitPrice:null,paid:true,dueDate:null,receiptState:'UPLOADED'});
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]}); harness.detectChanges();
    const button=harness.routeNativeElement!.querySelector('[data-testid="download-receipt"]')!;
    expect(button.getAttribute('href')).toBeNull(); click(harness,'download-receipt');
    const download=http.expectOne(`${api}/expenses/confirmed/receipt`);
    expect(download.request.method).toBe('GET'); expect(download.request.responseType).toBe('blob');
    const blob=new Blob(['%PDF-1.7'],{type:'application/pdf'}); download.flush(blob);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:receipt-test');
  });
  it('keeps the confirmed expense and prevents another creation after an upload failure', async () => {
    const harness=await open();
    input(harness,'description','Com recibo'); input(harness,'purchaseDate','2030-01-01');
    input(harness,'categoryId','category'); input(harness,'supplierId','supplier'); input(harness,'totalPrice','100');
    const fileInput=harness.routeNativeElement!.querySelector('[data-testid="receipt-file"]') as HTMLInputElement;
    const files=new DataTransfer(); files.items.add(new File(['%PDF-1.7\n%%EOF'],'receipt.pdf',{type:'application/pdf'}));
    fileInput.files=files.files; await (harness.routeDebugElement!.componentInstance as ExpenseFormComponent).selectReceipt({target:fileInput} as unknown as Event); await harness.fixture.whenStable(); click(harness,'save-expense');
    http.expectOne(`${api}/expenses`).flush({id:'saved',receiptState:'PENDING'},{status:201,statusText:'Created'});
    http.expectOne(`${api}/expenses/saved/receipt`).flush({},{status:503,statusText:'Unavailable'}); harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Despesa salva, mas o comprovante não foi enviado. Você pode tentar novamente.');
    expect(harness.routeNativeElement!.querySelector('a[href="/despesas/saved"]')).not.toBeNull();
    click(harness,'save-expense'); http.expectNone(request => request.method === 'POST');
  });  it('shows required errors and does not send an invalid form', async () => {
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
      totalPrice:100.25,quantity:null,unitPrice:null,paid:true,receiptState:'NONE'};
    request.flush(saved,{status:201,statusText:'Created'});
    await harness.fixture.whenStable();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({categories:[]});
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/despesas/expense');
    expect(harness.routeNativeElement!.textContent).toContain('Cimento');
    expect(harness.routeNativeElement!.textContent).toContain('Quitada');
    expect(harness.routeNativeElement!.querySelector('[data-testid="no-receipt"]')?.textContent).toContain('Sem comprovante');
    expect(harness.routeNativeElement!.textContent).not.toContain('mas o comprovante não foi enviado');
    http.expectNone(request => request.method === 'PUT');
  });
  for (const scenario of [
    {state:'EXCEEDED',percentage:100,spent:100.25,planned:100.25,alert:true},
    {state:'EXCEEDED',percentage:110,spent:110.25,planned:100.25,alert:true},
    {state:'WARNING',percentage:100,spent:99.96,planned:100,alert:false},
    {state:'ON_TRACK',percentage:50,spent:50,planned:100,alert:false},
    {state:'NO_BUDGET',percentage:null,spent:100.25,planned:0,alert:false},
    {state:'missing',percentage:null,spent:100.25,planned:0,alert:false},
    {state:'unavailable',percentage:null,spent:100.25,planned:0,alert:false},
  ]) {
  it(`preserves the saved expense after navigation with budget state ${scenario.state} (${scenario.spent})`, async () => {
    const harness = await open();
    input(harness,'description','Cimento'); input(harness,'purchaseDate','2030-01-01');
    input(harness,'categoryId','category'); input(harness,'supplierId','supplier');
    input(harness,'totalPrice','10025'); click(harness,'save-expense');
    const saved = {id:'expense',projectId:'project',description:'Cimento',purchaseDate:'2030-01-01',
      categoryId:'category',categoryName:'Alvenaria',supplier:{id:'supplier',name:'Loja',document:'12345678000190'},
      totalPrice:100.25,quantity:null,unitPrice:null,paid:true,dueDate:null};
    http.expectOne(`${api}/expenses`).flush(saved,{status:201,statusText:'Created'});
    await harness.fixture.whenStable();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    harness.detectChanges();
    const budgetRequest = http.expectOne(`${api}/budgets?projectId=project`);
    if (scenario.state === 'unavailable') {
      budgetRequest.flush({}, {status:503,statusText:'Unavailable'});
    } else {
      budgetRequest.flush({projectId:'project',categories:[
        {categoryId:'other',state:'EXCEEDED',percentage:200,plannedAmount:1,spentAmount:2},
        ...(scenario.state === 'missing' ? [] : [{categoryId:'category',state:scenario.state,
          percentage:scenario.percentage,plannedAmount:scenario.planned,spentAmount:scenario.spent}])
      ]});
    }
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/despesas/expense');
    expect(harness.routeNativeElement!.textContent).toContain('Despesa salva');
    const alert = harness.routeNativeElement!.querySelector('[data-testid="budget-ceiling-alert"]');
    expect(!!alert).toBe(scenario.alert);
    if (scenario.alert) {
      expect(alert!.textContent).toContain('Revise o orçamento');
      expect(alert!.getAttribute('role')).toBe('alert');
      expect(alert!.querySelector('a')?.getAttribute('href')).toBe('/orcamentos');
    }
    if (scenario.state === 'unavailable') {
      expect(harness.routeNativeElement!.textContent).toContain('Não foi possível consultar o orçamento');
      expect(harness.routeNativeElement!.textContent).toContain('Cimento');
    }
    http.expectNone(`${api}/expenses`);
  });
  }
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
