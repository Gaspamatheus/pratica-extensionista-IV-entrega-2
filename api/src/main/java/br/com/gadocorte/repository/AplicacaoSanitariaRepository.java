package br.com.gadocorte.repository;

import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.StatusAnimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AplicacaoSanitariaRepository extends JpaRepository<AplicacaoSanitaria, Long> {

    List<AplicacaoSanitaria> findByAnimalIdOrderByDataAplicacaoDescIdDesc(Long animalId);

    List<AplicacaoSanitaria> findTop50ByOrderByDataAplicacaoDescIdDesc();

    Optional<AplicacaoSanitaria> findByIdCliente(String idCliente);

    /** Aplicação com a carência mais longa ainda valendo na data informada, se houver. */
    Optional<AplicacaoSanitaria> findFirstByAnimalIdAndFimCarenciaGreaterThanEqualOrderByFimCarenciaDesc(
            Long animalId, LocalDate data);

    /** Aplicações cuja carência ainda vale na data, só de animais ativos. */
    @Query("""
            select ap from AplicacaoSanitaria ap join fetch ap.animal a
            where a.status = :status and ap.fimCarencia >= :data
            order by ap.fimCarencia desc
            """)
    List<AplicacaoSanitaria> findCarenciasVigentes(@Param("data") LocalDate data,
                                                   @Param("status") StatusAnimal status);

    void deleteByAnimalId(Long animalId);
}
