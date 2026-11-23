package br.com.gadocorte.exception;

/** Dado que já existe, como um brinco repetido. */
public class ConflitoException extends RuntimeException {

    public ConflitoException(String mensagem) {
        super(mensagem);
    }
}
