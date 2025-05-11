// RetroWave Rider Game
// Main game logic and rendering

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROAD_WIDTH = 600;
const ROAD_EDGE_WIDTH = (GAME_WIDTH - ROAD_WIDTH) / 2;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

// Game variables
let canvas, ctx;
let gameActive = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let dataPackets = 0;
let gameSpeed = 5;
let roadOffset = 0;
let lastTime = 0;
let deltaTime = 0;

// Player car
const player = {
    width: 60,
    height: 100,
    x: GAME_WIDTH / 2 - 30,
    y: GAME_HEIGHT - 150,
    speed: 5,
    boosting: false,
    boostTime: 0,
    maxBoostTime: 100,
    boostCooldown: 0,
    lane: 1, // 0 = left, 1 = center, 2 = right
    color: '#00ffff',
    draw() {
        // Draw car body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw car details
        ctx.fillStyle = '#120029';
        ctx.fillRect(this.x + 10, this.y + 15, 10, 70);
        ctx.fillRect(this.x + 40, this.y + 15, 10, 70);
        
        // Draw neon glow when boosting
        if (this.boosting) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.shadowBlur = 0;
            
            // Draw boost flames
            ctx.fillStyle = '#ff00ff';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + this.height);
            ctx.lineTo(this.x + 20, this.y + this.height + 20);
            ctx.lineTo(this.x + 30, this.y + this.height);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 30, this.y + this.height);
            ctx.lineTo(this.x + 40, this.y + this.height + 20);
            ctx.lineTo(this.x + 50, this.y + this.height);
            ctx.fill();
        }
    },
    update() {
        // Handle boost
        if (this.boosting) {
            this.boostTime--;
            if (this.boostTime <= 0) {
                this.boosting = false;
                this.boostCooldown = 150;
            }
        } else if (this.boostCooldown > 0) {
            this.boostCooldown--;
        }
        
        // Update position based on lane
        const targetX = ROAD_EDGE_WIDTH + (LANE_WIDTH * this.lane) + (LANE_WIDTH / 2) - (this.width / 2);
        this.x += (targetX - this.x) * 0.2;
    }
};

// Game objects arrays
let obstacles = [];
let dataPacketItems = [];
let powerUps = [];
let particles = [];

// Obstacle types
const obstacleTypes = [
    { width: 80, height: 80, color: '#ff00ff', points: -10, name: 'barrier' },
    { width: 100, height: 60, color: '#ff5500', points: -15, name: 'roadblock' },
    { width: 50, height: 120, color: '#ff0000', points: -20, name: 'truck' }
];

// Power-up types
const powerUpTypes = [
    { width: 30, height: 30, color: '#00ff00', effect: 'shield', duration: 300, name: 'Shield' },
    { width: 30, height: 30, color: '#ffff00', effect: 'slowTime', duration: 200, name: 'Time Warp' },
    { width: 30, height: 30, color: '#ff00ff', effect: 'magnet', duration: 250, name: 'Data Magnet' },
    { width: 30, height: 30, color: '#0088ff', effect: 'extraLife', duration: 0, name: 'Extra Life' }
];

// Active power-ups
let activePowerUps = {
    shield: 0,
    slowTime: 0,
    magnet: 0
};

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // Show start screen
    document.getElementById('startScreen').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';
}

// Start the game
function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    resetGame();
    gameActive = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Restart the game
function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    resetGame();
    gameActive = true;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

