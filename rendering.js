/**
 * Leone Bus - Rendering Module
 * Modulo di rendering per il gioco Leone Bus
 * Tutti i disegni sono fatti su canvas 2D - nessuna logica di gioco qui
 */

// ============================================
// COSTANTI DI DISEGNO
// ============================================

const COLORS = {
    YELLOW_BUS: '#F7C41F',
    YELLOW_BUS_DARK: '#E5A800',
    YELLOW_BUS_LIGHT: '#FFE066',
    ROAD: '#4A4A4A',
    ROAD_LINE: '#F7C41F',
    SIDEWALK: '#B8D4A8',
    GRASS: '#6DC04A',
    SKY_TOP: '#87CEEB',
    SKY_BOTTOM: '#C8E8F8',
    STOP_SIGN: '#E53935',
    STOP_POLE: '#8B8B8B',
    CHILD_SKIN: '#F4A460',
    CHILD_SHIRT: '#42A5F5',
    CHILD_HAT: '#E53935',
    CONE: '#FF6B35',
    CONE_STRIPE: '#FFFFFF',
    COW: '#F5F5F5',
    COW_SPOTS: '#8B4513',
    TREE_TRUNK: '#8B6914',
    TREE_LEAVES: '#228B22',
    STAR: '#FFD700',
    STAR_SHINE: '#FFFACD',
    WINDOW_BLUE: '#5DADE2',
    WHEEL_COLOR: '#333333',
    HEART_RED: '#E53935',
    HEART_EMPTY: '#CCCCCC',
    CLOUD: '#FFFFFF',
    SHADOW: 'rgba(0,0,0,0.2)',
};

// Dimensioni base del gioco (risoluzione 480x270)
const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Disegna un rettangolo arrotondato
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Disegna una stella a 5 punte
 */
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, rotation = 0) {
    let rot = (Math.PI / 2 * 3) + rotation;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

// ============================================
// SKY RENDERER
// ============================================

/**
 * Disegna lo sfondo del cielo con gradient e nuvolette
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {number} scrollOffset - offset di scroll per effetto parallax
 */
function renderSky(ctx, scrollOffset = 0) {
    // Gradient cielo
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, COLORS.SKY_TOP);
    gradient.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Nuvolette con parallax lento (0.2x)
    const cloudScroll = scrollOffset * 0.2;
    drawClouds(ctx, cloudScroll);
}

/**
 * Disegna le nuvolette
 */
function drawClouds(ctx, scrollOffset) {
    ctx.fillStyle = COLORS.CLOUD;
    
    // Nuvola 1
    const cloud1X = ((50 - scrollOffset * 0.5) % (GAME_WIDTH + 100)) - 50;
    drawCloud(ctx, cloud1X, 30, 0.8);
    
    // Nuvola 2
    const cloud2X = ((200 - scrollOffset * 0.3) % (GAME_WIDTH + 100)) - 50;
    drawCloud(ctx, cloud2X, 50, 1.2);
    
    // Nuvola 3
    const cloud3X = ((350 - scrollOffset * 0.4) % (GAME_WIDTH + 100)) - 50;
    drawCloud(ctx, cloud3X, 25, 0.6);
    
    // Nuvola 4
    const cloud4X = ((-50 - scrollOffset * 0.35) % (GAME_WIDTH + 100)) - 50;
    drawCloud(ctx, cloud4X, 70, 1.0);
}

/**
 * Disegna una singola nuvola stilizzata
 */
function drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.arc(20, -5, 20, 0, Math.PI * 2);
    ctx.arc(40, 0, 15, 0, Math.PI * 2);
    ctx.arc(15, 8, 12, 0, Math.PI * 2);
    ctx.arc(30, 8, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// ============================================
// ROAD RENDERER
// ============================================

/**
 * Disegna la strada con 3 corsie e linee tratteggiate scrolling
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {number} scrollOffset - offset di scroll per animazione
 */
function renderRoad(ctx, scrollOffset = 0) {
    const roadTop = 80;
    const roadHeight = GAME_HEIGHT - 40;
    const laneWidth = GAME_WIDTH / 3;
    
    // Fondo strada (asfalto)
    ctx.fillStyle = COLORS.ROAD;
    ctx.fillRect(0, roadTop, GAME_WIDTH, roadHeight);
    
    // Bordi della strada
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, roadTop, 4, roadHeight);
    ctx.fillRect(GAME_WIDTH - 4, roadTop, 4, roadHeight);
    
    // Linee tratteggiate tra le corsie
    ctx.fillStyle = COLORS.ROAD_LINE;
    const dashHeight = 30;
    const dashGap = 20;
    const totalDash = dashHeight + dashGap;
    
    // Offset per effetto scrolling
    const dashOffset = scrollOffset % totalDash;
    
    // Linea tra corsia 0 e 1
    const line1X = laneWidth - 2;
    for (let y = roadTop - dashOffset; y < roadTop + roadHeight; y += totalDash) {
        if (y + dashHeight > roadTop) {
            ctx.fillRect(line1X, Math.max(roadTop, y), 4, Math.min(dashHeight, roadTop + roadHeight - Math.max(roadTop, y)));
        }
    }
    
    // Linea tra corsia 1 e 2
    const line2X = laneWidth * 2 - 2;
    for (let y = roadTop - dashOffset; y < roadTop + roadHeight; y += totalDash) {
        if (y + dashHeight > roadTop) {
            ctx.fillRect(line2X, Math.max(roadTop, y), 4, Math.min(dashHeight, roadTop + roadHeight - Math.max(roadTop, y)));
        }
    }
    
    // Erba ai lati della strada
    ctx.fillStyle = COLORS.GRASS;
    ctx.fillRect(0, roadTop + roadHeight, GAME_WIDTH, GAME_HEIGHT - roadTop - roadHeight);
    
    // Marciapiede (verde pisello)
    ctx.fillStyle = COLORS.SIDEWALK;
    ctx.fillRect(0, roadTop + roadHeight, GAME_WIDTH, 8);
}

// ============================================
// BUS RENDERER
// ============================================

/**
 * Disegna il bus (scuolabus giallo con Leone dentro)
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} bus - oggetto bus con proprietà x, y, vx, state, direction
 */
