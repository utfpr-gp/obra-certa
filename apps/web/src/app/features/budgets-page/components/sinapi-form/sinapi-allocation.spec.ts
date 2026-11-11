import {
  allocateCents,
  estimateCents,
  FULL_ALLOCATION,
  initialPercent,
  parsePercent,
  PRD_RATEIO,
  shareCents,
} from './sinapi-allocation';

describe('sinapi-allocation', () => {
  describe('tabela inicial do PRD', () => {
    it('lists the nine PRD categories in PRD order and sums exactly to 100%', () => {
      expect(PRD_RATEIO.map(({ name }) => name)).toEqual([
        'Fundação e Estrutura',
        'Alvenaria',
        'Elétrica',
        'Hidráulica',
        'Telhado e Cobertura',
        'Esquadrias e Vidros',
        'Acabamento e Pintura',
        'Mão de Obra',
        'Taxas e Serviços',
      ]);
      const total = PRD_RATEIO.reduce((sum, { percent }) => sum + parsePercentOrThrow(percent), 0);
      expect(total).toBe(FULL_ALLOCATION);
    });

    it('gives categories outside the PRD table an initial percentage of zero', () => {
      expect(initialPercent('Alvenaria')).toBe(14);
      expect(initialPercent('Categoria do catálogo')).toBe(0);
    });
  });

  describe('estimateCents', () => {
    it('multiplies the unit cost by the area in exact decimal and returns centavos', () => {
      expect(estimateCents(2221.06, 100)).toBe(22210600);
      expect(estimateCents(0.1, 1)).toBe(10);
      expect(estimateCents(1.01, 1.01)).toBe(102);
    });

    it('rounds half up: R$ 0,05 × 0,5 = 2,5 centavos becomes 3 centavos', () => {
      expect(estimateCents(0.05, 0.5)).toBe(3);
    });

    it('rounds down below half a centavo', () => {
      expect(estimateCents(0.01, 0.4)).toBe(0);
    });

    it('returns zero for a zero area', () => {
      expect(estimateCents(2221.06, 0)).toBe(0);
    });

    it('returns null when a number has no plain decimal form', () => {
      expect(estimateCents(1e-7, 1)).toBeNull();
    });
  });

  describe('parsePercent', () => {
    it('reads two-decimal percentages exactly as hundredths', () => {
      expect(parsePercent(33.33)).toEqual({ ok: true, hundredths: 3333 });
      expect(parsePercent(0)).toEqual({ ok: true, hundredths: 0 });
      expect(parsePercent(100)).toEqual({ ok: true, hundredths: 10000 });
    });

    it('rejects a missing percentage', () => {
      expect(parsePercent(null)).toEqual({ ok: false, reason: 'missing' });
    });

    it('rejects a negative percentage', () => {
      expect(parsePercent(-0.01)).toEqual({ ok: false, reason: 'negative' });
    });

    it('rejects more than two decimal places instead of rounding', () => {
      expect(parsePercent(33.333)).toEqual({ ok: false, reason: 'precision' });
      expect(parsePercent(14.001)).toEqual({ ok: false, reason: 'precision' });
    });
  });

  describe('shareCents', () => {
    it('rounds a single exact share half up to the centavo', () => {
      expect(shareCents(10, 2500)).toBe(3); // 2,5 centavos sobe
      expect(shareCents(10, 3300)).toBe(3); // 3,3 centavos
      expect(shareCents(222106_00, 1500)).toBe(33315_90);
      expect(shareCents(10, 0)).toBe(0);
    });
  });

  describe('allocateCents', () => {
    it('splits 10 centavos at 33%, 33% and 34% as 3, 3 and 4', () => {
      expect(allocateCents(10, [3300, 3300, 3400])).toEqual([3, 3, 4]);
    });

    it('splits 10 centavos at 25%, 25% and 50% as 3, 2 and 5, breaking the tie by position', () => {
      expect(allocateCents(10, [2500, 2500, 5000])).toEqual([3, 2, 5]);
    });

    it('gives the leftover centavos to the largest fractions', () => {
      expect(allocateCents(102, [3333, 3333, 3334])).toEqual([34, 34, 34]);
    });

    it('keeps the sum of the parcels equal to the total and each parcel within one centavo of its exact share', () => {
      const sets = [
        [3333, 3333, 3334],
        [2500, 2500, 5000],
        [1, 9999, 0],
        PRD_RATEIO.map(({ percent }) => parsePercentOrThrow(percent)),
      ];
      for (const hundredths of sets) {
        for (let total = 0; total <= 250; total++) {
          const parcels = allocateCents(total, hundredths);
          const sum = parcels.reduce((acc, value) => acc + value, 0);
          expect(sum).toBe(total);
          hundredths.forEach((value, index) => {
            const exact = (total * value) / FULL_ALLOCATION;
            expect(parcels[index]).toBeGreaterThanOrEqual(Math.floor(exact));
            expect(parcels[index]).toBeLessThanOrEqual(Math.ceil(exact));
          });
        }
      }
    });

    it('splits the PRD table over the estimate without losing a centavo', () => {
      const hundredths = PRD_RATEIO.map(({ percent }) => parsePercentOrThrow(percent));
      const parcels = allocateCents(22210600, hundredths);
      expect(parcels.reduce((sum, value) => sum + value, 0)).toBe(22210600);
    });

    it('refuses a rateio whose percentages do not sum to 100%', () => {
      expect(() => allocateCents(10, [3300, 3300, 3300])).toThrowError();
    });

    it('refuses a negative percentage', () => {
      expect(() => allocateCents(10, [-100, 10100])).toThrowError();
    });
  });
});

function parsePercentOrThrow(percent: number): number {
  const result = parsePercent(percent);
  if (!result.ok) throw new Error(`invalid PRD percentage ${percent}`);
  return result.hundredths;
}
