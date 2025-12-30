const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== KONSTANTY =====
const CONFIG = {
    // Velikosti objektů (MANDARIN_SIZE už se nepoužívá - používá se původní velikost z obrázku)
    MANDARIN_SPACING: 120,
    PLAYER_SPEED: 8,   // Rychlejší pro hladší pohyb
    MANDARIN_FALL_SPEED: 3,
    
    // Velikost herního plátna (užší pro snazší hraní)
    GAME_WIDTH: 600,
    GAME_HEIGHT: 700,
    
    // Pozice menu
    TITLE_Y_PERCENT: 0.3,
    MENU_START_Y_PERCENT: 0.55,
    MENU_SPACING_PERCENT: 0.08,
    
    // Velikosti textu (v % z šířky)
    TITLE_FONT_PERCENT: 0.055,
    SUBTITLE_FONT_PERCENT: 0.014,
    MENU_FONT_PERCENT: 0.02,
    
    // Capy pozice
    CAPY_X: 20,
    CAPY_Y_OFFSET: 20,
    
    // Barvy
    BG_COLOR: '#ffb482',
    GAME_BG_COLOR: '#87CEEB',
    GROUND_COLOR: '#8B4513',
    TEXT_COLOR: '#ffffff',
    TEXT_OUTLINE_COLOR: '#000000',
    TITLE_OUTLINE_COLOR: '#ff6b6b',
    HOVER_COLOR: '#ffc800',
    
    // Hra
    GROUND_HEIGHT: 80,
    MANDARIN_SPAWN_RATE: 0.025,      // 2.5% šance každý frame (výrazně zvýšeno)
    MANDARIN2_SPAWN_RATE: 0.01,      // 1% šance (méně často)
    MANDARIN3_SPAWN_RATE: 0.005,     // 0.5% šance (nejméně často - game over pokud se chytne)
    MANDARIN_MIN_SPACING: 60,        // Minimální vzdálenost mezi mandarinkami (sníženo pro více mandarinek)
    MANDARIN_MIN_SPAWN_DELAY: 300,   // Minimální časový odstup mezi spawny (v ms)
    MAX_MANDARINS_ON_SCREEN: 12,     // Maximální počet mandarinek na obrazovce (výrazně zvýšeno)
    SCORE_MAND1: 10,
    SCORE_MAND2: 20,
    
    // API pro statistiky (JSONBin.io - zdarma API pro JSON storage)
    // Pro jednoduchost používáme localStorage, ale API je připravené
    JSONBIN_BIN_ID: null, // Bude se vytvořit při prvním uložení (pokud použiješ JSONBin.io)
    JSONBIN_API_KEY: '$2a$10$61z5IhpULsJXRCgOUSqxIe7Ds94orxG2.6uyDIZOMSeC8zTYBFyj2' // Nahraď svým API key z jsonbin.io (nebo nechej prázdné pro localStorage)
};

// ===== STAV HRY (musí být před resizeCanvas) =====
let scene = 'menu';

