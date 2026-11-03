import { ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, InjectionToken } from '@angular/core';
import type { PDFDocument as PdfDocument } from 'pdf-lib';
import type { Options } from 'html-to-image/lib/types';
import { ReportExport } from '../../core/services/report.service';
import { ReportPresentationComponent } from './report-presentation.component';
import { ReportPresentationModel } from './report-presentation.model';

interface PdfRuntime {
  toPng: (node: HTMLElement, options: Options) => Promise<string>;
  getFontEmbedCSS: (node: HTMLElement) => Promise<string>;
  PDFDocument: typeof PdfDocument;
}

export const REPORT_PDF_RUNTIME = new InjectionToken<() => Promise<PdfRuntime>>('Report PDF runtime', {
  providedIn: 'root',
  factory: () => async () => {
    const [capture, pdf] = await Promise.all([import('html-to-image'), import('pdf-lib')]);
    return { toPng: capture.toPng, getFontEmbedCSS: capture.getFontEmbedCSS, PDFDocument: pdf.PDFDocument };
  },
});

class ExportAbandoned extends Error {}

/** Local composition only; the HTTP service supplies a single authorized financial snapshot. */
@Injectable({ providedIn: 'root' })
export class ReportVisualExportService {
  private readonly loadRuntime = inject(REPORT_PDF_RUNTIME);
  private readonly environment = inject(EnvironmentInjector);
  private readonly application = inject(ApplicationRef);
  private readonly width = 1320;
  private readonly pageWidth = 841.89;
  private readonly pageHeight = 595.28;
  private readonly margin = 24;
  private readonly maximumHeight = (this.pageHeight - 2 * this.margin) / (this.pageWidth - 2 * this.margin) * this.width;

