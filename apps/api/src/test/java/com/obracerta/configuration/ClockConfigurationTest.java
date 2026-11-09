package com.obracerta.configuration;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClockConfigurationTest {

    @Test
    void businessClockUsesSaoPauloZone() {
        Clock clock = new ClockConfiguration().clock();

        assertEquals(ZoneId.of("America/Sao_Paulo"), clock.getZone());
    }
}