// Responzivní nastavení
function resizeCanvas() {
    if (scene === 'game') {
        // Přizpůsobit velikost prohlížeči, ale zachovat poměr
        const maxWidth = Math.min(window.innerWidth * 0.95, CONFIG.GAME_WIDTH);
        const maxHeight = Math.min(window.innerHeight * 0.95, CONFIG.GAME_HEIGHT);
        const ratio = Math.min(maxWidth / CONFIG.GAME_WIDTH, maxHeight / CONFIG.GAME_HEIGHT);
        
        canvas.width = CONFIG.GAME_WIDTH * ratio;
        canvas.height = CONFIG.GAME_HEIGHT * ratio;
    } else {
        // Fullscreen pro menu
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

resizeCanvas();

// ===== NAČTENÍ OBRÁZKŮ =====
const capyImg = new Image();
capyImg.src = 'assets/capy2.png';

const mand1Img = new Image();
mand1Img.src = 'assets/mand1.png';

const mand2Img = new Image();
mand2Img.src = 'assets/mand2.png';

const mand3Img = new Image();
mand3Img.src = 'assets/mand3.png';

const mandarinImg = new Image(); // Pro menu pozadí
mandarinImg.src = 'assets/mandarin.png';

// Sprite obrázky pro hráče
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

// Pattern mandarinek pro menu (bude se regenerovat při resize)
let mandarins = [];

function generateMandarinPattern() {
    mandarins = [];
    // Použít aktuální velikost canvasu
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

// Inicializovat pattern při startu
generateMandarinPattern();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (scene === 'menu') {
        generateMandarinPattern(); // Regenerovat při resize v menu
    }
});

// Menu položky
const menuItems = [
    { text: 'START GAME', y: 0, hover: false },
    { text: 'HOW TO PLAY', y: 0, hover: false },
    { text: 'STATISTICS', y: 0, hover: false }
];

// ===== STAV HRY =====
let mouseX = 0;
let mouseY = 0;
let time = 0;

// Hráč
const player = {
    x: 0,
    targetX: 0,  // Pro hladký pohyb
    y: 0,
    direction: 'right', // 'left' nebo 'right'
    spriteFrame: 0,
    spriteTimer: 0
};

// Padající mandarinky
const fallingMandarins = [];
let lastMandarinSpawnTime = 0; // Čas posledního spawnu mandarinky (pro časový odstup)

// Skóre a stav
let score = 0;
let gameOver = false;
let highScoreSaved = false; // Flag aby se high score uložil jen jednou
let prevBestBeforeUpdate = 0; // Předchozí best score před aktualizací (pro zobrazení při game over)
let keys = {};
let playerStats = {
    bestScore: 0,
    totalGames: 0,
    totalPoints: 0,
    averageScore: 0
};

// Načítání obrázků
const totalImagesToLoad = 5 + 6; // capy, mand1, mand2, mand3, mandarin + 6 sprites
let imagesLoadedCount = 0;
let gameStarted = false;

function checkAllImagesLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount >= totalImagesToLoad && !gameStarted) {
        gameStarted = true;
        loadStats(); // Načíst statistiky při startu aplikace
        requestAnimationFrame(gameLoop);
    }
}

// Nastavit onload handlery
capyImg.onload = checkAllImagesLoaded;
mand1Img.onload = checkAllImagesLoaded;
mand2Img.onload = checkAllImagesLoaded;
mand3Img.onload = checkAllImagesLoaded;
mandarinImg.onload = checkAllImagesLoaded;
playerSprites.left.forEach(img => img.onload = checkAllImagesLoaded);
playerSprites.right.forEach(img => img.onload = checkAllImagesLoaded);

// Zkontrolovat již načtené obrázky (cached)
if (capyImg.complete) checkAllImagesLoaded();
if (mand1Img.complete) checkAllImagesLoaded();
if (mand2Img.complete) checkAllImagesLoaded();
if (mand3Img.complete) checkAllImagesLoaded();
if (mandarinImg.complete) checkAllImagesLoaded();
playerSprites.left.forEach(img => { if (img.complete) checkAllImagesLoaded(); });
playerSprites.right.forEach(img => { if (img.complete) checkAllImagesLoaded(); });

// Fallback - spustit hru i když se obrázky nenačtou
setTimeout(() => {
    if (!gameStarted) {
        console.log('Spouštění hry...');
        gameStarted = true;
        loadStats(); // Načíst statistiky při startu aplikace
        requestAnimationFrame(gameLoop);
    }
}, 1000);

