package br.com.gadocorte.service;

import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.Pesagem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Cálculos zootécnicos usados nas telas: peso atual e ganho médio diário (GMD). */
public final class Indicadores {

    private Indicadores() {
    }

    /** Um ponto da curva de peso do animal. */
    record PontoPeso(LocalDate data, BigDecimal pesoKg) {
    }

    /** Peso de entrada (se houver) seguido das pesagens, em ordem de data. */
    static List<PontoPeso> curvaDePeso(Animal animal, List<Pesagem> pesagens) {
        List<PontoPeso> pontos = new ArrayList<>();
        if (animal.getPesoEntrada() != null && animal.getDataEntrada() != null) {
            pontos.add(new PontoPeso(animal.getDataEntrada(), animal.getPesoEntrada()));
        }
        for (Pesagem p : pesagens) {
            pontos.add(new PontoPeso(p.getData(), p.getPesoKg()));
        }
        pontos.sort(Comparator.comparing(PontoPeso::data));
        return pontos;
    }

    /** Peso mais recente conhecido: a última pesagem ou, sem pesagens, o peso de entrada. */
    public static BigDecimal pesoAtual(Animal animal, List<Pesagem> pesagens) {
        List<PontoPeso> curva = curvaDePeso(animal, pesagens);
        return curva.isEmpty() ? null : curva.get(curva.size() - 1).pesoKg();
    }

    /**
     * GMD = (peso final - peso inicial) / dias entre as duas medições, em kg/dia.
     * Devolve null quando há menos de duas medições em datas diferentes.
     */
    public static BigDecimal gmd(Animal animal, List<Pesagem> pesagens) {
        List<PontoPeso> curva = curvaDePeso(animal, pesagens);
        if (curva.size() < 2) {
            return null;
        }
        PontoPeso inicio = curva.get(0);
        PontoPeso fim = curva.get(curva.size() - 1);
        long dias = ChronoUnit.DAYS.between(inicio.data(), fim.data());
        if (dias <= 0) {
            return null;
        }
        return fim.pesoKg().subtract(inicio.pesoKg()).divide(BigDecimal.valueOf(dias), 3, RoundingMode.HALF_UP);
    }

    /** Média simples, arredondada em 2 casas. Lista vazia devolve null. */
    public static BigDecimal media(List<BigDecimal> valores) {
        if (valores.isEmpty()) {
            return null;
        }
        BigDecimal soma = valores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return soma.divide(BigDecimal.valueOf(valores.size()), 2, RoundingMode.HALF_UP);
    }
}
