package br.com.gadocorte.controller;

import br.com.gadocorte.dto.AplicacaoRequest;
import br.com.gadocorte.dto.AplicacaoResponse;
import br.com.gadocorte.service.SanidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sanidade")
@Tag(name = "Sanidade")
public class SanidadeController {

    private final SanidadeService sanidadeService;

    public SanidadeController(SanidadeService sanidadeService) {
        this.sanidadeService = sanidadeService;
    }

    @GetMapping("/aplicacoes")
    @Operation(summary = "Últimas 50 aplicações (vacinas, vermífugos, medicamentos)")
    public List<AplicacaoResponse> listar() {
        return sanidadeService.listarRecentes();
    }

    @PostMapping("/aplicacoes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra uma aplicação e calcula o fim da carência")
    public AplicacaoResponse registrar(@Valid @RequestBody AplicacaoRequest req) {
        return sanidadeService.registrar(req);
    }

    @DeleteMapping("/aplicacoes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Exclui uma aplicação lançada errada (somente gerente)")
    public void excluir(@PathVariable Long id) {
        sanidadeService.excluir(id);
    }

    @GetMapping("/carencias")
    @Operation(summary = "Animais ativos com carência vigente hoje")
    public List<AplicacaoResponse> carencias() {
        return sanidadeService.carenciasVigentes();
    }
}
