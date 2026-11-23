package br.com.gadocorte.service;

import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.Pesagem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class IndicadoresTest {

    private static final LocalDate ENTRADA = LocalDate.of(2026, 1, 1);

    @Test
    void gmdUsaPesoDeEntradaEUltimaPesagem() {
        Animal animal = animal("300");
        // 100 dias depois da entrada o animal pesa 380 kg: ganhou 80 kg em 100 dias = 0,8 kg/dia
        List<Pesagem> pesagens = List.of(pesagem(ENTRADA.plusDays(50), "340"), pesagem(ENTRADA.plusDays(100), "380"));

        assertThat(Indicadores.gmd(animal, pesagens)).isEqualByComparingTo("0.8");
        assertThat(Indicadores.pesoAtual(animal, pesagens)).isEqualByComparingTo("380");
    }

    @Test
    void gmdSemPesoDeEntradaUsaPrimeiraPesagem() {
        Animal animal = animal(null);
        List<Pesagem> pesagens = List.of(pesagem(ENTRADA.plusDays(10), "300"), pesagem(ENTRADA.plusDays(40), "330"));

        assertThat(Indicadores.gmd(animal, pesagens)).isEqualByComparingTo("1.0");
    }

    @Test
    void gmdNuloComUmaMedicaoSo() {
        assertThat(Indicadores.gmd(animal("300"), List.of())).isNull();
        assertThat(Indicadores.pesoAtual(animal("300"), List.of())).isEqualByComparingTo("300");
        assertThat(Indicadores.pesoAtual(animal(null), List.of())).isNull();
    }

    @Test
    void mediaDeListaVaziaENula() {
        assertThat(Indicadores.media(List.of())).isNull();
        assertThat(Indicadores.media(List.of(new BigDecimal("300"), new BigDecimal("401")))).isEqualByComparingTo("350.50");
    }

    private static Animal animal(String pesoEntrada) {
        Animal a = new Animal();
        a.setDataEntrada(ENTRADA);
        a.setPesoEntrada(pesoEntrada == null ? null : new BigDecimal(pesoEntrada));
        return a;
    }

    private static Pesagem pesagem(LocalDate data, String peso) {
        Pesagem p = new Pesagem();
        p.setData(data);
        p.setPesoKg(new BigDecimal(peso));
        return p;
    }
}
