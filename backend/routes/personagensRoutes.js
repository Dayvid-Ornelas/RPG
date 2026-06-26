// backend/routes/personagensRoutes.js
/**
 * File: backend/routes/personagensRoutes.js
 * HTTP routes for the character CRUD.
 */
import {
  atualizarPersonagem,
  buscarPersonagemPorId,
  criarPersonagem,
  excluirPersonagem,
  listarPersonagens,
} from "../controllers/personagensController.js";
import { readJsonBody, sendJson } from "../http-utils.js";

function extrairId(pathname) {
  const match = pathname.match(/^\/api\/personagens\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

export async function personagensRoutes(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/personagens") {
    return sendJson(res, 200, listarPersonagens());
  }

  const id = extrairId(pathname);

  if (req.method === "GET" && id) {
    const personagem = buscarPersonagemPorId(id);
    return personagem
      ? sendJson(res, 200, personagem)
      : sendJson(res, 404, { erro: "Personagem não encontrado." });
  }

  if (req.method === "POST" && pathname === "/api/personagens") {
    try {
      const dados = await readJsonBody(req);
      return sendJson(res, 201, criarPersonagem(dados));
    } catch (error) {
      return sendJson(res, 400, { erro: error.message });
    }
  }

  if (req.method === "PUT" && id) {
    try {
      const dados = await readJsonBody(req);
      const personagem = atualizarPersonagem(id, dados);
      return personagem
        ? sendJson(res, 200, personagem)
        : sendJson(res, 404, { erro: "Personagem não encontrado." });
    } catch (error) {
      return sendJson(res, 400, { erro: error.message });
    }
  }

  if (req.method === "DELETE" && id) {
    return excluirPersonagem(id)
      ? sendJson(res, 200, { mensagem: "Personagem excluído com sucesso." })
      : sendJson(res, 404, { erro: "Personagem não encontrado." });
  }

  return false;
}
