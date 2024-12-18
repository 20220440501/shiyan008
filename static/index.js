// 初始化画布和上下文
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 10;

// 初始化球的位置和速度
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2;
let dy = -2;

// 初始化挡板属性
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;

// 初始化砖块的属性
const brickRowCount = 5;
const brickColumnCount = 3;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;

// 初始化分数和生命值
let score = 0;
let lives = 3;

// 创建砖块数组并初始化每个砖块的状态
let bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

// 事件监听器
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

// 事件处理函数
function keyDownHandler(e) {
  if (e.key == "Right" || e.key == "ArrowRight") {
    rightPressed = true;
  } else if (e.key == "Left" || e.key == "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key == "Right" || e.key == "ArrowRight") {
    rightPressed = false;
  } else if (e.key == "Left" || e.key == "ArrowLeft") {
    leftPressed = false;
  }
}

function mouseMoveHandler(e) {
  let relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

// 碰撞检测函数
function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      let b = bricks[c][r];
      if (b.status == 1) {
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score++;
          updateScore(score).catch(error => console.error('Error updating score:', error));
          if (score == brickRowCount * brickColumnCount) {
            alert("YOU WIN, CONGRATS!");
            document.location.reload();
          }
        }
      }
    }
  }
}

// 绘制函数
function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) {
        const brickX = r * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = c * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText("Score: " + score, 8, 20);
}

function drawLives() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#0095DD";
  ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
}

let userId;

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    console.log('Login response:', data); // 调试信息
    if (data.message === 'Login successful') {
      userId = data.user_id;
      showGameInterface();
      getResultsHistory().catch(error => console.error('Error getting results history:', error));
      alert('Login successful');
    } else {
      alert('Invalid credentials. Please try again or register.');
      document.getElementById('registerTab').click(); // 切换到注册选项卡
    }
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

async function register() {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  try {
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    console.log('Register response:', data); // 调试信息
    if (data.message === 'User registered successfully') {
      alert('User registered successfully. You can now log in.');
      document.getElementById('loginTab').click(); // 切换到登录选项卡
    } else {
      alert('Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Error registering:', error);
  }
}

async function updateScore(score) {
  if (!userId) {
    alert('Please log in to save your score.');
    return;
  }
  try {
    const response = await fetch('http://localhost:5000/players/scores', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ score })
    });
    const data = await response.json();
    console.log(data.message); // 调试信息
    getResultsHistory().catch(error => console.error('Error getting results history:', error)); // 更新分数后获取得分历史
  } catch (error) {
    console.error('Error updating score:', error);
  }
}

async function recordFailure(score) {
  if (!userId) {
    alert('Please log in to save your score.');
    return;
  }
  try {
    const response = await fetch('http://localhost:5000/record_failure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ score })
    });
    const data = await response.json();
    console.log(data.message); // 调试信息
    getResultsHistory().catch(error => console.error('Error getting results history:', error)); // 记录失败后获取得分历史
  } catch (error) {
    console.error('Error recording failure:', error);
  }
}

async function getResultsHistory() {
  if (!userId) {
    return;
  }
  try {
    const response = await fetch(`http://localhost:5000/users/${userId}/results`);
    const results = await response.json();
    console.log(results); // 调试信息
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    results.forEach(result => {
      const li = document.createElement('li');
      li.textContent = `Score: ${result.score}, Result: ${result.result}`;
      historyList.appendChild(li);
    });
  } catch (error) {
    console.error('Error getting results history:', error);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawLives();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }
  if (y + dy < ballRadius) {
    dy = -dy;
  } else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      lives--;
      if (!lives) {
        recordFailure(score).then(() => {
          alert("GAME OVER");
          document.location.reload();
        }).catch(error => console.error('Error recording failure:', error));
      } else {
        x = canvas.width / 2;
        y = canvas.height - 30;
        dx = 3;
        dy = -3;
        paddleX = (canvas.width - paddleWidth) / 2;
      }
    }
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  x += dx;
  y += dy;
  requestAnimationFrame(draw);
}

document.getElementById("runButton").addEventListener("click", function () {
  draw();
  this.disabled = true;
});

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();
  login();
});

document.getElementById("registerForm").addEventListener("submit", function (event) {
  event.preventDefault();
  register();
});

// 显示游戏界面
function showGameInterface() {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';
}

// 隐藏游戏界面
function hideGameInterface() {
  document.getElementById('auth').style.display = 'flex';
  document.getElementById('gameContainer').style.display = 'none';
}

// 初始加载时尝试获取用户ID
window.onload = async function() {
  try {
    const response = await fetch('http://localhost:5000/get_user', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await response.json();
    console.log('Get user response:', data); // 调试信息
    if (data.id) {
      userId = data.id;
      showGameInterface();
      getResultsHistory().catch(error => console.error('Error getting initial results history:', error));
    } else {
      hideGameInterface();
      document.getElementById('loginTab').click(); // 默认显示登录选项卡
    }
  } catch (error) {
    console.error('Error checking user session:', error);
    hideGameInterface();
    document.getElementById('loginTab').click(); // 默认显示登录选项卡
  }
};



