const socket = io();

socket.on('init', ({ players: serverPlayers, questions, color, myId: id, isLeader: leader }) => {
    players = serverPlayers;
    myColor = color;
    myId = id;
    isLeader = leader;

    document.getElementById('login').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
    updateLobbyPlayers(players);

    if (isLeader) {
        document.getElementById('start-game-btn').style.display = 'block';
        document.getElementById('waiting-message').style.display = 'none';
    } else {
        document.getElementById('start-game-btn').style.display = 'none';
        document.getElementById('waiting-message').style.display = 'block';
    }
});

socket.on('updateLobbyPlayers', (players) => {
    updateLobbyPlayers(players);
});

socket.on('gameStarted', ({ players: serverPlayers, questions }) => {
    players = serverPlayers;
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('players').style.display = 'block';
    document.getElementById('board').style.display = 'grid';
    updatePlayers(players);
    updateBoard(questions);
});

socket.on('updateQuestions', questions => updateBoard(questions));
socket.on('updatePlayers', serverPlayers => {
    players = serverPlayers; // Update the global players object
    updatePlayers(players);
});
socket.on('questionAnswered', ({ qid, damager, damage, selfDamage, newQuestion, questionIndex, healed }) => {
    // Replace the question card
    const questionElement = document.querySelector(`[data-qid="${qid}"]`);
    if (questionElement && newQuestion) {
        questionElement.outerHTML = `
            <div class="question-card ${newQuestion.special ? 'special' : ''}" 
                data-qid="${newQuestion.id}"
                data-index="${questionIndex}"
                onmouseenter="hoverQuestion('${newQuestion.id}')" 
                onmouseleave="leaveQuestion('${newQuestion.id}')">
                
                <div class="hover-indicators" id="hover-${newQuestion.id}"></div>
                
                <h3>${newQuestion.type === "word_association" ? "Match the words with their translations:" : "Complete the sentence:"}</h3>
                <div class="question-content">
                    ${renderQuestionWithBlanks(newQuestion)}
                </div>
                
                <button class="submit-btn" 
                    onclick="answerQuestion('${newQuestion.id}', getAnswers('${newQuestion.id}'))">
                    Submit
                </button>
                
                ${newQuestion.special === 'double' ? `<div class="bonus-text">2x damage!!</div>` : ''}
                ${newQuestion.special === 'heal' ? `<div class="bonus-text">Heal 10%!!</div>` : ''}
            </div>
        `;
    }
    updatePlayers(players); // Add this line
});

socket.on('playerEliminated', ({ eliminatedPlayer, killer }) => {
    showEliminationMessage(eliminatedPlayer, killer);

    // Gray out the eliminated player's UI
    const playerElement = document.querySelector(`.player-row[data-playerid="${eliminatedPlayer}"]`);
    if (playerElement) {
        playerElement.style.opacity = '0.5';
        playerElement.style.pointerEvents = 'none';
    }

    // If the eliminated player is the current player, disable their ability to answer questions
    if (eliminatedPlayer === players[myId]?.username) {
        const questionCards = document.querySelectorAll('.question-card');
        questionCards.forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.1'; // Gray out
        });
    }
    const hoverIndicators = document.querySelectorAll('.hover-indicator');
    hoverIndicators.forEach(indicator => {
        if (indicator.getAttribute('data-playerid') === eliminatedPlayer) {
            indicator.remove(); // Remove the hover indicator
        }
    });
});

socket.on('updateHoverState', (hoverState) => {
    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach(card => {
        const qid = card.getAttribute('data-qid');
        const indicatorsContainer = card.querySelector('.hover-indicators') || document.createElement('div');
        indicatorsContainer.className = 'hover-indicators';
        indicatorsContainer.innerHTML = '';

        Object.entries(hoverState).forEach(([id, hoverQid]) => {
            if (hoverQid === qid) {
                const player = players[id];
                if (player) {
                    const indicator = document.createElement('div');
                    indicator.className = 'hover-indicator';
                    indicator.style.backgroundColor = player.color;
                    indicatorsContainer.appendChild(indicator);
                }
            }
        });

        if (!card.querySelector('.hover-indicators')) {
            card.appendChild(indicatorsContainer);
        }
    });
});

socket.on('playerHover', ({ qid, playerId, color }) => {
    const indicatorContainer = document.getElementById('hover-' + qid);
    if (indicatorContainer && !indicatorContainer.querySelector(`[data-playerid="${playerId}"]`)) {
        const indicator = document.createElement('div');
        indicator.className = 'hover-indicator';
        indicator.setAttribute('data-playerid', playerId);
        indicator.style.backgroundColor = color;
        indicatorContainer.appendChild(indicator);
    }
});

socket.on('playerHoverOut', ({ qid, playerId }) => {
    const indicatorContainer = document.getElementById('hover-' + qid);
    if (indicatorContainer) {
        const indicator = indicatorContainer.querySelector(`[data-playerid="${playerId}"]`);
        if (indicator) {
            indicator.remove();
        }
    }
});

socket.on('winnerDeclared', ({ winner }) => {
    alert(`Congratulations! You are the winner!`);
    updatePlayers(players); // Add this line
});

// Handle game over event
socket.on('gameOver', ({ winner }) => {
    if (winner !== players[myId]?.username) {
        alert(`Game over! ${winner} is the winner!`);
    }
    updatePlayers(players); // Add this line
    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach(card => {
        card.style.pointerEvents = 'none';
        card.style.opacity = '0.1';
    });
    const playerElements = document.querySelectorAll('.player-row');
    playerElements.forEach(playerElement => {
        playerElement.style.opacity = '0.5';
        playerElement.style.pointerEvents = 'none';
    });
    displayPlayAgainButton();
});