package br.com.gadocorte.dto;

import java.time.LocalDateTime;
import java.util.Map;

/** Formato padrão de erro devolvido pela API, para o front mostrar a mensagem ao usuário. */
public record ErroResponse(int status, String erro, String mensagem, Map<String, String> campos,
                           LocalDateTime timestamp) {

    public static ErroResponse de(int status, String erro, String mensagem) {
        return new ErroResponse(status, erro, mensagem, Map.of(), LocalDateTime.now());
    }
}
