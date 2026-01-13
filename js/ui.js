// UI pomocné funkce (drawText atd.)
import { ctx } from './canvas.js';

export function drawText(text, x, y, size, color, outlineColor = '#000000', outlineWidth = 4) {
    ctx.font = `${size}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = outlineWidth;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

