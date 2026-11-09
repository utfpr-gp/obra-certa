import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../core/interceptors/auth-interceptor';
import { ExpenseCategory } from '../../../core/models/expense-category.model';
import { ExpenseResponse } from '../../../core/models/expense-registration.model';
import { NfePreview } from '../../../core/models/nfe-import.model';
import { Project, ProjectStatus, ProjectType } from '../../../core/models/project.model';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { Auth } from '../../../core/services/auth';
import { NfeImportService } from '../../../core/services/nfe-import.service';
import { NfeImportDialogComponent } from './nfe-import-dialog.component';

describe('NfeImportDialogComponent', () => {
  let fixture: ComponentFixture<NfeImportDialogComponent>;
  let http: HttpTestingController;
  let active: ActiveProjectService;
  let closedCount: number;
  let opener: HTMLButtonElement;

  const projectA: Project = {
    id: 'project-a', name: 'Obra A', type: ProjectType.RENOVATION, status: ProjectStatus.IN_PROGRESS,
    location: null, createdAt: '', updatedAt: '',
  };
  const projectB: Project = { ...projectA, id: 'project-b', name: 'Obra B' };
  const url = `${environment.apiUrl}/api/projects/project-a/nfe/preview`;
  const importsUrl = `${environment.apiUrl}/api/projects/project-a/nfe/imports`;
  const categoriesUrl = `${environment.apiUrl}/api/expense-categories`;

  const preview: NfePreview = {
    projectId: 'project-a',
    accessKey: '35260112345678000199550010000012341000012345',
    issueDate: '2026-07-10',
    supplier: { name: 'Fornecedor XPTO', document: '12345678000199' },
    items: [
      { itemNumber: 1, description: 'Cimento CP II', quantity: 2, unit: 'saco', unitPrice: 25, totalPrice: 50 },
      { itemNumber: 2, description: 'Areia média', quantity: 1.5, unit: 'm³', unitPrice: 80, totalPrice: 120 },
    ],
    total: 170,
  };

  const categories: ExpenseCategory[] = [
    { id: 'cat-1', name: 'Alvenaria' },
    { id: 'cat-2', name: 'Elétrica' },
  ];

  const created: ExpenseResponse[] = preview.items.map((item, index) => ({
    id: `expense-${item.itemNumber}`,
    projectId: 'project-a',
    description: item.description,
    purchaseDate: '2026-07-10',
    categoryId: categories[index].id,
    categoryName: categories[index].name,
    supplier: { id: 'sup-1', name: 'Fornecedor XPTO', document: '12345678000199' },
    paid: true,
    dueDate: null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    receiptState: index === 0 ? 'UPLOADED' : 'NONE',
  }));

  const el = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
    fixture.nativeElement.querySelector(`[data-testid="${id}"]`);

  function choose(file: File): void {
    const input = el<HTMLInputElement>('nfe-file-input');
    expect(input).withContext('nfe-file-input').not.toBeNull();
    if (!input) return;
    const files = new DataTransfer();
    files.items.add(file);
    input.files = files.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function click(id: string): void {
    const target = el(id);
    expect(target).withContext(id).not.toBeNull();
    target?.click();
    fixture.detectChanges();
  }

  function send(): void {
    choose(new File(['<nfe/>'], 'nota.xml', { type: 'application/xml' }));
    click('nfe-submit');
  }

  function openPreview(): void {
    send();
    http.expectOne(url).flush(preview);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush(categories);
    fixture.detectChanges();
  }

  function selectCategory(itemNumber: number, categoryId: string): void {
    const select = el<HTMLSelectElement>(`nfe-category-${itemNumber}`);
    expect(select).withContext(`nfe-category-${itemNumber}`).not.toBeNull();
    if (!select) return;
    select.value = categoryId;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function selectAllCategories(): void {
    selectCategory(1, 'cat-1');
    selectCategory(2, 'cat-2');
  }

  function confirm(): void {
    click('nfe-confirm');
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NfeImportDialogComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    active = TestBed.inject(ActiveProjectService);
    active.setActiveProject(projectA, 'owner');
    http = TestBed.inject(HttpTestingController);
    opener = document.createElement('button');
    opener.textContent = 'Abrir importação';
    document.body.appendChild(opener);
    opener.focus();
    fixture = TestBed.createComponent(NfeImportDialogComponent);
    fixture.componentRef.setInput('projectId', projectA.id);
    closedCount = 0;
    fixture.componentInstance.closed.subscribe(() => closedCount++);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    opener.remove();
    http.verify();
    localStorage.clear();
  });

  it('opens an accessible dialog that accepts only XML files', () => {
    const dialog = el('nfe-import-dialog');
    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(el<HTMLInputElement>('nfe-file-input')?.accept).toBe('.xml');
  });

  it('refuses an empty file as a convenience without calling the API', () => {
    choose(new File([], 'empty.xml', { type: 'application/xml' }));
    click('nfe-submit');

    expect(el('nfe-file-error')?.textContent).toContain('Selecione um arquivo XML');
    http.expectNone(url);
  });

  it('sends the XML and shows supplier, issue date, access key, every item and the note total', () => {
    openPreview();

    expect(el('nfe-supplier-name')?.textContent).toContain('Fornecedor XPTO');
    expect(el('nfe-supplier-document')?.textContent).toContain('12345678000199');
    expect(el('nfe-issue-date')?.textContent).toContain('10/07/2026');
    expect(el('nfe-access-key')?.textContent).toContain('3526 0112 3456 7800 0199 5500 1000 0012 3410 0001 2345');
    expect(el('nfe-total')?.textContent).toContain('170,00');

    const items = el('nfe-items');
    expect(items?.textContent).toContain('Cimento CP II');
    expect(items?.textContent).toContain('saco');
    expect(items?.textContent).toContain('50,00');
    expect(items?.textContent).toContain('Areia média');
    expect(items?.textContent).toContain('120,00');
    expect(items?.querySelectorAll('[data-testid^="nfe-item-"]').length).toBe(2);
    expect(el('nfe-submit')).toBeNull();
  });

  it('explains an invalid XML with the backend reason and offers manual registration', () => {
    send();
    http.expectOne(url).flush(
      { status: 400, message: 'O arquivo XML está corrompido ou incompleto', fieldErrors: [] },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(el('nfe-invalid-alert')?.textContent).toContain('O arquivo XML está corrompido ou incompleto');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    click('nfe-manual');

    expect(navigate).toHaveBeenCalledWith(['/contas/nova']);
    expect(closedCount).toBe(1);
  });

  it('shows an informational alert when the access key was already registered, without manual registration', () => {
    send();
    http.expectOne(url).flush(
      { status: 409, message: 'A nota fiscal já foi registrada', fieldErrors: [] },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(el('nfe-conflict-alert')?.textContent).toContain('A nota fiscal já foi registrada');
    expect(el('nfe-manual')).toBeNull();
    click('close-nfe-import');
    expect(closedCount).toBe(1);
  });

  it('offers a retry with the same file after a network/server failure', () => {
    send();
    http.expectOne(url).flush({}, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    expect(el('nfe-failure-alert')).not.toBeNull();
    click('nfe-retry');

    const retry = http.expectOne(url);
    expect((retry.request.body as FormData).get('file')).toEqual(jasmine.any(File));
    expect(((retry.request.body as FormData).get('file') as File).name).toBe('nota.xml');
    retry.flush(preview);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush(categories);
    fixture.detectChanges();
    expect(el('nfe-supplier-name')?.textContent).toContain('Fornecedor XPTO');
  });

  it('ends a stalled upload at 30 seconds and offers a manual retry', fakeAsync(() => {
    send();
    const request = http.expectOne(url);

    tick(29999);
    fixture.detectChanges();
    expect(el('nfe-failure-alert')).toBeNull();
    tick(1);
    fixture.detectChanges();

    expect(request.cancelled).toBeTrue();
    expect(el('nfe-failure-alert')).not.toBeNull();
    expect(el('nfe-retry')).not.toBeNull();
    http.expectNone(url);
  }));

  it('keeps the existing 401 interceptor flow without showing a retry', () => {
    TestBed.inject(Auth).saveToken('session-token');
    const auth = TestBed.inject(Auth);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    send();

    const request = http.expectOne(url);
    expect(request.request.headers.get('Authorization')).toBe('Bearer session-token');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(auth.getToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(el('nfe-failure-alert')).toBeNull();
    http.expectNone(url);
  });

  it('discards an old response and closes the dialog when the project changes, including A → B → A', () => {
    send();
    http.expectOne(url);

    active.setActiveProject(projectB, 'owner');
    fixture.detectChanges();
    expect(closedCount).toBe(1);

    active.setActiveProject(projectA, 'owner');
    fixture.detectChanges();
    expect(closedCount).toBe(1);
  });

  it('does not show an old response received after the A → B → A transition', () => {
    send();
    const request = http.expectOne(url);

    active.setActiveProject(projectB, 'owner');
    fixture.detectChanges();
    active.setActiveProject(projectA, 'owner');
    fixture.detectChanges();

    request.flush(preview);
    fixture.detectChanges();

    expect(el('nfe-preview')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Fornecedor XPTO');
    expect(closedCount).toBe(1);
  });

  it('blocks confirmation while an item has no category and lists the missing item numbers', () => {
    openPreview();

    expect(el('nfe-missing-categories')?.textContent).toContain('Itens sem categoria: 1, 2');
    expect(el<HTMLButtonElement>('nfe-confirm')?.disabled).toBeTrue();

    selectCategory(1, 'cat-1');
    expect(el('nfe-missing-categories')?.textContent).toContain('Itens sem categoria: 2');
    expect(el<HTMLButtonElement>('nfe-confirm')?.disabled).toBeTrue();

    fixture.componentInstance.confirm();
    fixture.detectChanges();
    http.expectNone(importsUrl);
  });

  it('confirms the chosen categories and paid=true, then only Concluir emits imported and closed', async () => {
    openPreview();
    selectAllCategories();

    const order: string[] = [];
    let imported: ExpenseResponse[] | undefined;
    fixture.componentInstance.imported.subscribe((list) => { order.push('imported'); imported = list; });
    fixture.componentInstance.closed.subscribe(() => order.push('closed'));

    expect(el<HTMLInputElement>('nfe-paid')?.checked).toBeTrue();
    expect(el('nfe-paid-label')?.textContent).toContain('Paga em 10/07/2026');

    confirm();
    const request = http.expectOne(importsUrl);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect((body.get('file') as File).name).toBe('nota.xml');

    const items = body.get('items') as Blob;
    expect(items.type).toBe('application/json');
    expect(JSON.parse(await items.text())).toEqual({
      items: [
        { itemNumber: 1, categoryId: 'cat-1' },
        { itemNumber: 2, categoryId: 'cat-2' },
      ],
    });

    const payment = body.get('payment') as Blob;
    expect(payment.type).toBe('application/json');
    expect(JSON.parse(await payment.text())).toEqual({ paid: true });

    request.flush(created);
    fixture.detectChanges();

    expect(order).toEqual([]);
    expect(el('nfe-result')?.textContent).toContain('2 linhas criadas');
    expect(el('nfe-result')?.textContent).toContain('170,00');
    expect(el('nfe-result')?.textContent).toContain('3526 0112 3456 7800 0199 5500 1000 0012 3410 0001 2345');
    expect(el('close-nfe-import')).toBeNull();

    click('nfe-finish');
    expect(order).toEqual(['imported', 'closed']);
    expect(imported).toEqual(created);
  });

  it('starts with the paid checkbox checked and sends paid=false with the pending consequence label', async () => {
    openPreview();
    selectAllCategories();

    const paid = el<HTMLInputElement>('nfe-paid');
    expect(paid?.checked).toBeTrue();
    if (!paid) return;
    paid.checked = false;
    paid.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(el('nfe-paid-label')?.textContent).toContain('Pendente, vence em 10/07/2026');

    confirm();
    const request = http.expectOne(importsUrl);
    const payment = (request.request.body as FormData).get('payment') as Blob;
    expect(payment.type).toBe('application/json');
    expect(JSON.parse(await payment.text())).toEqual({ paid: false });
    request.flush(created);
  });

  it('sends only one confirmation when the button is clicked twice before the response', () => {
    openPreview();
    selectAllCategories();

    const button = el<HTMLButtonElement>('nfe-confirm');
    button?.click();
    button?.click();
    fixture.detectChanges();
    fixture.componentInstance.confirm();

    const requests = http.match((request) => request.url === importsUrl);
    expect(requests.length).toBe(1);
    requests[0].flush(created);
    fixture.detectChanges();
    expect(el('nfe-result')).not.toBeNull();
  });

  it('does not close through X, Escape or backdrop while the confirmation is in flight', () => {
    openPreview();
    selectAllCategories();
    confirm();
    http.expectOne(importsUrl);

    click('close-nfe-import');
    expect(closedCount).toBe(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(closedCount).toBe(0);

    const backdrop = el('nfe-backdrop');
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(closedCount).toBe(0);
  });

  it('closes before confirming without sending any import', () => {
    openPreview();
    selectAllCategories();

    click('close-nfe-import');

    expect(closedCount).toBe(1);
    http.expectNone(importsUrl);
  });

  it('shows a confirmation 409 without success or result and keeps the choices', () => {
    openPreview();
    selectAllCategories();
    confirm();

    http.expectOne(importsUrl).flush(
      { status: 409, message: 'A nota fiscal já foi registrada', fieldErrors: [] },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(el('nfe-confirm-error')?.textContent).toContain('A nota fiscal já foi registrada');
    expect(el('nfe-result')).toBeNull();
    expect(el<HTMLSelectElement>('nfe-category-1')?.value).toBe('cat-1');
    expect(el<HTMLSelectElement>('nfe-category-2')?.value).toBe('cat-2');
  });

  it('returns to the conference with the category message and keeps the choices after a 400', () => {
    openPreview();
    selectAllCategories();
    confirm();

    http.expectOne(importsUrl).flush(
      { status: 400, message: 'Itens sem categoria: 1, 3', fieldErrors: [] },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(el('nfe-confirm-error')?.textContent).toContain('Itens sem categoria: 1, 3');
    expect(el('nfe-preview')).not.toBeNull();
    expect(el('nfe-result')).toBeNull();
    expect(el<HTMLSelectElement>('nfe-category-1')?.value).toBe('cat-1');
    expect(el<HTMLSelectElement>('nfe-category-2')?.value).toBe('cat-2');
  });

  it('blocks confirmation when categories fail to load and retries only the categories', () => {
    send();
    http.expectOne(url).flush(preview);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('nfe-categories-error')?.textContent).toContain('Não foi possível carregar as categorias');
    expect(el<HTMLButtonElement>('nfe-confirm')?.disabled).toBeTrue();

    click('nfe-categories-retry');
    http.expectNone(url);
    http.expectOne(categoriesUrl).flush(categories);
    fixture.detectChanges();

    expect(el<HTMLButtonElement>('nfe-confirm')?.disabled).toBeTrue();
    selectAllCategories();
    expect(el<HTMLButtonElement>('nfe-confirm')?.disabled).toBeFalse();
  });

  it('discards the confirmation response when the project changes while it is in flight', () => {
    openPreview();
    selectAllCategories();
    confirm();
    const request = http.expectOne(importsUrl);

    active.setActiveProject(projectB, 'owner');
    fixture.detectChanges();
    expect(closedCount).toBe(1);

    request.flush(created);
    fixture.detectChanges();

    expect(el('nfe-result')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('linhas criadas');
  });

  it('reports an uncertain result after a confirmation timeout and retries the same form data', fakeAsync(() => {
    openPreview();
    selectAllCategories();
    confirm();
    const request = http.expectOne(importsUrl);

    tick(30000);
    fixture.detectChanges();

    expect(request.cancelled).toBeTrue();
    expect(el('nfe-confirm-error')?.textContent).toContain('Não é possível saber se a importação foi gravada');
    expect(el('nfe-confirm-retry')).not.toBeNull();

    click('nfe-confirm-retry');
    const retry = http.expectOne(importsUrl);
    expect((retry.request.body as FormData).get('file')).toEqual(jasmine.any(File));
    retry.flush(created);
    fixture.detectChanges();

    expect(el('nfe-result')).not.toBeNull();
  }));

  it('ignores a different file chosen while the preview upload is in flight', () => {
    const fileA = new File(['<nfe/>'], 'nota-a.xml', { type: 'application/xml' });
    const fileB = new File(['<nfe/>'], 'nota-b.xml', { type: 'application/xml' });

    choose(fileA);
    click('nfe-submit');
    const request = http.expectOne(url);
    fixture.detectChanges();

    expect(el<HTMLInputElement>('nfe-file-input')?.disabled).toBeTrue();
    expect(el<HTMLButtonElement>('nfe-submit')?.disabled).toBeTrue();

    choose(fileB);
    expect(fixture.componentInstance.selectedFile()?.name).toBe('nota-a.xml');
    expect(fixture.componentInstance.phase()).toBe('sending');
    http.expectNone(url);

    request.flush(preview);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush(categories);
    fixture.detectChanges();

    expect(el('nfe-supplier-name')?.textContent).toContain('Fornecedor XPTO');

    selectAllCategories();
    confirm();
    const confirmation = http.expectOne(importsUrl);
    expect(((confirmation.request.body as FormData).get('file') as File).name).toBe('nota-a.xml');
    confirmation.flush(created);
  });

  it('discards a preview response from an older request generation', () => {
    const service = TestBed.inject(NfeImportService);
    const responses: Subject<NfePreview>[] = [];
    spyOn(service, 'preview').and.callFake(() => {
      const subject = new Subject<NfePreview>();
      responses.push(subject);
      return subject.asObservable();
    });
    const previewB: NfePreview = { ...preview, supplier: { name: 'Fornecedor B', document: '98765432000188' } };

    choose(new File(['<nfe/>'], 'nota-a.xml', { type: 'application/xml' }));
    click('nfe-submit');
    expect(responses.length).toBe(1);

    // White-box: simulate the component allowing a newer request while the first is still open.
    fixture.componentInstance.phase.set('failure');
    fixture.detectChanges();
    choose(new File(['<nfe/>'], 'nota-b.xml', { type: 'application/xml' }));
    click('nfe-submit');
    expect(responses.length).toBe(2);

    responses[0].next(preview);
    fixture.detectChanges();

    expect(fixture.componentInstance.preview()).toBeNull();
    expect(fixture.componentInstance.phase()).toBe('sending');
    http.expectNone(categoriesUrl);

    responses[1].next(previewB);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush(categories);
    fixture.detectChanges();

    expect(el('nfe-supplier-name')?.textContent).toContain('Fornecedor B');
  });

  it('wraps Tab from the last focusable element to the first and Shift+Tab back', () => {
    const first = el('close-nfe-import')!;
    const last = el('nfe-submit')!;

    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
  });

  it('returns focus to the opener when the dialog is destroyed', () => {
    expect(document.activeElement).toBe(el('nfe-import-dialog'));

    fixture.destroy();

    expect(document.activeElement).toBe(opener);
  });

  it('wraps Shift+Tab to the last control when the dialog container itself has focus', () => {
    const dialog = el('nfe-import-dialog')!;
    dialog.focus();
    expect(document.activeElement).toBe(dialog);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));

    expect(document.activeElement).toBe(el('nfe-submit'));
  });

  it('keeps the backdrop inert in idle and in preview while Escape still closes the preview', () => {
    el('nfe-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(closedCount).toBe(0);

    openPreview();
    el('nfe-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(closedCount).toBe(0);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(closedCount).toBe(1);
  });

  it('keeps Escape and the backdrop inert in the result state while Concluir still finishes', () => {
    openPreview();
    selectAllCategories();
    confirm();
    http.expectOne(importsUrl).flush(created);
    fixture.detectChanges();

    expect(el('nfe-result')).not.toBeNull();
    el('nfe-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(closedCount).toBe(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(closedCount).toBe(0);

    click('nfe-finish');
    expect(closedCount).toBe(1);
  });

  it('shows the server message on a terminal confirmation 404 without retry or connection hint', () => {
    openPreview();
    selectAllCategories();
    confirm();

    http.expectOne(importsUrl).flush(
      { status: 404, message: 'Obra não encontrada', fieldErrors: [] },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(el('nfe-not-found-alert')?.textContent).toContain('Obra não encontrada');
    expect(fixture.nativeElement.textContent).not.toContain('Verifique a conexão');
    expect(fixture.nativeElement.textContent).not.toContain('Tentar novamente');
    expect(el('nfe-confirm-retry')).toBeNull();
    expect(el('nfe-manual')).toBeNull();

    click('close-nfe-import');
    expect(closedCount).toBe(1);
  });

  it('shows a neutral obra message when a confirmation 404 has no server message', () => {
    openPreview();
    selectAllCategories();
    confirm();

    http.expectOne(importsUrl).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el('nfe-not-found-alert')?.textContent).toContain('Não foi possível importar para esta obra.');
    expect(fixture.nativeElement.textContent).not.toContain('Verifique a conexão');
    expect(el('nfe-confirm-retry')).toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(closedCount).toBe(1);
  });

  it('only points the category selects at the missing-categories summary when it exists', () => {
    openPreview();
    expect(el('nfe-missing-categories')).not.toBeNull();
    expect(el('nfe-category-1')?.getAttribute('aria-describedby')).toBe('nfe-missing-categories');
    expect(el('nfe-category-desktop-1')?.getAttribute('aria-describedby')).toBe('nfe-missing-categories');

    selectAllCategories();
    expect(el('nfe-missing-categories')).toBeNull();
    expect(el('nfe-category-1')?.getAttribute('aria-describedby')).toBeNull();
    expect(el('nfe-category-desktop-2')?.getAttribute('aria-describedby')).toBeNull();
  });

  it('does not point the category selects at the summary while the categories failed to load', () => {
    send();
    http.expectOne(url).flush(preview);
    fixture.detectChanges();
    http.expectOne(categoriesUrl).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('nfe-missing-categories')).toBeNull();
    expect(el('nfe-category-1')?.getAttribute('aria-describedby')).toBeNull();
  });

  it('marks the file input invalid and only describes it when the file error exists', () => {
    const input = el<HTMLInputElement>('nfe-file-input');
    expect(input?.getAttribute('aria-invalid')).toBeNull();
    expect(input?.getAttribute('aria-describedby')).toBeNull();

    choose(new File([], 'empty.xml', { type: 'application/xml' }));
    click('nfe-submit');

    const invalid = el<HTMLInputElement>('nfe-file-input');
    expect(invalid?.getAttribute('aria-invalid')).toBe('true');
    expect(invalid?.getAttribute('aria-describedby')).toBe('nfe-file-error');
  });

  it('ignores a new file selection while the conference is open', () => {
    openPreview();
    const confirmed = fixture.componentInstance.selectedFile();

    // White-box: the UI hides the file input while a preview exists, so the public method is
    // called directly to prove the invariant does not depend on the template.
    fixture.componentInstance.onFileSelected({
      target: { files: [new File(['<nfe/>'], 'outra.xml', { type: 'application/xml' })] },
    } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedFile()).toBe(confirmed);
    expect(fixture.componentInstance.phase()).toBe('preview');
    expect(el('nfe-supplier-name')?.textContent).toContain('Fornecedor XPTO');
  });

  it('keeps a confirmation 401 silent in the dialog and sends no resend, observed before any context change', () => {
    // Probe: logout is stubbed so the dialog stays alive and the 401 is observable where it lands.
    // Without the `return` after the 401 check, confirmError gets the connection-uncertain text and this fails.
    const auth = TestBed.inject(Auth);
    const logout = spyOn(auth, 'logout').and.stub();
    openPreview();
    selectAllCategories();
    confirm();

    const request = http.expectOne(importsUrl);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(logout).toHaveBeenCalled();
    expect(closedCount).toBe(0);
    expect(fixture.componentInstance.phase()).toBe('preview');
    expect(fixture.componentInstance.phase()).not.toBe('failure');
    expect(fixture.componentInstance.confirmError()).toBeNull();
    expect(fixture.componentInstance.confirmUncertain()).toBeFalse();
    expect(el('nfe-confirm-error')).toBeNull();
    expect(el('nfe-confirm-retry')).toBeNull();
    http.expectNone(importsUrl);
  });

  it('lets the interceptor end the session on a confirmation 401 and closes through the context change', () => {
    TestBed.inject(Auth).saveToken('session-token');
    const auth = TestBed.inject(Auth);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    openPreview();
    selectAllCategories();
    confirm();

    const request = http.expectOne(importsUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer session-token');
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(auth.getToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(closedCount).toBe(1);
    expect(el('nfe-confirm-error')).toBeNull();
    http.expectNone(importsUrl);
  });

  it('shows the server message on a preview 404 as terminal, without connection hint or retry', () => {
    send();
    http.expectOne(url).flush(
      { status: 404, message: 'Obra não encontrada', fieldErrors: [] },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(el('nfe-not-found-alert')?.textContent).toContain('Obra não encontrada');
    expect(fixture.nativeElement.textContent).not.toContain('Verifique a conexão');
    expect(fixture.nativeElement.textContent).not.toContain('Tentar novamente');
    expect(el('nfe-failure-alert')).toBeNull();
    expect(el('nfe-retry')).toBeNull();
    expect(el('nfe-submit')).toBeNull();

    click('close-nfe-import');
    expect(closedCount).toBe(1);
  });

  it('shows the neutral obra phrase on a preview 404 without server message', () => {
    send();
    http.expectOne(url).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el('nfe-not-found-alert')?.textContent).toContain('Não foi possível importar para esta obra.');
    expect(fixture.nativeElement.textContent).not.toContain('Verifique a conexão');
    expect(fixture.nativeElement.textContent).not.toContain('Tentar novamente');
    expect(el('nfe-retry')).toBeNull();
  });

  it('disables the category selects and the paid checkbox in the terminal confirmation 404', () => {
    openPreview();
    selectAllCategories();
    confirm();
    http.expectOne(importsUrl).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el<HTMLSelectElement>('nfe-category-1')?.disabled).toBeTrue();
    expect(el<HTMLSelectElement>('nfe-category-desktop-2')?.disabled).toBeTrue();
    expect(el<HTMLInputElement>('nfe-paid')?.disabled).toBeTrue();
  });

  it('points the confirm button at the missing-categories summary only when that summary is rendered', () => {
    send();
    http.expectOne(url).flush(preview);
    fixture.detectChanges();
    expect(el('nfe-missing-categories')).toBeNull();
    expect(el('nfe-confirm')?.getAttribute('aria-describedby')).toBeNull();

    http.expectOne(categoriesUrl).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el('nfe-missing-categories')).toBeNull();
    expect(el('nfe-confirm')?.getAttribute('aria-describedby')).toBeNull();

    click('nfe-categories-retry');
    http.expectOne(categoriesUrl).flush(categories);
    fixture.detectChanges();
    expect(el('nfe-missing-categories')).not.toBeNull();
    expect(document.getElementById('nfe-missing-categories')).not.toBeNull();
    expect(el('nfe-confirm')?.getAttribute('aria-describedby')).toBe('nfe-missing-categories');
  });

  it('reports an uncertain result after a 503 and retries once with the same form data', async () => {
    openPreview();
    selectAllCategories();
    confirm();

    http.expectOne(importsUrl).flush({}, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    expect(el('nfe-confirm-error')?.textContent).toContain('Não é possível saber se a importação foi gravada');
    expect(el('nfe-confirm-retry')).not.toBeNull();
    expect(el('nfe-result')).toBeNull();

    click('nfe-confirm-retry');
    const retries = http.match((request) => request.url === importsUrl);
    expect(retries.length).toBe(1);
    const body = retries[0].request.body as FormData;
    expect((body.get('file') as File).name).toBe('nota.xml');
    const items = body.get('items') as Blob;
    expect(JSON.parse(await items.text())).toEqual({
      items: [
        { itemNumber: 1, categoryId: 'cat-1' },
        { itemNumber: 2, categoryId: 'cat-2' },
      ],
    });
    expect(el('nfe-result')).toBeNull();

    retries[0].flush(created);
    fixture.detectChanges();
    expect(el('nfe-result')).not.toBeNull();
  });

  it('applies the desktop category select to the shared choice and the confirmation payload', async () => {
    openPreview();
    const desktop = el<HTMLSelectElement>('nfe-category-desktop-1');
    expect(desktop).not.toBeNull();
    if (!desktop) return;
    desktop.value = 'cat-2';
    desktop.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(el<HTMLSelectElement>('nfe-category-1')?.value).toBe('cat-2');
    selectCategory(2, 'cat-1');
    expect(el<HTMLButtonElement>('nfe-confirm')?.disabled).toBeFalse();

    confirm();
    const request = http.expectOne(importsUrl);
    const items = (request.request.body as FormData).get('items') as Blob;
    expect(JSON.parse(await items.text())).toEqual({
      items: [
        { itemNumber: 1, categoryId: 'cat-2' },
        { itemNumber: 2, categoryId: 'cat-1' },
      ],
    });
    request.flush(created);
  });
});
