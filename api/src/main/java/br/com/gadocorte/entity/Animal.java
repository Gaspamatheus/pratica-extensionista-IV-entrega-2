package br.com.gadocorte.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "animais")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Número do brinco de identificação. Único no rebanho. */
    @Column(nullable = false, unique = true, length = 30)
    private String brinco;

    @Column(length = 60)
    private String nome;

    @Column(length = 60)
    private String raca;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Sexo sexo;

    private LocalDate dataNascimento;

    @Column(nullable = false)
    private LocalDate dataEntrada;

    /** Peso na entrada da fazenda, em kg. */
    @Column(precision = 7, scale = 2)
    private BigDecimal pesoEntrada;

    /** Lote ou pasto onde o animal está. */
    @Column(length = 60)
    private String lote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatusAnimal status = StatusAnimal.ATIVO;

    @Column(length = 500)
    private String observacoes;

    public Animal() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBrinco() { return brinco; }
    public void setBrinco(String brinco) { this.brinco = brinco; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getRaca() { return raca; }
    public void setRaca(String raca) { this.raca = raca; }
    public Sexo getSexo() { return sexo; }
    public void setSexo(Sexo sexo) { this.sexo = sexo; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate dataEntrada) { this.dataEntrada = dataEntrada; }
    public BigDecimal getPesoEntrada() { return pesoEntrada; }
    public void setPesoEntrada(BigDecimal pesoEntrada) { this.pesoEntrada = pesoEntrada; }
    public String getLote() { return lote; }
    public void setLote(String lote) { this.lote = lote; }
    public StatusAnimal getStatus() { return status; }
    public void setStatus(StatusAnimal status) { this.status = status; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public boolean isAtivo() {
        return status == StatusAnimal.ATIVO;
    }
}
