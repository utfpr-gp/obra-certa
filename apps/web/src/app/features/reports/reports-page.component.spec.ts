import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ReportVisualExportService } from './report-visual-export.service';
import { ReportsPageComponent } from './reports-page.component';

describe('ReportsPageComponent real report', () => {
  let fixture: ComponentFixture<ReportsPageComponent>;
  let http: HttpTestingController;
  let visual: jasmine.SpyObj<ReportVisualExportService>;
  const project = { id: 'project-a', name: 'Casa', type: 'RENOVATION' as const, status: 'IN_PROGRESS' as const, location: null, createdAt: '', updatedAt: '' };
  const root = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    visual = jasmine.createSpyObj<ReportVisualExportService>('ReportVisualExportService', ['generate']);
    visual.generate.and.resolveTo(new Blob(['composed'], { type: 'application/pdf' }));
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ReportVisualExportService, useValue: visual }],
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

  it('downloads the consolidated PDF once, indicates generation and revokes its URL', async () => {
    loadComparison();
    fixture.componentInstance.selectedCategory.set('over');
    const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:report');
    const revoke = spyOn(URL, 'revokeObjectURL');
    let downloadedFilename: string | undefined;
    const click = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
    const button = root().querySelector<HTMLButtonElement>('.export')!;
    button.click();
    fixture.detectChanges();
    button.click();
    expect(button.disabled).toBeTrue();
    expect(root().textContent).toContain('Gerando PDF');
    const request = http.expectOne(r => r.url.endsWith('/projects/project-a/reports/export'));
    request.flush(exportSnapshot());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloadedFilename).toBe('relatorio-casa-2026-11-02.pdf');
    expect(revoke).toHaveBeenCalledWith('blob:report');
    expect(button.disabled).toBeFalse();
  });

  it('shows only a PDF error without retry controls or automatic retry', () => {
    loadComparison();
    root().querySelector<HTMLButtonElement>('.export')!.click();
    http.expectOne(r => r.url.endsWith('/reports/export')).flush({ message: 'Failure' }, { status: 500, statusText: 'Failure' });
    fixture.detectChanges();
    expect(root().textContent).toContain('Não foi possível gerar o PDF.');
    expect(root().querySelector('button[aria-label="Tentar novamente"]')).toBeNull();
    http.expectNone(r => r.url.endsWith('/reports/export'));
  });

  it('discards a pending PDF when the project changes', () => {
    loadComparison();
    const create = spyOn(URL, 'createObjectURL');
    root().querySelector<HTMLButtonElement>('.export')!.click();
    const pending = http.expectOne(r => r.url.endsWith('/reports/export'));
    TestBed.inject(ActiveProjectService).setActiveProject({ ...project, id: 'project-b' }, 'owner');
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/projects/project-b/reports')).flush({ projectId: 'project-b', projectName: 'B', categories: [], totalPlanned: 0, totalSpent: 0 });
    expect(pending.cancelled).toBeTrue();
    expect(create).not.toHaveBeenCalled();
    http.expectNone(r => r.url.endsWith('/reports/export'));
  });

  it('ignores a PDF after A to B to A even before effects run', () => {
    loadComparison();
    const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:obsolete');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    root().querySelector<HTMLButtonElement>('.export')!.click();
    const pending = http.expectOne(r => r.url.endsWith('/reports/export'));
    const active = TestBed.inject(ActiveProjectService);
    active.setActiveProject({ ...project, id: 'project-b' }, 'owner');
    active.setActiveProject(project, 'owner');
    pending.flush(exportSnapshot());
    expect(create).not.toHaveBeenCalled();
  });

  it('cancels pending export on leaving and does not export on returning', () => {
    loadComparison();
    root().querySelector<HTMLButtonElement>('.export')!.click();
    const pending = http.expectOne(r => r.url.endsWith('/reports/export'));
    fixture.destroy();
    expect(pending.cancelled).toBeTrue();
    fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.endsWith('/projects/project-a/reports')).flush({ projectId: 'project-a', projectName: 'Casa', categories: [], totalPlanned: 0, totalSpent: 0 });
    http.expectNone(r => r.url.endsWith('/reports/export'));
  });

  function exportSnapshot() {
    return { report: { projectId: 'project-a', projectName: 'Casa autoritativa', totalPlanned: 100, totalSpent: 120,
      totalPaid: 100, totalPending: 20, categories: [
        { categoryId: 'over', categoryName: 'Pintura', amount: 120, plannedAmount: 100, percentage: 100 },
      ] }, filename: 'relatorio-casa-2026-11-02.pdf', generatedAt: '2026-11-02' };
  }

  function date(id: string, value: string) {
    const input = root().querySelector<HTMLInputElement>(id)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('applies and clears a period only on click, updating every presentation from the response', () => {
    loadComparison();
    const from = root().querySelector<HTMLInputElement>('#report-from');
    expect(from).not.toBeNull();
    if (!from) return;
    expect(from.type).toBe('date');
    expect(from.value).toBe('');
    date('#report-from', '2026-10-01');
    date('#report-to', '2026-10-31');
    http.expectNone(r => r.url.endsWith('/reports'));
    root().querySelector<HTMLButtonElement>('[data-testid="apply-period"]')!.click();
    const request = http.expectOne(r => r.url.endsWith('/reports'));
    expect(request.request.params.get('from')).toBe('2026-10-01');
    expect(request.request.params.get('to')).toBe('2026-10-31');
    request.flush({ projectId: 'project-a', projectName: 'Casa', totalPlanned: 500000, totalSpent: 10,
      totalPaid: 10, totalPending: 0, categories: [
        { categoryId: 'over', categoryName: 'Pintura', plannedAmount: 500000, amount: 10, percentage: 100 },
      ] });
    fixture.detectChanges();
    expect(fixture.componentInstance.totals().plannedCents).toBe(50000000);
    expect(fixture.componentInstance.totals().actualCents).toBe(1000);
    expect(root().querySelectorAll('.distribution-item').length).toBe(1);
    expect(root().querySelectorAll('.comparison-row').length).toBe(1);
    expect(root().querySelectorAll('.detail-row').length).toBe(1);
    expect(root().querySelector('[data-testid="report-summary"]')?.textContent).toContain('R$ 10,00');
    root().querySelector<HTMLButtonElement>('[data-testid="clear-period"]')!.click();
    const cleared = http.expectOne(r => r.url.endsWith('/reports'));
    expect(cleared.request.params.keys()).toEqual([]);
    cleared.flush({ projectId: 'project-a', categories: [], totalPlanned: 500000, totalSpent: 0 });
    fixture.detectChanges();
    expect(from.value).toBe('');
  });

  it('blocks an inverted range with one error and preserves the displayed report', () => {
    loadComparison();
    expect(root().querySelector('#report-from')).not.toBeNull();
    if (!root().querySelector('#report-from')) return;
    date('#report-from', '2026-11-02');
    date('#report-to', '2026-11-01');
    root().querySelector<HTMLButtonElement>('[data-testid="apply-period"]')!.click();
    fixture.detectChanges();
    http.expectNone(r => r.url.endsWith('/reports'));
    expect(root().querySelectorAll('[role="alert"]').length).toBe(1);
    expect(root().textContent).toContain('A data inicial do período não pode ser posterior à final.');
    expect(fixture.componentInstance.totals().actualCents).toBe(35005000);
  });

  it('exports the applied period and category while ignoring dates still being edited', () => {
    loadComparison();
    date('#report-from', '2026-10-01');
    root().querySelector<HTMLButtonElement>('[data-testid="apply-period"]')!.click();
    http.expectOne(r => r.url.endsWith('/reports')).flush(exportSnapshot().report);
    fixture.detectChanges();
    date('#report-from', '2026-11-01');
    const category = root().querySelector<HTMLSelectElement>('#report-category')!;
    category.value = 'over';
    category.dispatchEvent(new Event('change'));
    fixture.componentInstance.exportPdf();
    const request = http.expectOne(r => r.url.endsWith('/reports/export'));
    expect(request.request.params.get('from')).toBe('2026-10-01');
    expect(request.request.params.has('to')).toBeFalse();
    expect(request.request.params.get('category')).toBe('over');
    request.flush({}, { status: 500, statusText: 'Failure' });
  });

  it('restores empty dates and full history when changing the active project', () => {
    loadComparison();
    date('#report-from', '2026-10-01');
    root().querySelector<HTMLButtonElement>('[data-testid="apply-period"]')!.click();
    http.expectOne(r => r.url.endsWith('/reports')).flush(exportSnapshot().report);
    TestBed.inject(ActiveProjectService).setActiveProject({ ...project, id: 'project-b' }, 'owner');
    fixture.detectChanges();
    const request = http.expectOne(r => r.url.endsWith('/projects/project-b/reports'));
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ projectId: 'project-b', categories: [], totalPlanned: 0, totalSpent: 0 });
    fixture.detectChanges();
    expect(root().querySelector<HTMLInputElement>('#report-from')!.value).toBe('');
    expect(root().querySelector<HTMLInputElement>('#report-to')!.value).toBe('');
  });

  for (const filter of ['period', 'category']) {
    it(`discards local PDF composition when the applied ${filter} changes`, async () => {
      loadComparison();
      let complete!: (blob: Blob) => void;
      visual.generate.and.returnValue(new Promise(resolve => complete = resolve));
      const create = spyOn(URL, 'createObjectURL');
      fixture.componentInstance.exportPdf();
      http.expectOne(r => r.url.endsWith('/reports/export')).flush(exportSnapshot());
      const isCurrent = visual.generate.calls.mostRecent().args[1];
      if (filter === 'period') {
        date('#report-from', '2026-10-01');
        root().querySelector<HTMLButtonElement>('[data-testid="apply-period"]')!.click();
        http.expectOne(r => r.url.endsWith('/reports')).flush(exportSnapshot().report);
      } else {
        const category = root().querySelector<HTMLSelectElement>('#report-category')!;
        category.value = 'over';
        category.dispatchEvent(new Event('change'));
      }
      expect(isCurrent()).toBeFalse();
      complete(new Blob(['abandoned']));
      await Promise.resolve();
      await Promise.resolve();
      expect(create).not.toHaveBeenCalled();
    });
  }

  it('uses the authoritative global snapshot without changing the screen category or financial data', async () => {
    loadComparison();
    fixture.componentInstance.selectedCategory.set('unplanned');
    const create = spyOn(URL, 'createObjectURL').and.returnValue('blob:report');
    spyOn(URL, 'revokeObjectURL');
    spyOn(HTMLAnchorElement.prototype, 'click');
    fixture.componentInstance.exportPdf();
    const snapshot = exportSnapshot();
    http.expectOne(r => r.url.endsWith('/reports/export')).flush(snapshot);
    await fixture.whenStable();
    expect(visual.generate.calls.mostRecent().args[0]).toEqual(snapshot);
    expect(fixture.componentInstance.selectedCategory()).toBe('unplanned');
    expect(fixture.componentInstance.totals().actualCents).toBe(5000);
    expect(create.calls.mostRecent().args[0]).toEqual(new Blob(['composed'], { type: 'application/pdf' }));
  });

  it('shows one error for local capture or composition failure and preserves selection', async () => {
    loadComparison();
    fixture.componentInstance.selectedCategory.set('over');
    visual.generate.and.rejectWith(new Error('capture failed'));
    fixture.componentInstance.exportPdf();
    http.expectOne(r => r.url.endsWith('/reports/export')).flush(exportSnapshot());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.pdfError()).toBe('Não foi possível gerar o PDF.');
    expect(fixture.componentInstance.generatingPdf()).toBeFalse();
    expect(fixture.componentInstance.selectedCategory()).toBe('over');
    expect(root().querySelectorAll('[role="alert"]').length).toBe(1);
    http.expectNone(r => r.url.endsWith('/reports/export'));
  });

  for (const abandon of ['A-B-A', 'leave']) {
    it(`discards a completed local composition after ${abandon}`, async () => {
      loadComparison();
      let complete!: (blob: Blob) => void;
      visual.generate.and.returnValue(new Promise(resolve => complete = resolve));
      const create = spyOn(URL, 'createObjectURL');
      fixture.componentInstance.exportPdf();
      http.expectOne(r => r.url.endsWith('/reports/export')).flush(exportSnapshot());
      const isCurrent = visual.generate.calls.mostRecent().args[1];
      expect(isCurrent()).toBeTrue();
      if (abandon === 'leave') fixture.destroy();
      else {
        const active = TestBed.inject(ActiveProjectService);
        active.setActiveProject({ ...project, id: 'project-b' }, 'owner');
        active.setActiveProject(project, 'owner');
      }
      expect(isCurrent()).toBeFalse();
      complete(new Blob(['abandoned']));
      await Promise.resolve();
      await Promise.resolve();
      expect(create).not.toHaveBeenCalled();
    });
  }

  it('rejects a mismatched remote snapshot before starting local capture', () => {
    loadComparison();
    fixture.componentInstance.exportPdf();
    const snapshot = exportSnapshot();
    snapshot.report.projectId = 'project-b';
    http.expectOne(r => r.url.endsWith('/reports/export')).flush(snapshot);
    expect(visual.generate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.pdfError()).toBe('Não foi possível gerar o PDF.');
  });

  it('reports that the project was not located when the PDF snapshot is not found', () => {
    loadComparison();
    fixture.componentInstance.exportPdf();
    http.expectOne(r => r.url.endsWith('/reports/export')).flush({ message: 'Projeto não encontrado' }, { status: 404, statusText: 'Not Found' });
    expect(fixture.componentInstance.pdfError()).toBe('A obra não foi localizada.');
    expect(fixture.componentInstance.generatingPdf()).toBeFalse();
  });

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
