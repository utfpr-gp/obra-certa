package com.obracerta.model.dto.budget;

import java.util.Map;
import java.util.Set;

public record SinapiAvailabilityDTO(Map<String, Set<String>> months) {}
