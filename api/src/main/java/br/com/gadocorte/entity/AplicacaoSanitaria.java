package br.com.gadocorte.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

/** Vacina, vermífugo ou medicamento aplicado em um animal (módulo de sanidade). */
@Entity
@Table(name = "aplicacoes_sanitarias")
public class AplicacaoSanitaria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private TipoAplicacao tipo;

    @Column(nullable = false, length = 100)
    private String produto;

    @Column(length = 40)
    private String dose;

    @Column(nullable = false)
    private LocalDate dataAplicacao;

    /** Dias de carência do produto: período em que o animal não pode ser abatido nem vendido. */
    @Column(nullable = false)
    private int carenciaDias;

    /** Último dia de carência (o dia da aplicação conta como o primeiro). Venda liberada a partir do dia seguinte. */
    @Column(nullable = false)
    private LocalDate fimCarencia;

    @Column(length = 300)
    private String observacao;

    /** Mesmo papel do idCliente da pesagem: evita duplicar lançamentos reenviados pela fila offline. */
    @Column(unique = true, length = 40)
    private String idCliente;

    public AplicacaoSanitaria() {
    }

    public Long getId() { return id; }
    public Animal getAnimal() { return animal; }
    public void setAnimal(Animal animal) { this.animal = animal; }
    public TipoAplicacao getTipo() { return tipo; }
    public void setTipo(TipoAplicacao tipo) { this.tipo = tipo; }
    public String getProduto() { return produto; }
    public void setProduto(String produto) { this.produto = produto; }
    public String getDose() { return dose; }
    public void setDose(String dose) { this.dose = dose; }
    public LocalDate getDataAplicacao() { return dataAplicacao; }
    public void setDataAplicacao(LocalDate dataAplicacao) { this.dataAplicacao = dataAplicacao; }
    public int getCarenciaDias() { return carenciaDias; }
    public void setCarenciaDias(int carenciaDias) { this.carenciaDias = carenciaDias; }
    public LocalDate getFimCarencia() { return fimCarencia; }
    public void setFimCarencia(LocalDate fimCarencia) { this.fimCarencia = fimCarencia; }
    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
    public String getIdCliente() { return idCliente; }
    public void setIdCliente(String idCliente) { this.idCliente = idCliente; }
}
