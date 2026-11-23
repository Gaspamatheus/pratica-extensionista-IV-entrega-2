package br.com.gadocorte.controller;

import br.com.gadocorte.dto.PesagemRequest;
import br.com.gadocorte.dto.PesagemResponse;
import br.com.gadocorte.service.PesagemService;
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
@RequestMapping("/api/pesagens")
@Tag(name = "Pesagem")
public class PesagemController {

    private final PesagemService pesagemService;

    public PesagemController(PesagemService pesagemService) {
        this.pesagemService = pesagemService;
    }

    @GetMapping
    @Operation(summary = "Últimas 50 pesagens do rebanho")
    public List<PesagemResponse> listar() {
        return pesagemService.listarRecentes();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra uma pesagem (envie idCliente para o reenvio offline não duplicar)")
    public PesagemResponse registrar(@Valid @RequestBody PesagemRequest req) {
        return pesagemService.registrar(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Exclui uma pesagem lançada errada (somente gerente)")
    public void excluir(@PathVariable Long id) {
        pesagemService.excluir(id);
    }
}
