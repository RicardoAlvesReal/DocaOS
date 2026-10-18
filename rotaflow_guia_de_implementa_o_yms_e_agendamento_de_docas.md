# RotaFlow: Guia de Pivotagem para YMS (Yard Management System)

## 1. Visão Geral do Reposicionamento
O RotaFlow deixará de ser um sistema focado puramente em rastreamento rodoviário de pequenos frotistas para se tornar um **Orquestrador de Pátios e Agendamento de Docas (YMS)** voltado para terminais retroportuários, indústrias e grandes operadores logísticos. O foco sai do "GPS na rua" para o "Controle de Fluxo na Portaria".

**Stack Oficial:** 
* Backend: Python (FastAPI + SQLAlchemy + Pydantic + Uvicorn)
* Frontend: Vue.js 3 + Vite + TailwindCSS + Pinia (Composition API `<script setup>`)
* Banco de Dados: PostgreSQL (Isolamento Multi-tenant)
* Infra: Docker, AWS.

---

## 2. Modelagem de Dados (PostgreSQL)
A base de dados precisará de novas tabelas centrais para gerenciar o agendamento e o controle de estado dentro do pátio:

- [ ] **Tabela `tenants` (Multi-tenant):** Para separar os clientes logísticos.
- [ ] **Tabela `docks` (Docas/Vagas):** Mapeamento físico do pátio (Ex: Doca 01 - Carga Seca, Doca 02 - Frigorífica).
- [ ] **Tabela `appointments` (Agendamentos):** Registro do *time slot* (janela de horário) reservado para a transportadora.
- [ ] **Tabela `yard_events` (Log de Status):** Rastreabilidade de tempo. Timestamp de cada transição de fase para cálculo de SLAs e métricas de ociosidade.

---

## 3. Fase 1: Interface do Motorista (Check-in via Web/WhatsApp)
**Objetivo:** Zero fricção. O motorista terceirizado não fará login com senha e não baixará aplicativo nativo.

- [ ] **Geração de Link Único:** O sistema gera um link (token JWT com expiração) que é enviado via WhatsApp para o motorista ou transportadora.
- [ ] **Formulário Web PWA (Mobile-first):** O link abre uma página leve onde o motorista confere os dados da carga e insere a placa do cavalo/carreta e CPF.
- [ ] **Geração de QR Code:** Após confirmar os dados, a tela gera um QR Code estático.
- [ ] **Integração de Portaria:** Esse QR Code será lido pelo porteiro do armazém (com leitor óptico ou câmera de celular) para dar a entrada imediata do veículo no sistema, registrando o timestamp de "Chegada no Pátio".

---

## 4. Fase 2: Torre de Controle (Painel Kanban do Operador)
**Objetivo:** Visibilidade visual em tempo real para os gerentes do armazém.

- [ ] **Desenvolvimento do Board Kanban:** Criar uma interface web fluida usando Vue.js 3 (ex: drag-and-drop nativo ou `vue-draggable-plus`).
- [ ] **Colunas Obrigatórias (Status):**
  1. `Agendados` (Para o dia/turno)
  2. `Aguardando no Pátio` (Fizeram check-in na portaria, o cronômetro de estadia começou a rodar)
  3. `Em Doca` (Caminhão estacionado descarregando/carregando)
  4. `Finalizado / Liberação` (Pronto para sair, aguardando documentação)
- [ ] **Cards de Veículo:** Cada caminhão é um *card* exibindo: Placa, Transportadora, Tempo na fase atual (cronômetro dinâmico em vermelho se estourar o SLA) e Doca designada.
- [ ] **Automação de Doca:** Quando um card é movido para "Em Doca", o sistema vincula o caminhão àquela doca específica e muda o status da doca para `Ocupada`.

---

## 5. Fase 3: Camada Middleware e APIs (Enterprise)
**Objetivo:** Preparar o software para ser vendido para empresas que já possuem SAP, TOTVS ou ERPs legados.

- [ ] **Arquitetura API First:** Todas as ações do painel Kanban devem consumir uma API RESTful.
- [ ] **Endpoints de Ingestão de Carga:** Criar rotas fechadas para que o ERP do cliente envie os XMLs de notas fiscais ou a lista de agendamentos do dia automaticamente.
- [ ] **Webhooks de Saída:** Quando um caminhão for movido para `Finalizado` no Kanban, o RotaFlow dispara um Webhook para avisar o ERP do cliente que a nota fiscal já pode ser impressa.

---

## 6. Fase 4: Onboarding e Painel Administrativo Interno
**Objetivo:** Controlar a distribuição do software sem abrir cadastro público (Sales-Led Growth).

- [ ] **Painel Super Admin (Apenas para a RAOS Tecnologia):** Interface para você gerenciar os *tenants*.
- [ ] **Criação Manual de Clientes:** Script ou formulário para provisionar um novo armazém logístico, definindo o número de docas contratadas e liberando o usuário de acesso "Master" para o Gerente de Logística daquele cliente.

---

## 7. Indicadores e Relatórios (O Fator ROI)
Para garantir a renovação do contrato (SaaS), o sistema deve provar que gerou economia.

- [ ] **Dashboard Gerencial:** Gráficos mostrando:
  - Tempo médio de espera no pátio por transportadora.
  - Ociosidade das docas (quais docas ficam vazias por mais tempo).
  - Volume de caminhões atendidos por turno.
- [ ] **Exportação de Dados:** Botão simples para exportar em `.csv` os tempos de permanência de todos os veículos no mês, servindo como prova matemática para o cliente não pagar multas indevidas de estadia.