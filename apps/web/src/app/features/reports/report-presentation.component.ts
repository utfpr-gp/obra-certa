import { Component, computed, input } from '@angular/core';
import { LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideTrendingUp, LucideInfo, LucideCircleCheck, LucideCircleAlert } from '@lucide/angular';
import { ReportPresentationModel } from './report-presentation.model';
import { HoverScrollDirective } from '../../shared/directives/hover-scroll.directive';

@Component({
  selector: 'app-report-presentation',
  standalone: true,
  imports: [HoverScrollDirective, LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideTrendingUp, LucideInfo, LucideCircleCheck, LucideCircleAlert],
  templateUrl: './report-presentation.component.html',
  styleUrl: './report-presentation.component.css',
  host: { '[class.export-mode]': 'exportMode()' },
})
export class ReportPresentationComponent {
  readonly model = input.required<ReportPresentationModel>();
  readonly exportMode = input(false);
  readonly generatedAt = input<string | null>(null);
  readonly generatedAtLabel = computed(() => {
    const value = this.generatedAt();
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  });
}
