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

  function loadComparison() {
    http.expectOne(r => r.url.includes('/projects/project-a/reports')).flush({
      projectId: 'project-a', projectName: 'Casa', totalPlanned: 500000, totalSpent: 350050,
      totalPaid: 350050, totalPending: 0, categories: [
        { categoryId: 'empty', categoryName: 'Acabamento', amount: 0, plannedAmount: 200000, percentage: 0 },
        { categoryId: 'equal', categoryName: 'Elétrica', amount: 100000, plannedAmount: 100000, percentage: 28.6 },
        { categoryId: 'over', categoryName: 'Pintura', amount: 250000, plannedAmount: 200000, percentage: 71.4 },
        { categoryId: 'unplanned', categoryName: 'Material', amount: 50, plannedAmount: 0, percentage: 0.01 },
      ],
    });
    fixture.detectChanges();
  }

  it('uses one dynamic scale for planned and actual bars and omits unbudgeted categories', () => {
    loadComparison();
    const comparisons = root().querySelectorAll<HTMLElement>('.comparison-row');
    expect(comparisons.length).toBe(3);
    expect(root().querySelector('.comparison-chart')?.textContent).not.toContain('Material');
    const widths = Array.from(root().querySelectorAll<HTMLElement>('.bar-track > span'))
      .map(bar => Number.parseFloat(bar.style.width));
    expect(widths.every(width => width >= 0 && width <= 100)).toBeTrue();
    expect(widths[0]).toBeCloseTo(widths[5] * 200000 / 250000);
    expect(widths[2]).toBeCloseTo(widths[3]);
    expect(root().querySelector('.chart-axis')?.textContent).not.toContain('140');
    expect(root().querySelectorAll('.distribution-item').length).toBe(3);
    expect(root().querySelectorAll('.detail-row').length).toBe(4);
    expect(fixture.componentInstance.totals().actualCents).toBe(35005000);
  });

  it('renders positive balances green, only excess red and unbudgeted consumption undefined', () => {
    loadComparison();
    const details = Array.from(root().querySelectorAll<HTMLElement>('.detail-row'));
    const empty = details.find(row => row.textContent?.includes('Acabamento'))!;
    const equal = details.find(row => row.textContent?.includes('Elétrica'))!;
    const over = details.find(row => row.textContent?.includes('Pintura'))!;
    const unplanned = details.find(row => row.textContent?.includes('Material'))!;
    expect(empty.querySelectorAll('td')[3].classList.contains('positive')).toBeTrue();
    expect(over.querySelectorAll('td')[3].classList.contains('negative')).toBeTrue();
    expect(equal.classList.contains('exceeded')).toBeFalse();
    expect(unplanned.classList.contains('exceeded')).toBeFalse();
    expect(unplanned.querySelectorAll('td')[4].textContent).toContain('—');
    expect(unplanned.textContent).toContain('Sem orçamento');
    expect(fixture.componentInstance.totals().exceeded).toBe(1);
    expect(root().querySelectorAll('.report-kpi').length).toBe(4);
  });

  it('preserves budgets without expenses and does not invent distribution or largest expenses', () => {
    http.expectOne(r => r.url.includes('/projects/project-a/reports')).flush({
      projectId: 'project-a', projectName: 'Casa', totalPlanned: 400, totalSpent: 0,
      totalPaid: 0, totalPending: 0, categories: [
        { categoryId: 'empty', categoryName: 'Acabamento', amount: 0, plannedAmount: 400, percentage: 0 },
      ],
    });
    fixture.detectChanges();
    expect(root().textContent).toContain('ainda não possui despesas');
    expect(root().querySelectorAll('.comparison-row').length).toBe(1);
    expect(root().querySelectorAll('.donut-segment').length).toBe(0);
    expect(root().querySelectorAll('.distribution-item').length).toBe(0);
    expect(root().querySelector('.detail-row')?.textContent).toContain('R$ 400,00');
    expect(root().querySelector('.detail-row')?.querySelectorAll('td')[2].textContent).toContain('—');
    expect(root().querySelector('tfoot')?.querySelectorAll('td')[2].textContent).toContain('—');
    expect(root().querySelector('.report-summary')?.textContent).not.toContain('maiores gastos');
    expect(root().textContent).not.toMatch(/NaN|Infinity|por arredondamento/);
  });

  it('updates all charts and indicators when filtering an unbudgeted category', () => {
    loadComparison();
    const select = root().querySelector<HTMLSelectElement>('#report-category')!;
    select.value = 'unplanned';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(root().querySelectorAll('.comparison-row').length).toBe(0);
    expect(root().querySelectorAll('.distribution-item').length).toBe(1);
    expect(root().querySelectorAll('.detail-row').length).toBe(1);
    expect(fixture.componentInstance.totals().plannedCents).toBe(0);
    expect(fixture.componentInstance.totals().actualCents).toBe(5000);
    expect(root().querySelectorAll('.report-kpi')[1].textContent).toContain('Sem orçamento');
    expect(root().textContent).not.toMatch(/NaN|Infinity/);
  });
});
