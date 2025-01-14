import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import cors from "cors";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "client")));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

const rooms = {}; // Key: roomId, Value: { name, players, maxPlayers, timeLimit }
const users = {}; // Key: socketId, Value: { userId, username, avatar }
const usedUserIds = new Set();
// Hàm tạo userId ngẫu nhiên không trùng lặp
function generateUniqueUserId() {
  let userId;
  do {
    userId = Math.floor(1000 + Math.random() * 9000).toString();
  } while (Object.values(users).some(user => user.userId === userId));
  return userId;
}

// Hàm tạo roomId ngẫu nhiên không trùng lặp
function generateUniqueRoomId() {
  let roomId;
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString(); // Tạo số ngẫu nhiên từ 1000 đến 9999
  } while (rooms[roomId]);
  return roomId;
}

// Khi client kết nối
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Tạo user khi kết nối
  socket.on('create_user', ({ avatar }) => {
    const userId = generateUniqueUserId();
    const username = `user${userId}`;
    users[socket.id] = { userId, username, avatar };

    console.log(`User created: ${username} (${userId})`);
    socket.emit('user_created', users[socket.id]);
    io.emit('users_list', users); // Phát danh sách user tới tất cả client
  });

  // Gửi danh sách các room hiện có
  socket.emit('rooms_list', rooms);

  // Tạo room mới
  socket.on('create_room', ({ roomName, maxPlayers, timeLimit }) => {
    const roomId = generateUniqueRoomId();

    rooms[roomId] = {
      name: roomName,
      players: [],
      maxPlayers,
      timeLimit,
    };

    // Thêm user vào room ngay khi tạo
    const user = users[socket.id];
    if (user) {
      socket.join(roomId);
      rooms[roomId].players.push(user);
    }

    console.log(`Room created: ${roomName} (${roomId})`);
    socket.emit('room_created', { roomId, ...rooms[roomId] });
    io.emit('rooms_list', rooms); // Phát danh sách room cập nhật tới tất cả client
  });

  // Join vào room
  socket.on('join_room', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('error', 'Room does not exist.');
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error', 'Room is full.');
      return;
    }

    const user = users[socket.id];
    if (!user) {
      socket.emit('error', 'User does not exist.');
      return;
    }

    // Kiểm tra user đã trong phòng chưa
    if (!room.players.some(player => player.userId === user.userId)) {
      room.players.push(user);
    }

    socket.join(roomId);

    console.log(`User ${user.username} joined room ${roomId}`);

    // Gửi thông tin cập nhật phòng tới tất cả thành viên
    io.to(roomId).emit('room_update', { roomId, ...room });

    // // Cập nhật danh sách phòng tới tất cả client
    io.emit('rooms_list', rooms);
    // if (room.players.length == room.maxPlayers) {
    //   // Gửi tín hiệu chuyển hướng
    //   socket.emit('redirect_to_game', `/game.html?roomId=${roomId}`);
    // }
  });

  // Bắt đầu game
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('error', 'Room does not exist.');
      return;
    }
    console.log(`Game started for room ${roomId}`);
    io.to(roomId).emit('game_started', `/game.html?roomId=${roomId}`);
  });

  // Khi client ngắt kết nối
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Xóa user khỏi danh sách
    const user = users[socket.id];
    delete users[socket.id];
    io.emit('users_list', users); // Cập nhật danh sách user

    // Tự động xóa user khỏi tất cả các room
    for (const [roomId, room] of Object.entries(rooms)) {
      room.players = room.players.filter(player => player.userId !== user?.userId);
      if (room.players.length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted.`);
      } else {
        io.to(roomId).emit('room_update', { roomId, ...room });
      }
    }

    io.emit('rooms_list', rooms); // Cập nhật danh sách room
  });
});

// Route phục vụ trang game
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Khởi chạy server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
