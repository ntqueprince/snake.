const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const speedDisplay = document.getElementById('speed');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScore = document.getElementById('finalScore');
const levelSelect = document.getElementById('levelSelect');

const gridSize = 20;
const canvasCols = canvas.width / gridSize;
const canvasRows = canvas.height / gridSize;

let snake = [{ x: 5, y: 5 }];
let direction = 'RIGHT';
let food = randomFood();
let score = 0;
let gameLoop;
let speed = 100;
let isPaused = false;
let isFast = false;

levelSelect.addEventListener('change', (e) => {
  speed = parseInt(e.target.value);
  restartGame();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    isPaused = !isPaused;
    if (!isPaused) run();
    return;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    if (e.repeat) isFast = true;
    switch (e.code) {
      case 'ArrowUp':
        if (direction !== 'DOWN') direction = 'UP';
        break;
      case 'ArrowDown':
        if (direction !== 'UP') direction = 'DOWN';
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') direction = 'LEFT';
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') direction = 'RIGHT';
        break;
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    isFast = false;
  }
});

function randomFood() {
  return {
    x: Math.floor(Math.random() * canvasCols),
    y: Math.floor(Math.random() * canvasRows),
  };
}

function draw() {
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw food
  ctx.fillStyle = '#ff4b5c';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

  // draw snake
  ctx.fillStyle = '#00f2ff';
  for (let part of snake) {
    ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
  }
}

function update() {
  const head = { ...snake[0] };
  switch (direction) {
    case 'UP': head.y -= 1; break;
    case 'DOWN': head.y += 1; break;
    case 'LEFT': head.x -= 1; break;
    case 'RIGHT': head.x += 1; break;
  }

  if (
    head.x < 0 || head.y < 0 ||
    head.x >= canvasCols || head.y >= canvasRows ||
    snake.some(seg => seg.x === head.x && seg.y === head.y)
  ) {
    clearInterval(gameLoop);
    finalScore.textContent = score;
    gameOverScreen.style.display = 'flex';

    const username = prompt("Game Over! Enter your name:");
    if (username) {
      saveScore(username, score).then(fetchTopScores);
    }

    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomFood();
  } else {
    snake.pop();
  }
  scoreDisplay.textContent = score;
}

function run() {
  clearInterval(gameLoop);
  gameLoop = setInterval(() => {
    if (!isPaused) {
      update();
      draw();
    }
  }, isFast ? speed / 2 : speed);
  speedDisplay.textContent = isFast ? 'Fast' : 'Normal';
}

function restartGame() {
  snake = [{ x: 5, y: 5 }];
  direction = 'RIGHT';
  score = 0;
  food = randomFood();
  gameOverScreen.style.display = 'none';
  run();
}

function resetGame() {
  restartGame();
}

// ✅ Supabase integration using correct table and column names

async function saveScore(username, score) {
  const { data, error } = await supabase
    .from('high_scores')
    .insert([{ player_name: username, score }]);
  if (error) console.error('Error saving score:', error);
}

async function fetchTopScores() {
  const { data, error } = await supabase
    .from('high_scores')
    .select('player_name, score')
    .order('score', { ascending: false })
    .limit(5);

  const scoreList = document.getElementById('scoreList');
  if (error) {
    scoreList.innerHTML = 'Error loading scores.';
    return;
  }

  scoreList.innerHTML = data.map((entry, i) =>
    `<p>${i + 1}. ${entry.player_name} - ${entry.score}</p>`
  ).join('');
}

window.onload = () => {
  fetchTopScores();
  run();
};
