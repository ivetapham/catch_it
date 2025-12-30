const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CONFIG = {
    MANDARIN_SPACING: 120,
    PLAYER_SPEED: 8,
    MANDARIN_FALL_SPEED: 3,
    GAME_WIDTH: 600,
    GAME_HEIGHT: 700,
    TITLE_Y_PERCENT: 0.3,
    MENU_START_Y_PERCENT: 0.55,
    MENU_SPACING_PERCENT: 0.08,
    TITLE_FONT_PERCENT: 0.055,
    SUBTITLE_FONT_PERCENT: 0.014,
    MENU_FONT_PERCENT: 0.02,
    CAPY_X: 20,
    CAPY_Y_OFFSET: 20,
    BG_COLOR: '#ffb482',
    GAME_BG_COLOR: '#87CEEB',
    GROUND_COLOR: '#8B4513',
    TEXT_COLOR: '#ffffff',
    TEXT_OUTLINE_COLOR: '#000000',
    TITLE_OUTLINE_COLOR: '#ff6b6b',
    HOVER_COLOR: '#ffc800',
    GROUND_HEIGHT: 80,
    MANDARIN_SPAWN_RATE: 0.025,
    MANDARIN2_SPAWN_RATE: 0.01,
    MANDARIN3_SPAWN_RATE: 0.005,
    MANDARIN_MIN_SPACING: 60,
    MANDARIN_MIN_SPAWN_DELAY: 300,
    MAX_MANDARINS_ON_SCREEN: 12,
    SCORE_MAND1: 10,
    SCORE_MAND2: 20,
    JSONBIN_BIN_ID: null,
    // Free tier JSONBin.io API key - public key for frontend-only apps is acceptable
    JSONBIN_API_KEY: '$2a$10$61z5IhpULsJXRCgOUSqxIe7Ds94orxG2.6uyDIZOMSeC8zTYBFyj2'
};

let scene = 'menu';

