import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../core/interceptors/auth-interceptor';
import { NfePreview } from '../../../core/models/nfe-import.model';
import { Project, ProjectStatus, ProjectType } from '../../../core/models/project.model';
import { ActiveProjectService } from '../../../core/services/active-project.service';
import { Auth } from '../../../core/services/auth';
import { NfeImportDialogComponent } from './nfe-import-dialog.component';

describe('NfeImportDialogComponent', () => {
  let fixture: ComponentFixture<NfeImportDialogComponent>;
  let http: HttpTestingController;
  let active: ActiveProjectService;
  let closedCount: number;

  const projectA: Project = {
    id: 'project-a', name: 'Obra A', type: ProjectType.RENOVATION, status: ProjectStatus.IN_PROGRESS,
    location: null, createdAt: '', updatedAt: '',
  };
  const projectB: Project = { ...projectA, id: 'project-b', name: 'Obra B' };
  const url = `${environment.apiUrl}/api/projects/project-a/nfe/preview`;

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
    fixture = TestBed.createComponent(NfeImportDialogComponent);
    fixture.componentRef.setInput('projectId', projectA.id);
    closedCount = 0;
    fixture.componentInstance.closed.subscribe(() => closedCount++);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
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
    send();

    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect((body.get('file') as File).name).toBe('nota.xml');
    request.flush(preview);
    fixture.detectChanges();

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
});
