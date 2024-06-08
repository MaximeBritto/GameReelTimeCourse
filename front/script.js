const socket = io('https://gamereeltimecourse.onrender.com');
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
    if (result === 'Gagné') {
        launchFireworks();
    }
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

// Fireworks animation
function launchFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fireworks = [];

    function createFirework(x, y) {
        const particles = [];
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: x,
                y: y,
                angle: Math.random() * 2 * Math.PI,
                speed: Math.random() * 5 + 1,
                radius: Math.random() * 2 + 1,
                opacity: 1
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
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.fill();
            }
        }
    }

    function animate() {
        updateFireworks();
        drawFireworks();
        if (fireworks.length > 0) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
        }
    }

    canvas.style.display = 'block';
    createFirework(Math.random() * canvas.width, Math.random() * canvas.height);
    createFirework(Math.random() * canvas.width, Math.random() * canvas.height);
    createFirework(Math.random() * canvas.width, Math.random() * canvas.height);
    animate();
}
