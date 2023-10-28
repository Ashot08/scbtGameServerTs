import express, { Response, Request } from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';
// import './db/index.ts'; // database initialize
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import db from './db/index.ts';
import { authRouter } from './routes/authRouter.ts';

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);

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
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', async (msg) => {
    let result: any;
    try {
      // store the message in the database
      result = await db.run('INSERT INTO messages (content) VALUES (?)', msg);
    } catch (e) {
      // TODO handle the failure
      return;
    }
    // include the offset with the message
    io.emit('chat message', msg, result.lastID);

    console.log(`message: ${msg}`);
    // socket.broadcast.emit('new message', msg);
    io.emit('new message', msg);
  });

  if (!socket.recovered) {
    // if the connection state recovery was not successful
    try {
      // await db.each(
      //   'SELECT id, content FROM messages WHERE id > ?',
      //   [socket.handshake.auth.serverOffset || 0],
      //   (_err, row) => {
      //     socket.emit('chat message', row.content, row.id);
      //   },
      // );
      await db.each(
        'SELECT * FROM users WHERE id > ?',
        [socket.handshake.auth.serverOffset || 0],
        (_err, row) => {
          socket.emit(
            'chat message',
            `
            ${row.username} - 
            ${row.name} - 
            ${row.id} 
            `,
          );
        },
      );
    } catch (e) {
      // something went wrong
    }
  }
});
