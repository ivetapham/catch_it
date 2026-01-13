// Menu a UI obrazovky (drawMenu, drawHowTo, drawStats)
import { canvas, ctx, getScene } from './canvas.js';
import { CONFIG } from './config.js';
import { mandarinImg, capyImg, capy3Img, mand1Img, mand2Img, mand3Img } from './assets.js';
import { drawText } from './ui.js';
import { playerStats } from './stats.js';
import { menuBounce } from './animations.js';
import { getMousePos } from './input.js';

let mandarins = [];
let time = 0;

export function setTime(newTime) {
    time = newTime;
}

export const menuItems = [
    { text: 'START GAME', y: 0, hover: false },
    { text: 'HOW TO PLAY', y: 0, hover: false },
    { text: 'STATISTICS', y: 0, hover: false },
    { text: 'CREDITS', y: 0, hover: false }
];

let selectedMenuItemIndex = null; // null = žádná selekce
let usingKeyboard = false; // Sleduje, jestli se používá klávesnice

export function getSelectedMenuItemIndex() {
    return selectedMenuItemIndex;
}

export function setSelectedMenuItemIndex(index) {
    if (index === null || (index >= 0 && index < menuItems.length)) {
        selectedMenuItemIndex = index;
    }
}

export function setUsingKeyboard(value) {
    usingKeyboard = value;
    if (!value) {
        // Pokud se přestane používat klávesnice, zruš selekci
        selectedMenuItemIndex = null;
    }
}

export function moveMenuSelection(direction) {
    // direction: 1 = dolů, -1 = nahoru
    // Aktivuj klávesnicovou selekci
    usingKeyboard = true;
    
    // Pokud ještě není selekce, začni na první položce
    if (selectedMenuItemIndex === null) {
        selectedMenuItemIndex = direction > 0 ? 0 : menuItems.length - 1;
    } else {
        selectedMenuItemIndex += direction;
        if (selectedMenuItemIndex < 0) {
            selectedMenuItemIndex = menuItems.length - 1;
        } else if (selectedMenuItemIndex >= menuItems.length) {
            selectedMenuItemIndex = 0;
        }
    }
}

export function selectMenuItem() {
    if (selectedMenuItemIndex === null || selectedMenuItemIndex < 0 || selectedMenuItemIndex >= menuItems.length) {
        return null;
    }
    return menuItems[selectedMenuItemIndex];
}

