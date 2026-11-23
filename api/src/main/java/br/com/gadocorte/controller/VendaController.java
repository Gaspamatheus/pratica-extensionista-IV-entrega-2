package br.com.gadocorte.controller;

import br.com.gadocorte.dto.VendaResponse;
import br.com.gadocorte.service.VendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vendas")
@Tag(name = "Vendas")
public class VendaController {

    private final VendaService vendaService;

    public VendaController(VendaService vendaService) {
        this.vendaService = vendaService;
    }

    @GetMapping
    @Operation(summary = "Histórico de vendas (a venda é feita em POST /api/animais/{id}/venda)")
    public List<VendaResponse> listar() {
        return vendaService.listar();
    }
}
