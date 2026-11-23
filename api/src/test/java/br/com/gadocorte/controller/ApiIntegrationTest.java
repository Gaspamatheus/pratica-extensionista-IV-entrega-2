package br.com.gadocorte.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Testa a API de ponta a ponta (Controller, Service, Repository e banco H2), com o JWT de verdade. */
@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ApiIntegrationTest {

    private static final LocalDate HOJE = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ObjectMapper mapper;

    @Test
    void rotaProtegidaSemTokenDevolve401() throws Exception {
        mvc.perform(get("/api/animais"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Faça login para continuar"));
    }

    @Test
    void loginComSenhaErradaDevolve401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"gerente\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("Usuário ou senha inválidos"));
    }

    @Test
    void tokenInvalidoDevolve401() throws Exception {
        mvc.perform(get("/api/animais").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginDevolveTokenEPerfil() throws Exception {
        String token = login("gerente", "gerente123");
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("gerente"))
                .andExpect(jsonPath("$.role").value("GERENTE"));
    }

    @Test
    void corsLiberaOFrontDoVite() throws Exception {
        mvc.perform(options("/api/animais")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void fluxoCompletoDoRebanho() throws Exception {
        String gerente = "Bearer " + login("gerente", "gerente123");
        String funcionario = "Bearer " + login("funcionario", "func123");

        // Gerente cadastra o animal
        long id = criarAnimal(gerente, "BR-100");

        // Brinco repetido -> 409
        mvc.perform(post("/api/animais").header("Authorization", gerente).contentType(MediaType.APPLICATION_JSON)
                        .content(animalJson("BR-100")))
                .andExpect(status().isConflict());

        // Funcionário não pode cadastrar animal -> 403
        mvc.perform(post("/api/animais").header("Authorization", funcionario).contentType(MediaType.APPLICATION_JSON)
                        .content(animalJson("BR-101")))
                .andExpect(status().isForbidden());

        // Funcionário lança pesagem; reenvio com o mesmo idCliente não duplica
        String pesagem = """
                {"animalId": %d, "data": "%s", "pesoKg": 360.5, "idCliente": "offline-1"}
                """.formatted(id, HOJE);
        mvc.perform(post("/api/pesagens").header("Authorization", funcionario).contentType(MediaType.APPLICATION_JSON)
                .content(pesagem)).andExpect(status().isCreated());
        mvc.perform(post("/api/pesagens").header("Authorization", funcionario).contentType(MediaType.APPLICATION_JSON)
                .content(pesagem)).andExpect(status().isCreated());
        mvc.perform(get("/api/animais/" + id + "/pesagens").header("Authorization", gerente))
                .andExpect(jsonPath("$.length()").value(1));

        // Detalhe do animal traz peso atual e GMD: 300 kg há 30 dias -> 360,5 kg hoje
        mvc.perform(get("/api/animais/" + id).header("Authorization", gerente))
                .andExpect(jsonPath("$.pesoAtual").value(360.5))
                .andExpect(jsonPath("$.gmdKg").value(2.017))
                .andExpect(jsonPath("$.emCarencia").value(false));

        // Aplicação com 30 dias de carência
        mvc.perform(post("/api/sanidade/aplicacoes").header("Authorization", funcionario)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"animalId": %d, "tipo": "VERMIFUGO", "produto": "Ivermectina 1%%",
                                 "dataAplicacao": "%s", "carenciaDias": 30}
                                """.formatted(id, HOJE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fimCarencia").value(HOJE.plusDays(29).toString()));

        mvc.perform(get("/api/dashboard/resumo").header("Authorization", gerente))
                .andExpect(jsonPath("$.animaisAtivos").value(1))
                .andExpect(jsonPath("$.animaisEmCarencia").value(1));

        String venda = """
                {"data": "%s", "pesoKg": 360.5, "valorTotal": 7500, "comprador": "Frigorífico"}
                """.formatted(HOJE);

        // Funcionário não vende -> 403
        mvc.perform(post("/api/animais/" + id + "/venda").header("Authorization", funcionario)
                .contentType(MediaType.APPLICATION_JSON).content(venda)).andExpect(status().isForbidden());

        // Gerente tenta vender em carência -> 422 com a data de liberação
        mvc.perform(post("/api/animais/" + id + "/venda").header("Authorization", gerente)
                        .contentType(MediaType.APPLICATION_JSON).content(venda))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("está em carência")));
    }

    @Test
    void validacaoDevolveOsCamposComErro() throws Exception {
        String gerente = "Bearer " + login("gerente", "gerente123");
        mvc.perform(post("/api/animais").header("Authorization", gerente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"brinco\": \"\", \"pesoEntrada\": -5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.brinco").value("Informe o brinco"))
                .andExpect(jsonPath("$.campos.sexo").value("Informe o sexo"))
                .andExpect(jsonPath("$.campos.pesoEntrada").exists());
    }

    @Test
    void vendeAnimalSemCarencia() throws Exception {
        String gerente = "Bearer " + login("gerente", "gerente123");
        long id = criarAnimal(gerente, "BR-200");
        mvc.perform(post("/api/animais/" + id + "/venda").header("Authorization", gerente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"data\": \"%s\", \"pesoKg\": 450, \"valorTotal\": 9900}".formatted(HOJE)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.valorPorArroba").value(330.0));
        mvc.perform(get("/api/animais/" + id).header("Authorization", gerente))
                .andExpect(jsonPath("$.status").value("VENDIDO"));
        // Animal vendido não recebe pesagem
        mvc.perform(post("/api/pesagens").header("Authorization", gerente).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"animalId\": %d, \"data\": \"%s\", \"pesoKg\": 451}".formatted(id, HOJE)))
                .andExpect(status().isUnprocessableEntity());
    }

    private String login(String user, String senha) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"%s\",\"senha\":\"%s\"}".formatted(user, senha)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).get("token").asText();
    }

    private long criarAnimal(String auth, String brinco) throws Exception {
        String body = mvc.perform(post("/api/animais").header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON).content(animalJson(brinco)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = mapper.readTree(body);
        return node.get("id").asLong();
    }

    private static String animalJson(String brinco) {
        return """
                {"brinco": "%s", "nome": "Teste", "raca": "Nelore", "sexo": "MACHO",
                 "dataEntrada": "%s", "pesoEntrada": 300, "lote": "Pasto 1"}
                """.formatted(brinco, HOJE.minusDays(30));
    }
}
