package com.obracerta.configuration.security;

import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Ponto unico de resolucao do usuario autenticado. Os services de negocio pedem o
 * dono do request aqui em vez de conhecerem o {@link SecurityContextHolder}.
 */
@Component
public class UserContextHelper {

    private final UserRepository userRepository;

    public UserContextHelper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal() == null) {
            throw new ResourceNotFoundException();
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof UserDetails details) {
            return userRepository.findByEmail(details.getUsername())
                    .orElseThrow(ResourceNotFoundException::new);
        }
        throw new ResourceNotFoundException();
    }
}