// Reset game state
function resetGame() {
    score = 0;
    lives = 3;
    dataPackets = 0;
    gameSpeed = 5;
    roadOffset = 0;
    obstacles = [];
    dataPacketItems = [];
    powerUps = [];
    particles = [];
    activePowerUps = {
        shield: 0,
        slowTime: 0,
        magnet: 0
    };
    player.lane = 1;
    player.boosting = false;
    player.boostTime = 0;
    player.boostCooldown = 0;
    
    updateHUD();
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameActive) return;
    
    // Calculate delta time
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Skip update if game is paused
    if (!gamePaused) {
        update(deltaTime);
    }
    
    render();
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(dt) {
    // Adjust game speed over time
    if (score > 0 && score % 1000 === 0) {
        gameSpeed += 0.1;
    }
    
    // Apply slow time power-up
    let currentSpeed = gameSpeed;
    if (activePowerUps.slowTime > 0) {
        currentSpeed *= 0.6;
        activePowerUps.slowTime--;
    }
    
    // Update road offset (for scrolling effect)
    roadOffset += currentSpeed;
    if (roadOffset >= 100) {
        roadOffset = 0;
    }
    
    // Update player
    player.update();
    
    // Update power-ups duration
    if (activePowerUps.shield > 0) activePowerUps.shield--;
    if (activePowerUps.magnet > 0) activePowerUps.magnet--;
    
    // Generate obstacles
    if (Math.random() < 0.01 + (gameSpeed * 0.001)) {
        spawnObstacle();
    }
    
    // Generate data packets
    if (Math.random() < 0.02) {
        spawnDataPacket();
    }
    
    // Generate power-ups (less frequently)
    if (Math.random() < 0.003) {
        spawnPowerUp();
    }
    
    // Update obstacles
    updateGameObjects(obstacles, currentSpeed);
    
    // Update data packets
    updateGameObjects(dataPacketItems, currentSpeed);
    
    // Update power-ups
    updateGameObjects(powerUps, currentSpeed);
    
    // Update particles
    updateParticles(currentSpeed);
    
    // Check collisions
    checkCollisions();
    
    // Magnet effect for data packets
    if (activePowerUps.magnet > 0) {
        applyMagnetEffect();
    }
    
    // Increment score
    score += Math.floor(currentSpeed);
    updateHUD();
}

// Render game elements
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw background (grid effect)
    drawBackground();
    
    // Draw road
    drawRoad();
    
    // Draw particles
    drawParticles();
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw data packets
    dataPacketItems.forEach(packet => {
        drawDataPacket(packet);
    });
    
    // Draw power-ups
    powerUps.forEach(powerUp => {
        drawPowerUp(powerUp);
    });
    
    // Draw player
    player.draw();
    
    // Draw active power-up indicators
    drawPowerUpIndicators();
    
    // Draw pause indicator
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = '#00ffff';
        ctx.font = '40px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText('Press P to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }
}

// Draw the scrolling background grid
function drawBackground() {
    ctx.fillStyle = '#120029';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    const gridSize = 50;
    const offsetY = roadOffset % gridSize;
    
    for (let y = offsetY; y < GAME_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }
    
    // Perspective grid lines (converging to center)
    const centerX = GAME_WIDTH / 2;
    const horizonY = 100;
    const gridCount = 10;
    
    for (let i = 0; i <= gridCount; i++) {
        const x = ROAD_EDGE_WIDTH + (ROAD_WIDTH / gridCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, GAME_HEIGHT);
        ctx.lineTo(centerX + (x - centerX) * 0.2, horizonY);
        ctx.stroke();
    }
}

// Draw the road
function drawRoad() {
    // Road background
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(ROAD_EDGE_WIDTH, GAME_HEIGHT);
    ctx.lineTo(ROAD_EDGE_WIDTH + ROAD_WIDTH, GAME_HEIGHT);
    ctx.lineTo(GAME_WIDTH / 2 + ROAD_WIDTH * 0.4, 100);
    ctx.lineTo(GAME_WIDTH / 2 - ROAD_WIDTH * 0.4, 100);
    ctx.closePath();
    ctx.fill();
    
    // Road markings
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 5;
    
    // Lane dividers
    for (let lane = 1; lane < LANE_COUNT; lane++) {
        const laneX = ROAD_EDGE_WIDTH + lane * LANE_WIDTH;
        const dashLength = 30;
        const gapLength = 20;
        const totalLength = dashLength + gapLength;
        const startOffset = roadOffset % totalLength;
        
        for (let y = GAME_HEIGHT - startOffset; y > 100; y -= totalLength) {
            const perspectiveFactor = 1 - (GAME_HEIGHT - y) / (GAME_HEIGHT - 100);
            const xPos = GAME_WIDTH / 2 + (laneX - GAME_WIDTH / 2) * perspectiveFactor;
            const dashHeight = dashLength * perspectiveFactor;
            
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y - dashHeight);
            ctx.stroke();
        }
    }
    
    // Road edges
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 3;
    
    // Left edge
    ctx.beginPath();
    ctx.moveTo(ROAD_EDGE_WIDTH, GAME_HEIGHT);
    ctx.lineTo(GAME_WIDTH / 2 - ROAD_WIDTH * 0.4, 100);
    ctx.stroke();
    
    // Right edge
    ctx.beginPath();
    ctx.moveTo(ROAD_EDGE_WIDTH + ROAD_WIDTH, GAME_HEIGHT);
    ctx.lineTo(GAME_WIDTH / 2 + ROAD_WIDTH * 0.4, 100);
    ctx.stroke();
}

