// src/MinigameSetas.jsx
/**
 * File: src/MinigameSetas.jsx
 *
 * Overview:
 *   Keyboard sequence minigame used to dodge the boss strong attack.
 *   Generates a random arrow sequence and checks whether the player completes it before time runs out.
 *
 * Exports:
 *   - MinigameSetas — React component
 *
 * Imported By:
 *   - src/App.jsx
 */
import { useState, useEffect, useCallback } from "react";

// Dicionário para transformar os nomes das teclas em emojis/símbolos visuais
const MAPA_SETAS = {
  ArrowUp: "⬆️",
  ArrowDown: "⬇️",
  ArrowLeft: "⬅️",
  ArrowRight: "➡️"
};
const TECLAS_POSSIVEIS = Object.keys(MAPA_SETAS);

const gerarSequenciaSetas = () =>
  Array.from({ length: 10 }, () => {
    const indexAleatorio = Math.floor(Math.random() * TECLAS_POSSIVEIS.length);
    return TECLAS_POSSIVEIS[indexAleatorio];
  });

export default function MinigameSetas({ onComplete }) {
  const [setas] = useState(gerarSequenciaSetas);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(5000); // 5 segundos para completar
  const [ativo, setAtivo] = useState(true);
  const [mensagem, setMensagem] = useState("Rápido! Digite a sequência!");

  // 1. Função para finalizar o minigame
  const finalizar = useCallback((resultado) => {
    setAtivo(false);
    if (resultado === "PERFEITO") {
      setMensagem("ESQUIVA PERFEITA!");
    } else {
      setMensagem("TEMPO ESGOTADO!");
    }
    
    // Espera 1.5s para o jogador ler a mensagem antes de fechar
    setTimeout(() => {
      onComplete(resultado);
    }, 1500);
  }, [onComplete]);

  // 3. O Cronômetro (diminui a cada 100 milissegundos)
  useEffect(() => {
    if (!ativo) return;

    const intervalo = setInterval(() => {
      setTempoRestante((tempoAntigo) => {
        if (tempoAntigo <= 100) {
          clearInterval(intervalo);
          finalizar("ERRO"); // O tempo acabou e o jogador não terminou
          return 0;
        }
        return tempoAntigo - 100;
      });
    }, 100);

    return () => clearInterval(intervalo);
  }, [ativo, finalizar]);

  // 4. Ouvinte de Teclado (Keydown)
  useEffect(() => {
    if (!ativo || setas.length === 0) return;

    const capturarTecla = (evento) => {
      const teclaPressionada = evento.key;

      // Ignora teclas que não sejam as setinhas para não dar erro se o usuário apertar espaço, etc.
      if (!TECLAS_POSSIVEIS.includes(teclaPressionada)) return;

      // Se a tecla for exatamente a próxima que ele precisa apertar
      if (teclaPressionada === setas[indiceAtual]) {
        const proximoIndice = indiceAtual + 1;
        setIndiceAtual(proximoIndice);

        // Se chegou na última seta, ele venceu!
        if (proximoIndice === setas.length) {
          finalizar("PERFEITO");
        }
      }
      // Opcional: Se ele apertar a seta errada, você pode punir aqui, mas vamos apenas ignorar para ele tentar de novo
    };

    window.addEventListener("keydown", capturarTecla);
    return () => window.removeEventListener("keydown", capturarTecla);
  }, [ativo, setas, indiceAtual, finalizar]);

  // Estilo dinâmico para a barra de tempo ir encolhendo
  const larguraBarraTempo = (tempoRestante / 5000) * 100;

  return (
    <div style={{ textAlign: "center", padding: "20px", background: "#222", color: "white", borderRadius: "10px" }}>
      <h3 style={{ color: mensagem === "TEMPO ESGOTADO!" ? "red" : "yellow" }}>{mensagem}</h3>
      
      {/* Barra de Tempo */}
      <div style={{ width: "100%", background: "#555", height: "10px", borderRadius: "5px", margin: "20px 0", overflow: "hidden" }}>
        <div style={{ 
          width: `${larguraBarraTempo}%`, 
          background: larguraBarraTempo > 30 ? "lime" : "red", 
          height: "100%", 
          transition: "width 0.1s linear" 
        }}></div>
      </div>

      {/* Renderizando as Setinhas */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", fontSize: "30px", flexWrap: "wrap" }}>
        {setas.map((seta, index) => {
          // Lógica de Cores: Verde se já passou, Branco se é o atual, Cinza apagado se ainda vai chegar
          let opacidade = 0.3;
          let corFundo = "transparent";

          if (index < indiceAtual) {
            opacidade = 1;
            corFundo = "rgba(0, 255, 0, 0.3)"; // Ficou verde (já digitou)
          } else if (index === indiceAtual) {
            opacidade = 1;
            corFundo = "rgba(255, 255, 255, 0.2)"; // Destaque na atual
          }

          return (
            <div key={index} style={{ 
              opacity: opacidade, 
              background: corFundo, 
              padding: "10px", 
              borderRadius: "5px",
              border: index === indiceAtual ? "2px solid white" : "2px solid transparent"
            }}>
              {MAPA_SETAS[seta]}
            </div>
          );
        })}
      </div>
    </div>
  );
}