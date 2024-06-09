const socket = io('https://gamereeltimecourse.onrender.com');
let room = '';
let pseudo = '';
let roundsToWin = 3;
let fireworksInterval;
let rainInterval;
let rainAnimationFrame;

socket.on('connect', () => {
    console.log('Connected');
    if (room && pseudo) {
        socket.emit('join', room, pseudo);
    }
});

socket.on('error_message', (message) => {
    alert(message);
    // Reset room and pseudo if an error occurs to prevent joining the room
    room = '';
    pseudo = '';
});

socket.on('room_deleted', (message) => {
    console.log(message);
    if (room) {
        resetUI();
        alert(message); // Inform the user that the room has been deleted
    }
});

socket.on('room_left', () => {
    resetUI();
});

socket.on('room_list', (rooms) => {
    const roomListContainer = document.querySelector('#room-list-container');
    roomListContainer.innerHTML = '';
    rooms.forEach((roomInfo) => {
        const roomElement = document.createElement('div');
        roomElement.classList.add('room-item');
        roomElement.innerHTML = `
            <p>Room: ${roomInfo.room}</p>
            <p>Rounds to Win: ${roomInfo.rounds}</p>
            <button onclick="joinExistingRoom('${roomInfo.room}')">Rejoindre</button>
            <button onclick="deleteRoom('${roomInfo.room}')">Supprimer</button>
        `;
        roomListContainer.appendChild(roomElement);
    });
});

function toggleRoomList() {
    const roomListContainer = document.querySelector('#room-list');
    const showRoomsButton = document.querySelector('#show-rooms-button');
    if (roomListContainer.style.display === 'none' || roomListContainer.style.display === '') {
        roomListContainer.style.display = 'block';
        showRoomsButton.innerText = 'Hide Available Rooms';
        socket.emit('get_rooms'); // Fetch the room list when showing the list
    } else {
        roomListContainer.style.display = 'none';
        showRoomsButton.innerText = 'Show Available Rooms';
    }
}

socket.on('rps_result', ({ result, scores }) => {
    console.log(result);
    document.querySelector('#game-result').innerText = result;
    document.querySelector('#waiting-message').innerText = ''; // Clear waiting message
    updateScoreBoard(scores);
});

