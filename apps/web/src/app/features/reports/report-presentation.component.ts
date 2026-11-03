import { Component, input } from '@angular/core';
import { LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideTrendingUp, LucideInfo, LucideCircleCheck, LucideCircleAlert } from '@lucide/angular';
import { ReportPresentationModel } from './report-presentation.model';

@Component({
  selector: 'app-report-presentation',
  standalone: true,
  imports: [LucideWallet, LucidePieChart, LucidePiggyBank, LucideTriangleAlert, LucideTrendingUp, LucideInfo, LucideCircleCheck, LucideCircleAlert],
  templateUrl: './report-presentation.component.html',
  styleUrl: './report-presentation.component.css',
  host: { '[class.export-mode]': 'exportMode()' },
})
export class ReportPresentationComponent {
  readonly model = input.required<ReportPresentationModel>();
  readonly exportMode = input(false);
}
