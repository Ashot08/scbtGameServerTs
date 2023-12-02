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
import gameHandler from './ws/handlers/gameHandler.ts';
import answerHandler from './ws/handlers/answerHandler.ts';
import { questionRouter } from './routes/questionRouter.ts';

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/game', gameRouter);
app.use('/question', questionRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get('/', (req: Request, res: Response) => {
  console.log('req body (src/index.ts): ', req.body);
  res.sendFile(join(__dirname, 'index.html'));
});

server.listen(3001, () => {
  console.log('server running at http://localhost:3001');
});

io.on('connection', async (socket: any) => {
  console.log('a user connected');

  const { roomId } = socket.handshake.query;
  // сохраняем название комнаты в соответствующем свойстве сокета
  socket.roomId = roomId;

  // присоединяемся к комнате
  socket.join(roomId as string | string[]);

  gameHandler(io, socket);
  answerHandler(io, socket);

  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.leave(roomId as string);
  });

  socket.on('chat message', async () => {
    console.log(db);
  });
});