// ===== FUNKCE PRO TEXT =====
function drawText(text, x, y, size, color, outlineColor = '#000000', outlineWidth = 4) {
    ctx.font = `${size}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Obrys
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.strokeText(text, x, y);
    
    // Výplň
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

// ===== AJAX FUNKCE PRO STATISTIKY =====

// Uložit statistiky (voláno při game over) - AJAX
function checkAndSaveStats() {
    if (highScoreSaved) return; // Uložit jen jednou
    highScoreSaved = true;
    
    // Uložit předchozí best score před aktualizací (pro zobrazení)
    prevBestBeforeUpdate = playerStats.bestScore;
    
    // Aktualizovat statistiky
    const wasNewBest = score > playerStats.bestScore;
    if (wasNewBest) {
        playerStats.bestScore = score;
    }
    playerStats.totalGames += 1;
    playerStats.totalPoints += score;
    playerStats.averageScore = Math.round(playerStats.totalPoints / playerStats.totalGames);
    
    // Uložit do localStorage
    localStorage.setItem('catchItStats', JSON.stringify(playerStats));
    
    // Uložit přes API (AJAX)
    saveStats();
}

// Načíst statistiky z API nebo localStorage (AJAX)
async function loadStats() {
    // Nejdřív zkusit načíst z localStorage (fallback)
    const localStats = localStorage.getItem('catchItStats');
    if (localStats) {
        try {
            const saved = JSON.parse(localStats);
            playerStats.bestScore = saved.bestScore || 0;
            playerStats.totalGames = saved.totalGames || 0;
            playerStats.totalPoints = saved.totalPoints || 0;
            playerStats.averageScore = saved.averageScore || 0;
            console.log('📦 Statistiky načteny z localStorage:', playerStats);
        } catch (e) {
            console.log('❌ Chyba při načítání z localStorage:', e);
        }
    }
    
    // Potom zkusit načíst z API (AJAX) - pokud máme API key
    if (CONFIG.JSONBIN_API_KEY && CONFIG.JSONBIN_BIN_ID) {
        console.log('🌐 Pokus o načtení statistik z API, Bin ID:', CONFIG.JSONBIN_BIN_ID);
        try {
            const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}/latest`, {
                method: 'GET',
                headers: {
                    'X-Master-Key': CONFIG.JSONBIN_API_KEY
                }
            });
            
            console.log('📡 API Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                if (data.record && data.record.bestScore !== undefined) {
                    playerStats = data.record;
                    // Aktualizovat localStorage
                    localStorage.setItem('catchItStats', JSON.stringify(playerStats));
                    console.log('✅ Statistiky načteny z API:', playerStats);
                }
            } else {
                console.log('⚠️ API vrátilo chybu:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('❌ Nepodařilo se načíst statistiky z API, použije se localStorage:', error.message);
        }
    } else if (CONFIG.JSONBIN_API_KEY) {
        console.log('ℹ️ API key je nastaven, ale Bin ID není. Při prvním uložení se vytvoří.');
    } else {
        console.log('ℹ️ API key není nastaven, používá se pouze localStorage');
    }
    
    return Promise.resolve();
}

