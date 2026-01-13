// Particle efekty a vizuální efekty
import { canvas, ctx } from './canvas.js';

// Particle system
export const particles = [];

export const ParticleType = {
    STAR: 'star',
    SPARKLE: 'sparkle',
    DUST: 'dust'
};

// efekt chycení mandarinky
export function createCatchEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 2 + Math.random() * 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.01,
            size: 4 + Math.random() * 4,
            type: ParticleType.SPARKLE,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            color: `hsl(${40 + Math.random() * 40}, 100%, ${60 + Math.random() * 30}%)`
        });
    }
}

// efekt pád mandarinky
export function createImpactEffect(x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * 1.5; 
        const speed = 1 + Math.random() * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * 0.5,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.01,
            size: 3 + Math.random() * 5,
            type: ParticleType.DUST,
            color: `hsl(${25 + Math.random() * 15}, ${40 + Math.random() * 20}%, ${30 + Math.random() * 20}%)`
        });
    }
}

// efekt confetti při new record
export function createConfetti(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.5;
        const speed = 3 + Math.random() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1.0,
            decay: 0.008 + Math.random() * 0.005,
            size: 5 + Math.random() * 8,
            type: ParticleType.STAR,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            color: `hsl(${Math.random() * 360}, 100%, ${50 + Math.random() * 30}%)`
        });
    }
}

// Aktualizace particles
export function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update pozice
        p.x += p.vx;
        p.y += p.vy;
        
        // Update rotace
        if (p.rotation !== undefined) {
            p.rotation += p.rotationSpeed || 0;
        }
        
        // Fyzika
        p.vy += 0.15;
        
        // Update životnosti
        p.life -= p.decay;
        
        // Odstranění mrtvých particles
        if (p.life <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y > canvas.height + 50) {
            particles.splice(i, 1);
        }
    }
}

// Vykreslení particles
export function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        
        if (p.rotation !== undefined) {
            ctx.rotate(p.rotation);
        }
        
        switch (p.type) {
            case ParticleType.STAR:
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const x1 = Math.cos(angle) * p.size;
                    const y1 = Math.sin(angle) * p.size;
                    if (i === 0) ctx.moveTo(x1, y1);
                    else ctx.lineTo(x1, y1);
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case ParticleType.SPARKLE:
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.save();
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
                break;
                
            case ParticleType.DUST:
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    });
}

