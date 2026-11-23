package br.com.gadocorte.repository;

import br.com.gadocorte.entity.Pesagem;
import br.com.gadocorte.entity.StatusAnimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PesagemRepository extends JpaRepository<Pesagem, Long> {

    List<Pesagem> findByAnimalIdOrderByDataAscIdAsc(Long animalId);

    List<Pesagem> findTop50ByOrderByDataDescIdDesc();

    Optional<Pesagem> findByIdCliente(String idCliente);

    long countByDataGreaterThanEqual(LocalDate data);

    @Query("select p from Pesagem p join fetch p.animal a where a.status = :status order by a.id, p.data, p.id")
    List<Pesagem> findAllByStatusAnimal(@Param("status") StatusAnimal status);

    void deleteByAnimalId(Long animalId);
}
