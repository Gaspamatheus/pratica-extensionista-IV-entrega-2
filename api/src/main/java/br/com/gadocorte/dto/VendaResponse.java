package br.com.gadocorte.dto;

import br.com.gadocorte.entity.Venda;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

public record VendaResponse(Long id, Long animalId, String brinco, LocalDate data, BigDecimal pesoKg,
                            BigDecimal valorTotal, BigDecimal valorPorArroba, String comprador) {

    /** 1 arroba = 15 kg de peso vivo (referência usada no mercado de boi gordo). */
    private static final BigDecimal KG_POR_ARROBA = new BigDecimal("15");

    public static VendaResponse de(Venda v) {
        BigDecimal arrobas = v.getPesoKg().divide(KG_POR_ARROBA, 4, RoundingMode.HALF_UP);
        BigDecimal valorArroba = v.getValorTotal().divide(arrobas, 2, RoundingMode.HALF_UP);
        return new VendaResponse(v.getId(), v.getAnimal().getId(), v.getAnimal().getBrinco(), v.getData(),
                v.getPesoKg(), v.getValorTotal(), valorArroba, v.getComprador());
    }
}
