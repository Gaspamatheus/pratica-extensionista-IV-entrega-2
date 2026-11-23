package br.com.gadocorte.service;

import br.com.gadocorte.dto.PesagemRequest;
import br.com.gadocorte.dto.PesagemResponse;
import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.Pesagem;
import br.com.gadocorte.exception.RecursoNaoEncontradoException;
import br.com.gadocorte.exception.RegraNegocioException;
import br.com.gadocorte.repository.PesagemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/** Regras do módulo Pesagem. */
@Service
public class PesagemService {

    private final PesagemRepository pesagemRepository;
    private final AnimalService animalService;

    public PesagemService(PesagemRepository pesagemRepository, AnimalService animalService) {
        this.pesagemRepository = pesagemRepository;
        this.animalService = animalService;
    }

    @Transactional(readOnly = true)
    public List<PesagemResponse> listarRecentes() {
        return pesagemRepository.findTop50ByOrderByDataDescIdDesc().stream().map(PesagemResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<PesagemResponse> listarDoAnimal(Long animalId) {
        animalService.buscarEntidade(animalId);
        return pesagemRepository.findByAnimalIdOrderByDataAscIdAsc(animalId).stream().map(PesagemResponse::de).toList();
    }

    /**
     * Registra uma pesagem. Se o idCliente já foi recebido (reenvio da fila offline),
     * devolve a pesagem existente em vez de criar outra.
     */
    @Transactional
    public PesagemResponse registrar(PesagemRequest req) {
        if (req.idCliente() != null && !req.idCliente().isBlank()) {
            Optional<Pesagem> existente = pesagemRepository.findByIdCliente(req.idCliente());
            if (existente.isPresent()) {
                return PesagemResponse.de(existente.get());
            }
        }
        Animal animal = animalService.buscarAtivo(req.animalId());
        if (req.data().isBefore(animal.getDataEntrada())) {
            throw new RegraNegocioException("A pesagem não pode ser anterior à entrada do animal na fazenda");
        }
        Pesagem p = new Pesagem();
        p.setAnimal(animal);
        p.setData(req.data());
        p.setPesoKg(req.pesoKg());
        p.setObservacao(req.observacao());
        p.setIdCliente(req.idCliente() == null || req.idCliente().isBlank() ? null : req.idCliente());
        return PesagemResponse.de(pesagemRepository.save(p));
    }

    @Transactional
    public void excluir(Long id) {
        Pesagem p = pesagemRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pesagem " + id + " não encontrada"));
        pesagemRepository.delete(p);
    }
}
