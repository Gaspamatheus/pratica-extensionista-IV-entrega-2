package br.com.gadocorte.service;

import br.com.gadocorte.dto.ResumoResponse;
import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.Pesagem;
import br.com.gadocorte.entity.StatusAnimal;
import br.com.gadocorte.repository.AnimalRepository;
import br.com.gadocorte.repository.AplicacaoSanitariaRepository;
import br.com.gadocorte.repository.PesagemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/** Indicadores do rebanho para a tela inicial. */
@Service
public class DashboardService {

    private final AnimalRepository animalRepository;
    private final PesagemRepository pesagemRepository;
    private final AplicacaoSanitariaRepository aplicacaoRepository;
    private final Clock clock;

    public DashboardService(AnimalRepository animalRepository, PesagemRepository pesagemRepository,
                            AplicacaoSanitariaRepository aplicacaoRepository, Clock clock) {
        this.animalRepository = animalRepository;
        this.pesagemRepository = pesagemRepository;
        this.aplicacaoRepository = aplicacaoRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ResumoResponse resumo() {
        LocalDate hoje = LocalDate.now(clock);
        List<Animal> ativos = animalRepository.buscar(StatusAnimal.ATIVO, null);
        Map<Long, List<Pesagem>> pesagensPorAnimal = pesagemRepository.findAllByStatusAnimal(StatusAnimal.ATIVO)
                .stream().collect(Collectors.groupingBy(p -> p.getAnimal().getId()));

        List<BigDecimal> pesos = new ArrayList<>();
        List<BigDecimal> gmds = new ArrayList<>();
        for (Animal a : ativos) {
            List<Pesagem> ps = pesagensPorAnimal.getOrDefault(a.getId(), List.of());
            BigDecimal peso = Indicadores.pesoAtual(a, ps);
            if (peso != null) {
                pesos.add(peso);
            }
            BigDecimal gmd = Indicadores.gmd(a, ps);
            if (gmd != null) {
                gmds.add(gmd);
            }
        }

        long emCarencia = aplicacaoRepository.findCarenciasVigentes(hoje, StatusAnimal.ATIVO).stream()
                .map(AplicacaoSanitaria::getAnimal).map(Animal::getId).filter(Objects::nonNull).distinct().count();

        return new ResumoResponse(
                ativos.size(),
                animalRepository.countByStatus(StatusAnimal.VENDIDO),
                emCarencia,
                Indicadores.media(pesos),
                gmds.isEmpty() ? null : Indicadores.media(gmds).setScale(3, java.math.RoundingMode.HALF_UP),
                pesagemRepository.countByDataGreaterThanEqual(hoje.minusDays(30)));
    }
}
