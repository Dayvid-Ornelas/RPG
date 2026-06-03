# Crônicas do Chefão — RPG de Turno

Protótipo de um RPG de turno feito com **React + Vite**. O jogador passa por um tutorial interativo, aprende os comandos principais e depois enfrenta um chefão em uma batalha com ataques, magia, defesa, esquiva, música e efeitos sonoros.

## Objetivo do projeto

Este projeto foi criado como atividade acadêmica, mas foi organizado para também funcionar como peça de portfólio. A ideia é demonstrar lógica de jogo, controle de estado em React, minigames simples, feedback visual/sonoro e uma interface temática.

## Funcionalidades

- Tutorial guiado antes da batalha real.
- Batalha por turnos entre herói e chefão.
- Ataque rápido com dano aleatório.
- Magia Suprema com minigame de precisão.
- Defesa com barra de tempo.
- Esquiva de ataque forte com sequência de setas.
- Barras de vida para herói e chefe.
- Música de fundo no tutorial e no combate.
- Efeitos sonoros gerados no navegador para ataques, magia, dano, defesa, vitória e derrota.
- Tela final diferente para vitória ou derrota.
- Layout responsivo com visual dark/fantasy.

## Como jogar

1. Clique em **Iniciar tutorial**.
2. Siga os passos para entender ataque, magia, defesa e esquiva.
3. Clique em **Entrar no combate real**.
4. Na batalha:
   - Use **Ataque rápido** para causar dano seguro.
   - Use **Magia Suprema** para tentar causar dano alto.
   - Quando o chefe atacar, complete o minigame de defesa ou esquiva.
5. Vença reduzindo o HP do chefão a zero antes que seu HP acabe.

## Lógica principal

O jogo é controlado principalmente pelo componente `App.jsx`, que mantém os estados centrais da partida:

- `hpHeroi`: vida atual do jogador.
- `hpChefe`: vida atual do chefe.
- `turnoDoJogador`: define se o jogador pode agir.
- `tutorialAtivo`: separa o modo tutorial da batalha real.
- `modoMinigame`: define qual minigame está ativo no momento.
- `jogoFinalizado`: controla a tela final de vitória ou derrota.
- `cooldownMagia`: limita o uso repetido da magia.

O fluxo geral é:

```text
Tutorial → Combate real → Turno do jogador → Turno do chefe → Vitória ou derrota
```

Durante o turno do jogador, ele pode usar ataque rápido ou magia. Depois disso, o turno passa para o chefe. O chefe sorteia entre um ataque normal, que usa o minigame de defesa, ou um ataque forte, que usa o minigame de setas.

## Estrutura dos arquivos

```text
src/
├── App.jsx             # Componente principal, estados do jogo, música, efeitos e fluxo da batalha
├── App.css             # Visual RPG: arena, cards, barras de HP, botões, tela final
├── MinigameBarra.jsx   # Minigame de precisão usado em magia e defesa
├── MinigameSetas.jsx   # Minigame de sequência de setas usado na esquiva
├── index.css           # Reset/base global de estilos
└── main.jsx            # Entrada da aplicação React

public/
├── tutorial.mp3        # Música de fundo do tutorial
└── combate.mp3         # Música de fundo da batalha
```

## Áudio

As músicas ficam na pasta `public/` e são iniciadas após interação do usuário, porque navegadores modernos bloqueiam autoplay.

Os efeitos sonoros curtos são criados com a **Web Audio API**, sem arquivos externos. Isso mantém o projeto leve e evita depender de novos assets para sons simples de espada, magia, explosão, dano, vitória e derrota.

## Tecnologias

- React
- Vite
- JavaScript
- CSS
- Web Audio API

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Rode o projeto em modo desenvolvimento:

```bash
npm run dev
```

Gere a build de produção:

```bash
npm run build
```

Verifique o código com lint:

```bash
npm run lint
```

## Status

Protótipo funcional e apresentável, com foco em demonstrar lógica de jogo, interação e polimento visual/sonoro.
