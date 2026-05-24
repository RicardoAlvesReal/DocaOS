-- ============================================================
-- RotaFlow — Migração v2: Schema Multi-Tenant
-- Executar no banco: rotaflow
-- ============================================================

\c rotaflow

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'sub_admin', 'motorista', 'passageiro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_contrato AS ENUM ('ativo', 'suspenso', 'cancelado', 'encerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_pagamento AS ENUM ('pendente', 'aguardando', 'confirmado', 'rejeitado', 'vencido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_veiculo AS ENUM ('ativo', 'manutencao', 'inativo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plano_empresa AS ENUM ('starter', 'profissional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- FUNÇÃO TRIGGER updated_date (reutilizada por todas as tabelas)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EMPRESAS (tenants do SaaS)
-- ============================================================

CREATE TABLE IF NOT EXISTS empresas (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(255) NOT NULL,
  cnpj          VARCHAR(18)  UNIQUE,
  email         VARCHAR(255),
  telefone      VARCHAR(20),
  plano         plano_empresa NOT NULL DEFAULT 'starter',
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  -- admin_id adicionado após criação de usuarios (evita circular ref)
  created_date  TIMESTAMPTZ  DEFAULT NOW(),
  updated_date  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- USUARIOS (tabela central de autenticação)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  senha           VARCHAR(255) NOT NULL,
  role            user_role    NOT NULL,
  empresa_id      UUID         REFERENCES empresas(id) ON DELETE SET NULL,
  -- sub_admin aponta para a frota que gerencia (adicionado após frotas)
  primeiro_acesso BOOLEAN      NOT NULL DEFAULT TRUE,
  ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_date    TIMESTAMPTZ  DEFAULT NOW(),
  updated_date    TIMESTAMPTZ  DEFAULT NOW()
);

-- Vincula o admin principal à empresa (após usuarios ser criado)
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;

-- ============================================================
-- FROTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS frotas (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         VARCHAR(255) NOT NULL,
  empresa_id   UUID         NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sub_admin_id UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
  ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_date TIMESTAMPTZ  DEFAULT NOW(),
  updated_date TIMESTAMPTZ  DEFAULT NOW()
);

-- sub_admin referencia a frota que gerencia
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS frota_id UUID REFERENCES frotas(id) ON DELETE SET NULL;

-- ============================================================
-- VEÍCULOS
-- ============================================================

CREATE TABLE IF NOT EXISTS veiculos (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  placa        VARCHAR(10)   UNIQUE NOT NULL,
  modelo       VARCHAR(255)  NOT NULL,
  ano          SMALLINT,
  capacidade   SMALLINT,
  frota_id     UUID          NOT NULL REFERENCES frotas(id) ON DELETE RESTRICT,
  status       status_veiculo NOT NULL DEFAULT 'ativo',
  created_date TIMESTAMPTZ   DEFAULT NOW(),
  updated_date TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- MOTORISTAS (perfil extra de usuario com role=motorista)
-- ============================================================

CREATE TABLE IF NOT EXISTS motoristas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID        UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id   UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cnh          VARCHAR(20),
  cnh_validade DATE,
  telefone     VARCHAR(20),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PASSAGEIROS (perfil extra de usuario com role=passageiro)
-- ============================================================

CREATE TABLE IF NOT EXISTS passageiros (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID        UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id   UUID        NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cpf          VARCHAR(14) UNIQUE,
  telefone     VARCHAR(20),
  endereco     TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALUNOS (dependentes de um passageiro — menores de idade)
-- ============================================================

CREATE TABLE IF NOT EXISTS alunos_v2 (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  passageiro_id    UUID        NOT NULL REFERENCES passageiros(id) ON DELETE CASCADE,
  nome             VARCHAR(255) NOT NULL,
  data_nascimento  DATE,
  escola           VARCHAR(255),
  turno            VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'integral', 'noite')),
  created_date     TIMESTAMPTZ DEFAULT NOW(),
  updated_date     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROTAS
-- ============================================================

CREATE TABLE IF NOT EXISTS rotas (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(255) NOT NULL,
  descricao     TEXT,
  frota_id      UUID        NOT NULL REFERENCES frotas(id) ON DELETE RESTRICT,
  motorista_id  UUID        REFERENCES motoristas(id) ON DELETE SET NULL,
  veiculo_id    UUID        REFERENCES veiculos(id) ON DELETE SET NULL,
  horario_ida   TIME,
  horario_volta TIME,
  ativo         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTRATOS (passageiro ↔ rota)
-- ============================================================

CREATE TABLE IF NOT EXISTS contratos (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  passageiro_id UUID           NOT NULL REFERENCES passageiros(id) ON DELETE RESTRICT,
  rota_id       UUID           NOT NULL REFERENCES rotas(id) ON DELETE RESTRICT,
  valor_mensal  NUMERIC(10,2)  NOT NULL,
  data_inicio   DATE           NOT NULL,
  data_fim      DATE,
  status        status_contrato NOT NULL DEFAULT 'ativo',
  created_date  TIMESTAMPTZ    DEFAULT NOW(),
  updated_date  TIMESTAMPTZ    DEFAULT NOW()
);

-- ============================================================
-- PAGAMENTOS (mensalidades por contrato)
-- ============================================================

CREATE TABLE IF NOT EXISTS pagamentos (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     UUID            NOT NULL REFERENCES contratos(id) ON DELETE RESTRICT,
  mes_referencia  VARCHAR(7)      NOT NULL, -- formato: YYYY-MM (ex: 2026-05)
  valor           NUMERIC(10,2)   NOT NULL,
  vencimento      DATE            NOT NULL,
  status          status_pagamento NOT NULL DEFAULT 'pendente',
  created_date    TIMESTAMPTZ     DEFAULT NOW(),
  updated_date    TIMESTAMPTZ     DEFAULT NOW(),
  UNIQUE (contrato_id, mes_referencia)
);

-- ============================================================
-- COMPROVANTES v2 (vinculados a um pagamento)
-- ============================================================

CREATE TABLE IF NOT EXISTS comprovantes_v2 (
  id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID            NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  file_url     VARCHAR(500),
  file_name    VARCHAR(255),
  observacao   TEXT,
  status       status_pagamento NOT NULL DEFAULT 'aguardando',
  created_date TIMESTAMPTZ     DEFAULT NOW(),
  updated_date TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS updated_date em todas as novas tabelas
-- ============================================================

CREATE OR REPLACE TRIGGER trg_empresas_updated
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_frotas_updated
  BEFORE UPDATE ON frotas
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_veiculos_updated
  BEFORE UPDATE ON veiculos
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_motoristas_updated
  BEFORE UPDATE ON motoristas
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_passageiros_updated
  BEFORE UPDATE ON passageiros
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_alunos_v2_updated
  BEFORE UPDATE ON alunos_v2
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_rotas_updated
  BEFORE UPDATE ON rotas
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_contratos_updated
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_pagamentos_updated
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE OR REPLACE TRIGGER trg_comprovantes_v2_updated
  BEFORE UPDATE ON comprovantes_v2
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email       ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id  ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_role        ON usuarios(role);

CREATE INDEX IF NOT EXISTS idx_frotas_empresa_id    ON frotas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_frota_id    ON veiculos(frota_id);

CREATE INDEX IF NOT EXISTS idx_motoristas_empresa_id ON motoristas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_usuario_id ON motoristas(usuario_id);

CREATE INDEX IF NOT EXISTS idx_passageiros_empresa_id ON passageiros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_passageiros_usuario_id ON passageiros(usuario_id);
CREATE INDEX IF NOT EXISTS idx_passageiros_cpf         ON passageiros(cpf);

CREATE INDEX IF NOT EXISTS idx_alunos_v2_passageiro_id ON alunos_v2(passageiro_id);

CREATE INDEX IF NOT EXISTS idx_rotas_frota_id       ON rotas(frota_id);
CREATE INDEX IF NOT EXISTS idx_rotas_motorista_id   ON rotas(motorista_id);
CREATE INDEX IF NOT EXISTS idx_rotas_veiculo_id     ON rotas(veiculo_id);

CREATE INDEX IF NOT EXISTS idx_contratos_passageiro_id ON contratos(passageiro_id);
CREATE INDEX IF NOT EXISTS idx_contratos_rota_id       ON contratos(rota_id);
CREATE INDEX IF NOT EXISTS idx_contratos_status        ON contratos(status);

CREATE INDEX IF NOT EXISTS idx_pagamentos_contrato_id   ON pagamentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status        ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mes_ref       ON pagamentos(mes_referencia);

CREATE INDEX IF NOT EXISTS idx_comprovantes_v2_pagamento_id ON comprovantes_v2(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_v2_status       ON comprovantes_v2(status);

-- ============================================================
-- SEED: super_admin padrão
-- ============================================================

INSERT INTO usuarios (nome, email, senha, role, primeiro_acesso)
VALUES (
  'Super Admin',
  'superadmin@rotaflow.com',
  crypt('RotaFlow@2026', gen_salt('bf')),
  'super_admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;
