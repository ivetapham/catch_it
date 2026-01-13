// Player objekt a související funkce
import { CONFIG } from './config.js';
import { playerSprites } from './assets.js';

export const player = {
    x: 0,
    targetX: 0,
    y: 0,
    direction: 'right',
    spriteFrame: 0,
    spriteTimer: 0
};

export function getGroundY() {
    const canvas = document.getElementById('gameCanvas');
    const scaleY = canvas.height / CONFIG.GAME_HEIGHT;
    return (CONFIG.GAME_HEIGHT - CONFIG.GROUND_HEIGHT) * scaleY;
}

export function updatePlayerGroundPosition() {
    const groundY = getGroundY();
    const spriteArray = playerSprites[player.direction];
    if (spriteArray[player.spriteFrame] && spriteArray[player.spriteFrame].complete) {
        const img = spriteArray[player.spriteFrame];
        const playerHeight = img.naturalHeight || img.height;
        player.y = groundY - playerHeight;
    }
}

export function resetPlayer() {
    player.direction = 'right';
    player.spriteFrame = 0;
    player.spriteTimer = 0;
    player.x = 0;
    player.targetX = 0;
}