export function generateMandarinPattern() {
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

export function drawMenu() {
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
    
    // Glowing effect pro "CATCH IT" title
    ctx.font = `${fontSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Více vrstev pro glowing efekt
    const glowIntensity = 0.3 + Math.sin(time * 0.005) * 0.2;
    
    // Vnější glow (nejširší, nejprůhlednější)
    for (let i = 8; i >= 1; i--) {
        ctx.strokeStyle = `rgba(255, 107, 107, ${glowIntensity * (i / 8)})`;
        ctx.lineWidth = i * 2;
        ctx.strokeText('CATCH IT', titleX, titleYPos);
    }
    
    // Hlavní obrys
    ctx.strokeStyle = CONFIG.TITLE_OUTLINE_COLOR;
    ctx.lineWidth = 8;
    ctx.strokeText('CATCH IT', titleX, titleYPos);
    
    // Hlavní text
    drawText('CATCH IT', titleX, titleYPos, fontSize, CONFIG.TEXT_COLOR, CONFIG.TEXT_OUTLINE_COLOR, 4);
    
    const subSize = canvas.width * CONFIG.SUBTITLE_FONT_PERCENT;
    drawText('Catch the Mandarins!', canvas.width / 2, titleY + 90, subSize, CONFIG.TEXT_COLOR, CONFIG.TEXT_OUTLINE_COLOR, 3);
    
    const menuStartY = canvas.height * CONFIG.MENU_START_Y_PERCENT;
    const menuSpacing = canvas.height * CONFIG.MENU_SPACING_PERCENT;
    const textSize = canvas.width * CONFIG.MENU_FONT_PERCENT;
    
    menuItems.forEach((item, i) => {
        item.y = menuStartY + i * menuSpacing;
        const color = item.hover ? CONFIG.HOVER_COLOR : CONFIG.TEXT_COLOR;
        const lift = item.hover ? -3 : 0;
        
        // Bounce efekt
        const bounce = menuBounce[i] || 0;
        const bounceOffset = Math.sin(bounce * Math.PI) * 10;
        
        // Stín pod textem pro hloubku
        if (item.hover || bounce > 0) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.font = `${textSize}px 'Press Start 2P'`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.text, canvas.width / 2 + 3, item.y + lift + bounceOffset + 3);
            ctx.restore();
        }
        
        drawText(item.text, canvas.width / 2, item.y + lift + bounceOffset, textSize, color, CONFIG.TEXT_OUTLINE_COLOR, 4);
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

export function drawHowTo() {
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
    
    const { x: mouseX, y: mouseY } = getMousePos();
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

export function drawStats() {
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
    
    const { x: mouseX, y: mouseY } = getMousePos();
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

export function drawCredits() {
    ctx.fillStyle = CONFIG.BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const boxW = canvas.width * 0.7;
    const boxH = canvas.height * 0.6;
    const boxX = (canvas.width - boxW) / 2;
    const boxY = (canvas.height - boxH) / 2;
    
    // Box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    
    // Title
    const fontSize = canvas.width * 0.024;
    ctx.font = `${fontSize}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('CREDITS', canvas.width / 2, boxY + 50);
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('CREDITS', canvas.width / 2, boxY + 50);
    
    // Banner obrázek
    let imageBottomY = boxY + 120;
    if (capy3Img.complete) {
        const imgWidth = capy3Img.naturalWidth || capy3Img.width;
        const imgHeight = capy3Img.naturalHeight || capy3Img.height;
        const maxWidth = boxW * 0.6;
        const maxHeight = boxH * 0.3;
        const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        
        const imageY = boxY + 100;
        ctx.drawImage(
            capy3Img,
            canvas.width / 2 - scaledWidth / 2,
            imageY,
            scaledWidth,
            scaledHeight
        );
        
        imageBottomY = imageY + scaledHeight;
    }
    
    // Text thank you
    ctx.fillStyle = '#333333';
    const textSize = canvas.width * 0.012;
    ctx.font = `${textSize}px "Press Start 2P"`;
    ctx.textAlign = 'center';
    
    const lineH = canvas.height * 0.04;
    const textY = imageBottomY + lineH * 1.5;
    
    ctx.fillText('Thank you for playing!', canvas.width / 2, textY);
    ctx.fillText('All assets drawn by me', canvas.width / 2, textY + lineH);
    
    // BACK button
    const { x: mouseX, y: mouseY } = getMousePos();
    const backY = boxY + boxH - 50;
    const backHover = Math.abs(mouseX - canvas.width / 2) < 60 && 
                      Math.abs(mouseY - backY) < 20;
    
    ctx.textAlign = 'center';
    const backSize = canvas.width * 0.016;
    ctx.font = `${backSize}px 'Press Start 2P'`;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('BACK', canvas.width / 2, backY);
    ctx.fillStyle = backHover ? '#ff9999' : '#ff6b6b';
    ctx.fillText('BACK', canvas.width / 2, backY);
}

export function updateHover() {
    if (getScene() === 'menu') {
        const { x: mouseX, y: mouseY } = getMousePos();
        const textSize = canvas.width * CONFIG.MENU_FONT_PERCENT;
        ctx.font = `${textSize}px 'Press Start 2P'`;
        
        // jestli myš hoveruje nějakou položku
        let mouseHoveringAny = false;
        menuItems.forEach((item, index) => {
            const textWidth = ctx.measureText(item.text).width;
            const textHeight = textSize;
            const x = canvas.width / 2 - textWidth / 2;
            const y = item.y - textHeight / 2;
            
            const mouseHover = mouseX > x && mouseX < x + textWidth && 
                              mouseY > y && mouseY < y + textHeight;
            
            if (mouseHover) {
                mouseHoveringAny = true;
            }
        });
        
        // Pokud myš hoveruje nějakou položku a používá se klávesnice, přepni na myš
        if (mouseHoveringAny && usingKeyboard) {
            setUsingKeyboard(false);
        }
        
        // Nastav hover podle aktivního inputu (myš nebo klávesnice)
        menuItems.forEach((item, index) => {
            const textWidth = ctx.measureText(item.text).width;
            const textHeight = textSize;
            const x = canvas.width / 2 - textWidth / 2;
            const y = item.y - textHeight / 2;
            
            const mouseHover = mouseX > x && mouseX < x + textWidth && 
                              mouseY > y && mouseY < y + textHeight;
            
            // Pokud se používá klávesnice, použij klávesnicovou selekci, jinak myš
            if (usingKeyboard) {
                item.hover = selectedMenuItemIndex !== null && index === selectedMenuItemIndex;
            } else {
                item.hover = mouseHover;
            }
        });
    }
}

