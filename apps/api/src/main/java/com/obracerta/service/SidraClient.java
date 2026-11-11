package com.obracerta.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.obracerta.exception.SinapiReferenceException;
import com.obracerta.model.dto.budget.SinapiReferencesDTO.Finish;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SidraClient {
    private static final String QUERY = "https://api.sidra.ibge.gov.br/values/t/647/n3/{uf}/v/51"
            + "/p/{month}/c314/{project}/c41/786,787,788,789";
    private static final List<String> FINISH_CODES = List.of("786", "787", "788", "789");
    private static final List<String> DIMENSION_COLUMNS = List.of("D1C", "D2C", "D3C", "D4C", "D5C", "D5N");
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final RestClient http;

    @Autowired
    public SidraClient() {
        this(createHttpClient());
    }

    public SidraClient(RestClient http) {
        this.http = http;
    }

    private static RestClient createHttpClient() {
        var factory = new SimpleClientHttpRequestFactory() {
            @Override
            protected void prepareConnection(HttpURLConnection connection, String method) throws IOException {
                super.prepareConnection(connection, method);
                connection.setInstanceFollowRedirects(false);
            }
        };
        factory.setConnectTimeout(TIMEOUT);
        factory.setReadTimeout(TIMEOUT);
        return RestClient.builder().requestFactory(factory).build();
    }

    public List<Finish> getFinishes(String uf, String month, String project) {
        JsonNode rows;
        try {
            rows = http.get().uri(QUERY, uf, month, project)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve().body(JsonNode.class);
        } catch (RestClientException exception) {
            throw unavailable();
        }

        if (rows == null || !rows.isArray() || !hasExpectedHeader(rows.path(0))) {
            throw unavailable();
        }

        Map<String, Finish> finishes = new LinkedHashMap<>();
        // The first row is the header. SIDRA dimensions follow the query order.
        for (int index = 1; index < rows.size(); index++) {
            JsonNode row = rows.get(index);
            String finishCode = row.path("D5C").asText();
            if (!uf.equals(row.path("D1C").asText()) || !"51".equals(row.path("D2C").asText())
                    || !month.equals(row.path("D3C").asText()) || !project.equals(row.path("D4C").asText())
                    || !FINISH_CODES.contains(finishCode)) {
                continue;
            }

            String name = row.path("D5N").asText();
            BigDecimal cost = positiveCost(row.path("V").asText());
            if (cost != null && !name.isBlank()) {
                finishes.putIfAbsent(finishCode, new Finish(finishCode, name, cost));
            }
        }
        return List.copyOf(finishes.values());
    }

    private static boolean hasExpectedHeader(JsonNode header) {
        return "Valor".equals(header.path("V").textValue())
                && DIMENSION_COLUMNS.stream().map(header::path)
                .allMatch(column -> column.isTextual() && !column.textValue().isBlank());
    }

    private static BigDecimal positiveCost(String value) {
        try {
            BigDecimal cost = new BigDecimal(value);
            return cost.signum() > 0 ? cost : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static SinapiReferenceException unavailable() {
        return new SinapiReferenceException(HttpStatus.SERVICE_UNAVAILABLE,
                "O SIDRA/IBGE está temporariamente indisponível. Tente novamente.");
    }
}
