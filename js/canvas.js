// Canvas inicializace a resize funkce
import { CONFIG } from './config.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

let scene = 'menu';

export function getScene() {
    return scene;
}

export function setScene(newScene) {
    scene = newScene;
}

export function resizeCanvas() {
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

