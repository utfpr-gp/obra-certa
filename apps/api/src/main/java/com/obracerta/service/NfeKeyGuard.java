package com.obracerta.service;

import com.obracerta.exception.NfeAlreadyRegisteredException;
import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NfeKeyGuard {

    private final ProjectRepository projects;

    public NfeKeyGuard(ProjectRepository projects) {
        this.projects = projects;
    }

    // Participa da transação de quem grava: o bloqueio da obra dura até o commit dessa transação.
    @Transactional
    public void ensureNotRegistered(String projectId, String nfeKey) {
        projects.lockActiveById(projectId).orElseThrow(ResourceNotFoundException::new);
        if (projects.countActiveExpensesByProjectIdAndNfeKey(projectId, nfeKey) > 0)
            throw new NfeAlreadyRegisteredException();
    }
}
