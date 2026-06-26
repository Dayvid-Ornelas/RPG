// backend/server.js
/* global process */
/**
 * File: backend/server.js
 * Lightweight HTTP API for the RPG project.
 */
import { createServer } from "node:http";
import { equipamentosRoutes } from "./routes/equipamentosRoutes.js";
import { personagensRoutes } from "./routes/personagensRoutes.js";
import { sendJson } from "./http-utils.js";
import "./database.js";

const PORT = Number(process.env.RPG_API_PORT ?? 3001);

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      status: "online",
      projeto: "Crônicas do Chefão - Backend RPG",
    });
  }

  const handled =
    (await personagensRoutes(req, res, url.pathname)) ||
    equipamentosRoutes(req, res, url.pathname);

  if (!handled) {
    sendJson(res, 404, { erro: "Rota não encontrada." });
  }
});

server.listen(PORT, () => {
  console.log(`Backend RPG rodando em http://localhost:${PORT}`);
});