function resizeCanvas() {
    if (scene === 'game') {
        document.body.style.background = '#000000';
        const maxWidth = Math.min(window.innerWidth * 0.95, CONFIG.GAME_WIDTH);
        const maxHeight = Math.min(window.innerHeight * 0.95, CONFIG.GAME_HEIGHT);
        const ratio = Math.min(maxWidth / CONFIG.GAME_WIDTH, maxHeight / CONFIG.GAME_HEIGHT);
        canvas.width = CONFIG.GAME_WIDTH * ratio;
        canvas.height = CONFIG.GAME_HEIGHT * ratio;
    } else {
        document.body.style.background = CONFIG.BG_COLOR;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

resizeCanvas();

const capyImg = new Image();
capyImg.src = 'assets/capy2.png';

const mand1Img = new Image();
mand1Img.src = 'assets/mand1.png';

const mand2Img = new Image();
mand2Img.src = 'assets/mand2.png';

const mand3Img = new Image();
mand3Img.src = 'assets/mand3.png';

const mandarinImg = new Image();
mandarinImg.src = 'assets/mandarin.png';

const playerSprites = {
    left: [],
    right: []
};

for (let i = 1; i <= 3; i++) {
    const leftImg = new Image();
    leftImg.src = `assets/sprite_left${i}.png`;
    playerSprites.left.push(leftImg);
    
    const rightImg = new Image();
    rightImg.src = `assets/sprite_right${i}.png`;
    playerSprites.right.push(rightImg);
}

// Audio
const bgMusic = new Audio('sounds/bgm.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.08;

const doneSound = new Audio('sounds/done.mp3');
doneSound.volume = 0.15;

function playPointSound() {
    const sound = new Audio('sounds/point.mp3');
    sound.volume = 0.12;
    sound.play().catch(e => {});
}

let mandarins = [];

function generateMandarinPattern() {
    mandarins = [];
    const spacing = Math.max(100, Math.min(canvas.width, canvas.height) * 0.15);
    for (let y = 0; y < canvas.height + spacing; y += spacing) {
        for (let x = 0; x < canvas.width + spacing; x += spacing) {
            mandarins.push({
                x: x,
                y: y,
                offsetX: Math.random() * 20 - 10,
                offsetY: Math.random() * 20 - 10,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }
}

generateMandarinPattern();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (scene === 'menu') {
        generateMandarinPattern();
    }
});

const menuItems = [
    { text: 'START GAME', y: 0, hover: false },
    { text: 'HOW TO PLAY', y: 0, hover: false },
    { text: 'STATISTICS', y: 0, hover: false }
];

let mouseX = 0;
let mouseY = 0;
let time = 0;

const player = {
    x: 0,
    targetX: 0,
    y: 0,
    direction: 'right',
    spriteFrame: 0,
    spriteTimer: 0
};

const fallingMandarins = [];
let lastMandarinSpawnTime = 0;

let score = 0;
let gameOver = false;
let highScoreSaved = false;
let prevBestBeforeUpdate = 0;
let keys = {};
let playerStats = {
    bestScore: 0,
    totalGames: 0,
    totalPoints: 0,
    averageScore: 0
};

const totalImagesToLoad = 5 + 6;
let imagesLoadedCount = 0;
let gameStarted = false;

function checkAllImagesLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount >= totalImagesToLoad && !gameStarted) {
        gameStarted = true;
        loadStats();
        requestAnimationFrame(gameLoop);
    }
}

capyImg.onload = checkAllImagesLoaded;
mand1Img.onload = checkAllImagesLoaded;
mand2Img.onload = checkAllImagesLoaded;
mand3Img.onload = checkAllImagesLoaded;
mandarinImg.onload = checkAllImagesLoaded;
playerSprites.left.forEach(img => img.onload = checkAllImagesLoaded);
playerSprites.right.forEach(img => img.onload = checkAllImagesLoaded);

if (capyImg.complete) checkAllImagesLoaded();
if (mand1Img.complete) checkAllImagesLoaded();
if (mand2Img.complete) checkAllImagesLoaded();
if (mand3Img.complete) checkAllImagesLoaded();
if (mandarinImg.complete) checkAllImagesLoaded();
playerSprites.left.forEach(img => { if (img.complete) checkAllImagesLoaded(); });
playerSprites.right.forEach(img => { if (img.complete) checkAllImagesLoaded(); });

setTimeout(() => {
    if (!gameStarted) {
        console.log('Starting game...');
        gameStarted = true;
        loadStats();
        requestAnimationFrame(gameLoop);
    }
}, 1000);

function drawText(text, x, y, size, color, outlineColor = '#000000', outlineWidth = 4) {
    ctx.font = `${size}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function checkAndSaveStats() {
    if (highScoreSaved) return;
    highScoreSaved = true;
    prevBestBeforeUpdate = playerStats.bestScore;
    
    const wasNewBest = score > playerStats.bestScore;
    if (wasNewBest) {
        playerStats.bestScore = score;
    }
    playerStats.totalGames += 1;
    playerStats.totalPoints += score;
    playerStats.averageScore = Math.round(playerStats.totalPoints / playerStats.totalGames);
    
    localStorage.setItem('catchItStats', JSON.stringify(playerStats));
    saveStats();
}

async function loadStats() {
    const localStats = localStorage.getItem('catchItStats');
    if (localStats) {
        try {
            const saved = JSON.parse(localStats);
            playerStats.bestScore = saved.bestScore || 0;
            playerStats.totalGames = saved.totalGames || 0;
            playerStats.totalPoints = saved.totalPoints || 0;
            playerStats.averageScore = saved.averageScore || 0;
            console.log('Stats loaded from localStorage:', playerStats);
        } catch (e) {
            console.log('Error loading from localStorage:', e);
        }
    }
    
    if (CONFIG.JSONBIN_API_KEY && CONFIG.JSONBIN_BIN_ID) {
        console.log('Loading stats from API, Bin ID:', CONFIG.JSONBIN_BIN_ID);
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN_API_KEY
                }
            });
            
            console.log('API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                if (data.record && data.record.bestScore !== undefined) {
                    playerStats = data.record;
                    localStorage.setItem('catchItStats', JSON.stringify(playerStats));
                    console.log('Stats loaded from API:', playerStats);
                }
            } else {
                console.log('API error:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('Failed to load stats from API, using localStorage:', error.message);
        }
    } else if (CONFIG.JSONBIN_API_KEY) {
        console.log('API key set but no Bin ID. Will create on first save.');
    } else {
        console.log('API key not set, using localStorage only');
    }
    
    return Promise.resolve();
}

async function saveStats() {
    if (CONFIG.JSONBIN_API_KEY) {
        if (!CONFIG.JSONBIN_BIN_ID) {
            console.log('First save - creating new bin in API...');
            try {
                const response = await fetch('https://api.jsonbin.io/v3/b', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.JSONBIN_API_KEY,
                        'X-Bin-Name': 'CatchIt-Stats'
                    },
                    body: JSON.stringify(playerStats)
                });
                
                console.log('API response status (POST):', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    CONFIG.JSONBIN_BIN_ID = data.metadata.id;
                    console.log('Stats saved to API. Bin ID:', CONFIG.JSONBIN_BIN_ID);
                    console.log('Saved data:', playerStats);
                } else {
                    const errorText = await response.text();
                    console.log('API error creating bin:', response.status, errorText);
                }
            } catch (error) {
                console.log('Failed to create bin in API:', error.message);
                console.log('Using localStorage');
            }
        } else {
            console.log('Updating existing bin in API, Bin ID:', CONFIG.JSONBIN_BIN_ID);
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.JSONBIN_API_KEY
                    },
                    body: JSON.stringify(playerStats)
                });
                
                console.log('API response status (PUT):', response.status);
                
                if (response.ok) {
                    console.log('Stats updated in API');
                    console.log('Updated data:', playerStats);
                } else {
                    const errorText = await response.text();
                    console.log('API error updating:', response.status, errorText);
                }
            } catch (error) {
                console.log('Failed to update stats in API:', error.message);
                console.log('Using localStorage');
            }
        }
    } else {
        console.log('API key not set, using localStorage only');
    }
}

function drawMenu() {
    ctx.fillStyle = CONFIG.BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    mandarins.forEach(m => {
        const floatX = m.offsetX + Math.sin(time * 0.001 * m.speed + m.x) * 15;
        const floatY = m.offsetY + Math.cos(time * 0.001 * m.speed + m.y) * 15;
        const angle = Math.sin(time * 0.001 * m.speed) * 10;
        
        ctx.save();
        ctx.translate(m.x + floatX, m.y + floatY);
        ctx.rotate(angle * Math.PI / 180);
        ctx.globalAlpha = 0.6;
        if (mandarinImg.complete) {
            const mandWidth = mandarinImg.naturalWidth || mandarinImg.width;
            const mandHeight = mandarinImg.naturalHeight || mandarinImg.height;
            ctx.drawImage(mandarinImg, -mandWidth/2, -mandHeight/2, mandWidth, mandHeight);
        }
        ctx.restore();
    });
    
    const titleY = canvas.height * CONFIG.TITLE_Y_PERCENT;
    const titleBounce = Math.sin(time * 0.003) * 8;
    const fontSize = canvas.width * CONFIG.TITLE_FONT_PERCENT;
    const titleX = canvas.width / 2;
    const titleYPos = titleY + titleBounce;
    
    ctx.font = `${fontSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.strokeStyle = CONFIG.TITLE_OUTLINE_COLOR;
    ctx.lineWidth = 8;
    ctx.strokeText('CATCH IT', titleX, titleYPos);
    
    drawText('CATCH IT', titleX, titleYPos, fontSize, CONFIG.TEXT_COLOR, CONFIG.TEXT_OUTLINE_COLOR, 4);
    
    const subSize = canvas.width * CONFIG.SUBTITLE_FONT_PERCENT;
    drawText('Catch the Mandarins!', canvas.width / 2, titleY + 60, subSize, CONFIG.TEXT_COLOR, CONFIG.TEXT_OUTLINE_COLOR, 3);
    
    const menuStartY = canvas.height * CONFIG.MENU_START_Y_PERCENT;
    const menuSpacing = canvas.height * CONFIG.MENU_SPACING_PERCENT;
    const textSize = canvas.width * CONFIG.MENU_FONT_PERCENT;
    
    menuItems.forEach((item, i) => {
        item.y = menuStartY + i * menuSpacing;
        const color = item.hover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR;
        const lift = item.hover ? -3 : 0;
        drawText(item.text, canvas.width / 2, item.y + lift, textSize, color, CONFIG.TEXT_OUTLINE_COLOR, 4);
    });
    
    if (capyImg.complete) {
        const capyScale = Math.min(1, Math.min(canvas.width / 800, canvas.height / 600));
        const capyWidth = capyImg.naturalWidth * capyScale;
        const capyHeight = capyImg.naturalHeight * capyScale;
        const capyX = canvas.width * 0.02;
        const capyY = canvas.height - capyHeight - (canvas.height * 0.02);
        ctx.drawImage(capyImg, capyX, capyY, capyWidth, capyHeight);
    }
    
    ctx.font = `${canvas.width * 0.009}px "Press Start 2P"`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('v1.0', canvas.width / 2, canvas.height - 20);
}

function drawHowTo() {
    ctx.fillStyle = CONFIG.BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const boxW = canvas.width * 0.75;
    const boxH = canvas.height * 0.8;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    const fontSize = canvas.width * 0.024;
    ctx.font = `${fontSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('HOW TO PLAY', canvas.width / 2, boxY + 50);
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText('HOW TO PLAY', canvas.width / 2, boxY + 50);
    
    ctx.fillStyle = '#333333';
    const textSize = canvas.width * 0.012;
    ctx.font = `${textSize}px "Press Start 2P"`;
    ctx.textAlign = 'left';
    let currentY = boxY + 110;
    const lineH = canvas.height * 0.035;
    
    ctx.fillText('CONTROLS:', boxX + 40, currentY);
    currentY += lineH * 1.5;
    ctx.fillText('Move: LEFT/RIGHT arrows or A/D keys', boxX + 60, currentY);
    currentY += lineH * 2;
    
    ctx.fillText('MANDARINS:', boxX + 40, currentY);
    currentY += lineH * 1.5;
    
    if (mand1Img.complete) {
        const mandSize = (mand1Img.naturalWidth || mand1Img.width) * 0.8;
        ctx.drawImage(mand1Img, boxX + 60, currentY - mandSize/2, mandSize, mandSize);
        ctx.fillText('Orange mandarin: +10 points', boxX + 60 + mandSize + 20, currentY);
        currentY += lineH * 1.5;
    }
    
    if (mand2Img.complete) {
        const mandSize = (mand2Img.naturalWidth || mand2Img.width) * 0.8;
        ctx.drawImage(mand2Img, boxX + 60, currentY - mandSize/2, mandSize, mandSize);
        ctx.fillText('Blue mandarin: +20 points', boxX + 60 + mandSize + 20, currentY);
        currentY += lineH * 1.5;
    }
    
    if (mand3Img.complete) {
        const mandSize = (mand3Img.naturalWidth || mand3Img.width) * 0.8;
        ctx.drawImage(mand3Img, boxX + 60, currentY - mandSize/2, mandSize, mandSize);
        ctx.fillText('Red mandarin: POISON! Don\'t catch!', boxX + 60 + mandSize + 20, currentY);
        currentY += lineH * 1.5;
    }
    
    currentY += lineH;
    ctx.fillText('If edible mandarin hits the ground:', boxX + 40, currentY);
    currentY += lineH * 1.2;
    ctx.fillText('GAME OVER!', boxX + 60, currentY);
    
    const backY = boxY + boxH - 50;
    const backHover = Math.abs(mouseX - canvas.width / 2) < 60 && 
                      Math.abs(mouseY - backY) < 20;
    
    ctx.textAlign = 'center';
    const backSize = canvas.width * 0.016;
    ctx.font = `${backSize}px 'Press Start 2P'`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('BACK', canvas.width / 2, backY);
    ctx.fillStyle = backHover ? '#ffc800' : '#4ecdc4';
    ctx.fillText('BACK', canvas.width / 2, backY);
}

function drawStats() {
    ctx.fillStyle = CONFIG.BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const boxW = canvas.width * 0.7;
    const boxH = canvas.height * 0.75;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    const fontSize = canvas.width * 0.024;
    ctx.font = `${fontSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('STATISTICS', canvas.width / 2, boxY + 50);
    ctx.fillStyle = '#ffe66d';
    ctx.fillText('STATISTICS', canvas.width / 2, boxY + 50);
    
    ctx.fillStyle = '#333333';
    const textSize = canvas.width * 0.016;
    ctx.font = `${textSize}px "Press Start 2P"`;
    ctx.textAlign = 'left';
    
    const startY = boxY + 120;
    const lineH = canvas.height * 0.06;
    
    const bestScoreY = startY;
    ctx.fillStyle = '#ffc800';
    ctx.fillText('Best Score:', boxX + 60, bestScoreY);
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.bestScore.toString(), boxX + boxW - 60, bestScoreY);
    ctx.textAlign = 'left';
    
    const gamesY = startY + lineH;
    ctx.fillText('Games Played:', boxX + 60, gamesY);
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.totalGames.toString(), boxX + boxW - 60, gamesY);
    ctx.textAlign = 'left';
    
    const pointsY = startY + lineH * 2;
    ctx.fillText('Total Points:', boxX + 60, pointsY);
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.totalPoints.toString(), boxX + boxW - 60, pointsY);
    ctx.textAlign = 'left';
    
    const avgY = startY + lineH * 3;
    ctx.fillText('Average Score:', boxX + 60, avgY);
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.averageScore.toString(), boxX + boxW - 60, avgY);
    ctx.textAlign = 'left';
    
    const backY = boxY + boxH - 50;
    const backHover = Math.abs(mouseX - canvas.width / 2) < 60 && 
                      Math.abs(mouseY - backY) < 20;
    
    ctx.textAlign = 'center';
    const backSize = canvas.width * 0.016;
    ctx.font = `${backSize}px 'Press Start 2P'`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('BACK', canvas.width / 2, backY);
    ctx.fillStyle = backHover ? '#ffc800' : '#ffe66d';
    ctx.fillText('BACK', canvas.width / 2, backY);
}

