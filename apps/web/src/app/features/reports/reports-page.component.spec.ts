import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsPageComponent } from './reports-page.component';

describe('ReportsPageComponent demonstrative scenario', () => {
  let fixture: ComponentFixture<ReportsPageComponent>;
  let http: HttpTestingController;
  const root = () => fixture.nativeElement as HTMLElement;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReportsPageComponent], providers: [provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('renders four coherent indicators, seven categories and the exceeded category', () => {
    const page = fixture.componentInstance;
    expect(root().querySelectorAll('.report-kpi').length).toBe(4);
    expect(page.totals().plannedCents).toBe(39670000);
    expect(page.totals().actualCents).toBe(7440000);
    expect(page.totals().balanceCents).toBe(32230000);
    expect(page.rows().reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(100, 10);
    expect(page.rows().find(row => row.id === 'electrical')?.consumption).toBe(112.5);
    expect(root().querySelectorAll('.detail-row').length).toBe(7);
    expect(root().querySelector('.detail-row.exceeded')?.textContent).toContain('Elétrica');
    expect(root().textContent).toContain('Dados demonstrativos');
  });

  it('updates every visualization and summary together when selecting a category', () => {
    const select = root().querySelector<HTMLSelectElement>('#report-category')!;
    select.value = 'electrical';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.totals().actualCents).toBe(900000);
    expect(fixture.componentInstance.totals().balanceCents).toBe(-100000);
    expect(root().querySelectorAll('.distribution-item').length).toBe(1);
    expect(root().querySelectorAll('.comparison-row').length).toBe(1);
    expect(root().querySelectorAll('.detail-row').length).toBe(1);
    expect(root().querySelector('.distribution-item')?.textContent).toContain('100,0%');
    expect(root().querySelector('.report-summary')?.textContent).toContain('112,50%');
    expect(root().querySelector('.donut-total')?.textContent).toContain('9.000');
  });

  it('uses one scale for both bars and ticks, with textual values available', () => {
    const page = fixture.componentInstance;
    expect(page.axisTicks).toEqual([0, 35, 70, 105, 140]);
    const labor = page.rows().find(row => row.id === 'labor')!;
    expect(page.barWidth(labor.plannedCents)).toBeCloseTo(128700 / 140000 * 100, 8);
    expect(page.barWidth(labor.actualCents)).toBeCloseTo(15000 / 140000 * 100, 8);
    expect(root().querySelector('.comparison-row')?.getAttribute('aria-label')).toContain('45.000');
    expect(root().querySelectorAll('.donut-segment').length).toBe(7);
  });

  it('keeps the whole history fixed and announces future PDF without requests, persistence or download', () => {
    const storage = spyOn(Storage.prototype, 'setItem');
    const download = spyOn(URL, 'createObjectURL');
    const anchor = spyOn(HTMLAnchorElement.prototype, 'click');
    expect(root().querySelector<HTMLInputElement>('#report-period')?.readOnly).toBeTrue();
    root().querySelector<HTMLButtonElement>('.export-button')!.click();
    fixture.detectChanges();
    expect(root().querySelector('[role="status"]')?.textContent).toContain('disponibilizada na integração');
    fixture.destroy();
    expect(storage).not.toHaveBeenCalled();
    expect(download).not.toHaveBeenCalled();
    expect(anchor).not.toHaveBeenCalled();
    http.expectNone(() => true);
  });

  it('restores the initial scenario after leaving and recreating the component', () => {
    fixture.componentInstance.selectedCategory.set('electrical');
    fixture.componentInstance.showPdfNotice();
    fixture.destroy();
    fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedCategory()).toBe('all');
    expect(fixture.componentInstance.rows().length).toBe(7);
    expect(root().querySelector('[role="status"]')).toBeNull();
    expect(fixture.componentInstance.totals().actualCents).toBe(7440000);
  });
});
