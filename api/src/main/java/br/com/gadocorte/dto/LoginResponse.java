package br.com.gadocorte.dto;

public record LoginResponse(String token, String tipo, long expiraEmSegundos, UsuarioResponse usuario) {
}
