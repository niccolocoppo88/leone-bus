/**
 * Leone Bus Game - Main Entry Point
 * Integra engine.js e rendering.js in un gioco HTML5 completo
 */

// ============================================================================
// COSTANTI
// ============================================================================

const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;
const FIXED_TIMESTEP = 1 / 60;

// ============================================================================
// GAME DATA BRIDGE
// Bridge tra engine e rendering - espone gli alias che rendering.js si aspetta
// ============================================================================

const gameData = {
    // Mappatura base
    scrollOffset: 0,
    scrollY: 0,
    bus: null,
    obstacles: [],
    stars: [],
    stations: [],
    lives: 3,
    starsCollected: 0,
    friendsCollected: 0,
    totalFriends: 3,
    hitState: {
        active: false,
        shakeIntensity: 0,
        flashAlpha: 0
    }
};

// ============================================================================
// GAME RUNNER CLASS
// ============================================================================

class GameRunner {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.game = null;
        this.running = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.audioInitialized = false;
        this.audioManager = null;

        // Fixed timestep per fisica
        this.fixedTimestep = FIXED_TIMESTEP;

        // Scaling
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Stato per render
        this.currentState = 'TITLE';
    }

    /**
     * Inizializzazione gioco
     */
    init() {
        // Trova canvas
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element #gameCanvas not found!');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Failed to get 2D context!');
            return false;
        }

        // Disabilita smoothing per pixel-perfect
        this.ctx.imageSmoothingEnabled = false;

        // Inizializza engine
        const LeoneBusGame = window.LeoneBusGame;
        if (!LeoneBusGame || !LeoneBusGame.Game) {
            console.error('LeoneBusGame engine not loaded!');
            return false;
        }

        this.game = new LeoneBusGame.Game();

        // Inizializza audio
        this.audioManager = window.audioManager;

        // Setup canvas responsive
        this.setupCanvas();

        // Setup input handling
        this.setupInput();

        // Resize handler
        window.addEventListener('resize', () => this.setupCanvas());

        // Inizializza particles nel rendering module
        if (typeof initParticlePool === 'function') {
            initParticlePool();
        }

        console.log('GameRunner initialized successfully');
        return true;
    }

    /**
     * Setup canvas responsive con integer scaling
     */
    setupCanvas() {
        const baseWidth = GAME_WIDTH;
        const baseHeight = GAME_HEIGHT;

        // Trova dimensioni finestra
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calcola scale intero massimo che entra nella finestra
        let scaleX = Math.floor(windowWidth / baseWidth);
        let scaleY = Math.floor(windowHeight / baseHeight);
        this.scale = Math.max(1, Math.min(scaleX, scaleY));

        // Dimensioni finali canvas
        const canvasWidth = baseWidth * this.scale;
        const canvasHeight = baseHeight * this.scale;

        // Setta attributi canvas
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';

        // Calcola offset per centrare
        this.offsetX = (windowWidth - canvasWidth) / 2;
        this.offsetY = (windowHeight - canvasHeight) / 2;
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = this.offsetX + 'px';
        this.canvas.style.top = this.offsetY + 'px';

        // Scala il contesto per disegnare in coordinate virtuali
        this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
    }

    /**
     * Setup input handling che inoltra all'engine
     */
    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            // Init audio on first keypress
            this.initAudio();

            // Forward to engine
            if (this.game && this.game.input) {
                this.game.input.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.game && this.game.input) {
                this.game.input.keys[e.code] = false;
            }
        });

        // Touch su canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.initAudio();

            if (this.game && this.game.input && e.touches.length > 0) {
                this.game.input.isTouching = true;
                this.game.input.touchStartX = e.touches[0].clientX;
                this.game.input.touchCurrentX = e.touches[0].clientX;
                this.game.input.dragDeltaX = 0;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.game && this.game.input && e.touches.length > 0) {
                this.game.input.touchCurrentX = e.touches[0].clientX;
                this.game.input.dragDeltaX = 
                    this.game.input.touchCurrentX - this.game.input.touchStartX;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.game && this.game.input) {
                this.game.input.isTouching = false;
                this.game.input.dragDeltaX = 0;
            }
        }, { passive: false });

        // Click su canvas
        this.canvas.addEventListener('click', () => {
            this.initAudio();
        });
    }

    /**
     * Inizializza audio al primo user gesture
     */
    initAudio() {
        if (this.audioInitialized) return;

        if (this.audioManager && typeof this.audioManager.init === 'function') {
            this.audioManager.init();
            this.audioInitialized = true;
            console.log('Audio initialized');
        }
    }

    /**
     * Avvia il gioco
     */
    start() {
        if (!this.game) {
            console.error('Game not initialized!');
            return;
        }

        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;

        // Avvia game loop
        requestAnimationFrame(this.loop.bind(this));

        console.log('Game started');
    }

    /**
     * Ferma il gioco
     */
    stop() {
        this.running = false;
    }

    /**
     * Game loop principale con fixed timestep
     */
    loop(timestamp) {
        if (!this.running) return;

        // Calcola tempo frame
        const frameTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Accumula tempo (con clamp per tab-switch safety)
        this.accumulator += frameTime;
        if (this.accumulator > this.fixedTimestep * 5 * 1000) {
            this.accumulator = this.fixedTimestep * 5 * 1000;
        }

        // Fixed timestep updates
        while (this.accumulator >= this.fixedTimestep * 1000) {
            this.game.update(this.fixedTimestep);
            this.accumulator -= this.fixedTimestep * 1000;
        }

        // Update bridge con dati dall'engine
        this.updateGameData();

        // Render
        this.render();

        // Prossimo frame
        requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Aggiorna gameData bridge con dati dall'engine
     */
    updateGameData() {
        if (!this.game) return;

        // Mappatura engine -> rendering
        gameData.scrollOffset = this.game.scrollY;
        gameData.scrollY = this.game.scrollY;
        gameData.bus = this.game.bus;
        gameData.obstacles = this.game.obstaclePool.getActiveObstacles();
        gameData.stars = this.game.starPool.getActiveStars();
        gameData.stations = this.game.stations;
        gameData.lives = this.game.scoreManager.lives;
        gameData.starsCollected = this.game.scoreManager.starsCollected;
        gameData.friendsCollected = this.game.scoreManager.childrenCollected;
        gameData.totalFriends = 3; // LEVEL_1 ha 3 stazioni

        // Hit state
        const isHit = this.game.state === window.LeoneBusGame.STATE.HIT;
        gameData.hitState = {
            active: isHit,
            shakeIntensity: isHit ? 0.5 : 0,
            flashAlpha: isHit ? 0.3 : 0
        };

        // Salva stato corrente per render
        this.currentState = this.game.state;
    }

    /**
     * Rendering principale
     */
    render() {
        const ctx = this.ctx;
        const LeoneBusGame = window.LeoneBusGame;

        // Clear canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Routing per stato di gioco
        if (this.currentState === LeoneBusGame.STATE.TITLE) {
            this.renderTitleScreen();
        } else if (this.currentState === LeoneBusGame.STATE.WIN) {
            this.renderWinScreen();
        } else {
            // Gioco normale - usa rendering module
            this.renderGame();
        }
    }

    /**
     * Rendering del gioco principale
     */
    renderGame() {
        // Chiamata al modulo di rendering
        if (typeof render === 'function') {
            render(this.ctx, gameData);
        } else {
            // Fallback: rendering inline base
            this.renderFallback();
        }
    }

    /**
     * Rendering fallback se rendering.js non carica
     */
    renderFallback() {
        const ctx = this.ctx;

        // Sky
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#C8E8F8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Road
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 80, GAME_WIDTH, GAME_HEIGHT - 120);

        // Bus
        if (gameData.bus) {
            ctx.fillStyle = '#F7C41F';
            ctx.fillRect(gameData.bus.x - 30, gameData.bus.y - 20, 60, 40);
        }

        // UI
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Lives: ' + gameData.lives, 10, 20);
        ctx.fillText('Stars: ' + gameData.starsCollected, GAME_WIDTH - 60, 20);
        ctx.fillText('Friends: ' + gameData.friendsCollected + '/' + gameData.totalFriends, GAME_WIDTH / 2 - 30, 20);
    }

    /**
     * Rendering schermata titolo
     */
    renderTitleScreen() {
        const ctx = this.ctx;

        // Sky background
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#C8E8F8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Ground
        ctx.fillStyle = '#6DC04A';
        ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

        // Road
        ctx.fillStyle = '#4A4A4A';
        ctx.fillRect(0, 180, GAME_WIDTH, 90);

        // Titolo "LEONE BUS"
        ctx.save();
        ctx.fillStyle = '#F7C41F';
        ctx.strokeStyle = '#E5A800';
        ctx.lineWidth = 4;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('LEONE BUS', GAME_WIDTH / 2, 80);
        ctx.fillText('LEONE BUS', GAME_WIDTH / 2, 80);
        ctx.restore();

        // Sottotitolo
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText('Il gioco dello scuolabus!', GAME_WIDTH / 2, 115);
        ctx.fillText('Il gioco dello scuolabus!', GAME_WIDTH / 2, 115);

        // Istruzioni
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.fillText('Premi SPAZIO o tocca per iniziare', GAME_WIDTH / 2, 200);

        // Disegna bus stilizzato
        this.renderTitleBus();

        // Animazione nuvolette
        const time = Date.now() * 0.001;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(100 + Math.sin(time) * 10, 40, 15, 0, Math.PI * 2);
        ctx.arc(120 + Math.sin(time) * 10, 35, 20, 0, Math.PI * 2);
        ctx.arc(145 + Math.sin(time) * 10, 40, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(350 + Math.sin(time + 1) * 8, 55, 12, 0, Math.PI * 2);
        ctx.arc(365 + Math.sin(time + 1) * 8, 50, 16, 0, Math.PI * 2);
        ctx.arc(385 + Math.sin(time + 1) * 8, 55, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Bus stilizzato per schermata titolo
     */
    renderTitleBus() {
        const ctx = this.ctx;
        const x = GAME_WIDTH / 2;
        const y = 160;

        // Ombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 25, 35, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo bus
        ctx.fillStyle = '#F7C41F';
        this.drawRoundedRect(ctx, x - 35, y - 20, 70, 40, 8);
        ctx.fill();

        // Finestrini
        ctx.fillStyle = '#5DADE2';
        this.drawRoundedRect(ctx, x - 28, y - 15, 14, 16, 2);
        ctx.fill();
        this.drawRoundedRect(ctx, x - 7, y - 15, 14, 16, 2);
        ctx.fill();
        this.drawRoundedRect(ctx, x + 14, y - 15, 14, 16, 2);
        ctx.fill();

        // Ruote
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(x - 20, y + 20, 7, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 20, 7, 0, Math.PI * 2);
        ctx.fill();

        // Leone nel finestrino
        ctx.fillStyle = '#F4A460';
        ctx.beginPath();
        ctx.arc(x - 21, y - 7, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.arc(x - 21, y - 10, 3, Math.PI, 0);
        ctx.fill();
    }

    /**
     * Rendering schermata vittoria
     */
    renderWinScreen() {
        const ctx = this.ctx;

        // Sky celebrativo
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFF8DC');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Ground
        ctx.fillStyle = '#6DC04A';
        ctx.fillRect(0, GAME_HEIGHT - 60, GAME_WIDTH, 60);

        // Testo "BRAVO!"
        ctx.save();
        ctx.fillStyle = '#E53935';
        ctx.strokeStyle = '#B71C1C';
        ctx.lineWidth = 5;
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('BRAVO!', GAME_WIDTH / 2, 80);
        ctx.fillText('BRAVO!', GAME_WIDTH / 2, 80);
        ctx.restore();

        // Score finale
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';

        const score = this.game ? this.game.scoreManager.score : 0;
        ctx.strokeText('Punteggio Finale: ' + score, GAME_WIDTH / 2, 130);
        ctx.fillText('Punteggio Finale: ' + score, GAME_WIDTH / 2, 130);

        // Statistiche
        ctx.font = '16px Arial';
        ctx.fillText('Stelle raccolte: ' + (this.game ? this.game.scoreManager.starsCollected : 0) + '/8', GAME_WIDTH / 2, 160);
        ctx.fillText('Amici portati a scuola: ' + (this.game ? this.game.scoreManager.childrenCollected : 0) + '/3', GAME_WIDTH / 2, 185);

        // Istruzioni restart
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.fillText('Premi SPAZIO per giocare ancora', GAME_WIDTH / 2, 220);

        // Stella decorativa animata
        const time = Date.now() * 0.003;
        ctx.save();
        ctx.translate(GAME_WIDTH / 2, 50);
        ctx.rotate(time);
        ctx.fillStyle = '#FFD700';
        this.drawStarShape(ctx, 0, 0, 5, 20, 10);
        ctx.restore();

        // Sparkles decorativi
        for (let i = 0; i < 5; i++) {
            const angle = time + (i * Math.PI * 2 / 5);
            const sx = GAME_WIDTH / 2 + Math.cos(angle) * 80;
            const sy = 100 + Math.sin(angle) * 40;
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = 0.6 + Math.sin(time * 2 + i) * 0.4;
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

/**
     * Disegna una stella a 5 punte (helper)
     */
    drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

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
        ctx.fill();
    }

    /**
     * Disegna un rettangolo arrotondato (compatibile)
     */
    drawRoundedRect(ctx, x, y, width, height, radius) {
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
}

// ============================================================================
// INIZIALIZZAZIONE
// ============================================================================

// Avvia gioco quando DOM è pronto
let gameRunner = null;

function initGame() {
    console.log('Initializing Leone Bus Game...');

    gameRunner = new GameRunner();

    if (gameRunner.init()) {
        gameRunner.start();
        console.log('Leone Bus Game is running!');
    } else {
        console.error('Failed to initialize game!');
        // Mostra messaggio errore nella pagina
        document.body.innerHTML = '<div style="text-align:center;padding:50px;font-family:Arial;color:#E53935;font-size:24px;">Errore: impossibile avviare il gioco.<br><br>Assicurati che tutti i file siano caricati correttamente.</div>';
    }
}

// Attendi caricamento completo DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Esporta per debug
window.gameRunner = gameRunner;
window.gameData = gameData;
