package com.obracerta.service;

import com.obracerta.service.SinapiAllocationCalculator.Parcel;
import com.obracerta.service.SinapiAllocationCalculator.Share;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SinapiAllocationCalculatorTest {

    /** Tabela inicial de percentuais da US15 no PRD (docs/prd.md, "Percentuais iniciais"). */
    private static final List<String> PRD_PERCENTAGES = List.of(
            "25", "14", "8", "9", "10", "10", "24", "0", "0");

    @Test
    void estimateMultipliesUnitCostByAreaAndKeepsTwoDecimals() {
        assertThat(SinapiAllocationCalculator.estimate(new BigDecimal("2221.06"), new BigDecimal("100")))
                .isEqualByComparingTo("222106.00");
        assertThat(SinapiAllocationCalculator.estimate(new BigDecimal("0.1"), new BigDecimal("1")))
                .isEqualByComparingTo("0.10");
        assertThat(SinapiAllocationCalculator.estimate(new BigDecimal("1.01"), new BigDecimal("1.01")))
                .isEqualByComparingTo("1.02");
    }

    @Test
    void estimateRoundsHalfUp() {
        // R$ 0,05 × 0,5 m² = R$ 0,025 → meio centavo sobe para R$ 0,03.
        assertThat(SinapiAllocationCalculator.estimate(new BigDecimal("0.05"), new BigDecimal("0.5")))
                .isEqualByComparingTo("0.03");
    }

    @Test
    void estimateRoundsDownBelowHalfCentavo() {
        assertThat(SinapiAllocationCalculator.estimate(new BigDecimal("0.01"), new BigDecimal("0.4")))
                .isEqualByComparingTo("0.00");
    }

    @Test
    void splitsTenCentavosAt33_33_34As3_3_4() {
        List<Parcel> parcels = SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"),
                List.of(share("a", "33"), share("b", "33"), share("c", "34")));

        assertThat(amounts(parcels)).usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("0.03"), new BigDecimal("0.03"), new BigDecimal("0.04"));
    }

    @Test
    void splitsTenCentavosAt25_25_50As3_2_5BreakingTheTieByPosition() {
        List<Parcel> parcels = SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"),
                List.of(share("a", "25"), share("b", "25"), share("c", "50")));

        assertThat(amounts(parcels)).usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("0.03"), new BigDecimal("0.02"), new BigDecimal("0.05"));
    }

    @Test
    void givesLeftoverCentavosToTheLargestFractions() {
        List<Parcel> parcels = SinapiAllocationCalculator.allocate(
                new BigDecimal("1.02"),
                List.of(share("a", "33.33"), share("b", "33.33"), share("c", "33.34")));

        assertThat(amounts(parcels)).usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("0.34"), new BigDecimal("0.34"), new BigDecimal("0.34"));
    }

    @Test
    void roundsTheTotalHalfUpBeforeSplittingIt() {
        List<Parcel> parcels = SinapiAllocationCalculator.allocate(
                new BigDecimal("0.025"), List.of(share("a", "100")));

        assertThat(parcels).extracting(Parcel::amount).usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("0.03"));
    }

    @Test
    void prdTableSumsExactlyTo100Percent() {
        BigDecimal sum = PRD_PERCENTAGES.stream().map(BigDecimal::new)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(sum).isEqualByComparingTo("100");
    }

    @Test
    void keepsTheSumOfTheParcelsEqualToTheTotalInEveryCase() {
        List<List<String>> sets = List.of(
                List.of("33.33", "33.33", "33.34"),
                List.of("25", "25", "50"),
                List.of("0.01", "99.99", "0"),
                PRD_PERCENTAGES);

        for (List<String> percentages : sets) {
            List<Share> shares = new java.util.ArrayList<>();
            for (int i = 0; i < percentages.size(); i++) shares.add(share("c" + i, percentages.get(i)));
            for (int cents = 0; cents <= 250; cents++) {
                BigDecimal total = BigDecimal.valueOf(cents, 2);
                List<Parcel> parcels = SinapiAllocationCalculator.allocate(total, shares);
                BigDecimal sum = parcels.stream().map(Parcel::amount).reduce(BigDecimal.ZERO, BigDecimal::add);

                assertThat(sum).isEqualByComparingTo(total);
            }
        }
    }

    @Test
    void splitsThePrdTableOverTheEstimateWithoutLosingACentavo() {
        List<Share> shares = new java.util.ArrayList<>();
        for (int i = 0; i < PRD_PERCENTAGES.size(); i++) shares.add(share("c" + i, PRD_PERCENTAGES.get(i)));

        List<Parcel> parcels = SinapiAllocationCalculator.allocate(new BigDecimal("222106.00"), shares);
        BigDecimal sum = parcels.stream().map(Parcel::amount).reduce(BigDecimal.ZERO, BigDecimal::add);

        assertThat(sum).isEqualByComparingTo("222106.00");
    }

    @Test
    void refusesAPercentageSumDifferentFrom100() {
        assertThatThrownBy(() -> SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"), List.of(share("a", "33"), share("b", "33"), share("c", "33"))))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"), List.of(share("a", "15"), share("b", "86"))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void refusesANegativePercentage() {
        assertThatThrownBy(() -> SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"), List.of(share("a", "-1"), share("b", "101"))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void refusesMoreThanTwoDecimalPlacesInAPercentage() {
        assertThatThrownBy(() -> SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"), List.of(share("a", "33.333"), share("b", "66.667"))))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void acceptsTwoDecimalPlacesThatSumExactlyTo100() {
        assertThatCode(() -> SinapiAllocationCalculator.allocate(
                new BigDecimal("0.10"), List.of(share("a", "33.33"), share("b", "33.33"), share("c", "33.34"))))
                .doesNotThrowAnyException();
    }

    private static Share share(String categoryId, String percentage) {
        return new Share(categoryId, new BigDecimal(percentage));
    }

    private static List<BigDecimal> amounts(List<Parcel> parcels) {
        return parcels.stream().map(Parcel::amount).toList();
    }
}
