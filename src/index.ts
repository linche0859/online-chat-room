import devServer from './server/dev';
import prodServer from './server/prod';
import express from 'express';
import http from 'http';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Server } from 'socket.io';
import { name } from '@/utils';
import UserService from '@/services/User';

const port = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const userService = new UserService();

dayjs.extend(utc);

// websocket
io.on('connection', (socket) => {
  // 發送 socket 編號，一個使用者會有一個 socket 編號
  socket.emit('user-id', socket.id);
  // 進入聊天室
  socket.on(
    'join',
    ({ userName, roomName }: { userName: string; roomName: string }) => {
      // 加入指定的 socket
      socket.join(roomName);
      userService.addUser({
        id: socket.id,
        userName,
        roomName,
      });
      // 發送給其他在相同 socket 的人，但不發送給自己
      socket.broadcast.to(roomName).emit('join', { userName, roomName });
    }
  );
  // 發送聊天訊息
  socket.on('chat', (message: string) => {
    const user = userService.getUser(socket.id);
    if (user) {
      const time = dayjs().utc().format();
      // 發送給其他在相同 socket 的人，也發送給自己
      io.to(user.roomName).emit('chat', { user, message, time });
    }
  });
  // 離開聊天室
  socket.on('disconnect', () => {
    const user = userService.getUser(socket.id);
    if (user) {
      socket.broadcast
        .to(user.roomName)
        .emit('leave', { userName: user.userName, roomName: user.roomName });
    }
    userService.removeUser(socket.id);
  });
});

// 執行npm run dev本地開發 or 執行npm run start部署後啟動線上伺服器
if (process.env.NODE_ENV === 'development') {
  devServer(app);
} else {
  prodServer(app);
}

console.log('server side', name);

server.listen(port, () => {
  console.log(`The application is running on port ${port}.`);
});
