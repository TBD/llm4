document.addEventListener('DOMContentLoaded', () => {
    const playerSprite = [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,0,1,0,0,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,0,0,0,0,0,1]
    ];

    const invaderSprite = [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,0,1,1,0,1,0],
        [0,0,1,0,0,1,0,0],
        [0,1,0,0,0,0,1,0],
        [1,0,1,0,0,1,0,1]
    ];

    const bulletSprite = [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,0,1,1,1,1,0,0],
        [0,0,1,1,1,1,0,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0]
    ];

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('startButton');

    let audioCtx;

    const player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 50,
        speed: 5,
        dx: 0
    };

    let score = 0;
    let gameRunning = false;
    let bullets = [];
    let invaders = [];

    const bullet = {
        width: 5,
        height: 10,
        speed: 7
    };

    const invader = {
        width: 40,
        height: 30,
        speed: 2
    };

    function createInvaders() {
        invaders = [];
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 10; j++) {
                invaders.push({
                    x: 50 + j * 70,
                    y: 50 + i * 50,
                    width: invader.width,
                    height: invader.height
                });
            }
        }
    }

    function drawSprite(sprite, x, y, width, height, color) {
        ctx.fillStyle = color;
        const pixelWidth = width / 8;
        const pixelHeight = height / 8;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (sprite[i][j] === 1) {
                    ctx.fillRect(x + j * pixelWidth, y + i * pixelHeight, pixelWidth, pixelHeight);
                }
            }
        }
    }

    function drawPlayer() {
        drawSprite(playerSprite, player.x, player.y, player.width, player.height, 'green');
    }

    function drawBullets() {
        bullets.forEach(b => {
            drawSprite(bulletSprite, b.x, b.y, bullet.width, bullet.height, 'white');
        });
    }

    function drawInvaders() {
        invaders.forEach(inv => {
            drawSprite(invaderSprite, inv.x, inv.y, inv.width, inv.height, 'red');
        });
    }

    function clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function update() {
        if (!gameRunning) return;

        clear();
        drawPlayer();
        drawBullets();
        drawInvaders();

        player.x += player.dx;

        // Wall detection for player
        if (player.x < 0) {
            player.x = 0;
        }
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }

        // Bullet movement
        bullets.forEach((b, index) => {
            b.y -= bullet.speed;
            if (b.y < 0) {
                bullets.splice(index, 1);
            }
        });

        // Invader movement
        let drop = false;
        invaders.forEach(inv => {
            inv.x += invader.speed;
            if (inv.x + inv.width > canvas.width || inv.x < 0) {
                drop = true;
            }
        });

        if (drop) {
            invader.speed *= -1;
            invaders.forEach(inv => {
                inv.y += 20;
            });
        }

        // Collision detection
        bullets.forEach((b, bIndex) => {
            invaders.forEach((inv, iIndex) => {
                if (
                    b.x < inv.x + inv.width &&
                    b.x + bullet.width > inv.x &&
                    b.y < inv.y + inv.height &&
                    b.y + bullet.height > inv.y
                ) {
                    playExplosionSound();
                    bullets.splice(bIndex, 1);
                    invaders.splice(iIndex, 1);
                    score += 10;
                    scoreElement.textContent = score;
                }
            });
        });

        // Game over
        invaders.forEach(inv => {
            if (inv.y + inv.height > player.y) {
                gameRunning = false;
                alert('Game Over!');
            }
        });

        if (invaders.length === 0) {
            gameRunning = false;
            alert('You Win!');
        }

        requestAnimationFrame(update);
    }

    function movePlayer(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right') {
            player.dx = player.speed;
        } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
            player.dx = -player.speed;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            shoot();
        }
    }

    function playLaserSound() {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(1500, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    }

    function playExplosionSound() {
        if (!audioCtx) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    }

    function stopPlayer(e) {
        if (
            e.key === 'ArrowRight' ||
            e.key === 'Right' ||
            e.key === 'ArrowLeft' ||
            e.key === 'Left'
        ) {
            player.dx = 0;
        }
    }

    function shoot() {
        playLaserSound();
        bullets.push({
            x: player.x + player.width / 2 - bullet.width / 2,
            y: player.y
        });
    }

    function startGame() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        gameRunning = true;
        score = 0;
        scoreElement.textContent = score;
        player.x = canvas.width / 2 - 25;
        bullets = [];
        createInvaders();
        update();
    }

    startButton.addEventListener('click', startGame);
    document.addEventListener('keydown', movePlayer);
    document.addEventListener('keyup', stopPlayer);
});
