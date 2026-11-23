package br.com.gadocorte.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    /** Hash BCrypt da senha. A senha em texto puro nunca é gravada. */
    @Column(nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    protected Usuario() {
    }

    public Usuario(String nome, String username, String senhaHash, Role role) {
        this.nome = nome;
        this.username = username;
        this.senhaHash = senhaHash;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getUsername() { return username; }
    public String getSenhaHash() { return senhaHash; }
    public Role getRole() { return role; }
}
