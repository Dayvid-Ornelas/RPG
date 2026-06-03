import { useState, useEffect, useRef } from "react";
import MinigameBarra from "./MinigameBarra";
import MinigameSetas from "./MinigameSetas";

export default function App() {
  // --- ESTADOS DO JOGO ---
  const [hpHeroi, setHpHeroi] = useState(100);
  const [hpChefe, setHpChefe] = useState(150);
  const [turnoDoJogador, setTurnoDoJogador] = useState(true);
  const [logBatalha, setLogBatalha] = useState(
    "A batalha real ainda não começou.",
  );
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const audioRef = useRef(null);
  const [modoMinigame, setModoMinigame] = useState(null);
  const [danoPendente, setDanoPendente] = useState(0);
  const [cooldownMagia, setCooldownMagia] = useState(0);

  // --- ESTADOS DO TUTORIAL ---
  const [tutorialAtivo, setTutorialAtivo] = useState(true);
  const [passoTutorial, setPassoTutorial] = useState(0);
  const [simulandoMinigame, setSimulandoMinigame] = useState(false);
  const [feedbackTutorial, setFeedbackTutorial] = useState("");

  const maxHpHeroi = 100;
  const maxHpChefe = 150;

  // --- LOGICA DE RESOLUÇÃO DO TUTORIAL (AMBIENTE SEGURO) ---

  const tocarMusica = (caminhoArquivo) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(caminhoArquivo);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    audioRef.current.play().catch((erro) => {
      console.log("Autoplay bloqueado. Aguardando clique do usuário.", erro);
    });
  };

  useEffect(() => {
    if (jogoFinalizado) {
      // Poderia colocar uma música de Game Over/Vitória aqui se quiser
      if (audioRef.current) audioRef.current.pause();
    } else if (tutorialAtivo) {
      // Toca a música do tutorial
      tocarMusica("/sons/tutorial.mp3");
    } else {
      // Toca a música da batalha real
      tocarMusica("/sons/combate.mp3");
    }

    // Limpeza: Se o componente fechar, desliga a música da memória
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [tutorialAtivo, jogoFinalizado]);

  const iniciarTutorialEAudio = () => {
    setPassoTutorial(1);
    // Força o play na música atual (tutorial) após o clique obrigatório do usuário
    if (audioRef.current) audioRef.current.play().catch(() => {});
  };
  const resolverMagiaTutorial = (resultado) => {
    setSimulandoMinigame(false);
    if (resultado === "PERFEITO") {
      setFeedbackTutorial(
        "💥 Excelente! Você tirou PERFEITO. No jogo real, isso causará 75 de dano massivo!",
      );
    } else if (resultado === "BOM") {
      setFeedbackTutorial(
        "⚡ Muito bem! Você tirou BOM. No jogo real, causará 35 de dano.",
      );
    } else {
      setFeedbackTutorial(
        "❌ Cuidado! Você ERROU a zona. No jogo real, você receberá 25 de dano de ricochete!",
      );
    }
  };

  const resolverDefesaTutorial = (resultado) => {
    setSimulandoMinigame(false);
    if (resultado === "PERFEITO") {
      setFeedbackTutorial(
        "🛡️ Incrível! Defesa PERFEITA esquiva completamente do golpe (0 de dano).",
      );
    } else if (resultado === "BOM") {
      setFeedbackTutorial(
        "🟡 Boa! Defesa amarela reduz o dano do Chefe pela metade.",
      );
    } else {
      setFeedbackTutorial(
        "💥 Ops! Você errou o tempo. No jogo real, você tomará o dano completo.",
      );
    }
  };

  const resolverSetasTutorial = (resultado) => {
    setSimulandoMinigame(false);
    if (resultado === "PERFEITO") {
      setFeedbackTutorial(
        "🏃💨 Espetacular! Você completou a sequência a tempo e realizou uma Esquiva Épica!",
      );
    } else {
      setFeedbackTutorial(
        "💀 O tempo acabou! No jogo real, os ataques fortes do chefe tiram muita vida se você falhar.",
      );
    }
  };

  const avancarTutorial = () => {
    setFeedbackTutorial("");
    setPassoTutorial((p) => p + 1);
  };

  const iniciarJogoReal = () => {
    setTutorialAtivo(false);
    setLogBatalha("O Chefe desafia você! É a sua vez.");
  };

  // --- ATAQUES DO JOGADOR (JOGO REAL) ---
  const realizarAtaque = (nomeAtaque, danoMin, danoMax) => {
    if (!turnoDoJogador || jogoFinalizado || tutorialAtivo) return;
    const danoGerado =
      Math.floor(Math.random() * (danoMax - danoMin + 1)) + danoMin;
    aplicarDanoChefe(
      danoGerado,
      `Você usou ${nomeAtaque} e causou ${danoGerado} de dano!`,
    );
  };

  const iniciarMagia = () => {
    if (!turnoDoJogador || jogoFinalizado || cooldownMagia > 0 || tutorialAtivo)
      return;
    setModoMinigame("magia");
    setLogBatalha("💥 CANALIZANDO MAGIA SUPREMA! Pare a barra na área verde!");
  };

  const resolverMagia = (resultado) => {
    setModoMinigame(null);
    setCooldownMagia(2);

    if (resultado === "PERFEITO") {
      aplicarDanoChefe(
        75,
        "💥 !!!MAGIA PERFEITA!!! Você obliterou o Chefão com 75 de dano!",
      );
    } else if (resultado === "BOM") {
      aplicarDanoChefe(
        35,
        "⚡ Magia canalizada com sucesso! O impacto causou 35 de dano.",
      );
    } else {
      const danoAutoAfligido = 25;
      const novoHpHeroi = Math.max(0, hpHeroi - danoAutoAfligido);
      setHpHeroi(novoHpHeroi);
      setLogBatalha(
        `❌ FALHA CRÍTICA! A energia mística colapsou em você! (-${danoAutoAfligido} HP)`,
      );

      if (novoHpHeroi === 0) {
        setLogBatalha(
          "💀 Você foi destruído pelo ricochete da sua própria Magia... Game Over!",
        );
        setJogoFinalizado(true);
      } else {
        setTurnoDoJogador(false);
      }
    }
  };

  const aplicarDanoChefe = (dano, mensagem) => {
    const novoHpChefe = Math.max(0, hpChefe - dano);
    setHpChefe(novoHpChefe);
    setLogBatalha(mensagem);

    if (novoHpChefe === 0) {
      setLogBatalha(`🎉 Vitória! Você derrotou o Chefão!`);
      setJogoFinalizado(true);
      return;
    }
    setTurnoDoJogador(false);
  };

  // --- TURNO E DEFESA CONTRA O CHEFÃO (JOGO REAL) ---
  useEffect(() => {
    // Bloqueia o turno do chefe se o tutorial estiver ativo
    if (tutorialAtivo) return;

    if (!turnoDoJogador && !jogoFinalizado && modoMinigame === null) {
      const temporizador = setTimeout(() => {
        const poderDoChefe = Math.floor(Math.random() * (35 - 20 + 1)) + 20;
        setDanoPendente(poderDoChefe);

        const ataqueSorteado = Math.random() > 0.5 ? "defesa" : "setas";
        setModoMinigame(ataqueSorteado);

        if (ataqueSorteado === "defesa") {
          setLogBatalha(
            "O Chefão usou um Ataque Normal! Prepare-se para defender!",
          );
        } else {
          setLogBatalha("⚠️ ATAQUE FORTE! Desvie usando as setas do teclado!");
        }
      }, 1500);

      return () => clearTimeout(temporizador);
    }
  }, [turnoDoJogador, jogoFinalizado, modoMinigame, tutorialAtivo]);

  const resolverDefesa = (resultado) => {
    setModoMinigame(null);
    let multiplicador = 1;
    let textoResultado = "";

    if (resultado === "PERFEITO") {
      multiplicador = 0;
      textoResultado = "PERFEITO! Você esquivou completamente do ataque!";
    } else if (resultado === "BOM") {
      multiplicador = 0.5;
      textoResultado = "Boa defesa! Você reduziu o dano pela metade.";
    } else {
      multiplicador = 1;
      textoResultado = "Falhou! Você recebeu o dano total do ataque!";
    }

    aplicarDanoHeroi(Math.floor(danoPendente * multiplicador), textoResultado);
  };

  const resolverSetas = (resultado) => {
    setModoMinigame(null);
    let danoFinal = 0;
    let textoResultado = "";

    if (resultado === "PERFEITO") {
      danoFinal = 0;
      textoResultado = "ESQUIVA ÉPICA! Você desviou da fúria do Chefão!";
    } else {
      danoFinal = danoPendente;
      textoResultado = "Não foi rápido o suficiente! Tomou o dano em cheio!";
    }

    aplicarDanoHeroi(danoFinal, textoResultado);
  };

  const aplicarDanoHeroi = (danoFinal, textoResultado) => {
    const novoHpHeroi = Math.max(0, hpHeroi - danoFinal);
    setHpHeroi(novoHpHeroi);
    setLogBatalha(`${textoResultado} (-${danoFinal} HP)`);

    if (novoHpHeroi === 0) {
      setLogBatalha(`💀 Game Over! Você foi derrotado...`);
      setJogoFinalizado(true);
    } else {
      setTurnoDoJogador(true);
      setCooldownMagia((tempoAtual) => Math.max(0, tempoAtual - 1));
    }
  };

  const reiniciarBatalha = () => {
    setHpHeroi(maxHpHeroi);
    setHpChefe(maxHpChefe);
    setTurnoDoJogador(true);
    setJogoFinalizado(false);
    setModoMinigame(null);
    setCooldownMagia(0);
    setTutorialAtivo(true); // Permite jogar o tutorial de novo se quiser
    setPassoTutorial(0);
  };

  return (
    <div
      style={{ padding: "20px", fontFamily: "sans-serif", textAlign: "center" }}
    >
      <h1>RPG de Turno - Protótipo com Tutorial</h1>

      {/* Arena borrada/desativada visualmente se for o tutorial */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "30px 0",
          opacity: tutorialAtivo ? 0.4 : 1,
        }}
      >
        <div>
          <h3>Herói (Você)</h3>
          <p>
            HP: {hpHeroi} / {maxHpHeroi}
          </p>
        </div>
        <div>
          <h3>Chefão (Inimigo)</h3>
          <p>
            HP: {hpChefe} / {maxHpChefe}
          </p>
        </div>
      </div>

      {/* Caixa de Mensagem Principal do Combate Real */}
      {!tutorialAtivo && (
        <div
          style={{
            background: "#eee",
            padding: "15px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          <strong>{logBatalha}</strong>
        </div>
      )}

      {/* ================= SEÇÃO DO TUTORIAL ================= */}
      {tutorialAtivo && (
        <div
          style={{
            background: "#fffdeb",
            border: "2px solid #e6b000",
            padding: "20px",
            borderRadius: "10px",
            maxWidth: "500px",
            margin: "0 auto 20px auto",
          }}
        >
          <h2 style={{ color: "#b38600", marginTop: 0 }}>
            🧠 Modo de Treinamento
          </h2>

          {passoTutorial === 0 && (
            <div>
              <p>
                Bem-vindo ao jogo! Antes de enfrentar o terrível Chefão, vamos
                passar por uma rápida simulação para você aprender os comandos
                básicos.
              </p>
              <button
                onClick={avancarTutorial}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Entendi, vamos lá!
              </button>
            </div>
          )}

          {passoTutorial === 1 && (
            <div>
              <h3>1. Ataque Rápido</h3>
              <p>
                É a sua ação padrão e segura. Ela causa dano de forma
                **instantânea** no inimigo, sem a necessidade de passar por
                minigames.
              </p>
              <button
                onClick={avancarTutorial}
                style={{ padding: "10px 20px", cursor: "pointer" }}
              >
                Entendi, próximo comando
              </button>
            </div>
          )}

          {passoTutorial === 2 && (
            <div>
              <h3>2. Magia Suprema (Vertical)</h3>
              <p>
                Uma habilidade devastadora de alto risco. Uma barra começará a
                subir e descer rapidamente (Velocidade: 3.5!).
              </p>
              <ul>
                <li>
                  <strong>Verde Escuro (Perfeito):</strong> 75 de Dano.
                </li>
                <li>
                  <strong>Amarelo (Bom):</strong> 35 de Dano.
                </li>
                <li>
                  <strong>Cinza (Erro):</strong> Você toma 25 de dano de
                  ricochete.
                </li>
              </ul>
              <p>
                Ela possui um <strong>cooldown de 2 turnos</strong> após ser
                usada.
              </p>

              {!simulandoMinigame && !feedbackTutorial && (
                <button
                  onClick={() => setSimulandoMinigame(true)}
                  style={{
                    padding: "10px 20px",
                    background: "purple",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Testar Magia
                </button>
              )}

              {simulandoMinigame && (
                <MinigameBarra
                  tipo="vertical"
                  onComplete={resolverMagiaTutorial}
                />
              )}

              {feedbackTutorial && (
                <div>
                  <p style={{ fontWeight: "bold" }}>{feedbackTutorial}</p>
                  <button
                    onClick={avancarTutorial}
                    style={{ padding: "10px 20px", cursor: "pointer" }}
                  >
                    Avançar para Defesa
                  </button>
                </div>
              )}
            </div>
          )}

          {passoTutorial === 3 && (
            <div>
              <h3>3. Defesa de Ataques Normais (Horizontal)</h3>
              <p>
                Quando for o turno do Chefe e ele usar um golpe básico, uma
                barra horizontal surgirá na tela.
              </p>
              <p>
                Pare a barra no centro verde para **esquivar** (0 de dano) ou
                nas bordas amarelas para **reduzir o dano pela metade**.
              </p>

              {!simulandoMinigame && !feedbackTutorial && (
                <button
                  onClick={() => setSimulandoMinigame(true)}
                  style={{
                    padding: "10px 20px",
                    background: "blue",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Testar Defesa
                </button>
              )}

              {simulandoMinigame && (
                <MinigameBarra
                  tipo="horizontal"
                  onComplete={resolverDefesaTutorial}
                />
              )}

              {feedbackTutorial && (
                <div>
                  <p style={{ fontWeight: "bold" }}>{feedbackTutorial}</p>
                  <button
                    onClick={avancarTutorial}
                    style={{ padding: "10px 20px", cursor: "pointer" }}
                  >
                    Avançar para Esquiva Forte
                  </button>
                </div>
              )}
            </div>
          )}

          {passoTutorial === 4 && (
            <div>
              <h3>4. Esquiva de Ataques Fortes (Setas do Teclado)</h3>
              <p>
                Se o Chefe carregar um ataque destruidor, surgirá uma lista de
                **10 setas aleatórias** na tela.
              </p>
              <p>
                Você tem apenas 5 segundos para digitar a sequência correta no
                teclado. Se falhar, receberá o dano massivo completo.
              </p>

              {!simulandoMinigame && !feedbackTutorial && (
                <button
                  onClick={() => setSimulandoMinigame(true)}
                  style={{
                    padding: "10px 20px",
                    background: "orange",
                    cursor: "pointer",
                  }}
                >
                  Testar Sequência de Setas
                </button>
              )}

              {simulandoMinigame && (
                <MinigameSetas onComplete={resolverSetasTutorial} />
              )}

              {feedbackTutorial && (
                <div>
                  <p style={{ fontWeight: "bold" }}>{feedbackTutorial}</p>
                  <button
                    onClick={iniciarJogoReal}
                    style={{
                      padding: "15px 30px",
                      background: "red",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    🔥 ENTRAR NO COMBATE REAL!
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ================= FIM SEÇÃO DO TUTORIAL ================= */}

      {/* JOGO REAL: RENDERIZAÇÃO DOS MINIGAMES DE COMBATE */}
      {!tutorialAtivo && modoMinigame === "magia" && (
        <MinigameBarra tipo="vertical" onComplete={resolverMagia} />
      )}
      {!tutorialAtivo && modoMinigame === "defesa" && (
        <MinigameBarra tipo="horizontal" onComplete={resolverDefesa} />
      )}
      {!tutorialAtivo && modoMinigame === "setas" && (
        <MinigameSetas onComplete={resolverSetas} />
      )}

      {/* JOGO REAL: RENDERIZAÇÃO DO PAINEL DE AÇÕES */}
      {!tutorialAtivo && !modoMinigame && !jogoFinalizado && (
        <div>
          <button
            onClick={() => realizarAtaque("Ataque Rápido", 10, 15)}
            disabled={!turnoDoJogador}
            style={{ margin: "5px", padding: "10px 20px", cursor: "pointer" }}
          >
            Ataque Rápido
          </button>

          <button
            onClick={iniciarMagia}
            disabled={!turnoDoJogador || cooldownMagia > 0}
            style={{
              margin: "5px",
              padding: "10px 20px",
              cursor:
                !turnoDoJogador || cooldownMagia > 0
                  ? "not-allowed"
                  : "pointer",
              background: cooldownMagia > 0 ? "#777" : "purple",
              color: "white",
              fontWeight: "bold",
              border: "none",
            }}
          >
            {cooldownMagia > 0
              ? `Magia (Recarregando: ${cooldownMagia})`
              : "Usar Magia Suprema"}
          </button>
        </div>
      )}

      {jogoFinalizado && (
        <button
          onClick={reiniciarBatalha}
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        >
          Reiniciar Tudo (Voltar ao Treino)
        </button>
      )}
    </div>
  );
}
