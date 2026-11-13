export function formatPercentage(value: number, minimumFractionDigits = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits,
    maximumFractionDigits: 1,
  }).format(value) + '%';
}
