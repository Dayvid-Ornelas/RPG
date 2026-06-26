# Arquitetura — Crônicas do Chefão

## Visão geral

O projeto é uma aplicação web de RPG de turno feita em React. Nesta etapa, ele foi evoluído com um backend local para cadastrar, consultar, atualizar e excluir personagens persistidos em banco SQLite.

## Subsystems

- **Frontend React** (`src/`): jogo, tutorial, combate e tela de CRUD de personagens.
- **Backend HTTP** (`backend/server.js`, `backend/routes/`, `backend/controllers/`): API JSON com rotas de personagens e equipamentos.
- **Banco SQLite** (`backend/database.js`, `backend/data/rpg.sqlite`): armazena personagens e catálogo inicial de armas/armaduras.

## Diagrama

```text
Usuário
  ↓
Frontend React/Vite
  ↓ fetch HTTP
Backend Node HTTP
  ↓
Controllers
  ↓
SQLite
```

## Stack

- React + Vite
- JavaScript ES Modules
- Node.js HTTP server
- SQLite via `node:sqlite`
- CSS responsivo temático de RPG

## Como rodar

Em um terminal:

```bash
npm run backend
```

Em outro terminal:

```bash
npm run dev
```

O backend usa a porta `3001` por padrão. Para mudar, defina `RPG_API_PORT`. O frontend consome a API em `http://localhost:3001/api` por padrão. Para mudar a URL no frontend, defina `VITE_API_URL`.

## Boas práticas aplicadas

- Separação entre rotas, controllers e banco de dados.
- Validação básica no backend antes de salvar.
- Respostas JSON padronizadas.
- Operações CRUD completas para personagens.
- Catálogo de equipamentos persistido no banco.
