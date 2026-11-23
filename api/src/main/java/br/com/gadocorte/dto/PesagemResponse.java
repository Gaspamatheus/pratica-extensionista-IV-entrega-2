package br.com.gadocorte.dto;

import br.com.gadocorte.entity.Pesagem;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PesagemResponse(Long id, Long animalId, String brinco, LocalDate data, BigDecimal pesoKg,
                              String observacao, String idCliente) {

    public static PesagemResponse de(Pesagem p) {
        return new PesagemResponse(p.getId(), p.getAnimal().getId(), p.getAnimal().getBrinco(), p.getData(),
                p.getPesoKg(), p.getObservacao(), p.getIdCliente());
    }
}
