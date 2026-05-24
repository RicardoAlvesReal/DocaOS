# RotaFlow

Plataforma multi-tenant de gestão de transporte escolar. Permite que empresas de van escolar gerenciem frotas, motoristas, rotas, passageiros e pagamentos em um único painel.

---

## Tecnologias

| Camada | Stack |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL |

---

## Estrutura do projeto

```
rotaflow/
├── src/          # Frontend React
├── server/       # Backend Express + rotas da API
└── public/       # Assets estáticos
```

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- pnpm (ou npm)

---

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/RicardoAlvesReal/rotaflow.git
cd rotaflow
```

### 2. Instale as dependências do frontend

```bash
pnpm install
# ou: npm install
```

### 3. Configure o backend

```bash
cd server
npm install
```

Crie o arquivo `server/.env` com as variáveis de ambiente:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rotaflow
DB_USER=postgres
DB_PASSWORD=sua_senha
PORT=3001
```

### 4. Crie o banco de dados

```bash
# Dentro da pasta server/
npm run setup-db
```

---

## Rodando o projeto

### Backend (porta 3001)

```bash
cd server
npm run dev
```

### Frontend (porta 5173)

```bash
# Na raiz do projeto
pnpm dev
# ou: npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## Scripts disponíveis

### Frontend

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia o servidor de desenvolvimento |
| `pnpm build` | Gera o build de produção |
| `pnpm preview` | Pré-visualiza o build de produção |

### Backend (`/server`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia com hot-reload (`node --watch`) |
| `npm start` | Inicia em modo produção |
| `npm run setup-db` | Cria as tabelas no banco de dados |
| `npm run migrate` | Migra dados legados |

---

## Funcionalidades

- **Super Admin** — gerencia todas as empresas cadastradas na plataforma
- **Admin da Empresa** — gerencia frotas, motoristas, veículos, rotas, passageiros e pagamentos
- **Motorista** — acessa suas rotas e passageiros
- **Passageiro** — visualiza contratos, rotas e pagamentos
- Atribuição de rotas, veículos e passageiros a motoristas
- Upload de comprovantes de pagamento
- Controle de contratos e mensalidades
