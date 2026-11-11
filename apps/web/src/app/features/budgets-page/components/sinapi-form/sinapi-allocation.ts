/**
 * Rateio da US15 em aritmética exata. Percentuais ficam em centésimos de percentual
 * (33,33% = 3333) e valores em centavos inteiros. Nunca há number de ponto flutuante
 * no caminho do dinheiro. A mesma regra existe no back, em SinapiAllocationCalculator.
 */

/** 100% em centésimos de percentual. */
export const FULL_ALLOCATION = 10000;

/** Tabela inicial de percentuais da US15 no PRD, em ordem de tabela (usada no desempate). */
export const PRD_RATEIO: readonly { readonly name: string; readonly percent: number }[] = [
  { name: 'Fundação e Estrutura', percent: 25 },
  { name: 'Alvenaria', percent: 14 },
  { name: 'Elétrica', percent: 8 },
  { name: 'Hidráulica', percent: 9 },
  { name: 'Telhado e Cobertura', percent: 10 },
  { name: 'Esquadrias e Vidros', percent: 10 },
  { name: 'Acabamento e Pintura', percent: 24 },
  { name: 'Mão de Obra', percent: 0 },
  { name: 'Taxas e Serviços', percent: 0 },
];

/** Categorias fora da tabela do PRD começam em 0% e perdem o desempate para as da tabela. */
export function initialPercent(name: string): number {
  return PRD_RATEIO.find(row => row.name === name)?.percent ?? 0;
}

/** Posição na tabela do PRD; categorias fora dela ficam por último. */
export function prdOrder(name: string): number {
  const index = PRD_RATEIO.findIndex(row => row.name === name);
  return index === -1 ? PRD_RATEIO.length : index;
}

export type PercentError = 'missing' | 'negative' | 'precision';
export type PercentResult = { readonly ok: true; readonly hundredths: number }
  | { readonly ok: false; readonly reason: PercentError };

const PLAIN_DECIMAL = /^(\d+)(?:\.(\d+))?$/;

/** Lê um percentual digitado. Mais de duas casas decimais é erro, não arredondamento silencioso. */
export function parsePercent(value: number | null): PercentResult {
  if (value === null || !Number.isFinite(value)) return { ok: false, reason: 'missing' };
  if (value < 0) return { ok: false, reason: 'negative' };
  const match = PLAIN_DECIMAL.exec(String(value));
  if (!match) return { ok: false, reason: 'precision' };
  const [, integer, fraction = ''] = match;
  if (fraction.length > 2) return { ok: false, reason: 'precision' };
  return { ok: true, hundredths: Number(integer) * 100 + Number((fraction + '00').slice(0, 2)) };
}

/**
 * Estimativa em centavos: custo unitário × área, em decimal exato, com HALF_UP.
 * Devolve null se algum número não tiver forma decimal simples (ex.: notação exponencial).
 */
export function estimateCents(unitCost: number, area: number): number | null {
  const unit = plainDecimal(unitCost);
  const surface = plainDecimal(area);
  if (!unit || !surface) return null;
  const numerator = unit.units * surface.units * 100n;
  const denominator = 10n ** BigInt(unit.scale + surface.scale);
  return Number((2n * numerator + denominator) / (2n * denominator));
}

/** Parcela exata de um total em centavos, arredondada para centavo com HALF_UP. */
export function shareCents(totalCents: number, hundredths: number): number {
  const product = totalCents * hundredths;
  return Math.floor((2 * product + FULL_ALLOCATION) / (2 * FULL_ALLOCATION));
}

/**
 * Divide o total em centavos pelos percentuais. Cada parcela recebe o piso da fração exata;
 * o resto vai 1 centavo por vez para as maiores frações; empate de fração vai para a posição
 * menor na lista, que deve estar na ordem do PRD. A soma das parcelas é sempre o total.
 */
export function allocateCents(totalCents: number, hundredths: readonly number[]): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new RangeError('O total deve ser um número inteiro de centavos não negativo.');
  }
  if (hundredths.some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new RangeError('Os percentuais devem ser inteiros não negativos em centésimos.');
  }
  const sum = hundredths.reduce((acc, value) => acc + value, 0);
  if (sum !== FULL_ALLOCATION) {
    throw new RangeError('A soma dos percentuais deve ser 100%.');
  }

  const products = hundredths.map(value => totalCents * value);
  const remainders = products.map(product => product % FULL_ALLOCATION);
  const parcels = products.map((product, index) => (product - remainders[index]) / FULL_ALLOCATION);
  let leftover = totalCents - parcels.reduce((acc, value) => acc + value, 0);

  const order = hundredths.map((_, index) => index)
    .sort((a, b) => remainders[b] - remainders[a] || a - b);
  for (const index of order) {
    if (leftover === 0) break;
    parcels[index] += 1;
    leftover -= 1;
  }
  return parcels;
}

function plainDecimal(value: number): { units: bigint; scale: number } | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const match = PLAIN_DECIMAL.exec(String(value));
  if (!match) return null;
  const [, integer, fraction = ''] = match;
  return { units: BigInt(integer + fraction), scale: fraction.length };
}
