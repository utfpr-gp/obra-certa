import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportPresentationModel } from './report-presentation.model';
import { ReportPresentationComponent } from './report-presentation.component';
import { ReportVisualExportService } from './report-visual-export.service';
import { LucideFileText, LucideInfo } from '@lucide/angular';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ReportService } from '../../core/services/report.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [ReportPresentationComponent, LucideFileText, LucideInfo],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css',
})
export class ReportsPageComponent extends ReportPresentationModel {
  readonly activeProject = inject(ActiveProjectService);
  private readonly reportService = inject(ReportService);
  private readonly visualExport = inject(ReportVisualExportService);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly generatingPdf = signal(false);
  readonly pdfError = signal<string | null>(null);
  private pdfRequest?: Subscription;
  private pdfGeneration = 0;
  private readonly destroyRef = inject(DestroyRef);
  private requestGeneration = 0;
  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.discardPdf());
    effect(() => {
      const project = this.activeProject.activeProject();
      this.discardPdf();
      const generation = ++this.requestGeneration;
      this.selectedCategory.set('all');
      this.report.set(null);
      this.error.set(null);
      if (!project) {
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.reportService.get(project.id).subscribe({
        next: report => {
          if (generation === this.requestGeneration && report.projectId === project.id) {
            this.report.set(report);
            this.loading.set(false);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (generation !== this.requestGeneration) return;
          this.loading.set(false);
          this.error.set(error.status === 404 ? 'A obra não foi localizada.' : 'Não foi possível carregar os relatórios.');
        },
      });
    });
  }

  retry(): void {
    const project = this.activeProject.activeProject();
    if (!project) return;
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    const generation = ++this.requestGeneration;
    this.reportService.get(project.id).subscribe({
      next: report => {
        if (generation === this.requestGeneration && report.projectId === project.id) {
          this.report.set(report);
          this.loading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => { if (generation === this.requestGeneration) { this.loading.set(false); this.error.set(error.status === 404 ? 'A obra não foi localizada.' : 'Não foi possível carregar os relatórios.'); } },
    });
  }
  selectCategory(event: Event): void { this.selectedCategory.set((event.target as HTMLSelectElement).value); }
  private discardPdf(): void {
    ++this.pdfGeneration;
    this.pdfRequest?.unsubscribe();
    this.generatingPdf.set(false);
    this.pdfError.set(null);
  }

  exportPdf(): void {
    const project = this.activeProject.activeProject();
    if (!project || this.generatingPdf() || this.loading()) return;
    const generation = ++this.pdfGeneration;
    const contextVersion = this.activeProject.contextVersion();
    this.generatingPdf.set(true);
    this.pdfError.set(null);
    const isCurrent = () => !this.destroyRef.destroyed && generation === this.pdfGeneration
      && contextVersion === this.activeProject.contextVersion() && this.activeProject.activeProject()?.id === project.id;
    const fail = () => {
      if (!isCurrent()) return;
      this.generatingPdf.set(false);
      this.pdfError.set('Não foi possível gerar o PDF.');
    };
    this.pdfRequest = this.reportService.exportSnapshot(project.id).subscribe({
      next: snapshot => {
        if (!isCurrent()) return;
        if (!snapshot?.report || snapshot.report.projectId !== project.id) { fail(); return; }
        void this.visualExport.generate(snapshot, isCurrent).then(blob => {
          if (!isCurrent() || !blob) return;
          const safeFilename = /^relatorio-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.pdf$/.test(snapshot.filename)
            ? snapshot.filename : 'relatorio-obra.pdf';
          const url = URL.createObjectURL(blob);
          try {
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = safeFilename;
            anchor.click();
          } finally { URL.revokeObjectURL(url); }
          this.generatingPdf.set(false);
        }).catch(fail);
      },
      error: fail,
    });
  }
}
