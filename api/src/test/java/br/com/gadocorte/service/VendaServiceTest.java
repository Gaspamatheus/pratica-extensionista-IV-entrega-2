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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendaServiceTest {

    @Mock
    private VendaRepository vendaRepository;
    @Mock
    private AplicacaoSanitariaRepository aplicacaoRepository;
    @Mock
    private AnimalService animalService;

    @InjectMocks
    private VendaService vendaService;

    private Animal animal;

    @BeforeEach
    void setUp() {
        animal = new Animal();
        animal.setId(1L);
        animal.setBrinco("BR-010");
        animal.setDataEntrada(LocalDate.of(2026, 1, 1));
        when(animalService.buscarAtivo(1L)).thenReturn(animal);
    }

    @Test
    void naoVendeAnimalEmCarencia() {
        AplicacaoSanitaria ap = new AplicacaoSanitaria();
        ap.setProduto("Ivermectina");
        ap.setDataAplicacao(LocalDate.of(2026, 3, 1));
        ap.setFimCarencia(LocalDate.of(2026, 3, 30));
        LocalDate dataVenda = LocalDate.of(2026, 3, 15);
        when(aplicacaoRepository.findFirstByAnimalIdAndFimCarenciaGreaterThanEqualOrderByFimCarenciaDesc(1L, dataVenda))
                .thenReturn(Optional.of(ap));

        assertThatThrownBy(() -> vendaService.vender(1L, venda(dataVenda)))
                .isInstanceOf(RegraNegocioException.class)
                .hasMessageContaining("carência até 30/03/2026")
                .hasMessageContaining("liberada a partir de 31/03/2026");

        verify(vendaRepository, never()).save(any());
        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.ATIVO);
    }

    @Test
    void vendeAnimalSemCarenciaEMarcaComoVendido() {
        LocalDate dataVenda = LocalDate.of(2026, 4, 2);
        when(aplicacaoRepository.findFirstByAnimalIdAndFimCarenciaGreaterThanEqualOrderByFimCarenciaDesc(1L, dataVenda))
                .thenReturn(Optional.empty());
        when(vendaRepository.save(any(Venda.class))).thenAnswer(inv -> inv.getArgument(0));

        VendaResponse resp = vendaService.vender(1L, venda(dataVenda));

        assertThat(animal.getStatus()).isEqualTo(StatusAnimal.VENDIDO);
        // 540 kg = 36 arrobas; R$ 11.880 / 36 = R$ 330 por arroba
        assertThat(resp.valorPorArroba()).isEqualByComparingTo("330.00");
    }

    @Test
    void naoVendeAntesDaEntradaNaFazenda() {
        assertThatThrownBy(() -> vendaService.vender(1L, venda(LocalDate.of(2025, 12, 1))))
                .isInstanceOf(RegraNegocioException.class);
    }

    private static VendaRequest venda(LocalDate data) {
        return new VendaRequest(data, new BigDecimal("540"), new BigDecimal("11880"), "Frigorífico Exemplo");
    }
}
