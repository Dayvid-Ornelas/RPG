// backend/database.js
/**
 * File: backend/database.js
 * Initializes the SQLite database used by the RPG backend.
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "rpg.sqlite"));
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('arma', 'armadura')),
    bonus_ataque INTEGER NOT NULL DEFAULT 0,
    bonus_defesa INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS personagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    classe TEXT NOT NULL,
    nivel INTEGER NOT NULL DEFAULT 1,
    vida INTEGER NOT NULL DEFAULT 100,
    arma_id INTEGER,
    armadura_id INTEGER,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (arma_id) REFERENCES equipamentos(id),
    FOREIGN KEY (armadura_id) REFERENCES equipamentos(id)
  );
`);

const { total } = db.prepare("SELECT COUNT(*) AS total FROM equipamentos").get();
if (total === 0) {
  const inserirEquipamento = db.prepare(`
    INSERT INTO equipamentos (nome, tipo, bonus_ataque, bonus_defesa)
    VALUES (?, ?, ?, ?)
  `);

  [
    ["Espada de Ferro", "arma", 8, 0],
    ["Cajado Arcano", "arma", 12, 0],
    ["Machado do Norte", "arma", 15, -1],
    ["Armadura de Couro", "armadura", 0, 5],
    ["Cota de Malha", "armadura", 0, 9],
    ["Armadura do Guardião", "armadura", -1, 14],
  ].forEach((equipamento) => inserirEquipamento.run(...equipamento));
}

export default db;
