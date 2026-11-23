package br.com.gadocorte.repository;

import br.com.gadocorte.entity.Venda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    @Query("select v from Venda v join fetch v.animal order by v.data desc, v.id desc")
    List<Venda> findAllComAnimal();

    Optional<Venda> findByAnimalId(Long animalId);

    boolean existsByAnimalId(Long animalId);
}
