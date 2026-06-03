import { useState, useEffect, useRef } from "react";
import MinigameBarra from "./MinigameBarra";
import MinigameSetas from "./MinigameSetas";
import "./App.css";

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
      tocarMusica("/tutorial.mp3");
    } else {
      // Toca a música da batalha real
      tocarMusica("/combate.mp3");
    }

    // Limpeza: Se o componente fechar, desliga a música da memória
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [tutorialAtivo, jogoFinalizado]);

  const iniciarTutorialEAudio = () => {
    tocarMusica("/tutorial.mp3");
    setPassoTutorial(1);
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
    tocarMusica("/combate.mp3");
    setTutorialAtivo(false);
    setLogBatalha("O Chefão desperta na arena. É a sua vez.");
  };

  // --- ATAQUES DO JOGADOR (JOGO REAL) ---
  const realizarAtaque = (nomeAtaque, danoMin, danoMax) => {
    if (!turnoDoJogador || jogoFinalizado || tutorialAtivo) return;
    // O dano é sorteado apenas em resposta ao clique do jogador.
    // eslint-disable-next-line react-hooks/purity
    const danoGerado = Math.floor(Math.random() * (danoMax - danoMin + 1)) + danoMin;
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

    const resultadoDefesa = {
      PERFEITO: {
        multiplicador: 0,
        texto: "PERFEITO! Você esquivou completamente do ataque!",
      },
      BOM: {
        multiplicador: 0.5,
        texto: "Boa defesa! Você reduziu o dano pela metade.",
      },
      ERRO: {
        multiplicador: 1,
        texto: "Falhou! Você recebeu o dano total do ataque!",
      },
    }[resultado] ?? {
      multiplicador: 1,
      texto: "Falhou! Você recebeu o dano total do ataque!",
    };

    aplicarDanoHeroi(
      Math.floor(danoPendente * resultadoDefesa.multiplicador),
      resultadoDefesa.texto,
    );
  };

  const resolverSetas = (resultado) => {
    setModoMinigame(null);

    const resultadoEsquiva =
      resultado === "PERFEITO"
        ? {
            danoFinal: 0,
            texto: "ESQUIVA ÉPICA! Você desviou da fúria do Chefão!",
          }
        : {
            danoFinal: danoPendente,
            texto: "Não foi rápido o suficiente! Tomou o dano em cheio!",
          };

    aplicarDanoHeroi(resultadoEsquiva.danoFinal, resultadoEsquiva.texto);
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

  const hpHeroiPercentual = Math.max(0, (hpHeroi / maxHpHeroi) * 100);
  const hpChefePercentual = Math.max(0, (hpChefe / maxHpChefe) * 100);

  return (
    <main className={`rpg-shell ${tutorialAtivo ? "is-training" : "is-battle"}`}>
      <section className="hero-banner">
        <p className="eyebrow">RPG de turno</p>
        <h1>Crônicas do Chefão</h1>
        <p className="subtitle">
          Treine seus comandos, domine os minigames e sobreviva ao combate final.
        </p>
      </section>

      <section className={`battle-arena ${tutorialAtivo ? "muted" : ""}`}>
        <article className="fighter-card hero-card">
          <div className="fighter-sprite hero-sprite" aria-hidden="true">🛡️</div>
          <div className="fighter-info">
            <span className="fighter-label">Herói</span>
            <h2>Você</h2>
            <div className="hp-row">
              <span>HP</span>
              <strong>{hpHeroi} / {maxHpHeroi}</strong>
            </div>
            <div className="hp-bar">
              <div className="hp-fill hero-hp" style={{ width: `${hpHeroiPercentual}%` }} />
            </div>
          </div>
        </article>

        <div className="versus-mark">VS</div>

        <article className="fighter-card boss-card">
          <div className="fighter-sprite boss-sprite" aria-hidden="true">🐉</div>
          <div className="fighter-info">
            <span className="fighter-label">Inimigo</span>
            <h2>Chefão</h2>
            <div className="hp-row">
              <span>HP</span>
              <strong>{hpChefe} / {maxHpChefe}</strong>
            </div>
            <div className="hp-bar">
              <div className="hp-fill boss-hp" style={{ width: `${hpChefePercentual}%` }} />
            </div>
          </div>
        </article>
      </section>

      {!tutorialAtivo && (
        <section className="combat-log" aria-live="polite">
          <span className="log-label">Narração</span>
          <strong>{logBatalha}</strong>
        </section>
      )}

      {tutorialAtivo && (
        <section className="tutorial-panel">
          <span className="panel-glow" aria-hidden="true" />
          <p className="eyebrow">Modo de treinamento</p>
          <h2>Antes da arena, aprenda os comandos</h2>

          {passoTutorial === 0 && (
            <div className="tutorial-step">
              <p>
                Bem-vindo ao jogo. Antes de enfrentar o Chefão, você passará por uma simulação rápida para aprender ataques, magia, defesa e esquiva.
              </p>
              <button className="rpg-button primary" onClick={iniciarTutorialEAudio}>
                ▶ Iniciar tutorial
              </button>
            </div>
          )}

          {passoTutorial === 1 && (
            <div className="tutorial-step">
              <h3>1. Ataque Rápido</h3>
              <p>
                Sua ação padrão e segura. Causa dano instantâneo no inimigo sem minigame.
              </p>
              <button className="rpg-button" onClick={avancarTutorial}>
                Próximo comando
              </button>
            </div>
          )}

          {passoTutorial === 2 && (
            <div className="tutorial-step">
              <h3>2. Magia Suprema</h3>
              <p>
                Habilidade devastadora de alto risco. Pare a barra na zona certa para liberar o dano.
              </p>
              <div className="rules-grid">
                <span><strong>Verde:</strong> 75 de dano</span>
                <span><strong>Amarelo:</strong> 35 de dano</span>
                <span><strong>Erro:</strong> 25 de ricochete</span>
              </div>

              {!simulandoMinigame && !feedbackTutorial && (
                <button className="rpg-button magic" onClick={() => setSimulandoMinigame(true)}>
                  ✦ Testar magia
                </button>
              )}

              {simulandoMinigame && <MinigameBarra tipo="vertical" onComplete={resolverMagiaTutorial} />}

              {feedbackTutorial && (
                <div className="feedback-box">
                  <p>{feedbackTutorial}</p>
                  <button className="rpg-button" onClick={avancarTutorial}>Avançar para defesa</button>
                </div>
              )}
            </div>
          )}

          {passoTutorial === 3 && (
            <div className="tutorial-step">
              <h3>3. Defesa</h3>
              <p>
                Quando o chefe atacar, pare a barra horizontal no centro verde para esquivar ou no amarelo para reduzir o dano.
              </p>

              {!simulandoMinigame && !feedbackTutorial && (
                <button className="rpg-button guard" onClick={() => setSimulandoMinigame(true)}>
                  ◆ Testar defesa
                </button>
              )}

              {simulandoMinigame && <MinigameBarra tipo="horizontal" onComplete={resolverDefesaTutorial} />}

              {feedbackTutorial && (
                <div className="feedback-box">
                  <p>{feedbackTutorial}</p>
                  <button className="rpg-button" onClick={avancarTutorial}>Avançar para esquiva</button>
                </div>
              )}
            </div>
          )}

          {passoTutorial === 4 && (
            <div className="tutorial-step">
              <h3>4. Esquiva forte</h3>
              <p>
                Digite a sequência de setas em até 5 segundos para escapar dos ataques mais perigosos.
              </p>

              {!simulandoMinigame && !feedbackTutorial && (
                <button className="rpg-button warning" onClick={() => setSimulandoMinigame(true)}>
                  ⚡ Testar sequência
                </button>
              )}

              {simulandoMinigame && <MinigameSetas onComplete={resolverSetasTutorial} />}

              {feedbackTutorial && (
                <div className="feedback-box">
                  <p>{feedbackTutorial}</p>
                  <button className="rpg-button danger" onClick={iniciarJogoReal}>
                    🔥 Entrar no combate real
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!tutorialAtivo && modoMinigame === "magia" && (
        <section className="minigame-stage">
          <MinigameBarra tipo="vertical" onComplete={resolverMagia} />
        </section>
      )}
      {!tutorialAtivo && modoMinigame === "defesa" && (
        <section className="minigame-stage">
          <MinigameBarra tipo="horizontal" onComplete={resolverDefesa} />
        </section>
      )}
      {!tutorialAtivo && modoMinigame === "setas" && (
        <section className="minigame-stage">
          <MinigameSetas onComplete={resolverSetas} />
        </section>
      )}

      {!tutorialAtivo && !modoMinigame && !jogoFinalizado && (
        <section className="action-panel">
          <button
            className="rpg-button primary"
            onClick={() => realizarAtaque("Ataque Rápido", 10, 15)}
            disabled={!turnoDoJogador}
          >
            ⚔️ Ataque rápido
          </button>

          <button
            className="rpg-button magic"
            onClick={iniciarMagia}
            disabled={!turnoDoJogador || cooldownMagia > 0}
          >
            {cooldownMagia > 0 ? `Magia recarregando: ${cooldownMagia}` : "✦ Magia suprema"}
          </button>
        </section>
      )}

      {jogoFinalizado && (
        <button className="rpg-button primary restart-button" onClick={reiniciarBatalha}>
          Reiniciar aventura
        </button>
      )}
    </main>
  );
}