function initGame() {
    resizeCanvas();
    const scaleX = canvas.width / CONFIG.GAME_WIDTH;
    player.direction = 'right';
    player.spriteFrame = 0;
    player.spriteTimer = 0;
    fallingMandarins.length = 0;
    lastMandarinSpawnTime = 0;
    score = 0;
    gameOver = false;
    highScoreSaved = false;
    prevBestBeforeUpdate = 0;
    keys = {};
    loadStats();
    player.x = 0;
    player.targetX = 0;
    
    bgMusic.play().catch(e => console.log('Music play failed:', e));
}

function getGroundY() {
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    return (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
}

function updatePlayerGroundPosition() {
    const groundY = getGroundY();
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        const playerHeight = img.naturalHeight || img.height;
        player.y = groundY - playerHeight;
    }
}

function updateGame(deltaTime) {
    if (gameOver) return;
    
    const scaleX = canvas.width / CONFIG.GAME_WIDTH;
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    
    updatePlayerGroundPosition();
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.targetX -= CONFIG.PLAYER_SPEED * scaleX;
        player.direction = 'left';
        player.spriteTimer += deltaTime;
        if (player.spriteTimer > 150) {
            player.spriteFrame = (player.spriteFrame + 1) % 3;
            player.spriteTimer = 0;
        }
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.targetX += CONFIG.PLAYER_SPEED * scaleX;
        player.direction = 'right';
        player.spriteTimer += deltaTime;
        if (player.spriteTimer > 150) {
            player.spriteFrame = (player.spriteFrame + 1) % 3;
            player.spriteTimer = 0;
        }
    }
    
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        const playerWidth = img.naturalWidth || img.width;
        player.targetX = Math.max(0, Math.min(canvas.width - playerWidth, player.targetX));
    }
    
    const smoothFactor = 0.15;
    player.x += (player.targetX - player.x) * smoothFactor;
    
    let mandSize = 50;
    if (mand1Img.complete) {
        mandSize = mand1Img.naturalWidth || mand1Img.width;
    }
    const minSpacing = CONFIG.MANDARIN_MIN_SPACING * scaleY;
    
    const canSpawn = fallingMandarins.length < CONFIG.MAX_MANDARINS_ON_SCREEN;
    
    const timeSinceLastSpawn = time - lastMandarinSpawnTime;
    const timeOK = timeSinceLastSpawn >= CONFIG.MANDARIN_MIN_SPAWN_DELAY;
    
    let closestY = -9999;
    fallingMandarins.forEach(mand => {
        if (mand.y > closestY) closestY = mand.y;
    });
    const spacingOK = (closestY < -minSpacing || fallingMandarins.length < 3);
    
    if (canSpawn && spacingOK && timeOK) {
        let spawned = false;
        
        if (!spawned && Math.random() < CONFIG.MANDARIN_SPAWN_RATE) {
            fallingMandarins.push({
                x: Math.random() * (canvas.width - mandSize),
                y: -mandSize,
                type: 1,
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
            lastMandarinSpawnTime = time;
            spawned = true;
        }
        
        if (!spawned && Math.random() < CONFIG.MANDARIN2_SPAWN_RATE) {
            fallingMandarins.push({
                x: Math.random() * (canvas.width - mandSize),
                y: -mandSize,
                type: 2,
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
            lastMandarinSpawnTime = time;
            spawned = true;
        }
        
        if (!spawned && Math.random() < CONFIG.MANDARIN3_SPAWN_RATE) {
            fallingMandarins.push({
                x: Math.random() * (canvas.width - mandSize),
                y: -mandSize,
                type: 3,
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
            lastMandarinSpawnTime = time;
            spawned = true;
        }
    }
    
    const groundY = (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
    
    for (let i = fallingMandarins.length - 1; i >= 0; i--) {
        const mand = fallingMandarins[i];
        mand.y += CONFIG.MANDARIN_FALL_SPEED * scaleY;
        if (!mand.wobbleTime) mand.wobbleTime = 0;
        mand.wobbleTime += mand.wobbleSpeed;
        
        updatePlayerGroundPosition();
        
        const spriteArray = playerSprites[player.direction];
        if (!spriteArray[player.spriteFrame] || !spriteArray[player.spriteFrame].complete) continue;
        const playerImg = spriteArray[player.spriteFrame];
        const playerSizeX = playerImg.naturalWidth || playerImg.width;
        const playerSizeY = playerImg.naturalHeight || playerImg.height;
        
        let img;
        if (mand.type === 1) img = mand1Img;
        else if (mand.type === 2) img = mand2Img;
        else if (mand.type === 3) img = mand3Img;
        if (!img || !img.complete) continue;
        const mandWidth = img.naturalWidth || img.width;
        const mandHeight = img.naturalHeight || img.height;
        
        const wobbleAmount = Math.sin(mand.wobbleTime + mand.wobbleOffset) * 5;
        const mandActualX = mand.x + wobbleAmount;
        
        if (mand.y + mandHeight > player.y &&
            mand.y < player.y + playerSizeY &&
            mandActualX + mandWidth > player.x &&
            mandActualX < player.x + playerSizeX) {
            
            if (mand.type === 3) {
                gameOver = true;
                bgMusic.pause();
                doneSound.play().catch(e => {});
                checkAndSaveStats();
                break;
            }
            
            score += mand.type === 1 ? CONFIG.SCORE_MAND1 : CONFIG.SCORE_MAND2;
            playPointSound();
            fallingMandarins.splice(i, 1);
            continue;
        }
        
        if (mand.y + mandHeight >= groundY) {
            if (mand.type === 3) {
                fallingMandarins.splice(i, 1);
                continue;
            }
            gameOver = true;
            bgMusic.pause();
            doneSound.play().catch(e => {});
            checkAndSaveStats();
            break;
        }
        
        if (mand.y > canvas.height) {
            fallingMandarins.splice(i, 1);
        }
    }
}

function drawGame() {
    const scaleX = canvas.width / CONFIG.GAME_WIDTH;
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    const groundY = (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
    const groundHeight = CONFIG.GROUND_HEIGHT * scaleY;
    
    ctx.fillStyle = CONFIG.GAME_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = CONFIG.GROUND_COLOR;
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3 * scaleY;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    fallingMandarins.forEach(mand => {
        let img;
        if (mand.type === 1) img = mand1Img;
        else if (mand.type === 2) img = mand2Img;
        else if (mand.type === 3) img = mand3Img;
        
        if (img && img.complete) {
            const mandWidth = img.naturalWidth || img.width;
            const mandHeight = img.naturalHeight || img.height;
            
            const wobbleAmount = Math.sin(mand.wobbleTime + mand.wobbleOffset) * 5;
            const wobbleAngle = Math.sin(mand.wobbleTime + mand.wobbleOffset) * 0.1;
            
            ctx.save();
            ctx.translate(mand.x + mandWidth / 2 + wobbleAmount, mand.y + mandHeight / 2);
            ctx.rotate(wobbleAngle);
            ctx.drawImage(img, -mandWidth / 2, -mandHeight / 2, mandWidth, mandHeight);
            ctx.restore();
        }
    });
    
    updatePlayerGroundPosition();
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        const playerWidth = img.naturalWidth || img.width;
        const playerHeight = img.naturalHeight || img.height;
        
        if (player.x === 0) {
            player.x = (canvas.width / 2 - playerWidth / 2);
            player.targetX = player.x;
        }
        
        ctx.drawImage(
            img,
            player.x,
            player.y,
            playerWidth,
            playerHeight
        );
    }
    
    const scoreSize = canvas.width * 0.025;
    drawText(`SCORE: ${score}`, canvas.width / 2, 50 * scaleY, scoreSize, CONFIG.TEXT_COLOR);
    
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gameOverSize = canvas.width * 0.05;
        drawText('GAME OVER', canvas.width / 2, canvas.height / 2 - 120 * scaleY, gameOverSize, '#ff6b6b');
        
        const prevBest = prevBestBeforeUpdate;
        const isNewRecord = score > prevBest;
        
        const finalScoreSize = canvas.width * 0.028;
        drawText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 50 * scaleY, finalScoreSize, CONFIG.TEXT_COLOR);
        
        const bestScoreSize = canvas.width * 0.018;
        if (isNewRecord) {
            drawText('NEW PERSONAL BEST!', canvas.width / 2, canvas.height / 2 + 5 * scaleY, bestScoreSize, '#ffc800');
        } else if (prevBest > 0) {
            drawText(`Your Best: ${prevBest}`, canvas.width / 2, canvas.height / 2 + 5 * scaleY, bestScoreSize, CONFIG.TEXT_COLOR);
        } else {
            drawText('Your Best: 0', canvas.width / 2, canvas.height / 2 + 5 * scaleY, bestScoreSize, CONFIG.TEXT_COLOR);
        }
        
        const restartY = canvas.height / 2 + 60 * scaleY;
        const restartSize = canvas.width * 0.022;
        const restartHover = Math.abs(mouseX - canvas.width / 2) < 120 && 
                            Math.abs(mouseY - restartY) < 25;
        drawText('Restart (SPACE)', canvas.width / 2, restartY, restartSize, restartHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
        
        const menuY = canvas.height / 2 + 110 * scaleY;
        const menuSize = canvas.width * 0.02;
        const menuHover = Math.abs(mouseX - canvas.width / 2) < 140 && 
                         Math.abs(mouseY - menuY) < 25;
        drawText('Exit to Menu (ESC)', canvas.width / 2, menuY, menuSize, menuHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
    }
}

function render() {
    if (scene === 'menu') drawMenu();
    else if (scene === 'howto') drawHowTo();
    else if (scene === 'stats') drawStats();
    else if (scene === 'game') drawGame();
}

function updateHover() {
    if (scene === 'menu') {
        const textSize = canvas.width * CONFIG.MENU_FONT_PERCENT;
        ctx.font = `${textSize}px 'Press Start 2P'`;
        
        menuItems.forEach(item => {
            const textWidth = ctx.measureText(item.text).width;
            const textHeight = textSize;
            const x = canvas.width / 2 - textWidth / 2;
            const y = item.y - textHeight / 2;
            
            item.hover = mouseX > x && mouseX < x + textWidth && 
                        mouseY > y && mouseY < y + textHeight;
        });
    }
}

let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    time = timestamp;
    
    if (scene === 'game') {
        updateGame(deltaTime);
    } else {
        updateHover();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const anyHover = menuItems.some(item => item.hover) || 
                    (scene !== 'menu' && scene !== 'game') ||
                    (scene === 'game' && gameOver && (
                        (Math.abs(mouseX - canvas.width / 2) < 120 && Math.abs(mouseY - (canvas.height / 2 + 50 * (canvas.height / CONFIG.GAME_HEIGHT))) < 25) ||
                        (Math.abs(mouseX - canvas.width / 2) < 140 && Math.abs(mouseY - (canvas.height / 2 + 100 * (canvas.height / CONFIG.GAME_HEIGHT))) < 25)
                    ));
    canvas.style.cursor = anyHover ? 'pointer' : 'default';
});

canvas.addEventListener('click', () => {
    if (scene === 'menu') {
        menuItems.forEach(item => {
            if (item.hover) {
                if (item.text === 'START GAME') {
                    scene = 'game';
                    resizeCanvas();
                    initGame();
                } else if (item.text === 'HOW TO PLAY') {
                    scene = 'howto';
                    resizeCanvas();
                } else if (item.text === 'STATISTICS') {
                    scene = 'stats';
                    resizeCanvas();
                }
            }
        });
    } else if (scene === 'game' && gameOver) {
        const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
        const restartY = canvas.height / 2 + 50 * scaleY;
        const menuY = canvas.height / 2 + 100 * scaleY;
        
        if (Math.abs(mouseX - canvas.width / 2) < 120 && 
            Math.abs(mouseY - restartY) < 25) {
            initGame();
        } else if (Math.abs(mouseX - canvas.width / 2) < 140 && 
                   Math.abs(mouseY - menuY) < 25) {
            scene = 'menu';
            resizeCanvas();
            bgMusic.pause();
        }
    } else if (scene === 'howto' || scene === 'stats') {
        const boxH = scene === 'stats' ? canvas.height * 0.75 : canvas.height * 0.8;
        const boxY = (canvas.height - boxH) / 2;
        const backY = boxY + boxH - 50;
        if (Math.abs(mouseX - canvas.width / 2) < 60 && 
            Math.abs(mouseY - backY) < 20) {
            scene = 'menu';
            resizeCanvas();
        }
    }
});

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (scene === 'game') {
        if (gameOver && e.key === ' ') {
            initGame();
        } else if (gameOver && e.key === 'Escape') {
            scene = 'menu';
            resizeCanvas();
            bgMusic.pause();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
