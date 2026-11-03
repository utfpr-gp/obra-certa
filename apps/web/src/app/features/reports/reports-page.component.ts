import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReportPresentationModel } from './report-presentation.model';
import { ReportPresentationComponent } from './report-presentation.component';
import { ReportVisualExportService } from './report-visual-export.service';
import { LucideFileText } from '@lucide/angular';
import { ActiveProjectService } from '../../core/services/active-project.service';
import { ReportService } from '../../core/services/report.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [ReportPresentationComponent, LucideFileText, ReactiveFormsModule],
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
  readonly periodForm = new FormGroup({
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
  });
  readonly periodError = signal<string | null>(null);
  private pdfRequest?: Subscription;
  private pdfGeneration = 0;
  private readonly destroyRef = inject(DestroyRef);
  private requestGeneration = 0;
  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.discardPdf());
    effect(() => {
      this.activeProject.activeProject();
      this.discardPdf();
      this.selectedCategory.set('all');
      this.periodForm.reset();
      this.appliedFrom.set('');
      this.appliedTo.set('');
      this.periodError.set(null);
      untracked(() => this.retry());
    });
  }

  retry(): void {
    const project = this.activeProject.activeProject();
    const generation = ++this.requestGeneration;
    if (!project) { this.report.set(null); this.error.set(null); this.loading.set(false); return; }
    this.loading.set(true);
    this.error.set(null);
    this.report.set(null);
    this.reportService.get(project.id, this.appliedFrom(), this.appliedTo()).subscribe({
      next: report => {
        if (generation === this.requestGeneration && report.projectId === project.id) {
          this.report.set(report);
          this.loading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => { if (generation === this.requestGeneration) { this.loading.set(false); this.error.set(error.status === 404 ? 'A obra não foi localizada.' : 'Não foi possível carregar os relatórios.'); } },
    });
  }
  applyPeriod(): void {
    const { from, to } = this.periodForm.getRawValue();
    if (from && to && from > to) {
      this.periodError.set('A data inicial do período não pode ser posterior à final.');
      return;
    }
    this.discardPdf();
    this.periodError.set(null);
    this.appliedFrom.set(from);
    this.appliedTo.set(to);
    this.retry();
  }
  clearPeriod(): void {
    this.periodForm.reset();
    this.applyPeriod();
  }
  selectCategory(event: Event): void {
    this.discardPdf();
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }
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
    this.pdfRequest = this.reportService.exportSnapshot(project.id, this.appliedFrom(), this.appliedTo(), this.selectedCategory()).subscribe({
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
