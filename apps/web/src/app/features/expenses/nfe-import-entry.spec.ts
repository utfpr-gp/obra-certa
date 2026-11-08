import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AccountsPageComponent } from './accounts-page.component';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { authInterceptor } from '../../core/interceptors/auth-interceptor';
import { Project } from '../../core/models/project.model';

describe('NF-e import entry (CA1 entry point and CA9 on screen)', () => {
  beforeAll(() => registerLocaleData(localePt));
  let fixture: ComponentFixture<AccountsPageComponent>;
  let http: HttpTestingController;
  let active: ActiveProjectService;

  const project = (id: string): Project => ({ id, name: id, type: 'RENOVATION',
    status: 'IN_PROGRESS', location: null, createdAt: '', updatedAt: '' });
  const expenses = { content: [], page: 0, size: 15, totalPages: 1, totalElements: 0,
    totals: { totalPaid: 0, totalPending: 0, totalGeneral: 0 } };
  const el = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
    fixture.nativeElement.querySelector(`[data-testid="${id}"]`);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [AccountsPageComponent], providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
    ] });
    http = TestBed.inject(HttpTestingController);
    active = TestBed.inject(ActiveProjectService);
    active.selectProject(project('A'), 'owner');
    fixture = TestBed.createComponent(AccountsPageComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(expenses);
    fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify(); localStorage.clear(); });

  it('opens the NF-e import dialog from the expenses listing', () => {
    const button = el<HTMLButtonElement>('import-nfe');
    expect(button).withContext('import-nfe').not.toBeNull();
    button?.click();
    fixture.detectChanges();

    expect(el('nfe-import-dialog')).not.toBeNull();
  });

  it('closes the import dialog when the active project changes', () => {
    el<HTMLButtonElement>('import-nfe')?.click();
    fixture.detectChanges();
    expect(el('nfe-import-dialog')).not.toBeNull();

    active.selectProject(project('B'), 'owner');
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/api/expenses')).flush(expenses);
    fixture.detectChanges();

    expect(el('nfe-import-dialog')).toBeNull();
  });
});
