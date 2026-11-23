package br.com.gadocorte.dto;

import java.math.BigDecimal;

/** Indicadores da tela inicial do app. */
public record ResumoResponse(
        long animaisAtivos,
        long animaisVendidos,
        long animaisEmCarencia,
        BigDecimal pesoMedioKg,
        BigDecimal gmdMedioKg,
        long pesagensUltimos30Dias) {
}
