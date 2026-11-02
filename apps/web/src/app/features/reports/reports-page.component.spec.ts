import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ReportsPageComponent } from './reports-page.component';

describe('ReportsPageComponent real report', () => {
  let fixture: ComponentFixture<ReportsPageComponent>;
  let http: HttpTestingController;
  const project = { id: 'project-a', name: 'Casa', type: 'RENOVATION' as const, status: 'IN_PROGRESS' as const, location: null, createdAt: '', updatedAt: '' };
  const root = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(ActiveProjectService).setActiveProject(project, 'owner');
    fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
  });
  afterEach(() => { http.verify(); TestBed.inject(ActiveProjectService).clear(); });

  it('loads real category amounts and percentages instead of the demo mass', () => {
    const request = http.expectOne(r => r.url.includes('/projects/project-a/reports'));
    request.flush({ projectId: 'project-a', projectName: 'Casa', totalPlanned: 0, totalSpent: 300, totalPaid: 300, totalPending: 0,
      categories: [{ categoryId: 'cat-1', categoryName: 'Alvenaria', amount: 100, plannedAmount: 120, percentage: 33.3 }, { categoryId: 'cat-2', categoryName: 'Elétrica', amount: 200, plannedAmount: 250, percentage: 66.7 }] });
    fixture.detectChanges();
    expect(root().querySelectorAll('.distribution-item').length).toBe(2);
    expect(root().textContent).toContain('R$ 100,00');
    expect(root().textContent).not.toContain('Dados demonstrativos');
  });

  it('shows loading, retryable network error and does not retain old data', () => {
    expect(root().textContent).toContain('Carregando');
    const initial = http.expectOne(r => r.url.includes('/projects/project-a/reports'));
    initial.flush({ projectId: 'project-a', projectName: 'Casa', totalPlanned: 0, totalSpent: 20, totalPaid: 20, totalPending: 0,
      categories: [{ categoryId: 'cat-1', categoryName: 'Alvenaria', amount: 20, plannedAmount: 30, percentage: 100 }] });
    fixture.detectChanges();
    expect(root().textContent).toContain('R$ 20,00');
    fixture.componentInstance.retry();
    fixture.detectChanges();
    expect(root().textContent).toContain('Carregando');
    expect(root().textContent).not.toContain('R$ 20,00');
    http.expectOne(r => r.url.includes('/projects/project-a/reports')).flush('offline', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(root().textContent).toContain('Não foi possível carregar');
    expect(root().querySelector('button[aria-label="Tentar novamente"]')).not.toBeNull();
  });

  it('formats currency without relying on a non-breaking space', () => {
    http.expectOne(r => r.url.includes('/projects/project-a/reports')).flush({
      projectId: 'project-a', projectName: 'Casa', totalPlanned: 0,
      totalSpent: 0, totalPaid: 0, totalPending: 0, categories: [],
    });
    expect(fixture.componentInstance.money(10000)).toBe('R$ 100,00');
  });

  it('discards the response from the previous active project', () => {
    const first = http.expectOne(r => r.url.includes('/projects/project-a/reports'));
    const active = TestBed.inject(ActiveProjectService);
    active.setActiveProject({ ...project, id: 'project-b' }, 'owner');
    fixture.detectChanges();
    const second = http.expectOne(r => r.url.includes('/projects/project-b/reports'));
    first.flush({ projectId: 'project-a', projectName: 'A', totalPlanned: 0, totalSpent: 1, totalPaid: 1, totalPending: 0, categories: [{ categoryId: 'a', categoryName: 'A', amount: 1, plannedAmount: 0, percentage: 100 }] });
    second.flush({ projectId: 'project-b', projectName: 'B', totalPlanned: 0, totalSpent: 2, totalPaid: 2, totalPending: 0, categories: [{ categoryId: 'b', categoryName: 'B', amount: 2, plannedAmount: 0, percentage: 100 }] });
    fixture.detectChanges();
    expect(root().textContent).toContain('B');
    expect(root().textContent).not.toContain('Casa');
  });
});
