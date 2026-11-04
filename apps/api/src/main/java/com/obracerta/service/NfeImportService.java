package com.obracerta.service;

import com.obracerta.configuration.security.UserContextHelper;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.integration.NfeXmlParser;
import com.obracerta.model.dto.nfe.NfePreviewResponseDTO;
import com.obracerta.repository.ProjectRepository;
import org.springframework.stereotype.Service;

@Service
public class NfeImportService {

    private final UserContextHelper identity;
    private final ProjectRepository projects;
    private final NfeXmlParser parser;
    private final NfeKeyGuard keyGuard;

    public NfeImportService(UserContextHelper identity, ProjectRepository projects,
                            NfeXmlParser parser, NfeKeyGuard keyGuard) {
        this.identity = identity;
        this.projects = projects;
        this.parser = parser;
        this.keyGuard = keyGuard;
    }

    // Só leitura: nada é gravado. Trava de chave fica para a confirmação.
    public NfePreviewResponseDTO preview(String projectId, byte[] xml) {
        var owner = identity.getAuthenticatedUser();
        projects.findByIdAndUserIdAndDeletedAtIsNull(projectId, owner.getId())
                .orElseThrow(ResourceNotFoundException::new);
        var preview = parser.parse(projectId, xml);
        keyGuard.ensureNotRegisteredWithoutLock(projectId, preview.accessKey());
        return preview;
    }
}
