# RotaFlow YMS (Yard Management System)

Plataforma corporativa SaaS B2B de **Orquestração de Pátios Logísticos, Agendamento Inteligente de Docas, Controle de Estadias e Gestão Comercial Multi-Tenant**. 

Desenvolvida e operada por **RAOS Tecnologia LTDA** (CNPJ: **66.914.167/0001-76**).

---

## 🚀 Arquitetura & Stack Tecnológica

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Frontend** | Vue.js 3 (Composition API) + Vite | Tailwind CSS, Pinia, Vue Router 4, Lucide Icons |
| **Backend** | Python 3.11+ / FastAPI | Uvicorn, WebSockets assíncronos, Pydantic v2 |
| **ORM & Banco de Dados** | SQLAlchemy 2.0 + PostgreSQL | Isolamento Multi-Tenant estrito, concorrência otimizada |
| **Segurança & Criptografia** | JWT (Bearer) + bcrypt + HMAC-SHA256 | Proteção multi-camadas de rotas e assinatura de Webhooks |
| **Comunicação Realtime** | WebSockets Bidirecionais | Atualização instantânea da Torre de Controle (Kanban) |

---

## 📦 Estrutura do Projeto

```text
rotaflow/
├── backend/                  # API REST FastAPI + WebSockets
│   ├── app/
│   │   ├── api/v1/          # Endpoints REST (Auth, Tenants, Docas, Gate, Reports, Webhooks)
│   │   ├── core/            # Configurações, Segurança (JWT, Bcrypt) e Sessão do Banco
│   │   ├── models/          # Modelagem relacional SQLAlchemy (Tenant, User, Dock, Schedule, etc.)
│   │   ├── schemas/         # Contratos e validações Pydantic v2
│   │   └── services/        # Regras de concorrência de docas, Webhooks ERP e WebSockets
│   ├── requirements.txt     # Dependências Python
│   └── .env                 # Variáveis de ambiente backend
│
├── frontend/                 # Aplicação Web SPA (Vue 3 + Vite)
│   ├── src/
│   │   ├── views/           # Telas operacionais, Portal do Transportador e Super Admin
│   │   ├── components/      # Sidebar adaptativa, Cards Kanban, Modais e Indicadores
│   │   ├── stores/          # Gerenciamento de estado reativo (Pinia: auth, yard)
│   │   └── router/          # Rotas com Navigation Guards para Super Admin e Operadores
│   ├── package.json
│   └── vite.config.js
```

---

## ✨ Módulos e Funcionalidades

### 👑 1. Painel Master Super Admin & Cobrança (RAOS Tecnologia)
- **Menu Lateral Executivo Exclusivo:** Navegação corporativa independente com faturamento consolidado e módulos de governança.
- **Gestão de Contratos & Boletos Bancários:** Definição livre do valor mensal cobrado por cliente (`monthly_fee`) e dia de vencimento (`billing_due_day`) para emissão de cobranças.
- **Métricas Financeiras & MRR:** Monitoramento em tempo real do faturamento mensal recorrente consolidado, clientes adimplentes e docas licenciadas.
- **Administração Central de Usuários:** Criação de colaboradores para qualquer cliente da carteira, busca universal com filtro por armazém, reset instantâneo de senhas e exclusão auditada.
- **Matriz de Módulos & Licenças:** Habilitação por armazém de automações de ponta como Robô de WhatsApp e Portal do Transportador.
- **Modo Auditoria de Pátio (Suporte Técnico):** Permite ao Super Admin inspecionar a operação de qualquer armazém da carteira na Torre de Controle e retornar ao painel executivo com 1 clique.
- **Proteção em 3 Camadas:** Interceptação no roteador Vue (`requiresSuperAdmin`), isolamento estrito contra o modo Sandbox e autenticação criptográfica JWT com dependência `require_super_admin` no FastAPI.

### 🚚 2. Portal do Transportador (Auto-Agendamento Público)
- Rota pública e amigável: `/agendar/:slug` (ex: `/agendar/comlog`).
- As próprias transportadoras e frotistas parceiros agendam suas janelas de entrega de forma autônoma.
- Seleção inteligente por tipo de operação (Carga Geral, Refrigerado, Grãos, etc.) respeitando a disponibilidade física das docas.

### 📊 3. Torre de Controle Kanban (Tempo Real)
- Visão visual de todos os veículos organizados em raias operacionais: `Agendados`, `Aguardando no Pátio`, `Em Doca` e `Liberados`.
- Atualização em tempo real via **WebSockets** sem necessidade de recarregar a página.
- Cronômetro individual de permanência (*Dwell Time*) com alertas visuais automáticos de estouro de tolerância/SLA.