socket.on('start_game', (pseudos) => {
    console.log('Game started! Both players are ready.');
    stopFireworks();
    stopRain();
    document.querySelector('#game').style.display = 'block';
    document.querySelector('#join-room').style.display = 'none';
    document.querySelector('#room-info').style.display = 'none';
    document.querySelector('#game-result').innerText = 'Game started! Make your choice.';
    document.querySelector('#waiting-message').innerText = ''; // Clear waiting message
    document.querySelector('#replay').style.display = 'none';
    document.querySelector('#final-score-container').style.display = 'none';
    document.querySelector('#leaveRoomButton').style.display = 'none';
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
    document.querySelector('#leaveRoomButton').style.display = 'block';
    if (result === 'Gagné') {
        launchFireworks();
    } else {
        startRain();
    }
    displayFinalScoreBoard();
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

function createRoom() {
    room = document.querySelector('#room').value;
    pseudo = document.querySelector('#pseudo').value;
    roundsToWin = parseInt(document.querySelector('#roundsToWin').value);
    if (room && pseudo) {
        socket.emit('create_room', room, pseudo, roundsToWin);
        document.querySelector('#joinButton').style.display = 'none';
        document.querySelector('#leaveButton').style.display = 'block';
        document.querySelector('#room-info').style.display = 'block';
        document.querySelector('#room-name').innerText = `Room: ${room}`;
        document.querySelector('#rounds-chosen').innerText = `Rounds to Win: ${roundsToWin}`;
    } else {
        alert('Please enter a room and a pseudo');
    }
}

function joinExistingRoom(existingRoom) {
    room = existingRoom;
    pseudo = document.querySelector('#pseudo').value;
    if (room && pseudo) {
        socket.emit('join', room, pseudo);
        document.querySelector('#joinButton').style.display = 'none';
        document.querySelector('#leaveButton').style.display = 'block';
        document.querySelector('#room-info').style.display = 'block';
        document.querySelector('#room-name').innerText = `Room: ${room}`;
        document.querySelector('#rounds-chosen').innerText = `Joining existing room`;
    } else {
        alert('Please enter a pseudo to join the room');
    }
}

function leaveRoom() {
    socket.emit('leave_room', room);
}

function choose(choice) {
    socket.emit('rps_choice', room, choice);
    document.querySelector('#waiting-message').innerText = 'En attente du choix de l\'autre joueur';
}

function replay() {
    stopFireworks();
    stopRain();
    socket.emit('reset_game', room, roundsToWin);
}

function deleteRoom(room) {
    socket.emit('delete_room', room);
}

function resetUI() {
    stopFireworks();
    stopRain();
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
    document.querySelector('#final-score-container').style.display = 'none';
    document.querySelector('#room-info').style.display = 'none';
    document.querySelector('#leaveRoomButton').style.display = 'none';
    room = '';
    pseudo = '';
    roundsToWin = 3;
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

const displayFinalScoreBoard = () => {
    const finalScoreContainer = document.querySelector('#final-score-container');
    const finalScoreBoard = document.querySelector('#final-score-board');
    const player1Name = document.querySelector('#player1-name').innerText;
    const player2Name = document.querySelector('#player2-name').innerText;
    const player1Score = document.querySelector('#player1-score').innerText;
    const player2Score = document.querySelector('#player2-score').innerText;

    finalScoreBoard.innerHTML = `
        <h2>Final Score</h2>
        <p>${player1Name}: ${player1Score}</p>
        <p>${player2Name}: ${player2Score}</p>
    `;
    finalScoreContainer.style.display = 'block';
};

// Fireworks animation
function launchFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fireworks = [];

    function createFirework(x, y) {
        const particles = [];
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'];
        for (let i = 0; i < 100; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push({
                x: x,
                y: y,
                angle: Math.random() * 2 * Math.PI,
                speed: Math.random() * 5 + 1,
                radius: Math.random() * 2 + 1,
                opacity: 1,
                color: color
            });
        }
        fireworks.push(particles);
    }

    function updateFireworks() {
        for (let i = 0; i < fireworks.length; i++) {
            const particles = fireworks[i];
            for (let j = 0; j < particles.length; j++) {
                const p = particles[j];
                p.x += Math.cos(p.angle) * p.speed;
                p.y += Math.sin(p.angle) * p.speed;
                p.opacity -= 0.02;
                if (p.opacity <= 0) {
                    particles.splice(j, 1);
                    j--;
                }
            }
            if (particles.length === 0) {
                fireworks.splice(i, 1);
                i--;
            }
        }
    }

    function drawFireworks() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const particles of fireworks) {
            for (const p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(${parseInt(p.color.slice(1, 3), 16)}, ${parseInt(p.color.slice(3, 5), 16)}, ${parseInt(p.color.slice(5, 7), 16)}, ${p.opacity})`;
                ctx.fill();
            }
        }
    }

    function animate() {
        updateFireworks();
        drawFireworks();
        requestAnimationFrame(animate);
    }

    canvas.style.display = 'block';
    fireworksInterval = setInterval(() => {
        createFirework(Math.random() * canvas.width, Math.random() * canvas.height);
    }, 1000); // Create a new firework every second

    animate();
}

function stopFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    clearInterval(fireworksInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
}

// Rain animation
function startRain() {
    const canvas = document.getElementById('rainCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drops = [];

    function createDrop() {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speed = Math.random() * 5 + 2;
        const length = Math.random() * 20 + 10;
        drops.push({ x, y, speed, length });
    }

    function updateRain() {
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            drop.y += drop.speed;
            if (drop.y > canvas.height) {
                drop.y = -drop.length;
                drop.x = Math.random() * canvas.width;
            }
        }
    }

    function drawRain() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(174,194,224,0.5)';
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        for (const drop of drops) {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
        }
    }

    function animateRain() {
        updateRain();
        drawRain();
        rainAnimationFrame = requestAnimationFrame(animateRain);
    }

    canvas.style.display = 'block';
    for (let i = 0; i < 500; i++) {
        createDrop();
    }
    animateRain();
}

function stopRain() {
    const canvas = document.getElementById('rainCanvas');
    const ctx = canvas.getContext('2d');
    cancelAnimationFrame(rainAnimationFrame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
}
