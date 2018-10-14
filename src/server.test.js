const _ = require('lodash');
const io = require('socket.io')();

const BaseGame = require('./games/basegame.js');
const Player = require('./player.js');
const { Room } = require('./rooms.js');
const Server = require('./server.js')(io);

let player, server;
const gameName = 'TicTacToe';

beforeEach(() => {
    server = new Server();
    player = new Player({
        'emit': jest.fn(),
        'join': jest.fn(),
        'leave': jest.fn()
    });
});

describe('Initialization', () => {
    test('games are loaded', () => {
        expect(server.gameNames).toBeDefined();

        _.forOwn(server.gameNames, (Game, gameName) => {
            expect(new Game()).toBeInstanceOf(BaseGame);
        });
    });

    test('lobby is created', () => {
        expect(server.lobby).toBeDefined();
        expect(server.lobby).toBeInstanceOf(Room);
    });
});

describe('Room creation', () => {
    test('lobby holds waiting players', () => {
        const player = {};

        server.handleNewPlayer(player, gameName);

        expect(server.lobby.players).toHaveLength(1);
        expect(server.gameRooms).toHaveLength(0);
    });

    test('new game room is created when there are enough players', () => {
        server.handleNewPlayer(player, gameName);

        expect(server.gameRooms).toHaveLength(0);

        server.handleNewPlayer(player, gameName);

        expect(server.gameRooms).toHaveLength(1);
        expect(server.gameRooms[0].players).toContain(player);
        expect(server.gameRooms[0].game)
            .toBeInstanceOf(server.gameNames[gameName]);
    });

    test('players in new room are removed from the lobby', () => {
        server.handleNewPlayer(player, gameName);
        server.handleNewPlayer(player, gameName);

        expect(server.getPlayersWaitingForGame(gameName)).toHaveLength(0);
        expect(server.lobby.players).toHaveLength(0);
    });
});

describe('Room destruction', () => {
    test('room is disbanded when someone disconnects', () => {
        server.handleNewPlayer(player, gameName);
        server.handleNewPlayer(player, gameName);

        expect(server.gameRooms).toHaveLength(1);

        server.disbandRoom = jest.fn();
        const room = server.gameRooms[0];
        server.handleDisconnectedPlayer(player);

        expect(server.disbandRoom).toHaveBeenCalledWith(room);
    });

    test('disbanded rooms are actually destroyed', () => {
        server.handleNewPlayer(player, gameName);
        server.handleNewPlayer(player, gameName);

        expect(server.gameRooms).toHaveLength(1);

        server.handleDisconnectedPlayer(player);

        expect(server.gameRooms).toHaveLength(0);
    });
});