package com.obracerta.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.IntStream;

/**
 * Rateio da US15 (orçamento a partir do SINAPI). Espelha a regra de
 * {@code sinapi-allocation.ts} no front: valores decimais exatos, arredondamento HALF_UP
 * para centavos, resto distribuído pelas maiores frações e empate pela posição na lista,
 * que deve vir na ordem do PRD. A soma das parcelas é sempre igual ao total.
 *
 * <p>Sem estado e sem endpoint nesta etapa: a confirmação que usa esta regra é da tarefa 5.
 */
public final class SinapiAllocationCalculator {

    private static final BigDecimal FULL = new BigDecimal("100");
    private static final int CENTS = 2;

    private SinapiAllocationCalculator() {
    }

    /** Percentual de uma categoria, em percentual (ex.: 33.33 = 33,33%). */
    public record Share(String categoryId, BigDecimal percentage) {
    }

    /** Parcela de uma categoria, em reais com duas casas decimais. */
    public record Parcel(String categoryId, BigDecimal amount) {
    }

    /** Custo unitário × área, arredondado para centavos com HALF_UP. */
    public static BigDecimal estimate(BigDecimal unitCost, BigDecimal area) {
        return unitCost.multiply(area).setScale(CENTS, RoundingMode.HALF_UP);
    }

    /**
     * Divide o total entre as categorias. Os percentuais devem ser não negativos, ter no máximo
     * duas casas decimais e somar exatamente 100. Caso contrário, lança IllegalArgumentException.
     */
    public static List<Parcel> allocate(BigDecimal total, List<Share> shares) {
        if (total == null || total.signum() < 0) {
            throw new IllegalArgumentException("O total deve ser um valor não negativo.");
        }
        validate(shares);

        long totalCents = total.setScale(CENTS, RoundingMode.HALF_UP).unscaledValue().longValueExact();
        int size = shares.size();
        long[] parcels = new long[size];
        BigDecimal[] fractions = new BigDecimal[size];
        long assigned = 0;
        for (int index = 0; index < size; index++) {
            BigDecimal exact = BigDecimal.valueOf(totalCents)
                    .multiply(shares.get(index).percentage())
                    .divide(FULL);
            long floor = exact.setScale(0, RoundingMode.FLOOR).longValueExact();
            parcels[index] = floor;
            fractions[index] = exact.subtract(BigDecimal.valueOf(floor));
            assigned += floor;
        }

        long leftover = totalCents - assigned;
        List<Integer> order = IntStream.range(0, size).boxed()
                .sorted(Comparator.<Integer, BigDecimal>comparing(index -> fractions[index]).reversed()
                        .thenComparingInt(index -> index))
                .toList();
        for (int position = 0; position < leftover; position++) {
            parcels[order.get(position)]++;
        }

        List<Parcel> result = new ArrayList<>(size);
        for (int index = 0; index < size; index++) {
            result.add(new Parcel(shares.get(index).categoryId(), BigDecimal.valueOf(parcels[index], CENTS)));
        }
        return result;
    }

    private static void validate(List<Share> shares) {
        BigDecimal sum = BigDecimal.ZERO;
        for (Share share : shares) {
            BigDecimal percentage = share.percentage();
            if (percentage == null || percentage.signum() < 0) {
                throw new IllegalArgumentException("Os percentuais devem ser não negativos.");
            }
            if (percentage.stripTrailingZeros().scale() > CENTS) {
                throw new IllegalArgumentException("Use no máximo duas casas decimais nos percentuais.");
            }
            sum = sum.add(percentage);
        }
        if (sum.compareTo(FULL) != 0) {
            throw new IllegalArgumentException("A soma dos percentuais deve ser 100%.");
        }
    }
}
