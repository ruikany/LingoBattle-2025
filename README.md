# LingoBattle-2025
## Lingo Battles
This project is a multiplayer online game called "Lingo Battles", where players compete against each other by answering language-related questions. The game is built using Node.js for the backend and Socket.io for real-time communication between the server and clients. The frontend is a simple HTML page with CSS for styling and JavaScript for handling user interactions and real-time updates.

## Key features:
- **Multiplayer Gameplay:** Players can join the game by entering a username. Each player is assigned a unique color and starts with a full health bar. The game supports multiple players (up to 6), and the layout dynamically adjusts based on the number of players.
- **Real-Time Interaction:** The game uses Socket.io to enable real-time communication between the server and clients. This allows players to see updates instantly, such as changes in health, new questions, and player eliminations.
- **Hover Indicators:** When a player hovers over a question, an indicator (a colored circle) appears on the question card, showing other players who is currently interacting with that question, allowing for ques taking over other people's questions.
- **Question Types:** So far, our game has two types of questions:
  1. Complete the Sentence: Players fill in the blanks in a sentence by selecting the correct word or phrase.
  2. Word Association: Players match words with their correct translations by selecting from a list of options.
- **Special Questions:** Some questions have special effects:
    - Double Damage: Correct answers deal double damage to other players. 
    - Heal: Correct answers heal the player by a certain amount.
- **Damage and Health:** Players deal damage to others based on the number of correct answers they provide. Incorrect answers result in self-damage. If a player's health drops to 0, they are eliminated from the game. The last player standing is declared the winner.
- **Dynamic UI:** The game board dynamically adjusts its layout based on the number of players. For example, with n players, the layout is adjusted to ensure n questions are displayed. Players can see their health bars, rankings, and avatars in real-time.
- **Elimination and Game Over:** When a player is eliminated, they are notified, and their UI is grayed out. The game continues until only one player remains.

## Inspiration
We got inspiration from Duolingo for the main idea and Skribbl.io for the design of the UI

## How It Works:
- **Server-Side:** 
  1. The server handles player connections, manages the game state (players, questions, health, etc.), and broadcasts updates to all clients.
  2. When a player joins, they are assigned a unique color and added to the players object.
  3. Questions are generated randomly from a predefined question bank, and special effects (double damage, heal) are applied based on chance.
  4. The server calculates damage, updates player health, and checks for a winner after each question is answered.
- **Client-Side:**
  1. The client interacts with the server to send and receive real-time updates.
  2. Players can answer questions by selecting options from dropdown menus and submitting their answers.
  3. The UI updates dynamically to reflect changes in the game state, such as health bars, player rankings, and new questions.

## How we built it
This program was built using basic Javascript, HTML and CSS

## Challenges we ran into
We weren't able to figure out how to effectively use the standard libraries, so we went with what we were comfortable with, which was basic web development. And merge conflicts

## Accomplishments that we're proud of
We are proud that we were able to submit a presentable project. We are also proud that we were able to convert our idea into reality, even though none of us are familiar with web development

## What we learned
We learned a lot about socket.io, a WebSockets library, and also a lot about the internals of Web development

## What's next for LingoBattles
There are so many things we could add:
- Support for more Languages
- Cleaner UI, using frameworks
- Add more types of questions
- New Bonuses on questions
- Leaderboard elo
- Draggable question boxes for more chaos
- Live chat to flame your friends


## Demo
🎥 Watch the program in action: [Demo Video](https://youtu.be/QSzz13u1Vew)
