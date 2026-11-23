package br.com.gadocorte.dto;

import br.com.gadocorte.entity.TipoAplicacao;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AplicacaoRequest(
        @NotNull(message = "Informe o animal") Long animalId,
        @NotNull(message = "Informe o tipo") TipoAplicacao tipo,
        @NotBlank(message = "Informe o produto") @Size(max = 100) String produto,
        @Size(max = 40) String dose,
        @NotNull(message = "Informe a data") @PastOrPresent(message = "A data não pode ser futura") LocalDate dataAplicacao,
        @NotNull(message = "Informe os dias de carência (0 se não houver)")
        @Min(value = 0, message = "A carência não pode ser negativa")
        @Max(value = 365, message = "Carência acima de 365 dias") Integer carenciaDias,
        @Size(max = 300) String observacao,
        @Size(max = 40) String idCliente) {
}
