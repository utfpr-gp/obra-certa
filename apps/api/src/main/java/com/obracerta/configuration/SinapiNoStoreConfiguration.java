package com.obracerta.configuration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Respostas do fluxo SINAPI (US15) não podem ser guardadas em cache. O interceptor roda antes
 * da leitura do corpo, então o header também sai nos erros de JSON malformado e de validação.
 * Fica restrito ao fluxo: o restante da API não muda.
 */
@Configuration
public class SinapiNoStoreConfiguration implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new NoStoreInterceptor()).addPathPatterns("/api/budgets/*/sinapi/**");
    }

    private static final class NoStoreInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
            return true;
        }
    }
}
