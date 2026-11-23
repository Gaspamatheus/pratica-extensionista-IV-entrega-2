package br.com.gadocorte.service;

import br.com.gadocorte.dto.AplicacaoRequest;
import br.com.gadocorte.dto.AplicacaoResponse;
import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.TipoAplicacao;
import br.com.gadocorte.repository.AplicacaoSanitariaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SanidadeServiceTest {

    @Mock
    private AplicacaoSanitariaRepository aplicacaoRepository;
    @Mock
    private AnimalService animalService;

    @Test
    void fimDaCarenciaContaODiaDaAplicacao() {
        assertThat(SanidadeService.calcularFimCarencia(LocalDate.of(2026, 3, 1), 30)).isEqualTo(LocalDate.of(2026, 3, 30));
        assertThat(SanidadeService.calcularFimCarencia(LocalDate.of(2026, 3, 1), 1)).isEqualTo(LocalDate.of(2026, 3, 1));
        // Sem carência: o "fim" fica na véspera, então nenhum dia é bloqueado
        assertThat(SanidadeService.calcularFimCarencia(LocalDate.of(2026, 3, 1), 0)).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void reenvioDaFilaOfflineNaoDuplica() {
        Animal animal = new Animal();
        animal.setId(1L);
        animal.setBrinco("BR-001");
        AplicacaoSanitaria existente = new AplicacaoSanitaria();
        existente.setAnimal(animal);
        existente.setTipo(TipoAplicacao.VACINA);
        existente.setProduto("Aftosa");
        existente.setDataAplicacao(LocalDate.of(2026, 5, 1));
        existente.setFimCarencia(LocalDate.of(2026, 4, 30));
        existente.setIdCliente("uuid-123");
        when(aplicacaoRepository.findByIdCliente("uuid-123")).thenReturn(Optional.of(existente));

        var service = new SanidadeService(aplicacaoRepository, animalService, Clock.systemDefaultZone());
        AplicacaoResponse resp = service.registrar(new AplicacaoRequest(1L, TipoAplicacao.VACINA, "Aftosa", null,
                LocalDate.of(2026, 5, 1), 0, null, "uuid-123"));

        assertThat(resp.idCliente()).isEqualTo("uuid-123");
        verify(aplicacaoRepository, never()).save(any());
        verify(animalService, never()).buscarAtivo(any());
    }
}
