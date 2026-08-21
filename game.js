class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.velocityY = 0;
        this.velocityX = 0;
        this.speed = 5;
        this.jumpPower = 12;
        this.isJumping = false;
        this.gravity = 0.6;
        this.hitEffect = 0;
        this.damageKnockback = 0;
        this.sprite = null;
        this.spriteLoaded = false;
        // アニメーション関連
        this.frame = 0;
        this.frameTick = 0;
        this.lastDir = 'right';
        this.bob = 0; // 歩行時の上下ゆれ
        this.loadSprite();
    }

    async loadSprite() {
        // まずローカルのドット絵フレームを優先して読み込む
        const walkFrames = ['assets/chades_walk1.svg', 'assets/chades_walk2.svg'];
        const hurtFrame = 'assets/chades_hurt.svg';
        this.frames = [];
        this.hurtFrame = null;
        let loadedCount = 0;

        const tryLoadLocal = () => new Promise((resolve) => {
            let toLoad = walkFrames.length + 1; // walk frames + hurt
            const onLoaded = () => {
                loadedCount++;
                toLoad--;
                if (toLoad <= 0) resolve(true);
            };

            // load walk frames
            walkFrames.forEach((p) => {
                const img = new Image();
                img.onload = () => {
                    this.frames.push(img);
                    onLoaded();
                };
                img.onerror = () => onLoaded();
                img.src = p;
            });

            // load hurt frame
            const imgH = new Image();
            imgH.onload = () => {
                this.hurtFrame = imgH;
                onLoaded();
            };
            imgH.onerror = () => onLoaded();
            imgH.src = hurtFrame;
        });

        try {
            await tryLoadLocal();
        } catch (e) {
            // ignore
        }

        if (this.frames.length > 0) {
            // ローカルフレームがある場合はそれを使用
            this.spriteLoaded = true;
            this.useFrames = true;
            return;
        }

        // ローカルが無ければ PokéAPI から取得して単一スプライトを使う
        try {
            const id = 1012; // 指定された図鑑番号
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const data = await res.json();

            let url = null;
            try {
                url = data.sprites.versions['generation-v']['black-white'].animated.front_default;
            } catch (e) { /* ignore */ }
            if (!url) url = data.sprites.front_default;
            if (!url && data.sprites.other && data.sprites.other['official-artwork']) {
                url = data.sprites.other['official-artwork'].front_default;
            }

            if (!url) {
                console.warn('スプライトが見つかりませんでした');
                return;
            }

            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                this.sprite = img;
                this.spriteLoaded = true;
            };
            img.onerror = () => {
                console.log('スプライト読み込み失敗', url);
            };
            img.src = url;
        } catch (err) {
            console.error('PokéAPI 取得エラー', err);
        }
    }

    update(keys) {
        if (keys['ArrowLeft']) {
            this.velocityX = -this.speed;
            this.lastDir = 'left';
        }
        else if (keys['ArrowRight']) {
            this.velocityX = this.speed;
            this.lastDir = 'right';
        }
        else this.velocityX = 0;

        if (keys[' '] && !this.isJumping) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
        }

        this.velocityY += this.gravity;
        this.y += this.velocityY;
        this.x += this.velocityX + this.damageKnockback;

        // ノックバック減衰
        if (this.damageKnockback !== 0) {
            this.damageKnockback *= 0.85;
            if (Math.abs(this.damageKnockback) < 0.1) this.damageKnockback = 0;
        }

        // ヒットエフェクト時間
        if (this.hitEffect > 0) {
            this.hitEffect--;
        }

        if (this.y + this.height >= canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // 歩行アニメ制御（簡易：歩いているときに上下ボブとフレーム切替）
        if (this.velocityX !== 0 && !this.isJumping) {
            this.frameTick++;
            if (this.frameTick > 6) {
                this.frame = (this.frame + 1) % 4;
                this.frameTick = 0;
            }
            this.bob = Math.sin((this.frame / 4) * Math.PI * 2) * 4;
        } else {
            this.frame = 0;
            this.frameTick = 0;
            this.bob = 0;
        }

        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
    }

    draw(ctx) {
        // スプライトがローカルフレームからあるか単一スプライトかに応じて描画
        if (this.spriteLoaded) {
            ctx.save();
            // ここでは画像の向きが逆だったため、右向きのときに反転するように調整
            const shouldFlip = (this.lastDir === 'right');

            if (shouldFlip) ctx.scale(-1, 1);

            if (this.useFrames && this.frames && this.frames.length > 0) {
                // 歩行フレーム（フレーム配列から選択）
                const frameImg = this.frames[this.frame % this.frames.length];
                if (shouldFlip) ctx.drawImage(frameImg, -this.x - this.width, this.y + this.bob, this.width, this.height);
                else ctx.drawImage(frameImg, this.x, this.y + this.bob, this.width, this.height);
            } else if (this.hurtFrame && this.hitEffect > 0) {
                // ダメージ専用フレーム優先
                if (shouldFlip) ctx.drawImage(this.hurtFrame, -this.x - this.width, this.y + this.bob, this.width, this.height);
                else ctx.drawImage(this.hurtFrame, this.x, this.y + this.bob, this.width, this.height);
            } else if (this.sprite) {
                // フォールバックの単一スプライト
                if (shouldFlip) ctx.drawImage(this.sprite, -this.x - this.width, this.y + this.bob, this.width, this.height);
                else ctx.drawImage(this.sprite, this.x, this.y + this.bob, this.width, this.height);
            } else {
                // 最終プレースホルダ
                if (shouldFlip) ctx.fillRect(-this.x - this.width, this.y + this.bob, this.width, this.height);
                else ctx.fillRect(this.x, this.y + this.bob, this.width, this.height);
            }

            ctx.restore();
        } else {
            // スプライトが無ければプレースホルダを描画
            ctx.fillStyle = '#FFDD57';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // ダメージフラッシュエフェクト（重ねて表示）
        if (this.hitEffect > 0) {
            const flashAlpha = this.hitEffect / 10;
            ctx.fillStyle = `rgba(255, 100, 100, ${flashAlpha * 0.5})`;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    takeDamage(knockbackForce) {
        this.hitEffect = 10;
        this.damageKnockback = -knockbackForce;
        // パーティクル生成
        for (let i = 0; i < 8; i++) {
            particles.push(new DamageParticle(
                this.x + this.width / 2,
                this.y + this.height / 2
            ));
        }
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

class DamageParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 10;
        this.velocityY = (Math.random() - 0.5) * 10 - 2;
        this.life = 25;
        this.size = Math.random() * 5 + 4;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.3;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / 25;
        ctx.fillStyle = `rgba(255, 100, 100, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    isAlive() {
        return this.life > 0;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(100, canvas.height - 50 - 64);
const keys = {};
let enemies = [];
let particles = [];
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

    // パーティクル更新
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (!particles[i].isAlive()) {
            particles.splice(i, 1);
        }
    }
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update();

        if (player.collidesWith(enemies[i])) {
            lives--;
            player.takeDamage(2);
            enemies.splice(i, 1);
            if (lives <= 0) {
                gameOver = true;
                showGameOver();
            }
            continue;
        }

        if (enemies[i].isOffScreen()) {
            enemies.splice(i, 1);
        }
    }

    spawnCounter++;
    if (spawnCounter > 80) {
        spawnEnemy();
        spawnCounter = 0;
    }

    // 毎フレーム0.1ずつスコア増加
    score += 0.1;

    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('lives').textContent = '♡'.repeat(lives);
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

    // パーティクル描画
    for (let particle of particles) {
        particle.draw(ctx);
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
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('gameOver').style.display = 'block';
}

gameLoop();
