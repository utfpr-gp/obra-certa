package com.obracerta.configuration.security;

import com.obracerta.exception.ResourceNotFoundException;
import com.obracerta.model.entity.User;
import com.obracerta.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserContextHelperTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserContextHelper userContextHelper;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void returnsTheUserEntityWhenThePrincipalIsAlreadyAUser() {
        User user = user("user-1", "owner@example.com");
        authenticate(user);

        assertThat(userContextHelper.getAuthenticatedUser()).isSameAs(user);
        verifyNoInteractions(userRepository);
    }

    @Test
    void resolvesTheUserByUsernameWhenThePrincipalIsOnlyUserDetails() {
        UserDetails principal = new org.springframework.security.core.userdetails.User(
                "owner@example.com", "password", List.of());
        authenticate(principal);
        User user = user("user-1", "owner@example.com");
        when(userRepository.findByEmail("owner@example.com")).thenReturn(Optional.of(user));

        assertThat(userContextHelper.getAuthenticatedUser()).isSameAs(user);
    }

    @Test
    void throwsNotFoundWhenTheUserDetailsUsernameHasNoUser() {
        UserDetails principal = new org.springframework.security.core.userdetails.User(
                "missing@example.com", "password", List.of());
        authenticate(principal);
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userContextHelper.getAuthenticatedUser())
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void throwsNotFoundWhenThereIsNoAuthentication() {
        assertThatThrownBy(() -> userContextHelper.getAuthenticatedUser())
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    void throwsNotFoundWhenTheAuthenticationIsNotAuthenticated() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("owner@example.com", "password"));

        assertThatThrownBy(() -> userContextHelper.getAuthenticatedUser())
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    void throwsNotFoundWhenThePrincipalIsNull() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(null, null, List.of()));

        assertThatThrownBy(() -> userContextHelper.getAuthenticatedUser())
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(userRepository);
    }

    @Test
    void throwsNotFoundWhenThePrincipalIsNotSupported() {
        authenticate("anonymousUser");

        assertThatThrownBy(() -> userContextHelper.getAuthenticatedUser())
                .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(userRepository);
    }

    private static User user(String id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        return user;
    }

    private static void authenticate(Object principal) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }
}