### 📱 4. Check-in do Motorista & Mobile Pátio
- Totalmente otimizado para celulares e conexões de campo (Mobile-First / PWA).
- **Zero Fricção:** Sem necessidade de download de aplicativo ou criação de senhas; o motorista acessa via link único, valida seus dados e gera seu passe digital em QR Code.
- Fiscais de pátio utilizam tablets ou smartphones para direcionamento de baias e confirmação de encoste.

### 🛡️ 5. Portaria & Cancela Inteligente
- Leitor óptico de QR Code integrado via câmera e busca rápida por placa veicular.
- Validação e entrada em 1 toque com gravação de timestamp auditável para fins jurídicos.

### ⚡ 6. Gestão & Concorrência de Docas
- Algoritmo de prevenção de conflito: bloqueia automaticamente o agendamento simultâneo na mesma doca e janela de tempo.
- Monitoramento de status: `Disponível`, `Ocupada` e `Manutenção`.

### 📑 7. Relatórios & Laudo Jurídico de Permanência
- Indicadores gerenciais de tempo médio de permanência (*Dwell Time*), taxa de ocupação de docas e estadias acumuladas.
- **Exportação de Laudo Auditável (.CSV):** com todos os timestamps (portaria, início de descarga e liberação da cancela) e cálculo monetário de sobre-estadia conforme a **Lei Federal 11.442/2007**.

### 🔗 8. Integrações Enterprise & Ingestão Fiscal (ERP / WMS / TMS)
- **Ingestão de Notas Fiscais:** Endpoints prontos para receber XMLs e dados estruturados de NF-e, CT-e e DANFE emitidos pelos ERPs dos clientes.
- **Webhooks Seguros com HMAC-SHA256:** Notificações automáticas em tempo real para SAP, TOTVS Protheus, Senior e Oracle nas mudanças de status (`vehicle.docked`, `vehicle.released`).
- **Chaves de API Corporativas:** Gestão de tokens com prefixo `rf_live_` para conexão com sistemas legados.

---

## 🔑 Credenciais Padrão de Demonstração & Teste

| Perfil de Acesso | URL de Entrada | E-mail de Login | Senha |
|---|---|---|---|
| **Super Admin Master (RAOS)** | [http://localhost:5173/admin](http://localhost:5173/admin) | `admin@raos.com.br` | `raos2026` |
| **Armazém Piloto (ComLog Express)** | [http://localhost:5173/login](http://localhost:5173/login) | `operador@rotaflow.com.br` | `comlog123` |
| **Portal do Transportador** | [http://localhost:5173/agendar/comlog](http://localhost:5173/agendar/comlog) | *Acesso público* | *Sem senha* |
| **Visitante Sandbox (Demo)** | [http://localhost:5173/](http://localhost:5173/) | *Clique em "Experimentar Piloto Online"* | *Sem senha* |

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- **Python 3.11+**
- **Node.js 18+** / **npm 9+**
- **PostgreSQL 14+** (ou banco de dados compatível configurado no `.env`)

---

### 1. Configurando o Backend (FastAPI)

```bash
cd backend

# Criar e ativar o ambiente virtual:
# No Windows (PowerShell):
python -m venv .venv
.venv\Scripts\Activate.ps1

# No Linux / macOS:
python -m venv .venv
source .venv/bin/activate

# Instalar dependências:
pip install -r requirements.txt

# Iniciar o servidor com recarregamento automático:
uvicorn app.main:app --reload --port 8000
```

> **Documentação Swagger Interativa:** [http://localhost:8000/docs](http://localhost:8000/docs)  
> **Documentação Redoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 2. Configurando o Frontend (Vue.js 3 + Vite)

```bash
cd frontend

# Instalar dependências do ecossistema Vue:
npm install

# Iniciar servidor de desenvolvimento:
npm run dev
```

> **Painel do Sistema:** [http://localhost:5173](http://localhost:5173)

---

### 3. Validação & Build de Produção

Para validar que o frontend compila perfeitamente sem erros de sintaxe ou dependência:

```bash
cd frontend
npm run build
```

---

## 📄 Propriedade Intelectual & Governança

Este software é de propriedade exclusiva e confidencial de **RAOS Tecnologia LTDA**.  
**CNPJ:** `66.914.167/0001-76`  
Todos os direitos reservados &copy; 2026.