// Draw a data packet
function drawDataPacket(packet) {
    const pulseAmount = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
    
    // Glow effect
    ctx.shadowColor = packet.color;
    ctx.shadowBlur = 10 * pulseAmount;
    
    // Draw packet
    ctx.fillStyle = packet.color;
    ctx.beginPath();
    ctx.arc(packet.x + packet.width / 2, packet.y + packet.height / 2, 
            packet.width / 2 * pulseAmount, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner details
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(packet.x + packet.width / 2, packet.y + packet.height / 2, 
            packet.width / 4 * pulseAmount, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Draw a power-up
function drawPowerUp(powerUp) {
    const pulseAmount = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
    
    // Glow effect
    ctx.shadowColor = powerUp.color;
    ctx.shadowBlur = 15 * pulseAmount;
    
    // Draw power-up
    ctx.fillStyle = powerUp.color;
    ctx.beginPath();
    ctx.moveTo(powerUp.x + powerUp.width / 2, powerUp.y);
    ctx.lineTo(powerUp.x + powerUp.width, powerUp.y + powerUp.height / 2);
    ctx.lineTo(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height);
    ctx.lineTo(powerUp.x, powerUp.y + powerUp.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Inner details
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, 
            powerUp.width / 4 * pulseAmount, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Draw active power-up indicators
function drawPowerUpIndicators() {
    const indicators = [];
    
    if (activePowerUps.shield > 0) {
        indicators.push({
            name: 'SHIELD',
            time: Math.ceil(activePowerUps.shield / 60),
            color: '#00ff00'
        });
    }
    
    if (activePowerUps.slowTime > 0) {
        indicators.push({
            name: 'TIME WARP',
            time: Math.ceil(activePowerUps.slowTime / 60),
            color: '#ffff00'
        });
    }
    
    if (activePowerUps.magnet > 0) {
        indicators.push({
            name: 'DATA MAGNET',
            time: Math.ceil(activePowerUps.magnet / 60),
            color: '#ff00ff'
        });
    }
    
    // Draw indicators
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'right';
    
    indicators.forEach((indicator, index) => {
        const y = 50 + index * 25;
        ctx.fillStyle = indicator.color;
        ctx.fillText(`${indicator.name}: ${indicator.time}s`, GAME_WIDTH - 20, y);
    });
}

// Draw particles
function drawParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

// Update game objects (obstacles, data packets, power-ups)
function updateGameObjects(objects, speed) {
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        
        // Move object down
        obj.y += speed;
        
        // Apply perspective to x position
        const perspectiveFactor = obj.y / GAME_HEIGHT;
        const centerX = GAME_WIDTH / 2;
        obj.x = centerX + (obj.originalX - centerX) * perspectiveFactor;
        obj.width = obj.originalWidth * perspectiveFactor;
        obj.height = obj.originalHeight * perspectiveFactor;
        
        // Remove if off screen
        if (obj.y > GAME_HEIGHT) {
            objects.splice(i, 1);
        }
    }
}

// Update particles
function updateParticles(speed) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        particle.x += particle.vx;
        particle.y += particle.vy + speed * 0.5;
        particle.alpha -= 0.02;
        
        if (particle.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Spawn an obstacle
function spawnObstacle() {
    const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const lane = Math.floor(Math.random() * LANE_COUNT);
    
    const originalX = ROAD_EDGE_WIDTH + (LANE_WIDTH * lane) + (LANE_WIDTH / 2) - (obstacleType.width / 2);
    const perspectiveFactor = 0.2; // At the horizon
    const centerX = GAME_WIDTH / 2;
    const x = centerX + (originalX - centerX) * perspectiveFactor;
    
    obstacles.push({
        x: x,
        y: 100,
        width: obstacleType.width * perspectiveFactor,
        height: obstacleType.height * perspectiveFactor,
        originalX: originalX,
        originalWidth: obstacleType.width,
        originalHeight: obstacleType.height,
        color: obstacleType.color,
        points: obstacleType.points,
        lane: lane
    });
}

// Spawn a data packet
function spawnDataPacket() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const packetSize = 20;
    
    const originalX = ROAD_EDGE_WIDTH + (LANE_WIDTH * lane) + (LANE_WIDTH / 2) - (packetSize / 2);
    const perspectiveFactor = 0.2; // At the horizon
    const centerX = GAME_WIDTH / 2;
    const x = centerX + (originalX - centerX) * perspectiveFactor;
    
    dataPacketItems.push({
        x: x,
        y: 100,
        width: packetSize * perspectiveFactor,
        height: packetSize * perspectiveFactor,
        originalX: originalX,
        originalWidth: packetSize,
        originalHeight: packetSize,
        color: '#00ffff',
        lane: lane
    });
}

// Spawn a power-up
function spawnPowerUp() {
    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const lane = Math.floor(Math.random() * LANE_COUNT);
    
    const originalX = ROAD_EDGE_WIDTH + (LANE_WIDTH * lane) + (LANE_WIDTH / 2) - (powerUpType.width / 2);
    const perspectiveFactor = 0.2; // At the horizon
    const centerX = GAME_WIDTH / 2;
    const x = centerX + (originalX - centerX) * perspectiveFactor;
    
    powerUps.push({
        x: x,
        y: 100,
        width: powerUpType.width * perspectiveFactor,
        height: powerUpType.height * perspectiveFactor,
        originalX: originalX,
        originalWidth: powerUpType.width,
        originalHeight: powerUpType.height,
        color: powerUpType.color,
        effect: powerUpType.effect,
        duration: powerUpType.duration,
        name: powerUpType.name,
        lane: lane
    });
}

// Check collisions between player and game objects
function checkCollisions() {
    const playerHitbox = {
        x: player.x + 10,
        y: player.y + 10,
        width: player.width - 20,
        height: player.height - 20
    };
    
    // Check obstacle collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        if (checkCollision(playerHitbox, obstacle)) {
            // If shield is active, destroy obstacle without damage
            if (activePowerUps.shield > 0) {
                createExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.color);
                obstacles.splice(i, 1);
                continue;
            }
            
            // Player hit obstacle
            lives--;
            updateHUD();
            createExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, '#ff0000');
            obstacles.splice(i, 1);
            
            // Game over if no lives left
            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    }
    
    // Check data packet collisions
    for (let i = dataPacketItems.length - 1; i >= 0; i--) {
        const packet = dataPacketItems[i];
        
        if (checkCollision(playerHitbox, packet)) {
            // Collect data packet
            dataPackets++;
            score += 50;
            updateHUD();
            createExplosion(packet.x + packet.width / 2, packet.y + packet.height / 2, packet.color);
            dataPacketItems.splice(i, 1);
        }
    }
    
    // Check power-up collisions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        if (checkCollision(playerHitbox, powerUp)) {
            // Apply power-up effect
            applyPowerUp(powerUp);
            createExplosion(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.color);
            powerUps.splice(i, 1);
        }
    }
}

