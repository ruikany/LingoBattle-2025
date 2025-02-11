let myColor;
let myId;
let players = {};
let isLeader = 0;

function joinGame() {
  const username = document.getElementById("username").value;
  if (username) socket.emit("join", username);
}

function startGame() {
  socket.emit("startGame");
}

function updateLobbyPlayers(players) {
  const lobbyPlayers = document.getElementById("lobby-players");
  lobbyPlayers.innerHTML = Object.values(players)
    .map(
      (player) => `
        <div class="player-row">
            <div class="avatar" style="background: ${player.color};"></div>
            <div class="username">${player.username} ${player.id === myId ? "(you)" : ""}</div>
        </div>
    `,
    )
    .join("");
}

function updatePlayers(players) {
  const playerCount = Object.keys(players).length;
  updateGridLayout(playerCount);
  const container = document.getElementById("players");
  const currentPlayer = players[myId];

  // Generate player list HTML
  container.innerHTML = `
        <div class="player-row ${currentPlayer.eliminated ? "eliminated" : ""} ${currentPlayer.id === myId ? "current-player" : ""}" data-playerid="${currentPlayer.username}">
            <div class="standing">${getStanding(players, currentPlayer)}</div>
            <div class="player-info">
                <div class="username">${currentPlayer.username} ${currentPlayer.id === myId ? "(you)" : ""}</div>
                <div class="health-bar">
                    <div class="health-fill" style="width: ${currentPlayer.health}%"></div>
                </div>
            </div>
            <div class="avatar" style="background: ${currentPlayer.color};"></div>
        </div>
        ${Object.values(players)
          .filter((p) => p.id !== myId)
          .map(
            (player) => `
                <div class="player-row ${player.eliminated ? "eliminated" : ""}" data-playerid="${player.username}">
                    <div class="standing">${getStanding(players, player)}</div>
                    <div class="player-info">
                        <div class="username">${player.username}</div>
                        <div class="health-bar">
                            <div class="health-fill" style="width: ${player.health}%"></div>
                        </div>
                    </div>
                    <div class="avatar" style="background: ${player.color};"></div>
                </div>
            `,
          )
          .join("")}
    `;
}
function getStanding(players, player) {
  // Get unique health values in descending order
  const uniqueHealths = [
    ...new Set(Object.values(players).map((p) => p.health)),
  ].sort((a, b) => b - a);
  // Find the index of the player's health (+1 for 1-based standing)
  return uniqueHealths.indexOf(player.health) + 1;
}

function showEliminationMessage(eliminatedPlayer, killer) {
  const message = `You were eliminated by ${killer}!`;
  alert(message);
}

function renderQuestionWithBlanks(q) {
  if (q.type === "word_association") {
    // Handle word_association questions
    let html = `<div class="word-association">`;
    html += `<div class="words">`;
    q.words.forEach((word, index) => {
      html += `<div class="word">${word}</div>`;
    });
    html += `</div>`;
    html += `<div class="translations">`;
    q.words.forEach((_, index) => {
      html += `
                <select class="answer-select" id="select-${q.id}-${index}">
                    ${q.choices
                      .map(
                        (choice) => `
                        <option value="${choice}">${choice}</option>
                    `,
                      )
                      .join("")}
                </select>
            `;
    });
    html += `</div>`;
    html += `</div>`;
    return html;
  } else {
    // Handle complete_sentence questions
    const parts = q.question.split("_____");
    let html = "";
    parts.forEach((part, index) => {
      html += part;
      if (index < q.answers.length) {
        html += `
                    <select class="answer-select" id="select-${q.id}-${index}">
                        ${q.choices[index]
                          .map(
                            (choice) => `
                            <option value="${choice}">${choice}</option>
                        `,
                          )
                          .join("")}
                    </select>
                `;
      }
    });
    return html;
  }
}
function getAnswers(qid) {
  const selects = document.querySelectorAll(`[id^="select-${qid}-"]`);
  const answers = [];
  selects.forEach((select) => {
    answers.push(select.value);
  });
  return answers;
}
function answerQuestion(qid, answers) {
  const questionElement = document.querySelector(`[data-qid="${qid}"]`);
  if (questionElement) {
    socket.emit("answer", { qid, answers });
  } else {
    alert("This question is no longer available.");
  }
}
function updateBoard(questions) {
  const board = document.getElementById("board");
  board.innerHTML = questions
    .map(
      (q, index) => `
        <div class="question-card ${q.special ? "special" : ""}" 
            data-qid="${q.id}" 
            data-index="${index}"
            onmouseenter="hoverQuestion('${q.id}')" 
            onmouseleave="leaveQuestion('${q.id}')">
            
            <div class="hover-indicators" id="hover-${q.id}"></div>
            
            <h3>${q.type === "word_association" ? "Match the words with their translations:" : "Complete the sentence:"}</h3>
            <div class="question-content">
                ${renderQuestionWithBlanks(q)}
            </div>
            
            <button class="submit-btn" 
                onclick="answerQuestion('${q.id}', getAnswers('${q.id}'))">
                Submit
            </button>
            
            ${q.special === "double" ? `<div class="bonus-text">2x damage!!</div>` : ""}
            ${q.special === "heal" ? `<div class="bonus-text">Heal 10%!!</div>` : ""}
        </div>
    `,
    )
    .join("");
}

function updateGridLayout(playerCount) {
  const board = document.getElementById("board");
  board.setAttribute("data-players", playerCount);

  // Special handling for 3 and 5 players
  if (playerCount === 3 || playerCount === 5) {
    const questions = board.querySelectorAll(".question-card");
    questions.forEach((question, index) => {
      if (playerCount === 3 && index === 2) {
        question.style.gridColumn = "2 / 3";
        question.style.gridRow = "1 / 3";
        question.style.height = "100%";
      } else if (playerCount === 5 && index === 4) {
        question.style.gridColumn = "3 / 4";
        question.style.gridRow = "1 / 3";
        question.style.height = "100%";
      } else {
        question.style.gridColumn = "";
        question.style.gridRow = "";
        question.style.height = "";
      }
    });
  }
}
function answerQuestion(qid, answers) {
  socket.emit("answer", { qid, answers });
}
function hoverQuestion(qid) {
  socket.emit("hover", { qid: qid, playerId: myId, color: myColor });
}

function leaveQuestion(qid) {
  socket.emit("hoverOut", { qid: qid, playerId: myId });
}

function displayPlayAgainButton() {
  const button = document.createElement("button");
  button.textContent = "Play Again";
  button.onclick = () => {
    // leader starts the game,
    // this button only shown to leader
    // -> delete past players and send everybody to lobby page
  };
  document.body.appendChild(button);
}
