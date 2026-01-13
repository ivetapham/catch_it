// Pozadí a pozadí prvky (mraky, atd.)
import { canvas, ctx } from './canvas.js';

// Mraky pro pozadí hry
export const clouds = [];

// Inicializace mraků
export function initClouds() {
    clouds.length = 0;
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: 50 + Math.random() * (canvas.height * 0.4),
            width: 60 + Math.random() * 80,
            height: 30 + Math.random() * 40,
            speed: 0.2 + Math.random() * 0.3,
            opacity: 0.6 + Math.random() * 0.2
        });
    }
}

// Aktualizace mraků
export function updateClouds(deltaTime) {
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        
        // Loop mraků
        if (cloud.x > canvas.width + cloud.width) {
            cloud.x = -cloud.width;
            cloud.y = 50 + Math.random() * (canvas.height * 0.4);
        }
    });
}

// Vykreslení mraků
export function drawClouds() {
    clouds.forEach(cloud => {
        ctx.save();
        ctx.globalAlpha = cloud.opacity;
        ctx.fillStyle = '#ffffff';
        
        const circles = 3;
        for (let i = 0; i < circles; i++) {
            const offsetX = (i - 1) * (cloud.width / 3);
            const offsetY = i % 2 === 0 ? 0 : -cloud.height * 0.3;
            ctx.beginPath();
            ctx.arc(
                cloud.x + cloud.width / 2 + offsetX,
                cloud.y + cloud.height / 2 + offsetY,
                cloud.height / 2 + (i % 2) * (cloud.height * 0.2),
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.restore();
    });
}

