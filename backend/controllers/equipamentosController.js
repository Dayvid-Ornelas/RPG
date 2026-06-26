// backend/controllers/equipamentosController.js
/**
 * File: backend/controllers/equipamentosController.js
 * Handles equipment catalog queries used when creating RPG characters.
 */
import db from "../database.js";

export function listarEquipamentos() {
  return db
    .prepare(
      `SELECT id, nome, tipo, bonus_ataque AS bonusAtaque, bonus_defesa AS bonusDefesa
       FROM equipamentos
       ORDER BY tipo, nome`,
    )
    .all();
}
