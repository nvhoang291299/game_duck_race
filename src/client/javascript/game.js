// const socket = io();

// // Lấy roomId từ URL
// const params = new URLSearchParams(window.location.search);
// const roomId = params.get('roomId');

// if (roomId) {
//   socket.emit('join_room', { roomId });
// }

// // Cập nhật thông tin phòng
// socket.on('room_update', (room) => {
//   document.getElementById('room-info').innerHTML = `<h2>Room: ${room.name}</h2>`;
//   const playersList = room.players.map(player => `<li>${player}</li>`).join('');
//   document.getElementById('players-list').innerHTML = `<ul>${playersList}</ul>`;
// });

// // Xử lý lỗi
// socket.on('error', (message) => {
//   alert(message);
//   window.location.href = '/';
// });



// ----- GAME LOGIC -----
document.getElementById("start-game").addEventListener("click", startGame);

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Cài đặt canvas kích thước toàn màn hình
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let ducks = [];
let raceStarted = false;
const finishLine = canvas.width - 100; // Vạch đích

// Tạo đối tượng hình ảnh cho vịt
const duckImage = new Image();
duckImage.src = "assets/images/duck.png";  // Đảm bảo đường dẫn đúng tới file hình ảnh

// Lắng nghe sự kiện 'load' để đảm bảo hình ảnh đã tải xong
duckImage.onload = function () {
  // Khi hình ảnh đã tải xong, bạn có thể bắt đầu game
  startGame();
};

// Xử lý lỗi nếu hình ảnh không tải được
duckImage.onerror = function () {
  console.error("Failed to load duck image.");
  alert("Hình ảnh vịt không thể tải. Vui lòng kiểm tra đường dẫn.");
};

// Hàm khởi động game
function startGame() {
  document.getElementById("main-menu").style.display = "none";
  canvas.style.display = "block";

  // Khởi tạo vịt
  for (let i = 0; i < 5; i++) {
    ducks.push({
      id: i,
      x: 50, // Vị trí ngang ban đầu
      y: 100 + i * 100, // Vị trí dọc
      speed: Math.random() * 0.5 + 2, // Tốc độ ban đầu trong khoảng từ 2 đến 2.5
      targetSpeed: Math.random() * 0.5 + 2, // Tốc độ mục tiêu trong khoảng từ 2 đến 2.5
    });
  }

  raceStarted = true;

  // Random tốc độ mỗi giây, thay đổi dần dần
  setInterval(() => {
    ducks.forEach((duck) => {
      duck.targetSpeed = Math.random() * 0.5 + 2; // Random tốc độ mới mỗi giây từ 2 đến 2.5
    });
  }, 1000);

  requestAnimationFrame(updateGame);
}

// Hàm vẽ nền
function drawBackground() {
  ctx.fillStyle = "#ADD8E6";  // Màu nền (xanh nhạt)
  ctx.fillRect(0, 0, canvas.width, canvas.height);  // Vẽ nền
}

// Hàm tính toán interpolation
function lerp(start, end, alpha) {
  return start + alpha * (end - start);
}

// Hàm vẽ số thứ tự trên mỗi con vịt
function drawDuckOrder(duck) {
  const fontSize = 20;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "black";  // Màu chữ
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(duck.id + 1, duck.x + 25, duck.y + 25); // Vẽ số thứ tự ở vị trí giữa con vịt
}

// Hàm update game
function updateGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Vẽ nền đơn giản
  drawBackground();

  // Vẽ các chú vịt và cập nhật vị trí
  let allFinished = true;
  ducks.forEach((duck) => {
    const duckWidth = 50;
    const duckHeight = 50;

    // Dùng lerp để cập nhật tốc độ từ tốc độ hiện tại sang tốc độ mới
    duck.speed = lerp(duck.speed, duck.targetSpeed, 0.1); // Tăng tốc độ thay đổi (alpha = 0.1)

    // Tính khoảng cách đến đích
    if (duck.x < finishLine) {
      duck.x += duck.speed; // Tiến về phía đích
      allFinished = false; // Còn vịt chưa về đích
    }

    // Vẽ vịt
    ctx.drawImage(duckImage, duck.x, duck.y, duckWidth, duckHeight);

    // Vẽ số thứ tự trên mỗi con vịt
    drawDuckOrder(duck);
  });

  // Kiểm tra kết thúc đua
  if (allFinished && raceStarted) {
    raceStarted = false;
    // Lấy thứ tự các vịt về đích
    const raceResults = ducks
      .map((duck) => ({ id: duck.id, x: duck.x }))
      .sort((a, b) => b.x - a.x); // Sắp xếp theo vị trí (từ xa nhất đến gần nhất)

    // Hiển thị thứ tự các vịt về đích
    const resultText = raceResults
      .map((result, index) => `Vịt ${result.id + 1}: ${index + 1}`)
      .join("\n");

    alert(`Cuộc đua đã kết thúc!\nThứ tự về đích:\n${resultText}`);
  } else {
    requestAnimationFrame(updateGame);
  }
}
