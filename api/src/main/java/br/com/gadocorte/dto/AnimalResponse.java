package br.com.gadocorte.dto;

import br.com.gadocorte.entity.Sexo;
import br.com.gadocorte.entity.StatusAnimal;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dados do animal com os indicadores calculados: último peso, ganho médio diário (GMD)
 * e se ele está em carência sanitária.
 */
public record AnimalResponse(
        Long id,
        String brinco,
        String nome,
        String raca,
        Sexo sexo,
        LocalDate dataNascimento,
        LocalDate dataEntrada,
        BigDecimal pesoEntrada,
        String lote,
        StatusAnimal status,
        String observacoes,
        BigDecimal pesoAtual,
        LocalDate dataUltimaPesagem,
        BigDecimal gmdKg,
        boolean emCarencia,
        LocalDate carenciaAte) {
}
