package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.exception.SinapiReferenceException;
import com.obracerta.model.dto.budget.SinapiAvailabilityDTO;
import com.obracerta.model.dto.budget.SinapiReferencesDTO;
import com.obracerta.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static java.util.Map.entry;

@Service
public class SinapiReferenceService {
    private static final Map<String, String> UF_CODES = Map.ofEntries(
            entry("RO", "11"), entry("AC", "12"), entry("AM", "13"), entry("RR", "14"),
            entry("PA", "15"), entry("AP", "16"), entry("TO", "17"), entry("MA", "21"),
            entry("PI", "22"), entry("CE", "23"), entry("RN", "24"), entry("PB", "25"),
            entry("PE", "26"), entry("AL", "27"), entry("SE", "28"), entry("BA", "29"),
            entry("MG", "31"), entry("ES", "32"), entry("RJ", "33"), entry("SP", "35"),
            entry("PR", "41"), entry("SC", "42"), entry("RS", "43"), entry("MS", "50"),
            entry("MT", "51"), entry("GO", "52"), entry("DF", "53"));
    private static final Set<String> PROJECT_TYPES =
            Set.of("7101", "7088", "7087", "7102", "7089", "7090", "7091", "7103");
    private static final Pattern MONTH = Pattern.compile("(?!0000)[0-9]{4}-(0[1-9]|1[0-2])");
    private static final Pattern YEAR = Pattern.compile("(?!0000)[0-9]{4}");

    private final ProjectRepository projects;
    private final UserContextHelper userContext;
    private final SidraClient sidra;

    public SinapiReferenceService(ProjectRepository projects, UserContextHelper userContext, SidraClient sidra) {
        this.projects = projects;
        this.userContext = userContext;
        this.sidra = sidra;
    }

    public SinapiReferencesDTO getReferences(String projectId, String uf, String month, String projectType) {
        String ufCode = UF_CODES.get(uf);
        if (ufCode == null || !MONTH.matcher(month).matches() || !PROJECT_TYPES.contains(projectType)) {
            throw new SinapiReferenceException(HttpStatus.BAD_REQUEST,
                    "Informe uma UF, um mês e um projeto de referência válidos.");
        }

        requireOwnedProject(projectId);
        return new SinapiReferencesDTO("SIDRA/IBGE",
                sidra.getFinishes(ufCode, month.replace("-", ""), projectType));
    }

    public SinapiAvailabilityDTO getAvailability(String projectId, String uf, String year) {
        String ufCode = UF_CODES.get(uf);
        if (ufCode == null || !YEAR.matcher(year).matches()) {
            throw new SinapiReferenceException(HttpStatus.BAD_REQUEST, "Informe uma UF e um ano válidos.");
        }

        requireOwnedProject(projectId);
        return new SinapiAvailabilityDTO(sidra.getAvailability(ufCode, year, PROJECT_TYPES));
    }

    private void requireOwnedProject(String projectId) {
        String userId = userContext.getAuthenticatedUser().getId();
        projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, userId)
                .orElseThrow(ResourceNotFoundException::new);
    }
}
