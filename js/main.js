// Hlavní entry point - inicializace a game loop
import { getScene, resizeCanvas } from './canvas.js';
import { setOnAllImagesLoaded } from './assets.js';
import { loadStats } from './stats.js';
import { drawMenu, drawHowTo, drawStats, drawCredits, updateHover, generateMandarinPattern, setTime } from './menu.js';
import { updateGame, drawGame, setKeys, keys } from './game.js';
import { getMousePos } from './input.js';
import { setupInput } from './input.js';
import { updateMenuBounce } from './animations.js';

let gameStarted = false;
let lastTime = 0;
let time = 0;

function render() {
    const scene = getScene();
    if (scene === 'menu') drawMenu();
    else if (scene === 'howto') drawHowTo();
    else if (scene === 'stats') drawStats();
    else if (scene === 'credits') drawCredits();
    else if (scene === 'game') {
        const { x, y } = getMousePos();
        drawGame(x, y);
    }
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    time = timestamp;
    setTime(time);
    
    if (getScene() === 'game') {
        updateGame(deltaTime, time);
    } else {
        updateHover();
        // Aktualizace menu bounce animací
        updateMenuBounce(time);
    }
    
    setKeys(keys);
    
    render();
    requestAnimationFrame(gameLoop);
}

// Inicializace
resizeCanvas();
generateMandarinPattern();

window.addEventListener('resize', () => {
    resizeCanvas();
    if (getScene() === 'menu') {
        generateMandarinPattern();
    }
});

// Načtení statistik
loadStats();

// Nastavení callback pro načtené obrázky
setOnAllImagesLoaded(() => {
    if (!gameStarted) {
        gameStarted = true;
        loadStats().then(() => {
            requestAnimationFrame(gameLoop);
        });
    }
});

// Fallback timeout
setTimeout(() => {
    if (!gameStarted) {
        console.log('Starting game...');
        gameStarted = true;
        loadStats().then(() => {
            requestAnimationFrame(gameLoop);
        });
    }
}, 1000);

// Nastavení inputů
setupInput();

