# Emplyon Systems - Frontend Vue

Frontend em Vue 3 + Vite para consumir a API do backend.

## Pré-requisitos

- Node.js 20+ (recomendado LTS)
- npm 10+ (ou versão compatível com seu Node)
- Backend rodando localmente (preferencialmente em `http://localhost:8080`)

## Configuração de ambiente

Crie seu `.env` a partir do exemplo (se necessário):

```bash
cp .env.example .env
```

Variável principal:

- `VITE_API_BASE_URL=/api`

> Em desenvolvimento, o Vite faz proxy de `/api` para `http://localhost` (configurado em `vite.config.ts`), então o backend deve estar acessível nesse host/porta.

## Rodar em Desenvolvimento (local)

1. Instalar dependências:

```bash
npm install
```

2. Subir servidor de desenvolvimento:

```bash
npm run dev
```

3. Abrir no navegador:

- URL exibida no terminal (geralmente `http://localhost:5173`)

## Build de Produção (local)

1. Gerar build:

```bash
npm run build
```

2. Servir build localmente para validação:

```bash
npm run preview
```

## Scripts disponíveis

- `npm run dev` - inicia Vite com HMR
- `npm run build` - type-check + build de produção
- `npm run preview` - sobe build gerado localmente
- `npm run type-check` - valida tipos com `vue-tsc`
- `npm run format` - formata `src/` com Prettier

## Fluxo recomendado com backend

1. Subir backend em dev (`make dev-up`) no projeto `backend`.
2. Rodar migrations/seed no backend se necessário.
3. Subir frontend com `npm run dev`.
4. Testar chamadas de API pelo frontend usando `/api`.

## Solução rápida de problemas

- Erro de CORS/proxy: confirme backend ativo e rota disponível.
- Dependências quebradas: remova `node_modules` e rode `npm install` novamente.
- Porta ocupada no Vite: ele sugere outra porta automaticamente; valide no terminal.

Att: Rafael Rodrigues
