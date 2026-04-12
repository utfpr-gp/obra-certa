package com.obracerta.model;

import jakarta.persistence.*;

@Entity
@Table(name = "pending_payments")
public class PendingPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
}
