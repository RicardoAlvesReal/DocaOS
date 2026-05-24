-- Schema do RotaFlow para PostgreSQL

CREATE DATABASE rotaflow;

\c rotaflow

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS alunos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(255) NOT NULL,
  responsavel VARCHAR(255),
  matricula   VARCHAR(50)  UNIQUE NOT NULL,
  senha       VARCHAR(255) NOT NULL,
  primeiro_acesso BOOLEAN DEFAULT TRUE,
  mensalidade NUMERIC(10,2) NOT NULL DEFAULT 0,
  meses       JSONB NOT NULL DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comprovantes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula   VARCHAR(50)  NOT NULL,
  mes_key     VARCHAR(20)  NOT NULL,
  file_url    VARCHAR(500),
  file_name   VARCHAR(255),
  status      VARCHAR(20)  NOT NULL DEFAULT 'aguardando'
              CHECK (status IN ('aguardando', 'confirmado', 'rejeitado')),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_comprovante_aluno FOREIGN KEY (matricula)
    REFERENCES alunos(matricula) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        VARCHAR(255) NOT NULL,
  matricula   VARCHAR(50)  UNIQUE NOT NULL,
  senha       VARCHAR(255) NOT NULL,
  nivel       VARCHAR(20)  NOT NULL DEFAULT 'admin'
              CHECK (nivel IN ('super_admin', 'admin')),
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_admins_updated
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE INDEX IF NOT EXISTS idx_alunos_matricula        ON alunos(matricula);
CREATE INDEX IF NOT EXISTS idx_comprovantes_matricula  ON comprovantes(matricula);
CREATE INDEX IF NOT EXISTS idx_comprovantes_status     ON comprovantes(status);
CREATE INDEX IF NOT EXISTS idx_admins_matricula        ON admins(matricula);

-- Trigger para atualizar updated_date automaticamente
CREATE OR REPLACE FUNCTION set_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alunos_updated
  BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();

CREATE TRIGGER trg_comprovantes_updated
  BEFORE UPDATE ON comprovantes
  FOR EACH ROW EXECUTE FUNCTION set_updated_date();
