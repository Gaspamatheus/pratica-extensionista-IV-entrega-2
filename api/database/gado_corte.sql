-- =====================================================================
-- Banco de dados do app de Gestão de Gado de Corte
-- Prática Extensionista IV, entrega 2
--
-- Como usar: abra este arquivo no MySQL Workbench (File > Open SQL Script)
-- conectado como root e execute tudo (ícone do raio). Pode rodar de novo
-- sem problema: nada é apagado e nada é duplicado.
--
-- Requer MySQL 8.0 ou mais novo.
-- =====================================================================

-- Garante que os acentos (ex.: "Trovão") sejam gravados certo, inclusive no Docker
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. Banco e usuário da aplicação
-- ---------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS gado_corte
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- Usuário próprio da API, com acesso só a este banco (melhor do que usar o root).
-- Se mudar a senha aqui, mude também DB_PASSWORD na API.
CREATE USER IF NOT EXISTS 'gado_app'@'localhost' IDENTIFIED BY 'gado123';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
    ON gado_corte.* TO 'gado_app'@'localhost';
FLUSH PRIVILEGES;

USE gado_corte;

-- ---------------------------------------------------------------------
-- 2. Tabelas
-- ---------------------------------------------------------------------

-- Usuários do sistema. A senha fica guardada como hash BCrypt, nunca em texto puro.
CREATE TABLE IF NOT EXISTS usuarios (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    nome        VARCHAR(100) NOT NULL,
    username    VARCHAR(50)  NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    role        ENUM('GERENTE', 'FUNCIONARIO') NOT NULL,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uk_usuarios_username UNIQUE (username)
) ENGINE = InnoDB;

-- Rebanho. Cada animal é identificado pelo número do brinco.
CREATE TABLE IF NOT EXISTS animais (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    brinco           VARCHAR(30)  NOT NULL,
    nome             VARCHAR(60)  NULL,
    raca             VARCHAR(60)  NULL,
    sexo             ENUM('MACHO', 'FEMEA') NOT NULL,
    data_nascimento  DATE         NULL,
    data_entrada     DATE         NOT NULL,
    peso_entrada     DECIMAL(7,2) NULL      COMMENT 'Peso na entrada da fazenda, em kg',
    lote             VARCHAR(60)  NULL      COMMENT 'Lote ou pasto',
    status           ENUM('ATIVO', 'VENDIDO', 'MORTO') NOT NULL DEFAULT 'ATIVO',
    observacoes      VARCHAR(500) NULL,
    CONSTRAINT pk_animais PRIMARY KEY (id),
    CONSTRAINT uk_animais_brinco UNIQUE (brinco),
    INDEX idx_animais_status (status)
) ENGINE = InnoDB;

-- Pesagens. id_cliente é o UUID gerado pelo app offline: evita gravar duas vezes
-- o mesmo lançamento quando a fila do IndexedDB é reenviada.
CREATE TABLE IF NOT EXISTS pesagens (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    animal_id   BIGINT       NOT NULL,
    data        DATE         NOT NULL,
    peso_kg     DECIMAL(7,2) NOT NULL,
    observacao  VARCHAR(300) NULL,
    id_cliente  VARCHAR(40)  NULL,
    CONSTRAINT pk_pesagens PRIMARY KEY (id),
    CONSTRAINT uk_pesagens_id_cliente UNIQUE (id_cliente),
    CONSTRAINT fk_pesagens_animal FOREIGN KEY (animal_id) REFERENCES animais (id),
    INDEX idx_pesagens_animal_data (animal_id, data),
    INDEX idx_pesagens_data (data)
) ENGINE = InnoDB;

-- Sanidade: vacinas, vermífugos e medicamentos.
-- fim_carencia = último dia em que o animal não pode ser vendido
-- (o dia da aplicação conta como o primeiro dia de carência).
CREATE TABLE IF NOT EXISTS aplicacoes_sanitarias (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    animal_id       BIGINT       NOT NULL,
    tipo            ENUM('VACINA', 'VERMIFUGO', 'MEDICAMENTO', 'OUTRO') NOT NULL,
    produto         VARCHAR(100) NOT NULL,
    dose            VARCHAR(40)  NULL,
    data_aplicacao  DATE         NOT NULL,
    carencia_dias   INT          NOT NULL,
    fim_carencia    DATE         NOT NULL,
    observacao      VARCHAR(300) NULL,
    id_cliente      VARCHAR(40)  NULL,
    CONSTRAINT pk_aplicacoes PRIMARY KEY (id),
    CONSTRAINT uk_aplicacoes_id_cliente UNIQUE (id_cliente),
    CONSTRAINT fk_aplicacoes_animal FOREIGN KEY (animal_id) REFERENCES animais (id),
    CONSTRAINT ck_aplicacoes_carencia CHECK (carencia_dias >= 0),
    INDEX idx_aplicacoes_animal_carencia (animal_id, fim_carencia)
) ENGINE = InnoDB;