  async generate(snapshot: ReportExport, isCurrent: () => boolean): Promise<Blob | null> {
    const check = () => { if (!isCurrent()) throw new ExportAbandoned(); };
    const stage = async <T>(operation: Promise<T>): Promise<T> => { const value = await operation; check(); return value; };
    let cleanup: (() => void) | undefined;
    try {
      check();
      const runtime = await stage(this.loadRuntime());
      const host = document.createElement('app-report-presentation');
      host.dataset['testid'] = 'report-export-host';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = `position:fixed;left:-100000px;top:0;width:${this.width}px;pointer-events:none;z-index:-1;`;
      document.body.appendChild(host);
      const component = createComponent(ReportPresentationComponent, { environmentInjector: this.environment, hostElement: host });
      cleanup = () => { this.application.detachView(component.hostView); component.destroy(); host.remove(); };
      const model = new ReportPresentationModel();
      model.report.set(snapshot.report);
      component.setInput('model', model);
      component.setInput('exportMode', true);
      this.application.attachView(component.hostView);
      component.changeDetectorRef.detectChanges();
      await stage(document.fonts.ready);
      await stage(new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
      const fontEmbedCSS = await stage(runtime.getFontEmbedCSS(host));
      const sheets = this.paginate(host);
      const documentPdf = await stage(runtime.PDFDocument.create());
      for (const sheet of sheets) {
        check();
        const imageData = await stage(runtime.toPng(sheet, { pixelRatio: 2, backgroundColor: '#f8fafc', fontEmbedCSS }));
        const image = await stage(documentPdf.embedPng(imageData));
        const scale = (this.pageWidth - 2 * this.margin) / this.width;
        const height = sheet.getBoundingClientRect().height * scale;
        documentPdf.addPage([this.pageWidth, this.pageHeight]).drawImage(image, {
          x: this.margin, y: this.pageHeight - this.margin - height,
          width: this.pageWidth - 2 * this.margin, height,
        });
      }
      const appendix = await stage(runtime.PDFDocument.load(snapshot.appendixPdf));
      const pages = await stage(documentPdf.copyPages(appendix, appendix.getPageIndices()));
      for (const page of pages) documentPdf.addPage(page);
      const bytes = await stage(documentPdf.save());
      return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    } catch (error) {
      if (error instanceof ExportAbandoned) return null;
      throw error;
    } finally { cleanup?.(); }
  }

  /** Measure the real desktop DOM and break only between whole sections, chart rows and table rows. */
  private paginate(host: HTMLElement): HTMLElement[] {
    const sheets: HTMLElement[] = [];
    const makeSheet = () => {
      const sheet = document.createElement('div');
      sheet.dataset['testid'] = 'report-export-sheet';
      sheet.style.cssText = `width:${this.width}px;background:#f8fafc;display:flow-root;`;
      host.appendChild(sheet);
      sheets.push(sheet);
      return sheet;
    };
    let sheet = makeSheet();
    const fits = () => sheet.getBoundingClientRect().height <= this.maximumHeight;
    const add = (node: HTMLElement) => {
      sheet.appendChild(node);
      if (fits()) return;
      node.remove();
      if (sheet.childElementCount) sheet = makeSheet();
      sheet.appendChild(node);
      if (!fits()) throw new Error('Uma seção do relatório excede o tamanho legível da página.');
    };
    const blocks = Array.from(host.querySelectorAll<HTMLElement>(':scope > [data-pdf-block]'));
    for (const block of blocks) {
      const copy = block.cloneNode(true) as HTMLElement;
      if (block.classList.contains('charts') && block.getBoundingClientRect().height > this.maximumHeight) {
        for (const panel of Array.from(block.children)) {
          this.splitChart(panel as HTMLElement, add, host);
        }
      } else add(copy);
    }
    const original = host.querySelector<HTMLElement>(':scope > .detail-panel');
    if (original) {
      let tablePanel: HTMLElement | undefined;
      let body: HTMLTableSectionElement | undefined;
      const startTable = () => {
        const panel = original.cloneNode(true) as HTMLElement;
        panel.querySelector('tbody')!.replaceChildren();
        panel.querySelector('tfoot')!.remove();
        panel.querySelector('.detail-note')!.remove();
        return panel;
      };
      for (const row of Array.from(original.querySelectorAll('tbody tr'))) {
        if (!tablePanel) {
          tablePanel = startTable();
          add(tablePanel);
          body = tablePanel.querySelector('tbody')!;
        }
        const copy = row.cloneNode(true);
        body!.appendChild(copy);
        if (!fits()) {
          copy.parentNode!.removeChild(copy);
          // Keep a table header with at least one whole row on every page.
          if (!body!.children.length) tablePanel.remove();
          sheet = makeSheet();
          tablePanel = startTable();
          sheet.appendChild(tablePanel);
          body = tablePanel.querySelector('tbody')!;
          body.appendChild(copy);
          if (!fits()) throw new Error('Uma linha do relatório excede o tamanho legível da página.');
        }
      }
      const totalsPanel = startTable();
      totalsPanel.querySelector('table')!.appendChild(original.querySelector('tfoot')!.cloneNode(true));
      totalsPanel.appendChild(original.querySelector('.detail-note')!.cloneNode(true));
      add(totalsPanel);
    }
    return sheets.filter(page => page.childElementCount > 0);
  }

  private splitChart(panel: HTMLElement, add: (node: HTMLElement) => void, host: HTMLElement): void {
    const selector = panel.classList.contains('distribution-panel') ? '.distribution-item' : '.comparison-row';
    const rows = Array.from(panel.querySelectorAll<HTMLElement>(selector));
    const chunk = (start: number, end: number) => {
      const copy = panel.cloneNode(true) as HTMLElement;
      copy.style.cssText = 'padding:22px 23px;margin-bottom:22px;';
      copy.querySelectorAll(selector).forEach((row, index) => { if (index < start || index >= end) row.remove(); });
      if (selector === '.comparison-row') {
        const names = Array.from(copy.querySelectorAll('.bar-label')).map(label => label.textContent?.trim() ?? '');
        copy.querySelectorAll('.exceeded-note').forEach(note => {
          if (!names.some(name => note.textContent?.trim().startsWith(`${name}:`))) note.remove();
        });
      }
      return copy;
    };
    let start = 0;
    while (start < Math.max(rows.length, 1)) {
      let end = start + 1;
      let accepted = chunk(start, end);
      for (; end < rows.length; end++) {
        const candidate = chunk(start, end + 1);
        host.appendChild(candidate);
        const height = candidate.getBoundingClientRect().height;
        candidate.remove();
        if (height > this.maximumHeight) break;
        accepted = candidate;
      }
      add(accepted);
      start = end;
    }
  }
}
