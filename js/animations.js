// Animace a efekty (bounce, jump, atd.)

// Animace pro hráče (bounce při chycení - scale efekt)
export let playerScale = 1.0;
export let playerScaleTime = 0;
export let playerScaleActive = false;

// Animace pro score (jump při zvýšení)
export let scoreScale = 1.0;
export let scoreScaleVel = 0;

// Menu bounce animace
export let menuBounce = {};

export function resetPlayerBounce() {
    playerScale = 1.0;
    playerScaleTime = 0;
    playerScaleActive = false;
}

export function triggerPlayerBounce() {
    playerScaleActive = true;
    playerScaleTime = 0;
}

export function triggerScoreJump() {
    scoreScaleVel = 0.15; 
}

export function updatePlayerBounce(deltaTime) {
    if (playerScaleActive) {
        playerScaleTime += deltaTime;
        // Scale bounce efekt 
        const duration = 300; 
        if (playerScaleTime < duration) {
            const progress = playerScaleTime / duration;
            // Sinusoida 
            const scaleAmount = Math.sin(progress * Math.PI) * 0.15;
            playerScale = 1.0 + scaleAmount;
        } else {
            playerScale = 1.0;
            playerScaleActive = false;
        }
    }
}

export function updateScoreJump(deltaTime) {
    if (scoreScale > 1.0 || scoreScaleVel !== 0) {
        scoreScale += scoreScaleVel;
        
        if (scoreScale > 1.3) {
            scoreScaleVel = -0.1; 
        }
        
        if (scoreScale < 1.0) {
            scoreScale = 1.0;
            scoreScaleVel = 0;
        }
    }
}

export function updateMenuBounce(time) {
    // Bounce efekt pro menu 
    Object.keys(menuBounce).forEach(key => {
        if (menuBounce[key] > 0) {
            menuBounce[key] -= 0.1;
            if (menuBounce[key] < 0) menuBounce[key] = 0;
        }
    });
}

export function triggerMenuBounce(itemIndex) {
    menuBounce[itemIndex] = 1.0;
}

