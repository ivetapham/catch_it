// Event listeners pro klávesnici a myš
import { canvas, getScene, setScene, resizeCanvas } from './canvas.js';
import { menuItems, moveMenuSelection, selectMenuItem, setSelectedMenuItemIndex, setUsingKeyboard, getSelectedMenuItemIndex } from './menu.js';
import { initGame, setKeys, gameOver, gamePaused, togglePause } from './game.js';
import { bgMusic } from './assets.js';
import { resetHighScoreSaved } from './stats.js';
import { triggerMenuBounce } from './animations.js';

// Mouse position state
let mouseX = 0;
let mouseY = 0;

export function setMousePos(x, y) {
    mouseX = x;
    mouseY = y;
}

export function getMousePos() {
    return { x: mouseX, y: mouseY };
}

export function setupInput() {
    // Mouse move
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        setMousePos(mouseX, mouseY);
        
        const { x, y } = getMousePos();
        const scene = getScene();
        const scaleY = canvas.height / 700; // CONFIG.GAME_HEIGHT
        
        let anyHover = false;
        
        if (scene === 'menu') {
            // Menu: hover podle menu items
            anyHover = menuItems.some(item => item.hover);
        } else if (scene === 'howto' || scene === 'stats' || scene === 'credits') {
            // Howto/Stats/Credits: hover na BACK tlačítku
            const boxH = scene === 'stats' ? canvas.height * 0.75 : scene === 'credits' ? canvas.height * 0.6 : canvas.height * 0.8;
            const boxY = (canvas.height - boxH) / 2;
            const backY = boxY + boxH - 50;
            anyHover = Math.abs(x - canvas.width / 2) < 60 && 
                      Math.abs(y - backY) < 20;
        } else if (scene === 'game') {
            if (gamePaused) {
                // Pause menu: hover na Resume, Restart, nebo Exit to Menu
                const resumeY = canvas.height / 2 + 20 * scaleY;
                const restartY = canvas.height / 2 + 60 * scaleY;
                const menuY = canvas.height / 2 + 100 * scaleY;
                
                anyHover = (Math.abs(x - canvas.width / 2) < 140 && Math.abs(y - resumeY) < 25) ||
                           (Math.abs(x - canvas.width / 2) < 120 && Math.abs(y - restartY) < 25) ||
                           (Math.abs(x - canvas.width / 2) < 140 && Math.abs(y - menuY) < 25);
            } else if (gameOver) {
                // Game Over menu: hover na Restart nebo Exit to Menu
                const restartY = canvas.height / 2 + 60 * scaleY;
                const menuY = canvas.height / 2 + 110 * scaleY;
                
                anyHover = (Math.abs(x - canvas.width / 2) < 120 && Math.abs(y - restartY) < 25) ||
                           (Math.abs(x - canvas.width / 2) < 140 && Math.abs(y - menuY) < 25);
            }
            // Během hry (ne pause, ne game over): default cursor
        }
        
        canvas.style.cursor = anyHover ? 'pointer' : 'default';
    });
    
    // Click
    canvas.addEventListener('click', () => {
        const { x: mouseX, y: mouseY } = getMousePos();
        const scene = getScene();
        
        if (scene === 'menu') {
            menuItems.forEach((item, index) => {
                if (item.hover) {
                    // myš input
                    setUsingKeyboard(false);
                    setSelectedMenuItemIndex(null);
                    
                    // Trigger bounce animace
                    triggerMenuBounce(index);
                    
                    if (item.text === 'START GAME') {
                        setScene('game');
                        resizeCanvas();
                        resetHighScoreSaved();
                        initGame();
                    } else if (item.text === 'HOW TO PLAY') {
                        setScene('howto');
                        resizeCanvas();
                    } else if (item.text === 'STATISTICS') {
                        setScene('stats');
                        resizeCanvas();
                    } else if (item.text === 'CREDITS') {
                        setScene('credits');
                        resizeCanvas();
                    }
                }
            });
        } else if (scene === 'game' && gamePaused) {
            const scaleY = canvas.height / 600;
            const resumeY = canvas.height / 2 + 50 * scaleY;
            const restartY = canvas.height / 2 + 100 * scaleY;
            const menuY = canvas.height / 2 + 150 * scaleY;
            
            // Resume button
            if (Math.abs(mouseX - canvas.width / 2) < 140 && 
                Math.abs(mouseY - resumeY) < 25) {
                togglePause();
            } else if (Math.abs(mouseX - canvas.width / 2) < 120 && 
                       Math.abs(mouseY - restartY) < 25) {
                // Restart button
                resetHighScoreSaved();
                initGame();
            } else if (Math.abs(mouseX - canvas.width / 2) < 140 && 
                       Math.abs(mouseY - menuY) < 25) {
                // Exit to Menu
                togglePause(); 
                setScene('menu');
                resizeCanvas();
                bgMusic.pause();
            }
        } else if (scene === 'game' && gameOver) {
            const scaleY = canvas.height / 600;
            const restartY = canvas.height / 2 + 50 * scaleY;
            const menuY = canvas.height / 2 + 100 * scaleY;
            
            // Restart button
            if (Math.abs(mouseX - canvas.width / 2) < 120 && 
                Math.abs(mouseY - restartY) < 25) {
                resetHighScoreSaved();
                initGame();
            } else if (Math.abs(mouseX - canvas.width / 2) < 140 && 
                       Math.abs(mouseY - menuY) < 25) {
                // Exit to Menu
                setScene('menu');
                resizeCanvas();
                setSelectedMenuItemIndex(null); // Reset menu výběru (žádná selekce)
                bgMusic.pause();
            }
        } else if (scene === 'howto' || scene === 'stats' || scene === 'credits') {
            const boxH = scene === 'stats' ? canvas.height * 0.75 : scene === 'credits' ? canvas.height * 0.6 : canvas.height * 0.8;
            const boxY = (canvas.height - boxH) / 2;
            const backY = boxY + boxH - 50;
            if (Math.abs(mouseX - canvas.width / 2) < 60 && 
                Math.abs(mouseY - backY) < 20) {
                setScene('menu');
                resizeCanvas();
                setSelectedMenuItemIndex(null); // Reset menu výběru (žádná selekce)
            }
        }
    });
    
    // Keyboard
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        setKeys(keys);
        
        // Menu navigace pomocí šipek/W/S
        if (getScene() === 'menu') {
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                moveMenuSelection(1); // Dolů
                e.preventDefault();
            } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                moveMenuSelection(-1); // Nahoru
                e.preventDefault();
            } else if (e.key === 'Enter') {
                // Enter vybere menu položku (jen pokud je něco vybrané)
                const selectedItem = selectMenuItem();
                if (selectedItem) {
                    // Trigger bounce animace
                    const selectedIndex = getSelectedMenuItemIndex();
                    if (selectedIndex !== null) {
                        triggerMenuBounce(selectedIndex);
                    }
                    
                    if (selectedItem.text === 'START GAME') {
                        setScene('game');
                        resizeCanvas();
                        resetHighScoreSaved();
                        initGame();
                    } else if (selectedItem.text === 'HOW TO PLAY') {
                        setScene('howto');
                        resizeCanvas();
                    } else if (selectedItem.text === 'STATISTICS') {
                        setScene('stats');
                        resizeCanvas();
                    } else if (selectedItem.text === 'CREDITS') {
                        setScene('credits');
                        resizeCanvas();
                    }
                }
                e.preventDefault();
            }
        } else if (getScene() === 'howto' || getScene() === 'stats' || getScene() === 'credits') {
            // ESC při howto/stats/credits = návrat do menu
            if (e.key === 'Escape') {
                setScene('menu');
                resizeCanvas();
                // Reset menu výběru (žádná selekce)
                setSelectedMenuItemIndex(null);
                e.preventDefault();
            }
        } else if (getScene() === 'howto' || getScene() === 'stats') {
            // ESC při howto/stats = návrat do menu
            if (e.key === 'Escape') {
                setScene('menu');
                resizeCanvas();
                e.preventDefault();
            }
        }
        
        if (getScene() === 'game') {
            if (gamePaused) {
                // Při pauze
                if (e.key === 'Enter') {
                    // Enter = resume (pokračovat)
                    togglePause();
                } else if (e.key === ' ') {
                    // Space = restart (resetovat hru)
                    resetHighScoreSaved();
                    initGame();
                } else if (e.key === 'Escape') {
                    // ESC = návrat do menu
                    togglePause(); // Odpauzuj
                    setScene('menu');
                    resizeCanvas();
                    setSelectedMenuItemIndex(null); // Reset menu výběru (žádná selekce)
                    bgMusic.pause();
                }
            } else if (gameOver) {
                // Při game over
                if (e.key === ' ') {
                    // Space = restart
                    resetHighScoreSaved();
                    initGame();
                } else if (e.key === 'Escape') {
                    // ESC = návrat do menu
                    setScene('menu');
                    resizeCanvas();
                    setSelectedMenuItemIndex(null); // Reset menu výběru (žádná selekce)
                    bgMusic.pause();
                }
            } else {
                // Během hry
                if (e.key === ' ') {
                    // Space = pauza
                    togglePause();
                } else if (e.key === 'Escape') {
                    // ESC = návrat do menu
                    setScene('menu');
                    resizeCanvas();
                    setSelectedMenuItemIndex(null); // Reset menu výběru (žádná selekce)
                    bgMusic.pause();
                }
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        setKeys(keys);
    });
}

