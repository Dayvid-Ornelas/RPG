import { useRef, useEffect, useState } from "react";

export default function MinigameBarra({ onComplete, tipo = "vertical" }) {
  const [ativo, setAtivo] = useState(true);
  const [mensagem, setMensagem] = useState("");
  
  // Guardamos o progresso (de 0 a 100) e a direção (subindo ou descendo)
  const progresso = useRef(0);
  const direcao = useRef(1); // 1 = vai, -1 = volta
  const velocidade = 3.5; // Altere para deixar o minigame mais difícil
  
  // Referências para o DOM e para o loop de animação
  const indicadorRef = useRef(null);
  const animacaoRef = useRef(null);

  // Zonas de acerto (em porcentagem)
  const zonaPerfeita = { min: 75, max: 90 };
  const zonaBoa = { min: 65, max: 100 };

  const animar = () => {
    if (!ativo) return;

    // Atualiza a matemática da posição
    progresso.current += direcao.current * velocidade;

    // Bateu no topo ou no fundo, inverte a direção
    if (progresso.current >= 100) {
      progresso.current = 100;
      direcao.current = -1;
    } else if (progresso.current <= 0) {
      progresso.current = 0;
      direcao.current = 1;
    }

    // Atualiza o visual diretamente no DOM (muito mais rápido que o useState)
    if (indicadorRef.current) {
      if (tipo === "vertical") {
        indicadorRef.current.style.bottom = `${progresso.current}%`;
      } else {
        indicadorRef.current.style.left = `${progresso.current}%`;
      }
    }

    // Pede ao navegador para rodar essa função de novo no próximo quadro
    animacaoRef.current = requestAnimationFrame(animar);
  };

  // Inicia a animação assim que o componente aparece na tela
  useEffect(() => {
    animacaoRef.current = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(animacaoRef.current); // Limpa ao fechar
  }, [ativo]);

  // Função disparada quando o jogador aperta o botão
  const pararBarra = () => {
    if (!ativo) return;
    
    setAtivo(false);
    cancelAnimationFrame(animacaoRef.current);

    const pos = Math.round(progresso.current);
    let resultado = "ERRO";

    // Verifica onde a barra parou
    if (pos >= zonaPerfeita.min && pos <= zonaPerfeita.max) {
      resultado = "PERFEITO";
      setMensagem("PERFEITO!");
    } else if (pos >= zonaBoa.min && pos <= zonaBoa.max) {
      resultado = "BOM";
      setMensagem("Boa!");
    } else {
      setMensagem("Errou!");
    }

    // Espera 1.5 segundos para o jogador ver onde parou, e avisa o App.jsx
    setTimeout(() => {
      onComplete(resultado);
    }, 1500);
  };

  // Estilos inline básicos (depois substituiremos pelas classes do seu framework CSS)
  const barStyle = {
    position: "relative",
    background: "#333",
    borderRadius: "10px",
    overflow: "hidden",
    margin: "0 auto",
    ...(tipo === "vertical" ? { width: "40px", height: "300px" } : { width: "300px", height: "40px" })
  };

  const sweetSpotStyle = {
    position: "absolute",
    background: "rgba(230, 217, 40, 0.92)", // Amarelo
    ...(tipo === "vertical" 
      ? { bottom: `${zonaBoa.min}%`, height: `${zonaBoa.max - zonaBoa.min}%`, width: "100%" }
      : { left: `${zonaBoa.min}%`, width: `${zonaBoa.max - zonaBoa.min}%`, height: "100%" })
  };

  const perfectSpotStyle = {
    position: "absolute",
    background: "rgba(0, 255, 0, 0.8)", // Verde forte
    ...(tipo === "vertical" 
      ? { bottom: `${zonaPerfeita.min}%`, height: `${zonaPerfeita.max - zonaPerfeita.min}%`, width: "100%" }
      : { left: `${zonaPerfeita.min}%`, width: `${zonaPerfeita.max - zonaPerfeita.min}%`, height: "100%" })
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <div style={barStyle}>
        {/* Zonas de acerto desenhadas no fundo */}
        <div style={sweetSpotStyle}></div>
        <div style={perfectSpotStyle}></div>
        
        {/* A linha indicadora que se move */}
        <div
          ref={indicadorRef}
          style={{
            position: "absolute",
            background: "white",
            boxShadow: "0 0 10px white",
            ...(tipo === "vertical" 
              ? { width: "100%", height: "4px", bottom: "0%" }
              : { height: "100%", width: "4px", left: "0%" })
          }}
        ></div>
      </div>

      <div style={{ marginTop: "20px", height: "30px", fontWeight: "bold", fontSize: "20px", color: mensagem === "Errou!" ? "red" : "green" }}>
        {mensagem}
      </div>

      <button 
        onClick={pararBarra} 
        disabled={!ativo}
        style={{ marginTop: "10px", padding: "10px 30px", fontSize: "18px", cursor: ativo ? "pointer" : "not-allowed" }}
      >
        AÇÃO!
      </button>
    </div>
  );
}