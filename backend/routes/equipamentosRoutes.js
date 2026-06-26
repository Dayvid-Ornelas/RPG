// backend/routes/equipamentosRoutes.js
/**
 * File: backend/routes/equipamentosRoutes.js
 * Routes for the equipment catalog.
 */
import { listarEquipamentos } from "../controllers/equipamentosController.js";
import { sendJson } from "../http-utils.js";

export function equipamentosRoutes(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/equipamentos") {
    return sendJson(res, 200, listarEquipamentos());
  }

  return false;
}
