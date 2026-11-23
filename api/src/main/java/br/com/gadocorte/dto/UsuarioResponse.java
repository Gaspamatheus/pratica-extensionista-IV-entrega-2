package br.com.gadocorte.dto;

import br.com.gadocorte.entity.Role;
import br.com.gadocorte.entity.Usuario;

public record UsuarioResponse(Long id, String nome, String username, Role role) {

    public static UsuarioResponse de(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getUsername(), u.getRole());
    }
}
