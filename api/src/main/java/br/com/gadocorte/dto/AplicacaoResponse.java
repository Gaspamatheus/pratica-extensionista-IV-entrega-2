package br.com.gadocorte.dto;

import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.TipoAplicacao;

import java.time.LocalDate;

public record AplicacaoResponse(Long id, Long animalId, String brinco, TipoAplicacao tipo, String produto,
                                String dose, LocalDate dataAplicacao, int carenciaDias, LocalDate fimCarencia,
                                String observacao, String idCliente) {

    public static AplicacaoResponse de(AplicacaoSanitaria a) {
        return new AplicacaoResponse(a.getId(), a.getAnimal().getId(), a.getAnimal().getBrinco(), a.getTipo(),
                a.getProduto(), a.getDose(), a.getDataAplicacao(), a.getCarenciaDias(), a.getFimCarencia(),
                a.getObservacao(), a.getIdCliente());
    }
}
