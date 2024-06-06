const socket = io('http://localhost:3000');
let room = '';
let pseudo = '';

socket.on('connect', () => {
    console.log('Connected');
    if (room && pseudo) {
        socket.emit('join', room, pseudo);
    }
});

socket.on('rps_result', ({ result, scores }) => {
    console.log(result);
    document.querySelector('#game-result').innerText = result;
    document.querySelector('#waiting-message').innerText = ''; // Clear waiting message
    updateScoreBoard(scores);
});

socket.on('start_game', (pseudos) => {
    console.log('Game started! Both players are ready.');
    document.querySelector('#game').style.display = 'block';
    document.querySelector('#join-room').style.display = 'none';
    document.querySelector('#game-result').innerText = 'Game started! Make your choice.';
    document.querySelector('#waiting-message').innerText = ''; // Clear waiting message
    document.querySelector('#replay').style.display = 'none';
    updatePlayerNames(pseudos);
    updateScoreBoard({ [pseudos[Object.keys(pseudos)[0]]]: 0, [pseudos[Object.keys(pseudos)[1]]]: 0 });
});

socket.on('next_round', () => {
    document.querySelector('#waiting-message').innerText = ''; // Clear waiting message
});

socket.on('game_end', (result) => {
    console.log(result);
    document.querySelector('#game-result').innerText = result;
    document.querySelector('#waiting-message').innerText = ''; // Clear waiting message
    document.querySelector('#replay').style.display = 'block';
});

socket.on('waiting', (message) => {
    console.log(message);
    document.querySelector('#waiting-message').innerText = message;
});

socket.on('disconnect', () => {
    console.log('Disconnected');
    resetUI();
});

socket.on('user disconnected', (socketId) => {
    console.log('User disconnected:', socketId);
    resetUI();
});

socket.on('stop_game', (message) => {
    console.log(message);
    document.querySelector('#game-result').innerText = message;
    resetUI();
});

function joinRoom() {
    room = document.querySelector('#room').value;
    pseudo = document.querySelector('#pseudo').value;
    if (room && pseudo) {
        socket.emit('join', room, pseudo);
        document.querySelector('#joinButton').style.display = 'none';
        document.querySelector('#leaveButton').style.display = 'block';
    } else {
        alert('Please enter a room and a pseudo');
    }
}

function leaveRoom() {
    socket.emit('leave', room);
    resetUI();
}

function choose(choice) {
    socket.emit('rps_choice', room, choice);
    document.querySelector('#waiting-message').innerText = 'En attente du choix de l\'autre joueur';
}

function replay() {
    socket.emit('reset_game', room);
}

function resetUI() {
    document.querySelector('#joinButton').style.display = 'block';
    document.querySelector('#leaveButton').style.display = 'none';
    document.querySelector('#join-room').style.display = 'block';
    document.querySelector('#game').style.display = 'none';
    document.querySelector('#waiting-message').innerText = '';
    document.querySelector('#score-board').innerHTML = '';
    document.querySelector('#game-result').innerText = '';
    document.querySelector('#player1-name').innerText = 'Player 1';
    document.querySelector('#player1-score').innerText = '0';
    document.querySelector('#player2-name').innerText = 'Player 2';
    document.querySelector('#player2-score').innerText = '0';
    room = '';
    pseudo = '';
}

function updatePlayerNames(pseudos) {
    const playerIds = Object.keys(pseudos);
    document.querySelector('#player1-name').innerText = pseudos[playerIds[0]];
    document.querySelector('#player2-name').innerText = pseudos[playerIds[1]];
}

const updateScoreBoard = (scores) => {
    const player1Name = document.querySelector('#player1-name').innerText;
    const player2Name = document.querySelector('#player2-name').innerText;
    document.querySelector('#player1-score').innerText = scores[player1Name] || 0;
    document.querySelector('#player2-score').innerText = scores[player2Name] || 0;
};