-- Vendas. Um animal só pode ser vendido uma vez.
CREATE TABLE IF NOT EXISTS vendas (
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    animal_id    BIGINT        NOT NULL,
    data         DATE          NOT NULL,
    peso_kg      DECIMAL(7,2)  NOT NULL,
    valor_total  DECIMAL(12,2) NOT NULL,
    comprador    VARCHAR(120)  NULL,
    CONSTRAINT pk_vendas PRIMARY KEY (id),
    CONSTRAINT uk_vendas_animal UNIQUE (animal_id),
    CONSTRAINT fk_vendas_animal FOREIGN KEY (animal_id) REFERENCES animais (id)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- 3. Usuários iniciais
--    gerente / gerente123      (perfil GERENTE)
--    funcionario / func123     (perfil FUNCIONARIO)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO usuarios (nome, username, senha_hash, role) VALUES
    ('Gerente',     'gerente',     '$2a$10$tIBDZ57gNv5cWLTGfT7uduaV7QfSxAuoU20jvXyhZsqhSmAr9ngbq', 'GERENTE'),
    ('Funcionário', 'funcionario', '$2a$10$fRB7.KQ8lgPj28K2P4xH/uoCUNVtSXM7BuRUdCbOUyK2pr9MgNYmu', 'FUNCIONARIO');

-- ---------------------------------------------------------------------
-- 4. Rebanho de exemplo (opcional, para a apresentação)
--    As datas são relativas ao dia em que o script roda, então sempre
--    haverá animais em carência para demonstrar o bloqueio de venda.
--    Só insere se a tabela de animais estiver vazia.
-- ---------------------------------------------------------------------
INSERT INTO animais (brinco, nome, raca, sexo, data_nascimento, data_entrada, peso_entrada, lote)
SELECT * FROM (
    SELECT 'BR-001', 'Trovão',  'Nelore',  'MACHO', CURDATE() - INTERVAL 668 DAY, CURDATE() - INTERVAL 120 DAY, 312.00, 'Pasto 1' UNION ALL
    SELECT 'BR-002', 'Estrela', 'Angus',   'FEMEA', CURDATE() - INTERVAL 668 DAY, CURDATE() - INTERVAL 120 DAY, 295.00, 'Pasto 1' UNION ALL
    SELECT 'BR-003', NULL,      'Nelore',  'MACHO', CURDATE() - INTERVAL 638 DAY, CURDATE() - INTERVAL 90 DAY,  330.00, 'Pasto 2' UNION ALL
    SELECT 'BR-004', 'Pintado', 'Brangus', 'MACHO', CURDATE() - INTERVAL 608 DAY, CURDATE() - INTERVAL 60 DAY,  348.00, 'Pasto 2'
) AS exemplo
WHERE NOT EXISTS (SELECT 1 FROM animais);

INSERT INTO pesagens (animal_id, data, peso_kg)
SELECT a.id, CURDATE() - INTERVAL p.dias DAY, p.peso
FROM (
    SELECT 'BR-001' AS brinco, 60 AS dias, 348.00 AS peso UNION ALL
    SELECT 'BR-001', 5,  382.50 UNION ALL
    SELECT 'BR-002', 60, 321.00 UNION ALL
    SELECT 'BR-002', 5,  349.00 UNION ALL
    SELECT 'BR-003', 30, 352.00 UNION ALL
    SELECT 'BR-004', 10, 377.00
) AS p
JOIN animais a ON a.brinco = p.brinco
WHERE NOT EXISTS (SELECT 1 FROM pesagens);

INSERT INTO aplicacoes_sanitarias (animal_id, tipo, produto, dose, data_aplicacao, carencia_dias, fim_carencia)
SELECT a.id, s.tipo, s.produto, 'Conforme bula',
       CURDATE() - INTERVAL s.dias DAY, s.carencia,
       CURDATE() - INTERVAL s.dias DAY + INTERVAL s.carencia DAY - INTERVAL 1 DAY
FROM (
    SELECT 'BR-001' AS brinco, 'VACINA' AS tipo, 'Vacina contra febre aftosa' AS produto, 100 AS dias, 0 AS carencia UNION ALL
    SELECT 'BR-003', 'VERMIFUGO',   'Ivermectina 1%',  10, 35 UNION ALL
    SELECT 'BR-004', 'MEDICAMENTO', 'Oxitetraciclina', 3,  28
) AS s
JOIN animais a ON a.brinco = s.brinco
WHERE NOT EXISTS (SELECT 1 FROM aplicacoes_sanitarias);

-- Conferência rápida
SELECT 'usuarios' AS tabela, COUNT(*) AS registros FROM usuarios
UNION ALL SELECT 'animais', COUNT(*) FROM animais
UNION ALL SELECT 'pesagens', COUNT(*) FROM pesagens
UNION ALL SELECT 'aplicacoes_sanitarias', COUNT(*) FROM aplicacoes_sanitarias
UNION ALL SELECT 'vendas', COUNT(*) FROM vendas;
