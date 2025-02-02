const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

let players = {};
let leaderId = 0;

function createPlayer(username, color, id) {
    return {
        username,
        color,
        health: 100,
        id,
        lastDamager: null, // Track who last damaged this player
        eliminated: false, // Track if the player is eliminated
    };
}

let questions = generateQuestions();
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9999'];
const questionBank = [
    {
        type: "complete_sentence",
        question: "Elle _____ au magasin hier pour _____ des courses. Elle a aussi _____ un nouveau livre.",
        correct: ["est allée", "faire", "acheté"],
        choices: [
            ["est allée", "acheté", "acheté"],
            ["va", "faire", "acheter"],
            ["allée", "a acheté", "acheté"],
        ]
    },
    {
        type: "complete_sentence",
        question: "J' _____ faim, alors j'_____ quelque chose à manger. Ensuite, j'_____ une sieste.",
        correct: ["ai", "ai pris", "ai pris"],
        choices: [
            ["ai", "ai pris", "ai fait"],
            ["est", "ai pris", "ai dormi"],
            ["suis", "mangé", "ai pris"],
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Bonjour", "Au revoir", "Merci"],
        correct: ["Hello", "Goodbye", "Thank you"],
        choices: [
            "Hello", 
            "Goodbye", 
            "Thank you"
        ]
    },
    {
        type: "complete_sentence",
        question: "Il _____ au parc ce matin et _____ avec ses amis. Ensuite, il _____ un café.",
        correct: ["est allé", "joué", "a bu"],
        choices: [
            ["est allé", "joué", "a bu"],
            ["va", "a joué", "boit"],
            ["est allé", "jouait", "a bu"],
        ]
    },
    {
        type: "complete_sentence",
        question: "Nous _____ au cinéma ce soir. Après le film, nous _____ dîner ensemble.",
        correct: ["allons", "vont", "mangerons"],
        choices: [
            ["allons", "vont", "mangeront"],
            ["va", "allons", "dîner"],
        ]
    },
    {
        type: "complete_sentence",
        question: "Marie _____ très fatiguée aujourd'hui, donc elle _____ tôt ce soir.",
        correct: ["est", "s'est couché"],
        choices: [
            ["est", "se couche"],
            ["s'était couché", "s'est couché"],
        ]
    },
    {
        type: "complete_sentence",
        question: "J'_____ les nouvelles que tu _____ hier soir.",
        correct: ["ai entendu", "as partagé"],
        choices: [
            ["ai entendu", "as partagées"],
            ["ai entendu", "partagé"],
        ]
    },
    {
        type: "complete_sentence",
        question: "Ils _____ en vacances la semaine dernière et _____ à la plage tous les jours.",
        correct: ["étaient", "allaient"],
        choices: [
            ["étaient", "vont"],
            ["sont", "allaient"],
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Ami", "Maison", "Content"],
        correct: ["Friend", "House", "Happy"],
        choices: [
            "Friend",
            "House",
            "Happy"
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Ciel", "Terre", "Mer"],
        correct: ["Sky", "Earth", "Sea"],
        choices: [
            "Sky",
            "Earth",
            "Sea"
        ]
    },
    {
        type: "complete_sentence",
        question: "Je _____ à la maison quand tu _____ hier.",
        correct: ["étais", "es arrivé"],
        choices: [
            ["étais", "es arrivé"],
            ["étais", "arrivais"],
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Chien", "Chat", "Oiseau"],
        correct: ["Dog", "Cat", "Bird"],
        choices: [
            "Dog",
            "Cat",
            "Bird"
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Voiture", "Bateau", "Avion"],
        correct: ["Car", "Boat", "Plane"],
        choices: [
            "Car",
            "Boat",
            "Plane"
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Maison", "École", "Magasin"],
        correct: ["House", "School", "Store"],
        choices: [
            "House",
            "School",
            "Store"
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Lune", "Soleil", "Étoile"],
        correct: ["Moon", "Sun", "Star"],
        choices: [
            "Moon",
            "Sun",
            "Star"
        ]
    },
    {
        type: "word_association",
        question: "Associez les mots avec leurs traductions :",
        words: ["Plage", "Montagne", "Forêt"],
        correct: ["Beach", "Mountain", "Forest"],
        choices: [
            "Beach",
            "Mountain",
            "Forest"
        ]
    }
];


function generateQuestions(count) {
    const questions = [];
    const bonusChance = 0.2;
    const healChance = 0.1;
    
    for (let i = 0; i < count; i++) {
        const isBonus = Math.random() < bonusChance;
        const isHeal = Math.random() < healChance;
        const q = {...questionBank[Math.floor(Math.random() * questionBank.length)]};
        q.id = `${Date.now() + i}`;
        if (q.type === "word_association") {
            q.choices = shuffleArray(q.choices);
        } else {
            q.answers = q.choices.map(choice => shuffleArray(choice)); // shuffle each inner array
        }
        q.special = isHeal ? 'heal' : (isBonus ? 'double' : null);
        questions.push(q);
    }
    return questions;
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function generateAnswers(correct) {
    const answers = new Set([correct]);
    while (answers.size < 3) {
        const offset = Math.floor(Math.random() * 5) + 1;
        const wrongAnswer = correct + (Math.random() > 0.5 ? offset : -offset);
        if (wrongAnswer !== correct) {
            answers.add(wrongAnswer);
        }
    }
    return Array.from(answers).sort(() => Math.random() - 0.5);
}

app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client.html');
});

function checkForWinner() {
    const activePlayers = Object.values(players).filter(player => !player.eliminated);
    if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        io.to(winner.id).emit('winnerDeclared', { winner: winner.username });
        io.emit('gameOver', { winner: winner.username });
    }
}


io.on('connection', (socket) => {
    const colors = [
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#00FFFF', // Cyan
        '#FFA500', // Orange
        '#FFFF00', // Yellow
        '#800080', // Purple
        '#FFC0CB', // Pink
        '#32CD32'  // Lime
    ];
    socket.on('join', (username) => {
        const usedColors = Object.values(players).map(p => p.color);
        const availableColors = colors.filter(c => !usedColors.includes(c));
        const color = availableColors.length > 0 ? availableColors[0] : getRandomColor();
        players[socket.id] = createPlayer(username, color, socket.id);

        if (!leaderId) {
            leaderId = socket.id;
            players[socket.id].isLeader = true;
        }

        socket.emit('init', { players, questions, color, myId: socket.id, isLeader: players[socket.id].isLeader || false });
        io.emit('updateLobbyPlayers', players);
    });
    socket.on('startGame', () => {
        if (socket.id === leaderId) {
            questions = generateQuestions(Object.keys(players).length);
            io.emit('gameStarted', { players, questions });
        }
    });
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    socket.on('hover', ({ qid, playerId, color }) => {
        const player = players[socket.id];
        if (!player || player.eliminated) return; // Ignore eliminated players
        io.emit('playerHover', { qid, playerId, color });
    });
    
    socket.on('hoverOut', ({ qid, playerId }) => {
        const player = players[socket.id];
        if (!player || player.eliminated) return;
        io.emit('playerHoverOut', { qid, playerId });
    });

    socket.on('answer', ({ qid, answers }) => {
        const player = players[socket.id];
        if (!player || player.eliminated) return; // Prevent eliminated players from answering
    
        const question = questions.find(q => q.id === qid);
        if (!question) return;
    
        // Calculate correct and incorrect answers
        let correctCount = 0;
        let incorrectCount = 0;
        if (question.type === "word_association") {
            answers.forEach((answer, index) => {
                if (answer.toLowerCase() === question.correct[index].toLowerCase()) {
                    correctCount++;
                } else {
                    incorrectCount++;
                }
            });
        } else {
            answers.forEach((answer, index) => {
                if (answer.toLowerCase() === question.correct[index].toLowerCase()) {
                    correctCount++;
                } else {
                    incorrectCount++;
                }
            });
        }
    
        const baseDamage = 5;
        let damageToOthers = correctCount * baseDamage;
        let damageToSelf = incorrectCount * baseDamage;
        if (question.special === 'double'){
            damageToOthers = damageToOthers * 2;
            damageToSelf = damageToSelf * 2;
        }
        let healAmount = 0;
        if (question.special === 'heal') {
            healAmount = correctCount * 5; // Heal 5 points per correct answer
            player.health = Math.min(player.health + healAmount, 100);
        }
    
        // Apply damage to other players
        Object.keys(players).forEach(id => {
            if (id !== socket.id && !players[id].eliminated) {
                players[id].health = Math.max(players[id].health - damageToOthers, 0);
                players[id].lastDamager = player.username; // Update last damager
                if (players[id].health === 0) {
                    players[id].eliminated = true;
                    io.to(id).emit('playerEliminated', {
                        eliminatedPlayer: players[id].username,
                        killer: player.username,
                    });
                }
            }
        });
    
        // Apply damage to self
        player.health = Math.max(player.health - damageToSelf, 0);
        if (player.health === 0) {
            player.eliminated = true;
            socket.emit('playerEliminated', {
                eliminatedPlayer: player.username,
                killer: 'yourself!',
            });
        }
    
        const newQuestion = generateQuestions(1)[0];
        const questionIndex = questions.findIndex(q => q.id === qid);
        questions[questionIndex] = newQuestion;
    
        io.emit('questionAnswered', { 
            qid, 
            damager: player.username, 
            damageToOthers,
            damageToSelf,
            newQuestion,
            questionIndex,
            healAmount
        });
        io.emit('updatePlayers', players);
        checkForWinner();
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        if (socket.id === leaderId) {
            leaderId = Object.keys(players)[0] || null;
            if (leaderId) {
                players[leaderId].isLeader = true;
            }
        }
        io.emit('updateLobbyPlayers', players);
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));