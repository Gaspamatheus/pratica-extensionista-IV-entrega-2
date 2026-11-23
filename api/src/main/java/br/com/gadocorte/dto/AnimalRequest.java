package br.com.gadocorte.dto;

import br.com.gadocorte.entity.Sexo;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AnimalRequest(
        @NotBlank(message = "Informe o brinco") @Size(max = 30) String brinco,
        @Size(max = 60) String nome,
        @Size(max = 60) String raca,
        @NotNull(message = "Informe o sexo") Sexo sexo,
        @PastOrPresent(message = "A data de nascimento não pode ser futura") LocalDate dataNascimento,
        @PastOrPresent(message = "A data de entrada não pode ser futura") LocalDate dataEntrada,
        @DecimalMin(value = "0.1", message = "O peso deve ser maior que zero") BigDecimal pesoEntrada,
        @Size(max = 60) String lote,
        @Size(max = 500) String observacoes) {
}
