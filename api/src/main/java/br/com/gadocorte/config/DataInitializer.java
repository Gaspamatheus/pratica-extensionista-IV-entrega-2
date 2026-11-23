package br.com.gadocorte.config;

import br.com.gadocorte.entity.Animal;
import br.com.gadocorte.entity.AplicacaoSanitaria;
import br.com.gadocorte.entity.Pesagem;
import br.com.gadocorte.entity.Role;
import br.com.gadocorte.entity.Sexo;
import br.com.gadocorte.entity.TipoAplicacao;
import br.com.gadocorte.entity.Usuario;
import br.com.gadocorte.repository.AnimalRepository;
import br.com.gadocorte.repository.AplicacaoSanitariaRepository;
import br.com.gadocorte.repository.PesagemRepository;
import br.com.gadocorte.repository.UsuarioRepository;
import br.com.gadocorte.service.SanidadeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

/**
 * Cria os usuários iniciais na primeira execução e, se app.seed.dados-exemplo=true,
 * um pequeno rebanho de exemplo para a apresentação do app.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UsuarioRepository usuarioRepository;
    private final AnimalRepository animalRepository;
    private final PesagemRepository pesagemRepository;
    private final AplicacaoSanitariaRepository aplicacaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Value("${app.seed.gerente.username}")
    private String gerenteUsername;
    @Value("${app.seed.gerente.senha}")
    private String gerenteSenha;
    @Value("${app.seed.funcionario.username}")
    private String funcionarioUsername;
    @Value("${app.seed.funcionario.senha}")
    private String funcionarioSenha;
    @Value("${app.seed.dados-exemplo:false}")
    private boolean dadosExemplo;

    public DataInitializer(UsuarioRepository usuarioRepository, AnimalRepository animalRepository,
                           PesagemRepository pesagemRepository, AplicacaoSanitariaRepository aplicacaoRepository,
                           PasswordEncoder passwordEncoder, Clock clock) {
        this.usuarioRepository = usuarioRepository;
        this.animalRepository = animalRepository;
        this.pesagemRepository = pesagemRepository;
        this.aplicacaoRepository = aplicacaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        criarUsuario("Gerente", gerenteUsername, gerenteSenha, Role.GERENTE);
        criarUsuario("Funcionário", funcionarioUsername, funcionarioSenha, Role.FUNCIONARIO);
        if (dadosExemplo && animalRepository.count() == 0) {
            criarRebanhoExemplo();
        }
    }

    private void criarUsuario(String nome, String username, String senha, Role role) {
        if (!usuarioRepository.existsByUsername(username)) {
            usuarioRepository.save(new Usuario(nome, username, passwordEncoder.encode(senha), role));
            log.info("Usuário inicial criado: {} ({})", username, role);
        }
    }

    private void criarRebanhoExemplo() {
        LocalDate hoje = LocalDate.now(clock);
        Animal a1 = animal("BR-001", "Trovão", "Nelore", Sexo.MACHO, hoje.minusDays(120), "312", "Pasto 1");
        Animal a2 = animal("BR-002", "Estrela", "Angus", Sexo.FEMEA, hoje.minusDays(120), "295", "Pasto 1");
        Animal a3 = animal("BR-003", null, "Nelore", Sexo.MACHO, hoje.minusDays(90), "330", "Pasto 2");
        Animal a4 = animal("BR-004", "Pintado", "Brangus", Sexo.MACHO, hoje.minusDays(60), "348", "Pasto 2");

        pesagem(a1, hoje.minusDays(60), "348");
        pesagem(a1, hoje.minusDays(5), "382.5");
        pesagem(a2, hoje.minusDays(60), "321");
        pesagem(a2, hoje.minusDays(5), "349");
        pesagem(a3, hoje.minusDays(30), "352");
        pesagem(a4, hoje.minusDays(10), "377");

        aplicacao(a1, TipoAplicacao.VACINA, "Vacina contra febre aftosa", hoje.minusDays(100), 0);
        aplicacao(a3, TipoAplicacao.VERMIFUGO, "Ivermectina 1%", hoje.minusDays(10), 35);
        aplicacao(a4, TipoAplicacao.MEDICAMENTO, "Oxitetraciclina", hoje.minusDays(3), 28);
        log.info("Rebanho de exemplo criado com 4 animais");
    }

    private Animal animal(String brinco, String nome, String raca, Sexo sexo, LocalDate entrada, String peso,
                          String lote) {
        Animal a = new Animal();
        a.setBrinco(brinco);
        a.setNome(nome);
        a.setRaca(raca);
        a.setSexo(sexo);
        a.setDataNascimento(entrada.minusMonths(18));
        a.setDataEntrada(entrada);
        a.setPesoEntrada(new BigDecimal(peso));
        a.setLote(lote);
        return animalRepository.save(a);
    }

    private void pesagem(Animal a, LocalDate data, String peso) {
        Pesagem p = new Pesagem();
        p.setAnimal(a);
        p.setData(data);
        p.setPesoKg(new BigDecimal(peso));
        pesagemRepository.save(p);
    }

    private void aplicacao(Animal a, TipoAplicacao tipo, String produto, LocalDate data, int carencia) {
        AplicacaoSanitaria ap = new AplicacaoSanitaria();
        ap.setAnimal(a);
        ap.setTipo(tipo);
        ap.setProduto(produto);
        ap.setDose("Conforme bula");
        ap.setDataAplicacao(data);
        ap.setCarenciaDias(carencia);
        ap.setFimCarencia(SanidadeService.calcularFimCarencia(data, carencia));
        aplicacaoRepository.save(ap);
    }
}
