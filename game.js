class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.velocityY = 0;
        this.velocityX = 0;
        this.speed = 5;
        this.jumpPower = 12;
        this.isJumping = false;
        this.gravity = 0.6;
    }

    update(keys) {
        if (keys['ArrowLeft']) this.velocityX = -this.speed;
        else if (keys['ArrowRight']) this.velocityX = this.speed;
        else this.velocityX = 0;

        if (keys[' '] && !this.isJumping) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
        }

        this.velocityY += this.gravity;
        this.y += this.velocityY;
        this.x += this.velocityX;

        if (this.y + this.height >= canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
    }

    draw(ctx) {
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 8, this.y + 8, 8, 8);
        ctx.fillRect(this.x + 14, this.y + 8, 8, 8);
    }

    collidesWith(enemy) {
        return this.x < enemy.x + enemy.width &&
               this.x + this.width > enemy.x &&
               this.y < enemy.y + enemy.height &&
               this.y + this.height > enemy.y;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = 4;
    }

    update() {
        this.x -= this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = '#4ECDC4';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 8, this.y + 8, 8, 8);
        ctx.fillRect(this.x + 19, this.y + 8, 8, 8);
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(100, canvas.height - 90);
const keys = {};
let enemies = [];
let score = 0;
let lives = 3;
let gameOver = false;
let spawnCounter = 0;

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function spawnEnemy() {
    const y = canvas.height - 50 - 35;
    enemies.push(new Enemy(canvas.width, y));
}

function update() {
    if (gameOver) return;

    player.update(keys);
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();

        if (player.collidesWith(enemies[i])) {
            lives--;
            enemies.splice(i, 1);
            if (lives <= 0) {
                gameOver = true;
                showGameOver();
            }
            continue;
        }

        if (enemies[i].isOffScreen()) {
            enemies.splice(i, 1);
            score += 10;
        }
    }

    spawnCounter++;
    if (spawnCounter > 80) {
        spawnEnemy();
        spawnCounter = 0;
    }

    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

function draw() {
    ctx.fillStyle = '#e0f6ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    player.draw(ctx);
    
    for (let enemy of enemies) {
        enemy.draw(ctx);
    }

    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.fillText('避けてスコアを稼ぐ！', 10, 25);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function showGameOver() {
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

gameLoop();
