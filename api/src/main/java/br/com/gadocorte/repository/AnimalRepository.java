package br.com.gadocorte.repository;

import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.StatusAnimal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnimalRepository extends JpaRepository<Animal, Long> {

    boolean existsByBrinco(String brinco);

    boolean existsByBrincoAndIdNot(String brinco, Long id);

    long countByStatus(StatusAnimal status);

    /** Busca por status e por texto no brinco, nome ou lote. Os dois filtros são opcionais. */
    @Query("""
            select a from Animal a
            where (:status is null or a.status = :status)
              and (:busca is null
                   or lower(a.brinco) like lower(concat('%', :busca, '%'))
                   or lower(a.nome) like lower(concat('%', :busca, '%'))
                   or lower(a.lote) like lower(concat('%', :busca, '%')))
            order by a.brinco
            """)
    List<Animal> buscar(@Param("status") StatusAnimal status, @Param("busca") String busca);
}
