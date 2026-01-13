// Načítání obrázků a audio

export const capyImg = new Image();
capyImg.src = 'assets/capy2.png';

export const capy3Img = new Image();
capy3Img.src = 'assets/capy3.png';

export const mand1Img = new Image();
mand1Img.src = 'assets/mand1.png';

export const mand2Img = new Image();
mand2Img.src = 'assets/mand2.png';

export const mand3Img = new Image();
mand3Img.src = 'assets/mand3.png';

export const mandarinImg = new Image();
mandarinImg.src = 'assets/mandarin.png';

export const playerSprites = {
    left: [],
    right: []
};

for (let i = 1; i <= 3; i++) {
    const leftImg = new Image();
    leftImg.src = `assets/sprite_left${i}.png`;
    playerSprites.left.push(leftImg);
    
    const rightImg = new Image();
    rightImg.src = `assets/sprite_right${i}.png`;
    playerSprites.right.push(rightImg);
}

// Audio
export const bgMusic = new Audio('sounds/bgm.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.08;

export const doneSound = new Audio('sounds/done.mp3');
doneSound.volume = 0.15;

export function playPointSound() {
    const sound = new Audio('sounds/point.mp3');
    sound.volume = 0.12;
    sound.play().catch(e => {});
}

// Počítadlo načtených obrázků
const totalImagesToLoad = 6 + 6;
let imagesLoadedCount = 0;
let onAllImagesLoadedCallback = null;

export function setOnAllImagesLoaded(callback) {
    onAllImagesLoadedCallback = callback;
}

function checkAllImagesLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount >= totalImagesToLoad && onAllImagesLoadedCallback) {
        onAllImagesLoadedCallback();
    }
}

capyImg.onload = checkAllImagesLoaded;
capy3Img.onload = checkAllImagesLoaded;
mand1Img.onload = checkAllImagesLoaded;
mand2Img.onload = checkAllImagesLoaded;
mand3Img.onload = checkAllImagesLoaded;
mandarinImg.onload = checkAllImagesLoaded;
playerSprites.left.forEach(img => img.onload = checkAllImagesLoaded);
playerSprites.right.forEach(img => img.onload = checkAllImagesLoaded);

if (capyImg.complete) checkAllImagesLoaded();
if (capy3Img.complete) checkAllImagesLoaded();
if (mand1Img.complete) checkAllImagesLoaded();
if (mand2Img.complete) checkAllImagesLoaded();
if (mand3Img.complete) checkAllImagesLoaded();
if (mandarinImg.complete) checkAllImagesLoaded();
playerSprites.left.forEach(img => { if (img.complete) checkAllImagesLoaded(); });
playerSprites.right.forEach(img => { if (img.complete) checkAllImagesLoaded(); });

