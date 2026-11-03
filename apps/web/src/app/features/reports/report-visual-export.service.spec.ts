import { TestBed } from '@angular/core/testing';
import { PDFDocument } from 'pdf-lib';
import { ReportExport } from '../../core/services/report.service';
import { REPORT_PDF_RUNTIME, ReportVisualExportService } from './report-visual-export.service';

describe('ReportVisualExportService', () => {
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
  let snapshot: ReportExport;
  let capture: jasmine.Spy;
  let load: jasmine.Spy;
  let service: ReportVisualExportService;

  beforeEach(() => {
    snapshot = { report: { projectId: '11111111-2222-3333-4444-555555555555', projectName: 'Casa', totalPlanned: 100, totalSpent: 150,
      totalPaid: 100, totalPending: 50, categories: [
        { categoryId: 'c', categoryName: 'Pintura', plannedAmount: 100, amount: 150, percentage: 100 },
      ] }, filename: 'relatorio-casa-2026-11-02.pdf', generatedAt: '2026-11-02' };
    capture = jasmine.createSpy('toPng').and.resolveTo(png);
    load = jasmine.createSpy('loadRuntime').and.resolveTo({ toPng: capture, getFontEmbedCSS: async () => '', PDFDocument });
    TestBed.configureTestingModule({ providers: [{ provide: REPORT_PDF_RUNTIME, useValue: load }] });
    service = TestBed.inject(ReportVisualExportService);
  });

  it('captures shared charts, indicators and all category rows at 2x into exactly the visual sheets', async () => {
    const blocks: HTMLElement[] = [];
    capture.and.callFake(async (node: HTMLElement) => {
      blocks.push(node);
      const indicators = node.querySelector('[data-testid="report-kpis"]');
      if (indicators) expect(getComputedStyle(indicators).gridTemplateColumns.split(' ').length).toBe(4);
      const table = node.querySelector('table');
      if (table) expect(getComputedStyle(table).display).toBe('table');
      return png;
    });
    const result = await service.generate(snapshot, () => true);
    expect(result?.type).toBe('application/pdf');
    const pdf = await PDFDocument.load(await result!.arrayBuffer());
    expect(pdf.getPageCount()).toBe(capture.calls.count());
    expect(blocks.some(node => node.querySelector('[data-testid="report-donut"]'))).toBeTrue();
    expect(blocks.some(node => node.querySelector('[data-testid="report-bars"]'))).toBeTrue();
    expect(blocks.some(node => node.textContent?.includes('Pintura'))).toBeTrue();
    expect(blocks.every(node => !node.querySelector('button, select, input'))).toBeTrue();
    expect(capture.calls.allArgs().every(args => args[1].pixelRatio === 2)).toBeTrue();
    expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
  });

  it('does not append any appendix or page header page', async () => {
    const result = await service.generate(snapshot, () => true);
    const pdf = await PDFDocument.load(await result!.arrayBuffer());
    expect(pdf.getPageCount()).toBe(capture.calls.count());
    expect(capture.calls.count()).toBeGreaterThan(0);
    const pages = pdf.getPages();
    for (const page of pages) {
      expect(page.getWidth()).toBeCloseTo(841.89, 1);
      expect(page.getHeight()).toBeCloseTo(595.28, 1);
    }
  });

  it('writes the generation date, paid and pending amounts in the composition header without the internal identifier', async () => {
    const blocks: HTMLElement[] = [];
    capture.and.callFake(async (node: HTMLElement) => { blocks.push(node); return png; });
    await service.generate(snapshot, () => true);
    const heading = blocks[0].querySelector<HTMLElement>('[data-testid="report-export-heading"]');
    expect(heading?.textContent).toContain('Casa');
    expect(heading?.textContent).toContain('Data de geração: 02/11/2026');
    expect(heading?.textContent).toContain('Pago: R$ 100,00');
    expect(heading?.textContent).toContain('A pagar: R$ 50,00');
    expect(heading?.textContent).toContain('Todo o histórico');
    expect(heading?.textContent).toContain('Todas as categorias');
    expect(heading?.textContent).not.toContain('11111111-2222-3333-4444-555555555555');
    expect(heading?.textContent).not.toContain('Página 1');
  });

  it('paginates many category rows without dropping or slicing any row', async () => {
    snapshot.report.categories = Array.from({ length: 45 }, (_, i) => ({ categoryId: String(i), categoryName: `Categoria ${i}`, plannedAmount: 100, amount: 150, percentage: 100 / 45 }));
    let rows = 0;
    capture.and.callFake(async (node: HTMLElement) => { rows += node.querySelectorAll('[data-testid="report-detail-row"]').length; return png; });
    const result = await service.generate(snapshot, () => true);
    expect(rows).toBe(45);
    expect((await PDFDocument.load(await result!.arrayBuffer())).getPageCount()).toBe(capture.calls.count());
    expect(capture.calls.count()).toBeGreaterThan(3);
  });

  it('exports an empty project', async () => {
    snapshot.report.categories = [];
    snapshot.report.totalSpent = 0;
    expect(await service.generate(snapshot, () => true)).not.toBeNull();
  });

  it('discards after dynamic import before creating a DOM host', async () => {
    let current = true;
    load.and.callFake(async () => { current = false; return { toPng: capture, getFontEmbedCSS: async () => '', PDFDocument }; });
    expect(await service.generate(snapshot, () => current)).toBeNull();
    expect(capture).not.toHaveBeenCalled();
    expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
  });

  it('discards after capture and removes its host', async () => {
    let current = true;
    capture.and.callFake(async () => { current = false; return png; });
    expect(await service.generate(snapshot, () => current)).toBeNull();
    expect(capture).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
  });

  it('discards after asynchronous save', async () => {
    let current = true;
    const composed = await PDFDocument.create();
    const save = composed.save.bind(composed);
    spyOn(composed, 'save').and.callFake(async options => {
      const bytes = await save(options);
      current = false;
      return bytes;
    });
    load.and.resolveTo({ toPng: capture, getFontEmbedCSS: async () => '', PDFDocument: { create: async () => composed } });
    expect(await service.generate(snapshot, () => current)).toBeNull();
    expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
  });

  for (const stage of ['import', 'capture']) {
    it(`propagates a ${stage} failure and removes temporary DOM`, async () => {
      if (stage === 'import') load.and.rejectWith(new Error('import failed'));
      if (stage === 'capture') capture.and.rejectWith(new Error('capture failed'));
      await expectAsync(service.generate(snapshot, () => true)).toBeRejected();
      expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
    });
  }
});
