package br.com.gadocorte.service;

import br.com.gadocorte.dto.LoginRequest;
import br.com.gadocorte.dto.LoginResponse;
import br.com.gadocorte.dto.UsuarioResponse;
import br.com.gadocorte.entity.Usuario;
import br.com.gadocorte.exception.RecursoNaoEncontradoException;
import br.com.gadocorte.repository.UsuarioRepository;
import br.com.gadocorte.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, UsuarioRepository usuarioRepository,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    /** Confere usuário e senha (BCrypt) e devolve um token JWT com o perfil do usuário. */
    public LoginResponse login(LoginRequest req) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.senha()));
        Usuario usuario = buscarPorUsername(req.username());
        String token = jwtService.gerarToken(usuario);
        return new LoginResponse(token, "Bearer", jwtService.getExpiracaoSegundos(), UsuarioResponse.de(usuario));
    }

    public UsuarioResponse usuarioAtual(String username) {
        return UsuarioResponse.de(buscarPorUsername(username));
    }

    private Usuario buscarPorUsername(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
    }
}
