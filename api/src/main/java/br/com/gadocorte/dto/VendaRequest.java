package br.com.gadocorte.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VendaRequest(
        @NotNull(message = "Informe a data") @PastOrPresent(message = "A data não pode ser futura") LocalDate data,
        @NotNull(message = "Informe o peso de venda")
        @DecimalMin(value = "1", message = "O peso deve ser maior que zero") BigDecimal pesoKg,
        @NotNull(message = "Informe o valor")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero") BigDecimal valorTotal,
        @Size(max = 120) String comprador) {
}
