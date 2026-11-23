package br.com.gadocorte.exception;

/** Pedido válido no formato, mas que fere uma regra do negócio (ex.: vender animal em carência). */
public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
