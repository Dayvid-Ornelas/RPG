// backend/controllers/personagensController.js
/**
 * File: backend/controllers/personagensController.js
 * CRUD operations for RPG characters persisted in SQLite.
 */
import db from "../database.js";

const personagemSelect = `
  SELECT
    p.id,
    p.nome,
    p.classe,
    p.nivel,
    p.vida,
    p.arma_id AS armaId,
    arma.nome AS armaNome,
    arma.bonus_ataque AS armaBonusAtaque,
    p.armadura_id AS armaduraId,
    armadura.nome AS armaduraNome,
    armadura.bonus_defesa AS armaduraBonusDefesa,
    p.criado_em AS criadoEm,
    p.atualizado_em AS atualizadoEm
  FROM personagens p
  LEFT JOIN equipamentos arma ON arma.id = p.arma_id
  LEFT JOIN equipamentos armadura ON armadura.id = p.armadura_id
`;

function normalizarPersonagem(row) {
  if (!row) return null;

  return {
    id: row.id,
    nome: row.nome,
    classe: row.classe,
    nivel: row.nivel,
    vida: row.vida,
    arma: row.armaId
      ? { id: row.armaId, nome: row.armaNome, bonusAtaque: row.armaBonusAtaque }
      : null,
    armadura: row.armaduraId
      ? { id: row.armaduraId, nome: row.armaduraNome, bonusDefesa: row.armaduraBonusDefesa }
      : null,
    criadoEm: row.criadoEm,
    atualizadoEm: row.atualizadoEm,
  };
}

function validarPersonagem(dados) {
  const nome = String(dados.nome ?? "").trim();
  const classe = String(dados.classe ?? "").trim();
  const nivel = Number(dados.nivel ?? 1);
  const vida = Number(dados.vida ?? 100);
  const armaId = dados.armaId ? Number(dados.armaId) : null;
  const armaduraId = dados.armaduraId ? Number(dados.armaduraId) : null;

  if (!nome) throw new Error("Informe o nome do personagem.");
  if (!classe) throw new Error("Informe a classe do personagem.");
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 99) {
    throw new Error("O nível deve ser um número inteiro entre 1 e 99.");
  }
  if (!Number.isInteger(vida) || vida < 1 || vida > 999) {
    throw new Error("A vida deve ser um número inteiro entre 1 e 999.");
  }

  return { nome, classe, nivel, vida, armaId, armaduraId };
}

function equipamentoExiste(id, tipo) {
  if (!id) return true;
  const equipamento = db
    .prepare("SELECT id FROM equipamentos WHERE id = ? AND tipo = ?")
    .get(id, tipo);
  return Boolean(equipamento);
}

function validarEquipamentos({ armaId, armaduraId }) {
  if (!equipamentoExiste(armaId, "arma")) {
    throw new Error("Arma selecionada não existe.");
  }
  if (!equipamentoExiste(armaduraId, "armadura")) {
    throw new Error("Armadura selecionada não existe.");
  }
}

export function listarPersonagens() {
  return db
    .prepare(`${personagemSelect} ORDER BY p.id DESC`)
    .all()
    .map(normalizarPersonagem);
}

export function buscarPersonagemPorId(id) {
  const row = db.prepare(`${personagemSelect} WHERE p.id = ?`).get(id);
  return normalizarPersonagem(row);
}

export function criarPersonagem(dadosRecebidos) {
  const dados = validarPersonagem(dadosRecebidos);
  validarEquipamentos(dados);

  const resultado = db
    .prepare(
      `INSERT INTO personagens (nome, classe, nivel, vida, arma_id, armadura_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(dados.nome, dados.classe, dados.nivel, dados.vida, dados.armaId, dados.armaduraId);

  return buscarPersonagemPorId(resultado.lastInsertRowid);
}

export function atualizarPersonagem(id, dadosRecebidos) {
  if (!buscarPersonagemPorId(id)) return null;

  const dados = validarPersonagem(dadosRecebidos);
  validarEquipamentos(dados);

  db.prepare(
    `UPDATE personagens
     SET nome = ?, classe = ?, nivel = ?, vida = ?, arma_id = ?, armadura_id = ?, atualizado_em = CURRENT_TIMESTAMP
     WHERE id = ?`,
  ).run(dados.nome, dados.classe, dados.nivel, dados.vida, dados.armaId, dados.armaduraId, id);

  return buscarPersonagemPorId(id);
}

export function excluirPersonagem(id) {
  const resultado = db.prepare("DELETE FROM personagens WHERE id = ?").run(id);
  return resultado.changes > 0;
}
