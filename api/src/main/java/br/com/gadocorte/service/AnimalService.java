package br.com.gadocorte.service;

import br.com.gadocorte.dto.AnimalRequest;
import br.com.gadocorte.dto.AnimalResponse;
import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.Pesagem;
import br.com.gadocorte.entity.StatusAnimal;
import br.com.gadocorte.exception.ConflitoException;
import br.com.gadocorte.exception.RecursoNaoEncontradoException;
import br.com.gadocorte.exception.RegraNegocioException;
import br.com.gadocorte.repository.AnimalRepository;
import br.com.gadocorte.repository.AplicacaoSanitariaRepository;
import br.com.gadocorte.repository.PesagemRepository;
import br.com.gadocorte.repository.VendaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** Regras do módulo Rebanho: cadastro, consulta e baixa de animais. */
@Service
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final PesagemRepository pesagemRepository;
    private final AplicacaoSanitariaRepository aplicacaoRepository;
    private final VendaRepository vendaRepository;
    private final Clock clock;

    public AnimalService(AnimalRepository animalRepository, PesagemRepository pesagemRepository,
                         AplicacaoSanitariaRepository aplicacaoRepository, VendaRepository vendaRepository,
                         Clock clock) {
        this.animalRepository = animalRepository;
        this.pesagemRepository = pesagemRepository;
        this.aplicacaoRepository = aplicacaoRepository;
        this.vendaRepository = vendaRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AnimalResponse> listar(StatusAnimal status, String busca) {
        String termo = (busca == null || busca.isBlank()) ? null : busca.trim();
        return animalRepository.buscar(status, termo).stream().map(this::paraResposta).toList();
    }

    @Transactional(readOnly = true)
    public AnimalResponse buscar(Long id) {
        return paraResposta(buscarEntidade(id));
    }

    @Transactional
    public AnimalResponse criar(AnimalRequest req) {
        String brinco = req.brinco().trim();
        if (animalRepository.existsByBrinco(brinco)) {
            throw new ConflitoException("Já existe um animal com o brinco " + brinco);
        }
        Animal animal = new Animal();
        preencher(animal, req, brinco);
        return paraResposta(animalRepository.save(animal));
    }

    @Transactional
    public AnimalResponse atualizar(Long id, AnimalRequest req) {
        Animal animal = buscarEntidade(id);
        String brinco = req.brinco().trim();
        if (animalRepository.existsByBrincoAndIdNot(brinco, id)) {
            throw new ConflitoException("Já existe um animal com o brinco " + brinco);
        }
        preencher(animal, req, brinco);
        return paraResposta(animal);
    }

    /** Registra a morte do animal. Ele sai do rebanho ativo, mas o histórico é mantido. */
    @Transactional
    public AnimalResponse registrarMorte(Long id) {
        Animal animal = buscarEntidade(id);
        if (!animal.isAtivo()) {
            throw new RegraNegocioException("Só é possível dar baixa em animal ativo");
        }
        animal.setStatus(StatusAnimal.MORTO);
        return paraResposta(animal);
    }

    /** Exclui um cadastro feito por engano, junto com pesagens e aplicações. Animais vendidos não podem ser excluídos. */
    @Transactional
    public void excluir(Long id) {
        Animal animal = buscarEntidade(id);
        if (vendaRepository.existsByAnimalId(id)) {
            throw new RegraNegocioException("Animal vendido não pode ser excluído, pois a venda faz parte do histórico");
        }
        pesagemRepository.deleteByAnimalId(id);
        aplicacaoRepository.deleteByAnimalId(id);
        animalRepository.delete(animal);
    }

    public Animal buscarEntidade(Long id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Animal " + id + " não encontrado"));
    }

    /** Garante que o animal está no rebanho ativo antes de lançar algo nele. */
    public Animal buscarAtivo(Long id) {
        Animal animal = buscarEntidade(id);
        if (!animal.isAtivo()) {
            throw new RegraNegocioException("O animal " + animal.getBrinco() + " não está ativo (" + animal.getStatus() + ")");
        }
        return animal;
    }

    AnimalResponse paraResposta(Animal a) {
        List<Pesagem> pesagens = a.getId() == null ? List.of()
                : pesagemRepository.findByAnimalIdOrderByDataAscIdAsc(a.getId());
        LocalDate ultimaPesagem = pesagens.isEmpty() ? null : pesagens.get(pesagens.size() - 1).getData();
        Optional<AplicacaoSanitaria> carencia = a.getId() == null ? Optional.empty()
                : aplicacaoRepository.findFirstByAnimalIdAndFimCarenciaGreaterThanEqualOrderByFimCarenciaDesc(
                a.getId(), LocalDate.now(clock));
        return new AnimalResponse(a.getId(), a.getBrinco(), a.getNome(), a.getRaca(), a.getSexo(),
                a.getDataNascimento(), a.getDataEntrada(), a.getPesoEntrada(), a.getLote(), a.getStatus(),
                a.getObservacoes(), Indicadores.pesoAtual(a, pesagens), ultimaPesagem, Indicadores.gmd(a, pesagens),
                a.isAtivo() && carencia.isPresent(), carencia.map(AplicacaoSanitaria::getFimCarencia).orElse(null));
    }

    private void preencher(Animal animal, AnimalRequest req, String brinco) {
        LocalDate entrada = req.dataEntrada() != null ? req.dataEntrada() : LocalDate.now(clock);
        if (req.dataNascimento() != null && req.dataNascimento().isAfter(entrada)) {
            throw new RegraNegocioException("A data de nascimento não pode ser depois da data de entrada");
        }
        animal.setBrinco(brinco);
        animal.setNome(vazioParaNulo(req.nome()));
        animal.setRaca(vazioParaNulo(req.raca()));
        animal.setSexo(req.sexo());
        animal.setDataNascimento(req.dataNascimento());
        animal.setDataEntrada(entrada);
        animal.setPesoEntrada(req.pesoEntrada());
        animal.setLote(vazioParaNulo(req.lote()));
        animal.setObservacoes(vazioParaNulo(req.observacoes()));
    }

    private static String vazioParaNulo(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
