export interface ReportDemoCategory {
  readonly id: string;
  readonly name: string;
  readonly plannedCents: number;
  readonly actualCents: number;
  readonly color: string;
}

// TODO #8: substituir a massa demonstrativa pelo relatório integrado da obra.
export const REPORT_DEMO_CATEGORIES: readonly ReportDemoCategory[] = [
  { id: 'structure', name: 'Fundação e Estrutura', plannedCents: 4500000, actualCents: 1550000, color: '#007f87' },
  { id: 'masonry', name: 'Alvenaria', plannedCents: 8500000, actualCents: 1200000, color: '#4884bb' },
  { id: 'electrical', name: 'Elétrica', plannedCents: 800000, actualCents: 900000, color: '#9a78b6' },
  { id: 'plumbing', name: 'Hidráulica', plannedCents: 2200000, actualCents: 740000, color: '#50a9c1' },
  { id: 'labor', name: 'Mão de Obra', plannedCents: 12870000, actualCents: 1500000, color: '#335e77' },
  { id: 'finishing', name: 'Acabamento e Pintura', plannedCents: 10000000, actualCents: 1100000, color: '#dba632' },
  { id: 'services', name: 'Taxas e Serviços', plannedCents: 800000, actualCents: 450000, color: '#9aabba' },
];
