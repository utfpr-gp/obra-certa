package com.obracerta.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "expense_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpenseCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Expense> expenses = new ArrayList<>();

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Budget> budgets = new ArrayList<>();
}
