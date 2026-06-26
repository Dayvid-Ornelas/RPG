// src/App.jsx
/**
 * File: src/App.jsx
 *
 * Overview:
 *   Main React component for the turn-based RPG prototype.
 *   Coordinates tutorial flow, combat state, background music, sound effects and the final result screen.
 *
 * Imports:
 *   - React hooks — state, effects and audio refs
 *   - MinigameBarra — timing minigame for magic and blocking
 *   - MinigameSetas — keyboard sequence minigame for strong attacks
 *   - App.css — RPG interface styling
 *
 * Notes:
 *   - Background songs live in /public and are started only after user interaction.
 *   - Short combat sound effects are generated with Web Audio so no extra files are required.
 */
import { useState, useEffect, useRef, useCallback } from "react";
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
  const efeitosAudioRef = useRef(null);
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
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

  // --- ESTADOS DO BACKEND / CRUD DE PERSONAGENS ---
  const [personagens, setPersonagens] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [personagemEditandoId, setPersonagemEditandoId] = useState(null);
  const [statusBackend, setStatusBackend] = useState("Conectando ao backend...");
  const [formPersonagem, setFormPersonagem] = useState({
    nome: "",
    classe: "Guerreiro",
    nivel: 1,
    vida: 100,
    armaId: "",
    armaduraId: "",
  });

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

  /**
   * Returns a reusable AudioContext after the player has interacted with the page.
   * Browsers require this interaction before any sound can play.
   */
  const obterContextoAudio = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!efeitosAudioRef.current) {
      efeitosAudioRef.current = new AudioContext();
    }

    if (efeitosAudioRef.current.state === "suspended") {
      efeitosAudioRef.current.resume().catch(() => {});
    }

    return efeitosAudioRef.current;
  };

  /**
   * Plays compact combat feedback sounds using Web Audio oscillators.
   * This keeps the project self-contained while giving attacks, magic and results more impact.
   */
  const tocarEfeito = (tipo) => {
    const contexto = obterContextoAudio();
    if (!contexto) return;

    const agora = contexto.currentTime;
    const ganho = contexto.createGain();
    ganho.connect(contexto.destination);
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.exponentialRampToValueAtTime(0.22, agora + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.45);

    const oscilador = contexto.createOscillator();
    oscilador.connect(ganho);

    const presets = {
      espada: { type: "sawtooth", start: 520, end: 130, duration: 0.18 },
      magia: { type: "triangle", start: 220, end: 880, duration: 0.45 },
      explosao: { type: "square", start: 90, end: 45, duration: 0.42 },
      defesa: { type: "triangle", start: 360, end: 260, duration: 0.2 },
      dano: { type: "sawtooth", start: 150, end: 70, duration: 0.3 },
      vitoria: { type: "triangle", start: 440, end: 880, duration: 0.7 },
      derrota: { type: "sine", start: 180, end: 55, duration: 0.8 },
    };

    const preset = presets[tipo] ?? presets.espada;
    oscilador.type = preset.type;
    oscilador.frequency.setValueAtTime(preset.start, agora);
    oscilador.frequency.exponentialRampToValueAtTime(preset.end, agora + preset.duration);
    oscilador.start(agora);
    oscilador.stop(agora + preset.duration);
  };

  const carregarDadosBackend = useCallback(async () => {
    try {
      const [personagensResposta, equipamentosResposta] = await Promise.all([
        fetch(`${apiUrl}/personagens`),
        fetch(`${apiUrl}/equipamentos`),
      ]);

      if (!personagensResposta.ok || !equipamentosResposta.ok) {
        throw new Error("Falha ao carregar dados do backend.");
      }

      setPersonagens(await personagensResposta.json());
      setEquipamentos(await equipamentosResposta.json());
      setStatusBackend("Backend conectado. Dados salvos em SQLite.");
    } catch (error) {
      setStatusBackend(
        "Backend offline. Rode npm run backend em outro terminal para usar o CRUD.",
      );
      console.error(error);
    }
  }, [apiUrl]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarDadosBackend();
  }, [carregarDadosBackend]);

  const atualizarCampoPersonagem = (campo, valor) => {
    setFormPersonagem((dadosAtuais) => ({ ...dadosAtuais, [campo]: valor }));
  };

  const limparFormularioPersonagem = () => {
    setPersonagemEditandoId(null);
    setFormPersonagem({
      nome: "",
      classe: "Guerreiro",
      nivel: 1,
      vida: 100,
      armaId: "",
      armaduraId: "",
    });
  };

  const salvarPersonagem = async (event) => {
    event.preventDefault();

    const payload = {
      ...formPersonagem,
      nivel: Number(formPersonagem.nivel),
      vida: Number(formPersonagem.vida),
      armaId: formPersonagem.armaId ? Number(formPersonagem.armaId) : null,
      armaduraId: formPersonagem.armaduraId ? Number(formPersonagem.armaduraId) : null,
    };

    try {
      const resposta = await fetch(
        personagemEditandoId
          ? `${apiUrl}/personagens/${personagemEditandoId}`
          : `${apiUrl}/personagens`,
        {
          method: personagemEditandoId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Erro ao salvar personagem.");

      setStatusBackend(
        personagemEditandoId
          ? "Personagem atualizado no banco de dados."
          : "Personagem cadastrado no banco de dados.",
      );
      limparFormularioPersonagem();
      carregarDadosBackend();
    } catch (error) {
      setStatusBackend(error.message);
    }
  };

  const editarPersonagem = (personagem) => {
    setPersonagemEditandoId(personagem.id);
    setFormPersonagem({
      nome: personagem.nome,
      classe: personagem.classe,
      nivel: personagem.nivel,
      vida: personagem.vida,
      armaId: personagem.arma?.id ? String(personagem.arma.id) : "",
      armaduraId: personagem.armadura?.id ? String(personagem.armadura.id) : "",
    });
  };

  const excluirPersonagem = async (id) => {
    try {
      const resposta = await fetch(`${apiUrl}/personagens/${id}`, { method: "DELETE" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro ?? "Erro ao excluir personagem.");

      setStatusBackend("Personagem excluído do banco de dados.");
      limparFormularioPersonagem();
      carregarDadosBackend();
    } catch (error) {
      setStatusBackend(error.message);
    }
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
    obterContextoAudio();
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
    tocarEfeito("magia");
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
    tocarEfeito("espada");
    aplicarDanoChefe(
      danoGerado,
      `Você usou ${nomeAtaque} e causou ${danoGerado} de dano!`,
    );
  };

  const iniciarMagia = () => {
    if (!turnoDoJogador || jogoFinalizado || cooldownMagia > 0 || tutorialAtivo)
      return;
    tocarEfeito("magia");
    setModoMinigame("magia");
    setLogBatalha("💥 CANALIZANDO MAGIA SUPREMA! Pare a barra na área verde!");
  };

  const resolverMagia = (resultado) => {
    setModoMinigame(null);
    setCooldownMagia(2);

    if (resultado === "PERFEITO") {
      tocarEfeito("explosao");
      aplicarDanoChefe(
        75,
        "💥 !!!MAGIA PERFEITA!!! Você obliterou o Chefão com 75 de dano!",
      );
    } else if (resultado === "BOM") {
      tocarEfeito("magia");
      aplicarDanoChefe(
        35,
        "⚡ Magia canalizada com sucesso! O impacto causou 35 de dano.",
      );
    } else {
      tocarEfeito("dano");
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
      tocarEfeito("vitoria");
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

    tocarEfeito(resultadoDefesa.multiplicador === 0 ? "defesa" : "dano");
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

    tocarEfeito(resultadoEsquiva.danoFinal === 0 ? "defesa" : "dano");
    aplicarDanoHeroi(resultadoEsquiva.danoFinal, resultadoEsquiva.texto);
  };

  const aplicarDanoHeroi = (danoFinal, textoResultado) => {
    const novoHpHeroi = Math.max(0, hpHeroi - danoFinal);
    setHpHeroi(novoHpHeroi);
    setLogBatalha(`${textoResultado} (-${danoFinal} HP)`);

    if (novoHpHeroi === 0) {
      tocarEfeito("derrota");
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
    setFeedbackTutorial("");
    tocarMusica("/tutorial.mp3");
  };

  const hpHeroiPercentual = Math.max(0, (hpHeroi / maxHpHeroi) * 100);
  const hpChefePercentual = Math.max(0, (hpChefe / maxHpChefe) * 100);
  const jogadorVenceu = jogoFinalizado && hpChefe === 0;
  const tituloFinal = jogadorVenceu ? "Vitória lendária" : "Derrota na arena";
  const textoFinal = jogadorVenceu
    ? "O Chefão caiu. A guilda canta seu nome e a aventura entra para as crônicas."
    : "O Chefão resistiu ao combate. Reúna forças, treine os reflexos e tente novamente.";

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

      <section className="backend-panel">
        <div className="backend-header">
          <div>
            <p className="eyebrow">Backend + banco de dados</p>
            <h2>Forja de personagens</h2>
          </div>
          <span className="backend-status">{statusBackend}</span>
        </div>

        <form className="character-form" onSubmit={salvarPersonagem}>
          <label>
            Nome
            <input
              value={formPersonagem.nome}
              onChange={(event) => atualizarCampoPersonagem("nome", event.target.value)}
              placeholder="Ex.: Arion, o Bravo"
              required
            />
          </label>

          <label>
            Classe
            <select
              value={formPersonagem.classe}
              onChange={(event) => atualizarCampoPersonagem("classe", event.target.value)}
            >
              <option>Guerreiro</option>
              <option>Mago</option>
              <option>Arqueiro</option>
              <option>Paladino</option>
              <option>Ladino</option>
            </select>
          </label>

          <label>
            Nível
            <input
              type="number"
              min="1"
              max="99"
              value={formPersonagem.nivel}
              onChange={(event) => atualizarCampoPersonagem("nivel", event.target.value)}
            />
          </label>

          <label>
            Vida
            <input
              type="number"
              min="1"
              max="999"
              value={formPersonagem.vida}
              onChange={(event) => atualizarCampoPersonagem("vida", event.target.value)}
            />
          </label>

          <label>
            Arma
            <select
              value={formPersonagem.armaId}
              onChange={(event) => atualizarCampoPersonagem("armaId", event.target.value)}
            >
              <option value="">Sem arma</option>
              {equipamentos
                .filter((equipamento) => equipamento.tipo === "arma")
                .map((equipamento) => (
                  <option key={equipamento.id} value={equipamento.id}>
                    {equipamento.nome} (+{equipamento.bonusAtaque} ATQ)
                  </option>
                ))}
            </select>
          </label>

          <label>
            Armadura
            <select
              value={formPersonagem.armaduraId}
              onChange={(event) => atualizarCampoPersonagem("armaduraId", event.target.value)}
            >
              <option value="">Sem armadura</option>
              {equipamentos
                .filter((equipamento) => equipamento.tipo === "armadura")
                .map((equipamento) => (
                  <option key={equipamento.id} value={equipamento.id}>
                    {equipamento.nome} (+{equipamento.bonusDefesa} DEF)
                  </option>
                ))}
            </select>
          </label>

          <div className="form-actions">
            <button className="rpg-button primary" type="submit">
              {personagemEditandoId ? "Salvar edição" : "Cadastrar personagem"}
            </button>
            {personagemEditandoId && (
              <button className="rpg-button" type="button" onClick={limparFormularioPersonagem}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        <div className="characters-list">
          {personagens.length === 0 ? (
            <p className="empty-list">Nenhum personagem cadastrado ainda.</p>
          ) : (
            personagens.map((personagem) => (
              <article className="saved-character" key={personagem.id}>
                <div>
                  <strong>{personagem.nome}</strong>
                  <span>
                    {personagem.classe} • nível {personagem.nivel} • {personagem.vida} HP
                  </span>
                  <small>
                    {personagem.arma?.nome ?? "Sem arma"} / {personagem.armadura?.nome ?? "Sem armadura"}
                  </small>
                </div>
                <div className="character-actions">
                  <button className="rpg-button small" onClick={() => editarPersonagem(personagem)}>
                    Editar
                  </button>
                  <button className="rpg-button small danger" onClick={() => excluirPersonagem(personagem.id)}>
                    Excluir
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

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
        <section className={`final-screen ${jogadorVenceu ? "victory" : "defeat"}`}>
          <div className="final-emblem" aria-hidden="true">
            {jogadorVenceu ? "🏆" : "☠️"}
          </div>
          <p className="eyebrow">Fim da batalha</p>
          <h2>{tituloFinal}</h2>
          <p>{textoFinal}</p>
          <button className="rpg-button primary restart-button" onClick={reiniciarBatalha}>
            Reiniciar aventura
          </button>
        </section>
      )}
    </main>
  );
}
