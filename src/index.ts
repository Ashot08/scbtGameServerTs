import express, { Response, Request } from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import db from './db/index.ts'; // database initialize
import { authRouter } from './routes/authRouter.ts';
import { gameRouter } from './routes/gameRouter.ts';
import gameHandler from "./ws/handlers/gameHandler.ts";

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/game', gameRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get('/', (req: Request, res: Response) => {
  console.log('req body (src/index.ts): ', req.body);
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3001, () => {
  console.log('server running at http://localhost:3001');
});

io.on('connection', async (socket) => {
  console.log('a user connected');

  const { gameId } = socket.handshake.query;
  // сохраняем название комнаты в соответствующем свойстве сокета
  socket.roomId = gameId;

  // присоединяемся к комнате
  socket.join(gameId as string | string[]);

  gameHandler(io, socket);


  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.leave(gameId as string);
  });

  socket.on('chat message', async (msg) => {
      await db.run('INSERT INTO messages (content) VALUES (?)', msg);
  });

  socket.on('connecting_to_game', async (gameId, userId) => {
    // get game from DB by id;
    // if player in game join player to room with gameId;
    // if not - send error;
    console.log(gameId);
    console.log(userId);
  });

  socket.on('join_game', async (gameId, userId) => {
    // get game from DB by id;
    // if game exists;
    // if not - send error;
    // check is game available (status, players count);
    // if not - send error;
    // add player to game in DB;
    // add socketId to room = gameId

    // socket.join(gameId);
    // state.games[gameId].push(socket.id);
    // io.to(gameId).emit('added_to_game', `added ${socket.id}`);
    console.log(gameId);
    console.log(userId);
    socket.join('my_room');
    io.to('my_room').emit('added_to_game', `added ${socket.id}`);
  });

});
