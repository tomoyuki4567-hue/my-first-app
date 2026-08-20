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
        // プレイヤーの体
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // グラデーション効果
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#FF8C8C');
        gradient.addColorStop(1, '#DD4444');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y + this.height - 3, this.width, 3);
        
        // 目
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 口
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 25, 3, 0, Math.PI);
        ctx.stroke();
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
        // グラデーション背景
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#9D4EDD');
        gradient.addColorStop(1, '#3A0CA3');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 敵の枠線
        ctx.strokeStyle = '#7209B7';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // 影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x, this.y + this.height - 3, this.width, 3);
        
        // 目
        ctx.fillStyle = '#FFD60A';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳（敵らしく）
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 22, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();
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
    // 空の背景（グラデーション）
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
    skyGradient.addColorStop(0, '#1A1A2E');
    skyGradient.addColorStop(1, '#16213E');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

    // 地面のグラデーション
    const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
    groundGradient.addColorStop(0, '#0F3460');
    groundGradient.addColorStop(1, '#16A34A');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

    // 地面の草のディテール
    ctx.fillStyle = '#22C55E';
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - 50);
        ctx.lineTo(i + 5, canvas.height - 55);
        ctx.lineTo(i + 10, canvas.height - 50);
        ctx.fill();
    }

    // 雲的なデコレーション
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(150, 50, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(600, 80, 50, 0, Math.PI * 2);
    ctx.fill();

    player.draw(ctx);
    
    for (let enemy of enemies) {
        enemy.draw(ctx);
    }

    // ゲーム情報表示
    ctx.fillStyle = '#FFD60A';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('🎮 敵を避けてスコアを稼ぐ！', 10, 30);
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
