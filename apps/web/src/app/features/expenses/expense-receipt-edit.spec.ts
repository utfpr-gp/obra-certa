import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ExpenseDetailComponent } from './expense-detail.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ExpenseResponse } from '../../core/models/expense-registration.model';
import { environment } from '../../../environments/environment';

const saved: ExpenseResponse = {
  id: 'expense', projectId: 'project', description: 'Cimento', purchaseDate: '2030-01-01',
  categoryId: 'category', categoryName: 'Alvenaria', supplier: { id: 'supplier', name: 'Loja', document: null },
  paid: false, dueDate: '2030-01-02', paidAt: null, quantity: null, unitPrice: null,
  totalPrice: 1234.56, receiptState: 'UPLOADED'
};

describe('Expense receipt removal', () => {
  let fixture: ComponentFixture<ExpenseDetailComponent>;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/api`;
  const endpoint = `${api}/expenses/expense/receipt`;
  const el = (id: string): HTMLElement | null => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);
  function clickRemove() {
    expect(el('remove-receipt')).not.toBeNull();
    el('remove-receipt')?.click(); fixture.detectChanges();
  }
  function selectProject(id: string) {
    TestBed.inject(ActiveProjectService).selectProject(
      { id, name: 'Casa', type: 'RENOVATION', status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' }, 'owner');
  }
  function selectReplacement(file = new File(['new'], 'new.png', { type: 'image/png' })) {
    const input = el('receipt-file') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) return;
    const files = new DataTransfer(); files.items.add(file);
    input.files = files.files; input.dispatchEvent(new Event('change')); fixture.detectChanges();
  }
  function uploadReplacement() {
    expect(el('upload-receipt')).not.toBeNull(); el('upload-receipt')?.click(); fixture.detectChanges();
  }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'expense']]) } } }] });
    selectProject('project');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseDetailComponent); fixture.detectChanges();
    http.expectOne(`${api}/expenses/expense`).flush(saved);
    http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
  });
  afterEach(() => { http.verify(); TestBed.inject(ActiveProjectService).clear(); });

  it('sends a single DELETE while busy and shows no receipt only after confirmed success', () => {
    clickRemove();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('DELETE');
    expect((el('remove-receipt') as HTMLButtonElement)?.disabled).toBeTrue();
    expect(el('no-receipt')).toBeNull();
    clickRemove(); http.expectNone(endpoint);
    request.flush({ ...saved, receiptState: 'NONE' }); fixture.detectChanges();
    expect(el('no-receipt')?.textContent).toContain('Sem comprovante');
    expect(el('download-receipt')).toBeNull(); expect(el('remove-receipt')).toBeNull();
    expect(fixture.componentInstance.expense()).toEqual({ ...saved, receiptState: 'NONE' });
    expect(fixture.nativeElement.textContent).toContain('Cimento');
    expect(fixture.nativeElement.textContent).toContain('Pendente');
    expect(fixture.nativeElement.textContent).toContain('02/01/2030');
    expect(fixture.nativeElement.textContent).toContain('1.234,56');
  });

  it('keeps the attachment and financial data on error and permits a manual retry', () => {
    clickRemove();
    http.expectOne(endpoint).flush({}, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    expect(el('no-receipt')).toBeNull(); expect(el('download-receipt')).not.toBeNull();
    expect(fixture.componentInstance.expense()).toEqual(saved);
    expect(fixture.componentInstance.errorMessage()).toContain('não foi confirmada');
    expect(fixture.componentInstance.errorMessage()).toContain('tentar novamente');
    expect((el('remove-receipt') as HTMLButtonElement)?.disabled).toBeFalse();
    http.expectNone(endpoint);
    clickRemove();
    http.expectOne(endpoint).flush({ ...saved, receiptState: 'NONE' }); fixture.detectChanges();
    expect(el('no-receipt')).not.toBeNull(); expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  it('ignores late success after switching A to B to A', () => {
    clickRemove(); const request = http.expectOne(endpoint);
    selectProject('other'); selectProject('project'); fixture.detectChanges();
    request.flush({ ...saved, receiptState: 'NONE' }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull(); expect(el('no-receipt')).toBeNull();
    expect(fixture.componentInstance.errorMessage()).toContain('A obra foi alterada');
  });

  it('selects a replacement, shows progress and consults the confirmed new receipt', () => {
    selectReplacement(); uploadReplacement();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('PUT'); expect(request.request.reportProgress).toBeTrue();
    expect((request.request.body as FormData).get('file') instanceof File).toBeTrue();
    expect((el('upload-receipt') as HTMLButtonElement).disabled).toBeTrue();
    expect((el('remove-receipt') as HTMLButtonElement).disabled).toBeTrue();
    expect((el('download-receipt') as HTMLButtonElement).disabled).toBeTrue();
    fixture.componentInstance.uploadReceipt(); fixture.componentInstance.removeReceipt(); fixture.componentInstance.downloadReceipt();
    http.expectNone(endpoint);
    request.event({ type: HttpEventType.UploadProgress, loaded: 1, total: 2 }); fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('progress') as HTMLProgressElement)?.value).toBe(50);
    request.flush({ ...saved, receiptDeletionFailed: false }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()?.receiptState).toBe('UPLOADED');
    expect(el('no-receipt')).toBeNull(); expect(fixture.nativeElement.querySelector('progress')).toBeNull();
    const createUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:new');
    spyOn(URL, 'revokeObjectURL'); spyOn(HTMLAnchorElement.prototype, 'click');
    el('download-receipt')?.click();
    const download = http.expectOne(endpoint); expect(download.request.method).toBe('GET');
    const blob = new Blob(['new'], { type: 'image/png' }); download.flush(blob);
    expect(createUrl).toHaveBeenCalledWith(blob);
  });

  it('keeps the confirmed old receipt on upload failure and permits a manual retry', () => {
    selectReplacement(); uploadReplacement();
    http.expectOne(endpoint).flush({}, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toEqual(saved); expect(el('download-receipt')).not.toBeNull();
    expect(el('no-receipt')).toBeNull(); expect(fixture.componentInstance.errorMessage()).toContain('anterior');
    expect(fixture.componentInstance.errorMessage()).toContain('preservado');
    expect((el('upload-receipt') as HTMLButtonElement).disabled).toBeFalse(); http.expectNone(endpoint);
    uploadReplacement(); http.expectOne(endpoint).flush({ ...saved, receiptDeletionFailed: false }); fixture.detectChanges();
    expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  for (const status of [0, 500]) {
    it(`does not claim preservation or retry automatically after an unconfirmed response ${status}`, () => {
      selectReplacement(); uploadReplacement(); const request = http.expectOne(endpoint);
      if (status === 0) request.error(new ProgressEvent('error'));
      else request.flush({}, { status, statusText: 'Internal Server Error' });
      fixture.detectChanges();
      expect(fixture.componentInstance.errorMessage()).toContain('A substituição não foi confirmada');
      expect(fixture.componentInstance.errorMessage()).toContain('Consulte o estado atual');
      expect(fixture.componentInstance.errorMessage()).not.toContain('preservado');
      expect(fixture.componentInstance.errorMessage()).not.toContain('foi enviado');
      expect(fixture.componentInstance.expense()).toEqual(saved);
      expect((el('upload-receipt') as HTMLButtonElement).disabled).toBeFalse();
      http.expectNone(endpoint);
    });
  }

  it('warns when only old deletion failed without reporting upload failure or offering an old version', () => {
    selectReplacement(); uploadReplacement();
    http.expectOne(endpoint).flush({ ...saved, receiptDeletionFailed: true }); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Novo comprovante salvo'); expect(text).toContain('não foi possível apagar o anterior');
    expect(text).not.toContain('não foi enviado'); expect(text).not.toMatch(/automaticamente|agendad|será apagado|versão anterior/i);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="download-receipt"]').length).toBe(1);
    expect(fixture.componentInstance.expense()?.receiptState).toBe('UPLOADED');
    http.expectNone(endpoint);
  });

  it('rejects an invalid replacement without sending or hiding the current receipt', () => {
    selectReplacement(new File(['bad'], 'bad.pdf', { type: 'image/png' }));
    expect(el('receipt-error')?.textContent).toContain('JPEG, PNG ou PDF');
    expect((el('upload-receipt') as HTMLButtonElement)?.disabled).toBeTrue();
    expect(el('download-receipt')).not.toBeNull(); http.expectNone(endpoint);
  });

  it('does not start replacement during removal or download', () => {
    selectReplacement(); clickRemove(); const removal = http.expectOne(endpoint);
    fixture.componentInstance.uploadReceipt(); http.expectNone(endpoint);
    removal.flush({ ...saved }); fixture.detectChanges();
    fixture.componentInstance.downloadReceipt(); const download = http.expectOne(endpoint);
    fixture.componentInstance.uploadReceipt(); http.expectNone(endpoint);
    download.flush(null, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
  });

  it('ignores a late replacement response after switching A to B to A', () => {
    selectReplacement(); uploadReplacement(); const request = http.expectOne(endpoint);
    selectProject('other'); selectProject('project'); fixture.detectChanges();
    request.flush({ ...saved, receiptDeletionFailed: true }); fixture.detectChanges();
    expect(fixture.componentInstance.expense()).toBeNull(); expect(el('download-receipt')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Novo comprovante salvo');
  });

  for (const operation of ['remove', 'replace']) {
    it(`offers a manual state check after a lost ${operation} response without resubmitting`, () => {
      if (operation === 'remove') clickRemove();
      else { selectReplacement(); uploadReplacement(); }
      http.expectOne(endpoint).error(new ProgressEvent('error')); fixture.detectChanges();
      expect(fixture.componentInstance.expense()).toEqual(saved); http.expectNone(endpoint);
      const check = el('check-receipt-state'); expect(check).not.toBeNull();
      check?.click(); fixture.detectChanges();
      http.expectOne(`${api}/expenses/expense`).flush({ ...saved, receiptState: operation === 'remove' ? 'NONE' : 'UPLOADED' });
      http.expectOne(`${api}/budgets?projectId=project`).flush({ categories: [] }); fixture.detectChanges();
      expect(fixture.componentInstance.expense()?.receiptState).toBe(operation === 'remove' ? 'NONE' : 'UPLOADED');
      expect(el('check-receipt-state')).toBeNull();
      expect(fixture.componentInstance.errorMessage()).toBe('');
      http.expectNone(request => request.method !== 'GET');
    });
  }
});
