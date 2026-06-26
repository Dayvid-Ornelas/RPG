# API do Backend RPG

## Visão geral

A API adiciona a terceira etapa do projeto acadêmico: backend HTTP, rotas organizadas, comunicação cliente-servidor, persistência em SQLite e CRUD de personagens.

Base local: `http://localhost:3001/api`

## Endpoints

### `GET /api/health`

Verifica se o backend está online.

**Resposta 200**

```json
{
  "status": "online",
  "projeto": "Crônicas do Chefão - Backend RPG"
}
```

Fonte: `backend/server.js`.

### `GET /api/equipamentos`

Lista armas e armaduras disponíveis para montagem do personagem.

**Resposta 200**

```json
[
  {
    "id": 1,
    "nome": "Espada de Ferro",
    "tipo": "arma",
    "bonusAtaque": 8,
    "bonusDefesa": 0
  }
]
```

Fonte: `backend/routes/equipamentosRoutes.js` e `backend/controllers/equipamentosController.js`.

### `GET /api/personagens`

Lista todos os personagens cadastrados, incluindo arma e armadura vinculadas.

Fonte: `backend/routes/personagensRoutes.js` e `backend/controllers/personagensController.js`.

### `GET /api/personagens/:id`

Consulta um personagem específico pelo ID.

**Erros**

- `404`: personagem não encontrado.

Fonte: `backend/routes/personagensRoutes.js` e `backend/controllers/personagensController.js`.

### `POST /api/personagens`

Cadastra um novo personagem.

**Body**

```json
{
  "nome": "Arion",
  "classe": "Guerreiro",
  "nivel": 1,
  "vida": 100,
  "armaId": 1,
  "armaduraId": 4
}
```

**Resposta 201**

Retorna o personagem criado.

**Erros**

- `400`: campos inválidos ou equipamento inexistente.

Fonte: `backend/routes/personagensRoutes.js` e `backend/controllers/personagensController.js`.

### `PUT /api/personagens/:id`

Atualiza todos os dados editáveis de um personagem.

**Body**: mesmo formato do `POST /api/personagens`.

**Erros**

- `400`: campos inválidos ou equipamento inexistente.
- `404`: personagem não encontrado.

Fonte: `backend/routes/personagensRoutes.js` e `backend/controllers/personagensController.js`.

### `DELETE /api/personagens/:id`

Exclui um personagem cadastrado.

**Resposta 200**

```json
{
  "mensagem": "Personagem excluído com sucesso."
}
```

**Erros**

- `404`: personagem não encontrado.

Fonte: `backend/routes/personagensRoutes.js` e `backend/controllers/personagensController.js`.
