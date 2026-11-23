package br.com.gadocorte.controller;

import br.com.gadocorte.dto.AnimalRequest;
import br.com.gadocorte.dto.AnimalResponse;
import br.com.gadocorte.dto.AplicacaoResponse;
import br.com.gadocorte.dto.PesagemResponse;
import br.com.gadocorte.dto.VendaRequest;
import br.com.gadocorte.dto.VendaResponse;
import br.com.gadocorte.entity.StatusAnimal;
import br.com.gadocorte.service.AnimalService;
import br.com.gadocorte.service.PesagemService;
import br.com.gadocorte.service.SanidadeService;
import br.com.gadocorte.service.VendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/animais")
@Tag(name = "Rebanho")
public class AnimalController {

    private final AnimalService animalService;
    private final PesagemService pesagemService;
    private final SanidadeService sanidadeService;
    private final VendaService vendaService;

    public AnimalController(AnimalService animalService, PesagemService pesagemService,
                            SanidadeService sanidadeService, VendaService vendaService) {
        this.animalService = animalService;
        this.pesagemService = pesagemService;
        this.sanidadeService = sanidadeService;
        this.vendaService = vendaService;
    }

    @GetMapping
    @Operation(summary = "Lista animais, com filtro opcional por status e busca por brinco, nome ou lote")
    public List<AnimalResponse> listar(@RequestParam(required = false) StatusAnimal status,
                                       @RequestParam(required = false) String busca) {
        return animalService.listar(status, busca);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe do animal com peso atual, GMD e situação de carência")
    public AnimalResponse buscar(@PathVariable Long id) {
        return animalService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Cadastra um animal (somente gerente)")
    public AnimalResponse criar(@Valid @RequestBody AnimalRequest req) {
        return animalService.criar(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Atualiza o cadastro do animal (somente gerente)")
    public AnimalResponse atualizar(@PathVariable Long id, @Valid @RequestBody AnimalRequest req) {
        return animalService.atualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Exclui um cadastro feito por engano (somente gerente)")
    public void excluir(@PathVariable Long id) {
        animalService.excluir(id);
    }

    @PostMapping("/{id}/morte")
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Registra a morte do animal (somente gerente)")
    public AnimalResponse registrarMorte(@PathVariable Long id) {
        return animalService.registrarMorte(id);
    }

    @GetMapping("/{id}/pesagens")
    @Operation(summary = "Histórico de pesagens do animal")
    public List<PesagemResponse> pesagens(@PathVariable Long id) {
        return pesagemService.listarDoAnimal(id);
    }

    @GetMapping("/{id}/aplicacoes")
    @Operation(summary = "Histórico sanitário do animal")
    public List<AplicacaoResponse> aplicacoes(@PathVariable Long id) {
        return sanidadeService.listarDoAnimal(id);
    }

    @PostMapping("/{id}/venda")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Vende o animal; bloqueado se ele estiver em carência (somente gerente)")
    public VendaResponse vender(@PathVariable Long id, @Valid @RequestBody VendaRequest req) {
        return vendaService.vender(id, req);
    }
}
