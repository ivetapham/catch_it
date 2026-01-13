// Herní logika (updateGame, drawGame, initGame)
import { canvas, ctx } from './canvas.js';
import { CONFIG } from './config.js';
import { mand1Img, mand2Img, mand3Img, playerSprites, bgMusic, doneSound, playPointSound } from './assets.js';
import { drawText } from './ui.js';
import { player, updatePlayerGroundPosition, resetPlayer } from './player.js';
import { checkAndSaveStats, prevBestBeforeUpdate } from './stats.js';
import { updateParticles, drawParticles, createCatchEffect, createImpactEffect, createConfetti } from './effects.js';
import { updateClouds, drawClouds, initClouds } from './background.js';
import { updatePlayerBounce, updateScoreJump, triggerPlayerBounce, triggerScoreJump, resetPlayerBounce, scoreScale, playerScale } from './animations.js';

export const fallingMandarins = [];
export let lastMandarinSpawnTime = 0;
export let score = 0;
export let gameOver = false;
export let gamePaused = false;
export let keys = {};
let confettiCreated = false;

export function setKeys(newKeys) {
    keys = newKeys;
}

export function initGame() {
    resetPlayer();
    resetPlayerBounce();
    fallingMandarins.length = 0;
    lastMandarinSpawnTime = 0;
    score = 0;
    gameOver = false;
    gamePaused = false;
    keys = {};
    confettiCreated = false;
    
    // Inicializace mraků
    initClouds();
    
    bgMusic.play().catch(e => console.log('Music play failed:', e));
}

export function togglePause() {
    if (!gameOver) {
        gamePaused = !gamePaused;
        if (gamePaused) {
            bgMusic.pause();
        } else {
            bgMusic.play().catch(e => console.log('Music play failed:', e));
        }
    }
}

export function updateGame(deltaTime, time) {
    // Aktualizace mraků i při pauze
    updateClouds(deltaTime);
    
    // Aktualizace particles i při pauze 
    updateParticles(deltaTime);
    
    if (gameOver) {
        return;
    }
    
    if (gamePaused) {
        return;
    }
    
    const scaleX = canvas.width / CONFIG.GAME_WIDTH;
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    
    // Aktualizace animací
    updatePlayerBounce(deltaTime);
    updateScoreJump(deltaTime);
    
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
    
    // Update player position jednou před loopem
    updatePlayerGroundPosition();
    
    for (let i = fallingMandarins.length - 1; i >= 0; i--) {
        const mand = fallingMandarins[i];
        mand.y += CONFIG.MANDARIN_FALL_SPEED * scaleY;
        if (!mand.wobbleTime) mand.wobbleTime = 0;
        mand.wobbleTime += mand.wobbleSpeed;
        
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
                checkAndSaveStats(score);
                break;
            }
            
            // efekt při chycení
            createCatchEffect(mandActualX + mandWidth / 2, mand.y + mandHeight / 2);
            
            // bounce efekt
            triggerPlayerBounce();
            triggerScoreJump();
            
            score += mand.type === 1 ? CONFIG.SCORE_MAND1 : CONFIG.SCORE_MAND2;
            playPointSound();
            fallingMandarins.splice(i, 1);
            continue;
        }
        
        if (mand.y + mandHeight >= groundY) {
            if (mand.type === 3) {
                // efekt pád mandarinky
                createImpactEffect(mandActualX + mandWidth / 2, groundY);
                fallingMandarins.splice(i, 1);
                continue;
            }
            
            // efekt pád jedlé mandarinky
            createImpactEffect(mandActualX + mandWidth / 2, groundY);
            
            gameOver = true;
            bgMusic.pause();
            doneSound.play().catch(e => {});
            checkAndSaveStats(score);
            break;
        }
        
        if (mand.y > canvas.height) {
            fallingMandarins.splice(i, 1);
        }
    }
}

export function drawGame(mouseX, mouseY) {
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    const groundY = (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
    const groundHeight = CONFIG.GROUND_HEIGHT * scaleY;
    
    // Pozadí
    ctx.fillStyle = CONFIG.GAME_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Mraky v pozadí
    drawClouds();
    
    // Země
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
        
        // scale efekt/bounce efekt
        ctx.save();
        ctx.translate(player.x + playerWidth / 2, player.y + playerHeight / 2);
        ctx.scale(playerScale, playerScale);
        ctx.drawImage(
            img,
            -playerWidth / 2,
            -playerHeight / 2,
            playerWidth,
            playerHeight
        );
        ctx.restore();
    }
    
    // Score s jump animací
    const scoreSize = canvas.width * 0.025 * scoreScale;
    const scoreY = 50 * scaleY - (scoreScale > 1.0 ? (scoreScale - 1.0) * 20 : 0);
    drawText(`SCORE: ${score}`, canvas.width / 2, scoreY, scoreSize, CONFIG.TEXT_COLOR);
    
    drawParticles();
    
    // Pauza menu
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const pauseSize = canvas.width * 0.05;
        drawText('PAUSED', canvas.width / 2, canvas.height / 2 - 80 * scaleY, pauseSize, '#ffc800');
        
        const resumeY = canvas.height / 2 + 20 * scaleY;
        const resumeSize = canvas.width * 0.022;
        const resumeHover = Math.abs(mouseX - canvas.width / 2) < 140 && 
                            Math.abs(mouseY - resumeY) < 25;
        drawText('Resume (ENTER)', canvas.width / 2, resumeY, resumeSize, resumeHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
        
        const restartY = canvas.height / 2 + 60 * scaleY;
        const restartSize = canvas.width * 0.022;
        const restartHover = Math.abs(mouseX - canvas.width / 2) < 120 && 
                            Math.abs(mouseY - restartY) < 25;
        drawText('Restart (SPACE)', canvas.width / 2, restartY, restartSize, restartHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
        
        const menuY = canvas.height / 2 + 100 * scaleY;
        const menuSize = canvas.width * 0.02;
        const menuHover = Math.abs(mouseX - canvas.width / 2) < 140 && 
                         Math.abs(mouseY - menuY) < 25;
        drawText('Exit to Menu (ESC)', canvas.width / 2, menuY, menuSize, menuHover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR);
        
        return; 
    }
    
    if (gameOver) {
        drawParticles();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const prevBest = prevBestBeforeUpdate;
        const isNewRecord = score > prevBest;
        
        // confetti efekt
        if (isNewRecord && !confettiCreated) {
            createConfetti(canvas.width / 2, canvas.height / 2 - 100 * scaleY);
            confettiCreated = true;
        }
        
        // efekt nad overlayem
        if (isNewRecord) {
            drawParticles();
        }
        
        const gameOverSize = canvas.width * 0.05;
        drawText('GAME OVER', canvas.width / 2, canvas.height / 2 - 120 * scaleY, gameOverSize, '#ff6b6b');
        
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

