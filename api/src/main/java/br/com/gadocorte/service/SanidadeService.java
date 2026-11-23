package br.com.gadocorte.service;

import br.com.gadocorte.dto.AplicacaoRequest;
import br.com.gadocorte.dto.AplicacaoResponse;
import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.StatusAnimal;
import br.com.gadocorte.exception.RecursoNaoEncontradoException;
import br.com.gadocorte.exception.RegraNegocioException;
import br.com.gadocorte.repository.AplicacaoSanitariaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** Regras do módulo Sanidade: vacinas, vermífugos, medicamentos e carência. */
@Service
public class SanidadeService {

    private final AplicacaoSanitariaRepository aplicacaoRepository;
    private final AnimalService animalService;
    private final Clock clock;

    public SanidadeService(AplicacaoSanitariaRepository aplicacaoRepository, AnimalService animalService, Clock clock) {
        this.aplicacaoRepository = aplicacaoRepository;
        this.animalService = animalService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AplicacaoResponse> listarRecentes() {
        return aplicacaoRepository.findTop50ByOrderByDataAplicacaoDescIdDesc().stream()
                .map(AplicacaoResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<AplicacaoResponse> listarDoAnimal(Long animalId) {
        animalService.buscarEntidade(animalId);
        return aplicacaoRepository.findByAnimalIdOrderByDataAplicacaoDescIdDesc(animalId).stream()
                .map(AplicacaoResponse::de).toList();
    }

    /** Aplicações com carência vigente hoje, em animais ativos. */
    @Transactional(readOnly = true)
    public List<AplicacaoResponse> carenciasVigentes() {
        return aplicacaoRepository.findCarenciasVigentes(LocalDate.now(clock), StatusAnimal.ATIVO).stream()
                .map(AplicacaoResponse::de).toList();
    }

    /** Registra a aplicação e calcula o fim da carência. Reenvios da fila offline não duplicam. */
    @Transactional
    public AplicacaoResponse registrar(AplicacaoRequest req) {
        if (req.idCliente() != null && !req.idCliente().isBlank()) {
            Optional<AplicacaoSanitaria> existente = aplicacaoRepository.findByIdCliente(req.idCliente());
            if (existente.isPresent()) {
                return AplicacaoResponse.de(existente.get());
            }
        }
        Animal animal = animalService.buscarAtivo(req.animalId());
        if (req.dataAplicacao().isBefore(animal.getDataEntrada())) {
            throw new RegraNegocioException("A aplicação não pode ser anterior à entrada do animal na fazenda");
        }
        AplicacaoSanitaria a = new AplicacaoSanitaria();
        a.setAnimal(animal);
        a.setTipo(req.tipo());
        a.setProduto(req.produto().trim());
        a.setDose(req.dose());
        a.setDataAplicacao(req.dataAplicacao());
        a.setCarenciaDias(req.carenciaDias());
        a.setFimCarencia(calcularFimCarencia(req.dataAplicacao(), req.carenciaDias()));
        a.setObservacao(req.observacao());
        a.setIdCliente(req.idCliente() == null || req.idCliente().isBlank() ? null : req.idCliente());
        return AplicacaoResponse.de(aplicacaoRepository.save(a));
    }

    @Transactional
    public void excluir(Long id) {
        AplicacaoSanitaria a = aplicacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aplicação " + id + " não encontrada"));
        aplicacaoRepository.delete(a);
    }

    /**
     * Último dia de carência, contando o dia da aplicação como o primeiro. Com 30 dias a partir de 01/03,
     * o animal fica bloqueado de 01/03 a 30/03 e pode ser vendido a partir de 31/03. Sem carência (0 dias),
     * o fim é a véspera da aplicação, ou seja, nada fica bloqueado.
     */
    public static LocalDate calcularFimCarencia(LocalDate dataAplicacao, int carenciaDias) {
        return dataAplicacao.plusDays(carenciaDias).minusDays(1);
    }
}