function renderBus(ctx, bus) {
    ctx.save();
    ctx.translate(bus.x, bus.y);
    
    // Tilt quando si muove a sinistra/destra
    const tilt = bus.vx * 0.002;
    ctx.rotate(tilt);
    
    const busWidth = 70;
    const busHeight = 45;
    const windowWidth = 14;
    const windowHeight = 18;
    
    // Ombra sotto il bus
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(busWidth / 2, busHeight + 5, busWidth / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Corpo principale del bus (rettangolo arrotondato)
    ctx.fillStyle = COLORS.YELLOW_BUS;
    drawRoundedRect(ctx, 0, 0, busWidth, busHeight, 8);
    ctx.fill();
    
    // Lato destro più scuro per profondità
    ctx.fillStyle = COLORS.YELLOW_BUS_DARK;
    ctx.fillRect(busWidth - 6, 5, 6, busHeight - 10);
    
    // Parte superiore più chiara
    ctx.fillStyle = COLORS.YELLOW_BUS_LIGHT;
    ctx.fillRect(5, 2, busWidth - 15, 8);
    
    // Ruote
    ctx.fillStyle = COLORS.WHEEL_COLOR;
    ctx.beginPath();
    ctx.arc(15, busHeight, 7, 0, Math.PI * 2);
    ctx.arc(busWidth - 15, busHeight, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Cerchi ruote
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.arc(15, busHeight, 3, 0, Math.PI * 2);
    ctx.arc(busWidth - 15, busHeight, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Finestrini
    ctx.fillStyle = COLORS.WINDOW_BLUE;
    // Finestrino anteriore (con Leone)
    drawRoundedRect(ctx, 8, 8, windowWidth, windowHeight, 3);
    ctx.fill();
    
    // Secondo finestrino
    drawRoundedRect(ctx, 28, 8, windowWidth, windowHeight, 3);
    ctx.fill();
    
    // Terzo finestrino
    drawRoundedRect(ctx, 48, 8, windowWidth, windowHeight, 3);
    ctx.fill();
    
    // Disegna Leone nel primo finestrino
    drawLeone(ctx, 8 + windowWidth / 2, 8 + windowHeight / 2);
    
    // Frecce lampeggianti quando in fase di stopping
    if (bus.state === 'stopping' || bus.state === 'doors_open') {
        const flash = Math.sin(Date.now() * 0.01) > 0;
        if (flash) {
            ctx.fillStyle = '#FFA500';
            // Freccia sinistra
            ctx.beginPath();
            ctx.moveTo(2, 20);
            ctx.lineTo(8, 15);
            ctx.lineTo(8, 25);
            ctx.closePath();
            ctx.fill();
            // Freccia destra
            ctx.beginPath();
            ctx.moveTo(busWidth - 2, 20);
            ctx.lineTo(busWidth - 8, 15);
            ctx.lineTo(busWidth - 8, 25);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Portiere (a sinistra)
    if (bus.state === 'doors_open') {
        ctx.fillStyle = COLORS.YELLOW_BUS_DARK;
        ctx.fillRect(-5, 15, 8, 25);
    }
    
    // Lampeggio rosso quando colpito
    if (bus.state === 'hit') {
        const flash = Math.sin(Date.now() * 0.02) > 0;
        if (flash) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            drawRoundedRect(ctx, 0, 0, busWidth, busHeight, 8);
            ctx.fill();
        }
    }
    
    ctx.restore();
}

/**
 * Disegna Leone (il bambino dentro il finestrino)
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {number} cx - centro x
 * @param {number} cy - centro y
 */
function drawLeone(ctx, cx, cy) {
    // Testa (tonda)
    ctx.fillStyle = COLORS.CHILD_SKIN;
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Cappellino rosso
    ctx.fillStyle = COLORS.CHILD_HAT;
    ctx.beginPath();
    ctx.arc(cx, cy - 5, 4, Math.PI, 0);
    ctx.fill();
    
    // Occhi (puntini neri)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 1, 0, Math.PI * 2);
    ctx.arc(cx + 2, cy - 2, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Sorriso
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 2, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    
    // Mani sul volante (due piccoli cerchi ai lati)
    ctx.fillStyle = COLORS.CHILD_SKIN;
    ctx.beginPath();
    ctx.arc(cx - 6, cy + 6, 2, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy + 6, 2, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================
// OBSTACLE RENDERERS
// ============================================

/**
 * Renderer per tutti gli ostacoli
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} obstacle - oggetto ostacolo con type, x, y
 */
function renderObstacle(ctx, obstacle) {
    switch (obstacle.type) {
        case 'cone':
            renderCone(ctx, obstacle.x, obstacle.y);
            break;
        case 'cow':
            renderCow(ctx, obstacle.x, obstacle.y, obstacle.direction);
            break;
        case 'tree':
            renderTree(ctx, obstacle.x, obstacle.y);
            break;
    }
}

/**
 * Disegna un cono arancione/bianco
 */
function renderCone(ctx, x, y) {
    // Ombra
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Corpo del cono (arancione)
    ctx.fillStyle = COLORS.CONE;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 10);
    ctx.lineTo(x, y - 10);
    ctx.lineTo(x + 8, y + 10);
    ctx.closePath();
    ctx.fill();
    
    // Strisce bianche
    ctx.fillStyle = COLORS.CONE_STRIPE;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 4);
    ctx.lineTo(x, y - 2);
    ctx.lineTo(x + 5, y + 4);
    ctx.closePath();
    ctx.fill();
}

/**
 * Disegna una mucca bianca con macchie
 */
function renderCow(ctx, x, y, direction = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);
    
    // Ombra
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(0, 12, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Corpo
    ctx.fillStyle = COLORS.COW;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Macchie
    ctx.fillStyle = COLORS.COW_SPOTS;
    ctx.beginPath();
    ctx.ellipse(-5, -3, 5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 2, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, 5, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Testa
    ctx.fillStyle = COLORS.COW;
    ctx.beginPath();
    ctx.ellipse(-16, -2, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Orecchie
    ctx.beginPath();
    ctx.ellipse(-20, -8, 4, 2, -0.5, 0, Math.PI * 2);
    ctx.ellipse(-12, -8, 4, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Occhi
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-18, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(-14, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Naso/muso
    ctx.fillStyle = '#FFAAAA';
    ctx.beginPath();
    ctx.ellipse(-22, 2, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Zampe
    ctx.fillStyle = COLORS.COW;
    ctx.fillRect(-10, 8, 4, 6);
    ctx.fillRect(6, 8, 4, 6);
    
    ctx.restore();
}

/**
 * Disegna un albero caduto (tronco marrone + foglie verdi)
 */
function renderTree(ctx, x, y) {
    // Ombra
    ctx.fillStyle = COLORS.SHADOW;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Tronco orizzontale
    ctx.fillStyle = COLORS.TREE_TRUNK;
    drawRoundedRect(ctx, x - 25, y - 5, 50, 14, 4);
    ctx.fill();
    
    // Foglie (ammucchiate)
    ctx.fillStyle = COLORS.TREE_LEAVES;
    ctx.beginPath();
    ctx.arc(x - 15, y - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 5, y - 12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 20, y - 6, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Dettaglio foglie (verde più scuro)
    ctx.fillStyle = '#1B6B1B';
    ctx.beginPath();
    ctx.arc(x - 10, y - 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y - 17, 6, 0, Math.PI * 2);
    ctx.fill();
}

// ============================================
// STAR RENDERER
// ============================================

/**
 * Disegna una stella dorata rotante
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} star - oggetto stella con x, y, rotation
 */
function renderStar(ctx, star) {
    ctx.save();
    ctx.translate(star.x, star.y);
    
    // Rotazione
    const rotation = star.rotation || 0;
    
    // Sparkle effect (pulse)
    const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    ctx.scale(pulse, pulse);
    
    // Ombra
    ctx.fillStyle = COLORS.SHADOW;
    drawStar(ctx, 2, 2, 5, 12, 5, rotation);
    ctx.fill();
    
    // Stella principale dorata
    ctx.fillStyle = COLORS.STAR;
    drawStar(ctx, 0, 0, 5, 12, 5, rotation);
    ctx.fill();
    
    // Shimmer (puntino luminoso)
    ctx.fillStyle = COLORS.STAR_SHINE;
    ctx.beginPath();
    ctx.arc(-3, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// ============================================
// STATION RENDERER
// ============================================

/**
 * Disegna una fermata (segnale rosso F, paletto, pensilina)
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} station - oggetto stazione con x, y
 */
function renderStation(ctx, station) {
    ctx.save();
    ctx.translate(station.x, station.y);
    
    // Segnale rosso con "F"
    // Paletto
    ctx.fillStyle = COLORS.STOP_POLE;
    ctx.fillRect(-3, -30, 6, 60);
    
    // Base paletto
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.ellipse(0, 30, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Segnale (cerchio rosso)
    ctx.fillStyle = COLORS.STOP_SIGN;
    ctx.beginPath();
    ctx.arc(0, -40, 18, 0, Math.PI * 2);
    ctx.fill();
    
    //"Bordo" segnale
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Lettera "F" bianca
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', 0, -40);
    
    // Pensilina (tetto) - se nella lista delle fermate attive
    if (station.hasShelter) {
        // Supporti
        ctx.fillStyle = COLORS.STOP_POLE;
        ctx.fillRect(-30, -80, 4, 50);
        ctx.fillRect(26, -80, 4, 50);
        
        // Tetto
        ctx.fillStyle = '#8B4513';
        drawRoundedRect(ctx, -35, -90, 70, 12, 4);
        ctx.fill();
        
        // Parte inferiore pensilina
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(-32, -75, 64, 3);
    }
    
    // Bambino in attesa (se il bus si sta avvicinando)
    if (station.showChild) {
        drawWaitingChild(ctx, station.childX || 25, station.childY || -20);
    }
    
    ctx.restore();
}

/**
 * Disegna un bambino in attesa alla fermata
 */
function drawWaitingChild(ctx, x, y) {
    // Corpo
    ctx.fillStyle = COLORS.CHILD_SHIRT;
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Testa
    ctx.fillStyle = COLORS.CHILD_SKIN;
    ctx.beginPath();
    ctx.arc(x, y - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Cappellino
    ctx.fillStyle = COLORS.CHILD_HAT;
    ctx.beginPath();
    ctx.arc(x, y - 9, 4, Math.PI, 0);
    ctx.fill();
    
    // Occhi
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - 2, y - 5, 1, 0, Math.PI * 2);
    ctx.arc(x + 2, y - 5, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Manina che saluta (animazione)
    const wave = Math.sin(Date.now() * 0.008) * 0.3;
    ctx.save();
    ctx.translate(x + 5, y - 3);
    ctx.rotate(-0.5 + wave);
    ctx.fillStyle = COLORS.CHILD_SKIN;
    ctx.fillRect(0, -2, 6, 3);
    ctx.restore();
}

// ============================================
// UI RENDERER
// ============================================

/**
 * Disegna l'interfaccia utente (vite, stelle, amici)
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} gameState - stato del gioco con lives, stars, friends
 */
function renderUI(ctx, gameState) {
    // Cuori vite (in alto a sinistra)
    renderHearts(ctx, gameState.lives, 10, 10);
    
    // Contatore stelle (in alto a destra)
    renderStarCounter(ctx, gameState.stars, GAME_WIDTH - 50, 10);
    
    // Contatore amici (in alto al centro)
    renderFriendCounter(ctx, gameState.friends, gameState.totalFriends, GAME_WIDTH / 2, 10);
}

/**
 * Disegna i cuori delle vite
 */
function renderHearts(ctx, lives, x, y) {
    const heartSize = 14;
    const spacing = 20;
    
    for (let i = 0; i < 3; i++) {
        const hx = x + i * spacing;
        const filled = i < lives;
        drawHeart(ctx, hx, y, heartSize, filled);
    }
}

/**
 * Disegna un singolo cuore
 */
function drawHeart(ctx, x, y, size, filled) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.fillStyle = filled ? COLORS.HEART_RED : COLORS.HEART_EMPTY;
    
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 4);
    ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, size / 4);
    ctx.bezierCurveTo(-size / 2, size / 4, -size / 2, size / 2, 0, size);
    ctx.bezierCurveTo(size / 2, size / 2, size / 2, size / 4, size / 2, size / 4);
    ctx.fill();
    
    // Highlight se pieno
    if (filled) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-size / 6, size / 4, size / 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

/**
 * Disegna il contatore stelle
 */
function renderStarCounter(ctx, stars, x, y) {
    // Stella icona
    ctx.save();
    ctx.translate(x, y + 8);
    ctx.fillStyle = COLORS.STAR;
    drawStar(ctx, 0, 0, 5, 8, 4, 0);
    ctx.fill();
    ctx.restore();
    
    // Numero
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.strokeText(stars.toString(), x + 12, y + 8);
    ctx.fillText(stars.toString(), x + 12, y + 8);
}

/**
 * Disegna il contatore amici
 */
function renderFriendCounter(ctx, friends, total, x, y) {
    // Icona bambino
    ctx.save();
    ctx.translate(x - 30, y + 8);
    ctx.fillStyle = COLORS.CHILD_SHIRT;
    ctx.beginPath();
    ctx.ellipse(0, 4, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.CHILD_SKIN;
    ctx.beginPath();
    ctx.arc(0, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Testo contatore
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const text = `${friends}/${total}`;
    ctx.strokeText(text, x - 18, y + 8);
    ctx.fillText(text, x - 18, y + 8);
}

// ============================================
// PARTICLE RENDERER
// ============================================

/**
 * Pool di particelle per effetti sparkle
 */
const particlePool = [];
const MAX_PARTICLES = 50;

/**
 * Inizializza un pool di particelle
 */
function initParticlePool() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particlePool.push({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: '#FFD700',
            type: 'sparkle'
        });
    }
}

/**
 * Crea un burst di particelle sparkles
 */
function createSparkleBurst(x, y, count = 10, color = COLORS.STAR) {
    let created = 0;
    for (let i = 0; i < MAX_PARTICLES && created < count; i++) {
        const p = particlePool[i];
        if (!p.active) {
            p.active = true;
            p.x = x;
            p.y = y;
            const angle = (Math.PI * 2 * created) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 1.0;
            p.maxLife = 0.5 + Math.random() * 0.5;
            p.size = 3 + Math.random() * 3;
            p.color = color;
            p.type = 'sparkle';
            created++;
        }
    }
}

/**
 * Aggiorna tutte le particelle
 */
function updateParticles(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particlePool[i];
        if (p.active) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= dt / p.maxLife;
            
            if (p.life <= 0) {
                p.active = false;
            }
        }
    }
}

/**
 * Disegna tutte le particelle attive
 */
function renderParticles(ctx) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particlePool[i];
        if (p.active) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            
            if (p.type === 'sparkle') {
                // Stella sparkly
                drawStar(ctx, p.x, p.y, 4, p.size, p.size / 2, Date.now() * 0.01);
                ctx.fill();
            } else {
                // Cerchio semplice
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
}

// ============================================
// HIT STATE RENDERER
// ============================================

/**
 * Applica l'effetto di shake e flash rosso per stato HIT
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} hitState - stato hit con shakeIntensity, flashAlpha
 */
function applyHitEffect(ctx, hitState) {
    if (hitState.shakeIntensity > 0 || hitState.flashAlpha > 0) {
        ctx.save();
        
        // Shake effect
        if (hitState.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * hitState.shakeIntensity * 10;
            const shakeY = (Math.random() - 0.5) * hitState.shakeIntensity * 10;
            ctx.translate(shakeX, shakeY);
        }
        
        // Flash rosso
        if (hitState.flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 0, 0, ${hitState.flashAlpha * 0.4})`;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        
        ctx.restore();
    }
}

/**
 * Crea l'overlay per schermata di hit
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {number} intensity - intensità shake (0-1)
 * @param {number} flashAlpha - opacità flash rosso (0-1)
 */
function renderHitOverlay(ctx, intensity, flashAlpha) {
    // Screen shake
    if (intensity > 0) {
        const shakeX = (Math.random() - 0.5) * intensity * 15;
        const shakeY = (Math.random() - 0.5) * intensity * 15;
        ctx.translate(shakeX, shakeY);
    }
    
    // Red flash overlay
    if (flashAlpha > 0) {
        const flash = Math.sin(Date.now() * 0.015) > 0;
        if (flash) {
            ctx.fillStyle = `rgba(255, 50, 50, ${flashAlpha})`;
            ctx.fillRect(-20, -20, GAME_WIDTH + 40, GAME_HEIGHT + 40);
        }
    }
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

/**
 * Funzione principale di rendering - chiamata ogni frame
 * @param {CanvasRenderingContext2D} ctx - contesto canvas
 * @param {Object} game - oggetto game completo
 */
function render(ctx, game) {
    // Salva contesto
    ctx.save();
    
    // Disabilita smoothing per pixel-perfect
    ctx.imageSmoothingEnabled = false;
    
    // Applica hit effect se attivo
    if (game.hitState && game.hitState.active) {
        renderHitOverlay(ctx, game.hitState.shakeIntensity, game.hitState.flashAlpha);
    }
    
    // 1. Sky (parallax lento)
    renderSky(ctx, game.scrollOffset);
    
    // 2. Road (scrolling normale)
    renderRoad(ctx, game.scrollOffset);
    
    // 3. Stations (fermate)
    if (game.stations) {
        for (const station of game.stations) {
            if (station.y > -50 && station.y < GAME_HEIGHT + 50) {
                renderStation(ctx, station);
            }
        }
    }
    
    // 4. Obstacles (ostacoli)
    if (game.obstacles) {
        for (const obstacle of game.obstacles) {
            if (obstacle.y > -50 && obstacle.y < GAME_HEIGHT + 50) {
                renderObstacle(ctx, obstacle);
            }
        }
    }
    
    // 5. Stars (stelle collezionabili)
    if (game.stars) {
        for (const star of game.stars) {
            if (star.active && star.y > -30 && star.y < GAME_HEIGHT + 30) {
                renderStar(ctx, star);
            }
        }
    }
    
    // 6. Bus (protagonista)
    if (game.bus) {
        renderBus(ctx, game.bus);
    }
    
    // 7. Particles (effetti)
    renderParticles(ctx);
    
    // 8. UI (interfaccia)
    renderUI(ctx, {
        lives: game.lives || 3,
        stars: game.starsCollected || 0,
        friends: game.friendsCollected || 0,
        totalFriends: game.totalFriends || 0
    });
    
    // Ripristina contesto
    ctx.restore();
}

// Esporta tutto per uso modulo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        render,
        renderSky,
        renderRoad,
        renderBus,
        renderStar,
        renderStation,
        renderObstacle,
        renderCone,
        renderCow,
        renderTree,
        renderParticles,
        renderUI,
        renderHearts,
        applyHitEffect,
        renderHitOverlay,
        createSparkleBurst,
        updateParticles,
        initParticlePool,
        COLORS,
        GAME_WIDTH,
        GAME_HEIGHT
    };
}
