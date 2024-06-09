import express from 'express';
import http from 'http';
import ip from 'ip';
import { Server } from 'socket.io';
import cors from 'cors';

process.on('uncaughtException', (err) => {
    console.error('There was an uncaught error', err);
    process.exit(1); //mandatory (as per the Node.js docs)
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

app.use(cors());

let rooms = {};
let players = {};
let scores = {};
let pseudos = {};
let roundsToWin = {};

app.get('/', (req, res) => {
    res.json('ip address: http://' + ip.address() + ':' + PORT);    
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.broadcast.emit('user connected');

    // Envoyer la liste des salles disponibles au client
    socket.emit('room_list', getRoomList());

    socket.on('disconnect', () => {
        console.log('user disconnected');
        handlePlayerLeave(socket);
    });

    socket.on('create_room', (room, pseudo, rounds) => {
        if (rooms[room]) {
            socket.emit('error_message', 'La room que vous essayez de créer est déjà existante');
            return;
        }

        console.log(`${pseudo} created room: ${room}`);
        socket.join(room);

        rooms[room] = [];
        players[room] = {};
        scores[room] = {};
        pseudos[room] = {};
        roundsToWin[room] = rounds;

        scores[room][socket.id] = 0;
        pseudos[room][socket.id] = pseudo;

        players[room][socket.id] = null;
        io.emit('room_list', getRoomList()); // Mettre à jour la liste des salles pour tous les clients
        io.to(room).emit('join', { room, pseudo });

        if (Object.keys(players[room]).length === 2) {
            io.to(room).emit('start_game', pseudos[room]);
        }
    });

    socket.on('join', (room, pseudo) => {
        console.log(`${pseudo} joined room: ${room}`);
        socket.join(room);

        if (!rooms[room]) {
            rooms[room] = [];
        }
        if (!players[room]) {
            players[room] = {};
        }
        if (!scores[room]) {
            scores[room] = {};
        }
        if (!pseudos[room]) {
            pseudos[room] = {};
        }

        scores[room][socket.id] = 0;
        pseudos[room][socket.id] = pseudo;

        players[room][socket.id] = null;
        io.to(room).emit('join', { room, pseudo });

        if (Object.keys(players[room]).length === 2) {
            io.to(room).emit('start_game', pseudos[room]);
        }
    });

    socket.on('leave', (room) => {
        console.log('leave room: ' + room);
        handlePlayerLeave(socket, room);
    });

    socket.on('rps_choice', (room, choice) => {
        console.log(`Player ${pseudos[room][socket.id]} in room ${room} chose ${choice}`);
        if (players[room]) {
            players[room][socket.id] = choice;
        }

        const playerIds = Object.keys(players[room]);
        if (playerIds.length === 2) {
            const player1 = playerIds[0];
            const player2 = playerIds[1];
            const choice1 = players[room][player1];
            const choice2 = players[room][player2];

            if (choice1 && choice2) {
                let result;
                if (choice1 === choice2) {
                    result = 'Draw';
                } else if (
                    (choice1 === 'rock' && choice2 === 'scissors') ||
                    (choice1 === 'scissors' && choice2 === 'paper') ||
                    (choice1 === 'paper' && choice2 === 'rock')
                ) {
                    result = `Player ${pseudos[room][player1]} wins this round!`;
                    scores[room][player1] += 1;
                } else {
                    result = `Player ${pseudos[room][player2]} wins this round!`;
                    scores[room][player2] += 1;
                }

                io.to(room).emit('rps_result', { result, scores: getScoreBoard(room, pseudos[room], scores[room]) });
                players[room][player1] = null;
                players[room][player2] = null;

                if (scores[room][player1] === roundsToWin[room]) {
                    io.to(player1).emit('game_end', 'Gagné');
                    io.to(player2).emit('game_end', 'Perdu');
                    resetGame(room, false); // Reset game without resetting pseudos
                } else if (scores[room][player2] === roundsToWin[room]) {
                    io.to(player2).emit('game_end', 'Gagné');
                    io.to(player1).emit('game_end', 'Perdu');
                    resetGame(room, false); // Reset game without resetting pseudos
                } else {
                    io.to(room).emit('next_round');
                }
            } else {
                const waitingPlayer = choice1 ? pseudos[room][player2] : pseudos[room][player1];
                io.to(room).emit('waiting', `En attente du choix de ${waitingPlayer}`);
            }
        }
    });

    socket.on('reset_game', (room, rounds) => {
        roundsToWin[room] = rounds; // Set the new rounds to win
        resetGame(room, true); // Reset game and reset scores
        io.to(room).emit('start_game', pseudos[room]);
    });

    socket.on('message', (data) => {
        const room = Object.keys(socket.rooms).find(r => r !== socket.id);
        io.to(room).emit('message', data);
    });

    socket.on('delete_room', (room) => {
        console.log(`Room ${room} deleted`);
        if (rooms[room]) {
            // Inform all users in the room that it is being deleted
            io.to(room).emit('room_deleted', `Room ${room} has been deleted`);
            
            // Remove all players from the room
            for (const socketId in players[room]) {
                handlePlayerLeave({ id: socketId }, room);
            }
            
            // Delete room data
            delete rooms[room];
            delete players[room];
            delete scores[room];
            delete pseudos[room];
            delete roundsToWin[room];

            // Update the room list for all clients
            io.emit('room_list', getRoomList());
        }
    });

    const handlePlayerLeave = (socket, room = null) => {
        for (const r in players) {
            if (room && room !== r) continue;
            if (players[r] && players[r][socket.id]) {
                const pseudo = pseudos[r][socket.id];
                delete players[r][socket.id];
                delete scores[r][socket.id];
                delete pseudos[r][socket.id];
                io.to(r).emit('user disconnected', socket.id);
                io.to(r).emit('stop_game', `Le joueur ${pseudo} a quitté`);
                if (Object.keys(players[r]).length === 0) {
                    delete rooms[r];
                    delete players[r];
                    delete scores[r];
                    delete pseudos[r];
                    delete roundsToWin[r];
                }
                io.emit('room_list', getRoomList()); // Mettre à jour la liste des salles pour tous les clients
            }
        }
    };
});

const getScoreBoard = (room, pseudos, scores) => {
    if (!pseudos || !scores) return {};
    const playerIds = Object.keys(pseudos);
    if (playerIds.length < 2) return {};

    return {
        [pseudos[playerIds[0]]]: scores[playerIds[0]] || 0,
        [pseudos[playerIds[1]]]: scores[playerIds[1]] || 0
    };
};

const resetGame = (room, resetScores = false) => {
    players[room] = {};
    if (resetScores) {
        for (const playerId in scores[room]) {
            scores[room][playerId] = 0;
        }
    }
    io.to(room).emit('reset_game');
};

const getRoomList = () => {
    const roomList = [];
    for (const room in rooms) {
        roomList.push({ room, rounds: roundsToWin[room] });
    }
    return roomList;
};

server.listen(PORT, () => {
    console.log('Server ip : http://' + ip.address() + ":" + PORT);
});
