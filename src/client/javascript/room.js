const socket = io('http://localhost:3000');

// DOM elements
const userInfo = document.getElementById('user-info');
const roomsList = document.getElementById('rooms-list');
const createRoomForm = document.getElementById('create-room-form');

// Tạo user khi kết nối
socket.emit('create_user', { avatar: 'default-avatar.png' });

// Hiển thị thông tin user
socket.on('user_created', (user) => {
  userInfo.classList.remove('d-none');
  userInfo.textContent = `Welcome, ${user.username} (ID: ${user.userId})`;
});

// Cập nhật danh sách các phòng
socket.on('rooms_list', (rooms) => {
  roomsList.innerHTML = '';
  for (const roomId in rooms) {
    const room = rooms[roomId];
    roomsList.innerHTML += `
      <div class="col-md-4 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">${room.name}</h5>
            <p class="card-text">Players: ${room.players.length}/${room.maxPlayers}</p>
            <button class="btn btn-primary join-room-button" data-room-id="${roomId}">Join</button>
          </div>
        </div>
      </div>
    `;
  }

  document.querySelectorAll('.join-room-button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const roomId = e.target.dataset.roomId;
      socket.emit('join_room', { roomId });
    });
  });
});

// Xử lý tạo phòng
createRoomForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const roomName = document.getElementById('room-name').value;
  const maxPlayers = document.getElementById('max-players').value;
  const timeLimit = document.getElementById('time-limit').value;

  socket.emit('create_room', { roomName, maxPlayers, timeLimit });

  const modal = bootstrap.Modal.getInstance(document.getElementById('createRoomModal'));
  modal.hide();
});

// Chuyển hướng vào game
socket.on('redirect_to_game', (url) => {
  window.location.href = url;
});