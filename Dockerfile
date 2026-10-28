# ==============================================================================
# DocaOS - Dockerfile de Produção Unificado (Frontend SPA + Backend FastAPI)
# ==============================================================================

# ------------------------------------------------------------------------------
# Estágio 1: Build do Frontend Vue 3 + Vite
# ------------------------------------------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /build

# Instalação limpa das dependências do Frontend
COPY frontend/package*.json ./
RUN npm ci

# Compila os assets e o index.html otimizado
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Estágio 2: Runtime do Backend FastAPI + Servidor SPA
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Instala dependências de SO mínimas para networking e certificados
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instala bibliotecas Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia a aplicação do Backend
COPY backend/app ./app

# Copia os arquivos compilados do Frontend para entrega direta
COPY --from=frontend-builder /build/dist ./frontend_dist

# Porta padrão de exposição
EXPOSE 8080

# Inicialização com Uvicorn escutando na porta definida pela nuvem (Fly.io)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