// Uložit statistiky přes AJAX
async function saveStats() {
    // Uložit přes API (AJAX) - pokud máme API key
    if (CONFIG.JSONBIN_API_KEY) {
        if (!CONFIG.JSONBIN_BIN_ID) {
            // První uložení - vytvořit nový bin
            console.log('🌐 První uložení - vytváření nového bin v API...');
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
                
                console.log('📡 API Response status (POST):', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    CONFIG.JSONBIN_BIN_ID = data.metadata.id;
                    console.log('✅ Statistiky uloženy do API! Bin ID:', CONFIG.JSONBIN_BIN_ID);
                    console.log('📊 Uložená data:', playerStats);
                } else {
                    const errorText = await response.text();
                    console.log('❌ API vrátilo chybu při vytváření bin:', response.status, errorText);
                }
            } catch (error) {
                console.log('❌ Nepodařilo se vytvořit bin v API:', error.message);
                console.log('💾 Používá se localStorage');
            }
        } else {
            // Aktualizovat existující bin
            console.log('🔄 Aktualizování existujícího bin v API, Bin ID:', CONFIG.JSONBIN_BIN_ID);
            try {
                const response = await fetch(`https://api.jsonbin.io/v3/b/${CONFIG.JSONBIN_BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': CONFIG.JSONBIN_API_KEY
                    },
                    body: JSON.stringify(playerStats)
                });
                
                console.log('📡 API Response status (PUT):', response.status);
                
                if (response.ok) {
                    console.log('✅ Statistiky aktualizovány v API!');
                    console.log('📊 Aktualizovaná data:', playerStats);
                } else {
                    const errorText = await response.text();
                    console.log('❌ API vrátilo chybu při aktualizaci:', response.status, errorText);
                }
            } catch (error) {
                console.log('❌ Nepodařilo se aktualizovat statistiky v API:', error.message);
                console.log('💾 Používá se localStorage');
            }
        }
    } else {
        console.log('ℹ️ API key není nastaven, používá se pouze localStorage');
    }
}

// ===== MENU SCÉNA =====
function drawMenu() {
    ctx.fillStyle = CONFIG.BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Animované mandarinky pozadí
    mandarins.forEach(m => {
        const floatX = m.offsetX + Math.sin(time * 0.001 * m.speed + m.x) * 15;
        const floatY = m.offsetY + Math.cos(time * 0.001 * m.speed + m.y) * 15;
        const angle = Math.sin(time * 0.001 * m.speed) * 10;
        
        ctx.save();
        ctx.translate(m.x + floatX, m.y + floatY);
        ctx.rotate(angle * Math.PI / 180);
        ctx.globalAlpha = 0.6;
        if (mandarinImg.complete) {
            // Použít původní velikost z obrázku (bez škálování)
            const mandWidth = mandarinImg.naturalWidth || mandarinImg.width;
            const mandHeight = mandarinImg.naturalHeight || mandarinImg.height;
            ctx.drawImage(mandarinImg, -mandWidth/2, -mandHeight/2, mandWidth, mandHeight);
        }
        ctx.restore();
    });
    
    // Nadpis s bounce efektem
    const titleY = canvas.height * CONFIG.TITLE_Y_PERCENT;
    const titleBounce = Math.sin(time * 0.003) * 8;
    const fontSize = canvas.width * CONFIG.TITLE_FONT_PERCENT;
    const titleX = canvas.width / 2;
    const titleYPos = titleY + titleBounce;
    
    // Dvojitý obrys (červený vnější + černý vnitřní)
    ctx.font = `${fontSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Červený obrys (vnější)
    ctx.strokeStyle = CONFIG.TITLE_OUTLINE_COLOR;
    ctx.lineWidth = 8;
    ctx.strokeText('CATCH IT', titleX, titleYPos);
    
    // Černý obrys + bílá výplň (použijeme funkci drawText)
    drawText('CATCH IT', titleX, titleYPos, fontSize, CONFIG.TEXT_COLOR, CONFIG.TEXT_OUTLINE_COLOR, 4);
    
    // Podnadpis
    const subSize = canvas.width * CONFIG.SUBTITLE_FONT_PERCENT;
    drawText('Catch the Mandarins!', canvas.width / 2, titleY + 60, subSize, CONFIG.TEXT_COLOR, CONFIG.TEXT_OUTLINE_COLOR, 3);
    
    // Menu položky
    const menuStartY = canvas.height * CONFIG.MENU_START_Y_PERCENT;
    const menuSpacing = canvas.height * CONFIG.MENU_SPACING_PERCENT;
    const textSize = canvas.width * CONFIG.MENU_FONT_PERCENT;
    
    menuItems.forEach((item, i) => {
        item.y = menuStartY + i * menuSpacing;
        const color = item.hover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR;
        const lift = item.hover ? -3 : 0;
        drawText(item.text, canvas.width / 2, item.y + lift, textSize, color, CONFIG.TEXT_OUTLINE_COLOR, 4);
    });
    
    // Capy vlevo dole (responzivní)
    if (capyImg.complete) {
        // Škálovat podle velikosti canvasu (ale maximálně původní velikost)
        const capyScale = Math.min(1, Math.min(canvas.width / 800, canvas.height / 600));
        const capyWidth = capyImg.naturalWidth * capyScale;
        const capyHeight = capyImg.naturalHeight * capyScale;
        const capyX = canvas.width * 0.02; // 2% z šířky místo fixní hodnoty
        const capyY = canvas.height - capyHeight - (canvas.height * 0.02); // 2% z výšky
        ctx.drawImage(capyImg, capyX, capyY, capyWidth, capyHeight);
    }
    
    // Verze
    ctx.font = `${canvas.width * 0.009}px "Press Start 2P"`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('v1.0', canvas.width / 2, canvas.height - 20);
}

// How to Play scéna
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
    
    // Ovládání
    ctx.fillText('CONTROLS:', boxX + 40, currentY);
    currentY += lineH * 1.5;
    ctx.fillText('Move: LEFT/RIGHT arrows or A/D keys', boxX + 60, currentY);
    currentY += lineH * 2;
    
    // Mandarinky
    ctx.fillText('MANDARINS:', boxX + 40, currentY);
    currentY += lineH * 1.5;
    
    // Oranžová mandarinka (mand1)
    if (mand1Img.complete) {
        const mandSize = (mand1Img.naturalWidth || mand1Img.width) * 0.8;
        ctx.drawImage(mand1Img, boxX + 60, currentY - mandSize/2, mandSize, mandSize);
        ctx.fillText('Orange mandarin: +10 points', boxX + 60 + mandSize + 20, currentY);
        currentY += lineH * 1.5;
    }
    
    // Modrá mandarinka (mand2)
    if (mand2Img.complete) {
        const mandSize = (mand2Img.naturalWidth || mand2Img.width) * 0.8;
        ctx.drawImage(mand2Img, boxX + 60, currentY - mandSize/2, mandSize, mandSize);
        ctx.fillText('Blue mandarin: +20 points', boxX + 60 + mandSize + 20, currentY);
        currentY += lineH * 1.5;
    }
    
    // Červená mandarinka (mand3)
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

// Statistics scéna
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
    
    // Best Score
    const bestScoreY = startY;
    ctx.fillStyle = '#ffc800'; // Zlatá pro best score
    ctx.fillText('Best Score:', boxX + 60, bestScoreY);
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.bestScore.toString(), boxX + boxW - 60, bestScoreY);
    ctx.textAlign = 'left';
    
    // Total Games
    const gamesY = startY + lineH;
    ctx.fillText('Games Played:', boxX + 60, gamesY);
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.totalGames.toString(), boxX + boxW - 60, gamesY);
    ctx.textAlign = 'left';
    
    // Total Points
    const pointsY = startY + lineH * 2;
    ctx.fillText('Total Points:', boxX + 60, pointsY);
    ctx.textAlign = 'right';
    ctx.fillText(playerStats.totalPoints.toString(), boxX + boxW - 60, pointsY);
    ctx.textAlign = 'left';
    
    // Average Score
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

// ===== HRACÍ SCÉNA =====
function initGame() {
    resizeCanvas(); // Zajistit správnou velikost canvasu
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
    // Načíst aktuální statistiky před startem nové hry
    loadStats();
    // Pozice hráče se nastaví v drawGame() po načtení sprites
    player.x = 0;
    player.targetX = 0;
}

// Pomocná funkce pro získání aktuálního groundY
function getGroundY() {
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    return (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
}

// Pomocná funkce pro aktualizaci pozice hráče na zemi
function updatePlayerGroundPosition() {
    const groundY = getGroundY();
    // Použít skutečnou výšku sprite z obrázku (bez škálování)
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        const playerHeight = img.naturalHeight || img.height;
        // Spodní okraj sprite na groundY
        player.y = groundY - playerHeight;
    }
}

function updateGame(deltaTime) {
    if (gameOver) return;
    
    // Výpočet scale pro správné pozice
    const scaleX = canvas.width / CONFIG.GAME_WIDTH;
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    
    // Aktualizovat pozici hráče na zemi
    updatePlayerGroundPosition();
    
    // Hladký pohyb hráče s interpolací
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
    
    // Omezení targetX na obrazovku - použít skutečnou šířku sprite (bez škálování)
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        const playerWidth = img.naturalWidth || img.width;
        player.targetX = Math.max(0, Math.min(canvas.width - playerWidth, player.targetX));
    }
    
    // Hladká interpolace pozice (smoother pohyb)
    const smoothFactor = 0.15;
    player.x += (player.targetX - player.x) * smoothFactor;
    
    // Spawn mandarinek s kontrolou spacing, max počtu a časového odstupu
    // Použít skutečnou velikost mandarinky z obrázku (bez škálování)
    let mandSize = 50; // default, použije se skutečná velikost z obrázku
    if (mand1Img.complete) {
        mandSize = mand1Img.naturalWidth || mand1Img.width;
    }
    const minSpacing = CONFIG.MANDARIN_MIN_SPACING * scaleY;
    
    // Zkontrolovat, jestli můžeme spawnout novou mandarinku
    const canSpawn = fallingMandarins.length < CONFIG.MAX_MANDARINS_ON_SCREEN;
    
    // Kontrola časového odstupu - mandarinky nesmí padat současně
    const timeSinceLastSpawn = time - lastMandarinSpawnTime;
    const timeOK = timeSinceLastSpawn >= CONFIG.MANDARIN_MIN_SPAWN_DELAY;
    
    // Najít nejbližší mandarinku od vrchu (nejvyšší Y pozice = nejblíže vrchu)
    let closestY = -9999; // Pokud je prázdné, můžeme spawnout
    fallingMandarins.forEach(mand => {
        if (mand.y > closestY) closestY = mand.y;
    });
    // Můžeme spawnout pokud je nejbližší mandarinka dostatečně daleko od vrchu nebo pokud není moc mandarinek
    // Uvolněnější kontrola spacing pro více mandarinek
    const spacingOK = (closestY < -minSpacing || fallingMandarins.length < 3);
    
    if (canSpawn && spacingOK && timeOK) {
        // Spawn pouze jedné mandarinky najednou (aby nepadaly současně)
        // Zkontrolovat všechny typy, ale spawnout maximálně jednu
        let spawned = false;
        
        // Spawn mand1
        if (!spawned && Math.random() < CONFIG.MANDARIN_SPAWN_RATE) {
            fallingMandarins.push({
                x: Math.random() * (canvas.width - mandSize),
                y: -mandSize,
                type: 1, // mand1
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
            lastMandarinSpawnTime = time;
            spawned = true;
        }
        
        // Spawn mand2
        if (!spawned && Math.random() < CONFIG.MANDARIN2_SPAWN_RATE) {
            fallingMandarins.push({
                x: Math.random() * (canvas.width - mandSize),
                y: -mandSize,
                type: 2, // mand2 (hodnotnější)
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
            lastMandarinSpawnTime = time;
            spawned = true;
        }
        
        // Spawn mand3 (game over mandarinka - méně často)
        if (!spawned && Math.random() < CONFIG.MANDARIN3_SPAWN_RATE) {
            fallingMandarins.push({
                x: Math.random() * (canvas.width - mandSize),
                y: -mandSize,
                type: 3, // mand3 (game over pokud se chytne)
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
            lastMandarinSpawnTime = time;
            spawned = true;
        }
    }
    
    // Aktualizace padajících mandarinek
    const groundY = (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
    
    for (let i = fallingMandarins.length - 1; i >= 0; i--) {
        const mand = fallingMandarins[i];
        mand.y += CONFIG.MANDARIN_FALL_SPEED * scaleY;
        // Aktualizace kyvání
        if (!mand.wobbleTime) mand.wobbleTime = 0;
        mand.wobbleTime += mand.wobbleSpeed;
        
        // Aktualizovat pozici hráče na zemi (pro případ resize)
        updatePlayerGroundPosition();
        
        // Získat skutečné rozměry sprite (bez škálování)
        const spriteArray = playerSprites[player.direction];
        if (!spriteArray[player.spriteFrame] || !spriteArray[player.spriteFrame].complete) continue;
        const playerImg = spriteArray[player.spriteFrame];
        const playerSizeX = playerImg.naturalWidth || playerImg.width;
        const playerSizeY = playerImg.naturalHeight || playerImg.height;
        
        // Získat skutečnou velikost mandarinky z obrázku (bez škálování)
        let img;
        if (mand.type === 1) img = mand1Img;
        else if (mand.type === 2) img = mand2Img;
        else if (mand.type === 3) img = mand3Img;
        if (!img || !img.complete) continue;
        const mandWidth = img.naturalWidth || img.width;
        const mandHeight = img.naturalHeight || img.height;
        
        // Zohlednit wobble offset při kolizní detekci
        const wobbleAmount = Math.sin(mand.wobbleTime + mand.wobbleOffset) * 5;
        const mandActualX = mand.x + wobbleAmount;
        
        // Kolize - mandarinka se chytne když se překrývá s hráčem
        if (mand.y + mandHeight > player.y &&
            mand.y < player.y + playerSizeY &&
            mandActualX + mandWidth > player.x &&
            mandActualX < player.x + playerSizeX) {
            
            // Pokud je to mand3, hra končí (hráč se nesmí dotknout mand3)
            if (mand.type === 3) {
                gameOver = true;
                checkAndSaveStats();
                break;
            }
            
            // Přidat skóre pro mand1 a mand2
            score += mand.type === 1 ? CONFIG.SCORE_MAND1 : CONFIG.SCORE_MAND2;
            fallingMandarins.splice(i, 1);
            continue;
        }
        
        // Kontrola dotyku se zemí (Game Over)
        // Mandarinka se dotkne země když její spodní okraj dosáhne groundY
        if (mand.y + mandHeight >= groundY) {
            // mand3 NENÍ game over když spadne na zem, jen když se chytne
            if (mand.type === 3) {
                // Odstranit mand3, ale hra pokračuje
                fallingMandarins.splice(i, 1);
                continue;
            }
            // mand1 a mand2 ukončí hru když spadnou na zem
            gameOver = true;
            checkAndSaveStats();
            break;
        }
        
        // Odstranit mandarinky mimo obrazovku
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
    
    // Pozadí
    ctx.fillStyle = CONFIG.GAME_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Země/platforma
    ctx.fillStyle = CONFIG.GROUND_COLOR;
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    
    // Okraj země
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3 * scaleY;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    
    // Padající mandarinky s kyváním
    fallingMandarins.forEach(mand => {
        let img;
        if (mand.type === 1) img = mand1Img;
        else if (mand.type === 2) img = mand2Img;
        else if (mand.type === 3) img = mand3Img;
        
        if (img && img.complete) {
            // Použít skutečnou velikost z obrázku (bez škálování)
            const mandWidth = img.naturalWidth || img.width;
            const mandHeight = img.naturalHeight || img.height;
            
            // Výpočet kyvání (vlevo-vpravo)
            const wobbleAmount = Math.sin(mand.wobbleTime + mand.wobbleOffset) * 5;
            const wobbleAngle = Math.sin(mand.wobbleTime + mand.wobbleOffset) * 0.1;
            
            ctx.save();
            ctx.translate(mand.x + mandWidth / 2 + wobbleAmount, mand.y + mandHeight / 2);
            ctx.rotate(wobbleAngle);
            ctx.drawImage(img, -mandWidth / 2, -mandHeight / 2, mandWidth, mandHeight);
            ctx.restore();
        }
    });
    
    // Hráč (přesně na zemi) - zajistit, že je vždy na správné pozici
    updatePlayerGroundPosition();
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        // Použít skutečné rozměry sprite (bez škálování - canvas se škáluje přes CSS)
        const playerWidth = img.naturalWidth || img.width;
        const playerHeight = img.naturalHeight || img.height;
        
        // Nastavit pozici hráče na střed při prvním spuštění hry (jen pokud je x == 0)
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
    
    // Skóre
    const scoreSize = canvas.width * 0.025;
    drawText(`SCORE: ${score}`, canvas.width / 2, 50 * scaleY, scoreSize, CONFIG.TEXT_COLOR);
    
    // Game Over obrazovka
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const gameOverSize = canvas.width * 0.05;
        drawText('GAME OVER', canvas.width / 2, canvas.height / 2 - 120 * scaleY, gameOverSize, '#ff6b6b');
        
        // Zkontrolovat, jestli je to nový rekord (použít hodnotu před aktualizací)
        const prevBest = prevBestBeforeUpdate;
        const isNewRecord = score > prevBest;
        
        const finalScoreSize = canvas.width * 0.028;
        drawText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 - 50 * scaleY, finalScoreSize, CONFIG.TEXT_COLOR);
        
        // Zpráva o best score
        const bestScoreSize = canvas.width * 0.018;
        if (isNewRecord) {
            // Nový rekord!
            drawText('NEW PERSONAL BEST!', canvas.width / 2, canvas.height / 2 + 5 * scaleY, bestScoreSize, '#ffc800');
        } else if (prevBest > 0) {
            // Zobrazit předchozí best
            drawText(`Your Best: ${prevBest}`, canvas.width / 2, canvas.height / 2 + 5 * scaleY, bestScoreSize, CONFIG.TEXT_COLOR);
        } else {
            // První hra
            drawText('Your Best: 0', canvas.width / 2, canvas.height / 2 + 5 * scaleY, bestScoreSize, CONFIG.TEXT_COLOR);
        }
        
        // Restart tlačítko
        const restartY = canvas.height / 2 + 60 * scaleY;
        const restartSize = canvas.width * 0.022;
        const restartHover = Math.abs(mouseX - canvas.width / 2) < 120 && 
                            Math.abs(mouseY - restartY) < 25;
        drawText('Restart (SPACE)', canvas.width / 2, restartY, restartSize, restartHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
        
        // Menu tlačítko
        const menuY = canvas.height / 2 + 110 * scaleY;
        const menuSize = canvas.width * 0.02;
        const menuHover = Math.abs(mouseX - canvas.width / 2) < 140 && 
                         Math.abs(mouseY - menuY) < 25;
        drawText('Exit to Menu (ESC)', canvas.width / 2, menuY, menuSize, menuHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
    }
}

// Render
function render() {
    if (scene === 'menu') drawMenu();
    else if (scene === 'howto') drawHowTo();
    else if (scene === 'stats') drawStats();
    else if (scene === 'game') drawGame();
}

// Update hover
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

// Game loop
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

// Events
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
                    resizeCanvas(); // Změnit velikost canvasu
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
        // Game Over tlačítka
        const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
        const restartY = canvas.height / 2 + 50 * scaleY;
        const menuY = canvas.height / 2 + 100 * scaleY;
        
        if (Math.abs(mouseX - canvas.width / 2) < 120 && 
            Math.abs(mouseY - restartY) < 25) {
            // Restart
            initGame();
        } else if (Math.abs(mouseX - canvas.width / 2) < 140 && 
                   Math.abs(mouseY - menuY) < 25) {
            // Exit to Menu
            scene = 'menu';
            resizeCanvas();
        }
    } else if (scene === 'howto' || scene === 'stats') {
        const boxH = canvas.height * 0.75;
        const boxY = (canvas.height - boxH) / 2;
        const backY = boxY + boxH - 50;
        if (Math.abs(mouseX - canvas.width / 2) < 60 && 
            Math.abs(mouseY - backY) < 20) {
            scene = 'menu';
        }
    }
});

// Klávesnice
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (scene === 'game') {
        if (gameOver && e.key === ' ') {
            initGame();
        } else if (gameOver && e.key === 'Escape') {
            scene = 'menu';
            resizeCanvas();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
