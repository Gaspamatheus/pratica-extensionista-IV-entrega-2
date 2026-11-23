package br.com.gadocorte.service;

import br.com.gadocorte.dto.VendaRequest;
import br.com.gadocorte.dto.VendaResponse;
import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.StatusAnimal;
import br.com.gadocorte.entity.Venda;
import br.com.gadocorte.exception.RegraNegocioException;
import br.com.gadocorte.repository.AplicacaoSanitariaRepository;
import br.com.gadocorte.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/** Regras do módulo Vendas. A principal: animal em carência sanitária não pode ser vendido. */
@Service
public class VendaService {

    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final VendaRepository vendaRepository;
    private final AplicacaoSanitariaRepository aplicacaoRepository;
    private final AnimalService animalService;

    public VendaService(VendaRepository vendaRepository, AplicacaoSanitariaRepository aplicacaoRepository,
                        AnimalService animalService) {
        this.vendaRepository = vendaRepository;
        this.aplicacaoRepository = aplicacaoRepository;
        this.animalService = animalService;
    }

    @Transactional(readOnly = true)
    public List<VendaResponse> listar() {
        return vendaRepository.findAllComAnimal().stream().map(VendaResponse::de).toList();
    }

    @Transactional
    public VendaResponse vender(Long animalId, VendaRequest req) {
        Animal animal = animalService.buscarAtivo(animalId);
        if (req.data().isBefore(animal.getDataEntrada())) {
            throw new RegraNegocioException("A venda não pode ser anterior à entrada do animal na fazenda");
        }
        Optional<AplicacaoSanitaria> carencia = aplicacaoRepository
                .findFirstByAnimalIdAndFimCarenciaGreaterThanEqualOrderByFimCarenciaDesc(animalId, req.data());
        if (carencia.isPresent()) {
            AplicacaoSanitaria ap = carencia.get();
            throw new RegraNegocioException(String.format(
                    "O animal %s está em carência até %s por causa de %s aplicado em %s. A venda fica liberada a partir de %s.",
                    animal.getBrinco(), ap.getFimCarencia().format(BR), ap.getProduto(),
                    ap.getDataAplicacao().format(BR), ap.getFimCarencia().plusDays(1).format(BR)));
        }
        Venda venda = new Venda();
        venda.setAnimal(animal);
        venda.setData(req.data());
        venda.setPesoKg(req.pesoKg());
        venda.setValorTotal(req.valorTotal());
        venda.setComprador(req.comprador());
        animal.setStatus(StatusAnimal.VENDIDO);
        return VendaResponse.de(vendaRepository.save(venda));
    }
}
