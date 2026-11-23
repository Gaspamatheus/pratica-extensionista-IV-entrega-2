package br.com.gadocorte.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PesagemRequest(
        @NotNull(message = "Informe o animal") Long animalId,
        @NotNull(message = "Informe a data") @PastOrPresent(message = "A data não pode ser futura") LocalDate data,
        @NotNull(message = "Informe o peso")
        @DecimalMin(value = "1", message = "O peso deve ser maior que zero")
        @DecimalMax(value = "2000", message = "Peso acima do possível para um bovino") BigDecimal pesoKg,
        @Size(max = 300) String observacao,
        @Size(max = 40) String idCliente) {
}
