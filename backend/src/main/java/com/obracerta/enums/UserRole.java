package com.obracerta.enums;

public enum UserRole {
    USER("user"),
    ADMIN("admin");

    private String role;

    UserRole(String Role){
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}
