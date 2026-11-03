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

  beforeEach(async () => {
    const appendix = await PDFDocument.create();
    appendix.addPage().drawText('Expense appendix');
    snapshot = { report: { projectId: 'p', projectName: 'Casa', totalPlanned: 100, totalSpent: 150,
      totalPaid: 100, totalPending: 50, categories: [
        { categoryId: 'c', categoryName: 'Pintura', plannedAmount: 100, amount: 150, percentage: 100 },
      ] }, filename: 'relatorio-casa-2026-11-02.pdf', appendixPdf: await appendix.saveAsBase64() };
    capture = jasmine.createSpy('toPng').and.resolveTo(png);
    load = jasmine.createSpy('loadRuntime').and.resolveTo({ toPng: capture, getFontEmbedCSS: async () => '', PDFDocument });
    TestBed.configureTestingModule({ providers: [{ provide: REPORT_PDF_RUNTIME, useValue: load }] });
    service = TestBed.inject(ReportVisualExportService);
  });

  it('captures shared charts, indicators and all category rows at 2x and appends selectable pages in one PDF', async () => {
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
    expect(pdf.getPageCount()).toBe(capture.calls.count() + 1);
    expect(blocks.some(node => node.querySelector('[data-testid="report-donut"]'))).toBeTrue();
    expect(blocks.some(node => node.querySelector('[data-testid="report-bars"]'))).toBeTrue();
    expect(blocks.some(node => node.textContent?.includes('Pintura'))).toBeTrue();
    expect(blocks.every(node => !node.querySelector('button, select, input'))).toBeTrue();
    expect(capture.calls.allArgs().every(args => args[1].pixelRatio === 2)).toBeTrue();
    expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
  });

  it('appends every authorized appendix page after all visual sheets', async () => {
    const appendix = await PDFDocument.create();
    appendix.addPage([300, 200]).drawText('Expense 1');
    appendix.addPage([300, 200]).drawText('Expense 2');
    snapshot.appendixPdf = await appendix.saveAsBase64();

    const result = await service.generate(snapshot, () => true);

    const pdf = await PDFDocument.load(await result!.arrayBuffer());
    const visualSheets = capture.calls.count();
    expect(visualSheets).toBeGreaterThan(0);
    expect(pdf.getPageCount()).toBe(visualSheets + 2);
    const pages = pdf.getPages();
    for (const page of pages.slice(0, visualSheets)) {
      expect(page.getWidth()).toBeCloseTo(841.89, 1);
      expect(page.getHeight()).toBeCloseTo(595.28, 1);
    }
    for (const page of pages.slice(visualSheets)) {
      expect(page.getWidth()).toBe(300);
      expect(page.getHeight()).toBe(200);
    }
  });

  it('paginates many category rows without dropping or slicing any row', async () => {
    snapshot.report.categories = Array.from({ length: 45 }, (_, i) => ({ categoryId: String(i), categoryName: `Categoria ${i}`, plannedAmount: 100, amount: 150, percentage: 100 / 45 }));
    let rows = 0;
    capture.and.callFake(async (node: HTMLElement) => { rows += node.querySelectorAll('[data-testid="report-detail-row"]').length; return png; });
    const result = await service.generate(snapshot, () => true);
    expect(rows).toBe(45);
    expect((await PDFDocument.load(await result!.arrayBuffer())).getPageCount()).toBeGreaterThan(3);
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

  for (const boundary of ['merge', 'save'] as const) {
    it(`discards after asynchronous ${boundary}`, async () => {
      let current = true;
      const composed = await PDFDocument.create();
      if (boundary === 'merge') {
        const copy = composed.copyPages.bind(composed);
        spyOn(composed, 'copyPages').and.callFake(async (source, indices) => {
          const pages = await copy(source, indices);
          current = false;
          return pages;
        });
      } else {
        const save = composed.save.bind(composed);
        spyOn(composed, 'save').and.callFake(async options => {
          const bytes = await save(options);
          current = false;
          return bytes;
        });
      }
      load.and.resolveTo({ toPng: capture, getFontEmbedCSS: async () => '',
        PDFDocument: { create: async () => composed, load: PDFDocument.load } });
      expect(await service.generate(snapshot, () => current)).toBeNull();
      expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
    });
  }

  for (const stage of ['import', 'capture', 'merge']) {
    it(`propagates a ${stage} failure and removes temporary DOM`, async () => {
      if (stage === 'import') load.and.rejectWith(new Error('import failed'));
      if (stage === 'capture') capture.and.rejectWith(new Error('capture failed'));
      if (stage === 'merge') snapshot.appendixPdf = 'invalid';
      await expectAsync(service.generate(snapshot, () => true)).toBeRejected();
      expect(document.querySelector('[data-testid="report-export-host"]')).toBeNull();
    });
  }
});