// Check if two rectangles are colliding
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Apply power-up effect
function applyPowerUp(powerUp) {
    switch (powerUp.effect) {
        case 'shield':
            activePowerUps.shield = powerUp.duration;
            break;
        case 'slowTime':
            activePowerUps.slowTime = powerUp.duration;
            break;
        case 'magnet':
            activePowerUps.magnet = powerUp.duration;
            break;
        case 'extraLife':
            lives++;
            updateHUD();
            break;
    }
    
    // Show power-up notification
    showNotification(powerUp.name + ' activated!', powerUp.color);
}

// Apply magnet effect to attract data packets
function applyMagnetEffect() {
    const magnetRange = 150;
    const magnetStrength = 3;
    
    dataPacketItems.forEach(packet => {
        const dx = (player.x + player.width / 2) - (packet.x + packet.width / 2);
        const dy = (player.y + player.height / 2) - (packet.y + packet.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < magnetRange) {
            const factor = 1 - (distance / magnetRange);
            packet.x += dx * factor * magnetStrength / 10;
            packet.y += dy * factor * magnetStrength / 10;
        }
    });
}

// Create explosion effect
function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            alpha: 1
        });
    }
}

// Show notification
function showNotification(text, color) {
    // This would be implemented with DOM elements in a full game
    console.log(text);
}

// Update HUD elements
function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('data-packets').textContent = dataPackets;
}

// Game over
function gameOver() {
    gameActive = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// Handle keyboard input
function handleKeyDown(e) {
    if (!gameActive) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            if (player.lane > 0) player.lane--;
            break;
        case 'ArrowRight':
            if (player.lane < LANE_COUNT - 1) player.lane++;
            break;
        case ' ': // Space bar
            if (!player.boosting && player.boostCooldown <= 0) {
                player.boosting = true;
                player.boostTime = player.maxBoostTime;
                gameSpeed *= 1.5; // Temporary speed boost
            }
            break;
        case 'p':
        case 'P':
            gamePaused = !gamePaused;
            break;
    }
}

function handleKeyUp(e) {
    // Additional key handling if needed
}

// Initialize the game when the page loads
window.addEventListener('load', init);