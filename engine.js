/**
 * Leone Bus Engine - Game Logic Only
 * Nessun rendering - solo logica e strutture dati
 * 
 * States: TITLE → INTRO → PLAYING → STATION_STOP → HIT → LEVEL_COMPLETE → WIN
 */

// ============================================================================
// COSTANTI DI GIOCO
// ============================================================================

const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;
const BASE_SCROLL_SPEED = 80; // px/s
const BUS_SPEED_X = 200; // px/s
const FIXED_TIMESTEP = 1 / 60; // 60Hz
const MAX_ACCUMULATOR = 0.1; // 100ms max per tab-switch safety

// Game States
const STATE = {
    TITLE: 'TITLE',
    INTRO: 'INTRO',
    PLAYING: 'PLAYING',
    STATION_STOP: 'STATION_STOP',
    HIT: 'HIT',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    WIN: 'WIN'
};

// ============================================================================
// LEVEL 1 DATA
// ============================================================================

const LEVEL_1 = {
    duration: 60,
    scrollSpeed: BASE_SCROLL_SPEED,
    worldHeight: 3000,
    stations: [
        { y: -600, collected: false, children: 1, x: 160 },
        { y: -1400, collected: false, children: 1, x: 320 },
        { y: -2300, collected: false, children: 1, x: 240 }
    ],
    obstacles: [
        { type: 'cone', lane: 1, y: -300, width: 20, height: 30 },
        { type: 'cow', lane: -1, y: -700, direction: 1, width: 40, height: 30 },
        { type: 'cone', lane: 0, y: -1100, width: 20, height: 30 },
        { type: 'cone', lane: 2, y: -1700, width: 20, height: 30 },
        { type: 'tree', lane: 1, y: -2100, width: 30, height: 40 }
    ],
    stars: [
        { x: 100, y: -200 },
        { x: 380, y: -400 },
        { x: 240, y: -800 },
        { x: 80, y: -1000 },
        { x: 400, y: -1300 },
        { x: 160, y: -1600 },
        { x: 320, y: -1900 },
        { x: 240, y: -2500 }
    ]
};

// ============================================================================
// INPUT CLASS - Keyboard + Touch Drag
// ============================================================================

class Input {
    constructor() {
        this.keys = {};
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.isTouching = false;
        this.dragDeltaX = 0;
        this.touchEnabled = true;
        this.keyboardEnabled = true;

        this._bindKeyboard();
        this._bindTouch();
    }

    _bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    _bindTouch() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this.isTouching = true;
                this.touchStartX = e.touches[0].clientX;
                this.touchCurrentX = this.touchStartX;
                this.dragDeltaX = 0;
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this.touchCurrentX = e.touches[0].clientX;
                this.dragDeltaX = this.touchCurrentX - this.touchStartX;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.dragDeltaX = 0;
        }, { passive: false });
    }

    isLeftPressed() {
        return this.keyboardEnabled && (this.keys['ArrowLeft'] || this.keys['KeyA']);
    }

    isRightPressed() {
        return this.keyboardEnabled && (this.keys['ArrowRight'] || this.keys['KeyD']);
    }

    getTouchDragX() {
        return this.dragDeltaX;
    }

    getHorizontalInput() {
        let input = 0;
        if (this.isLeftPressed()) input -= 1;
        if (this.isRightPressed()) input += 1;
        
        // Touch drag overrides/adds to keyboard
        if (this.isTouching && Math.abs(this.dragDeltaX) > 5) {
            input = this.dragDeltaX > 0 ? 1 : -1;
        }
        
        return Math.max(-1, Math.min(1, input));
    }

    isActionPressed() {
        return this.keys['Space'] || this.keys['Enter'] || this.keys['Touch'];
    }

    update() {
        // Reset drag delta each frame (accumulated elsewhere if needed)
    }
}

// ============================================================================
// BUS CLASS - Movimento orizzontale
// ============================================================================

class Bus {
    constructor() {
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT - 60;
        this.width = 60;
        this.height = 40;
        this.vx = 0;
        this.targetVx = 0;
        this.lane = 1; // 0, 1, 2 (sinistra, centro, destra)
        this.laneWidth = GAME_WIDTH / 3;
        this.isHit = false;
        this.hitTimer = 0;
        this.isAtStation = false;
        this.doorsOpen = false;
        this.blinkTimer = 0;
        this.tilt = 0; // -1 a 1 per inclinazione laterale

        // Hitbox ridotto per collisione forgiving (80%)
        this.hitboxPadding = 0.1;
    }

    getHitbox() {
        const padX = this.width * this.hitboxPadding;
        const padY = this.height * this.hitboxPadding;
        return {
            x: this.x - this.width / 2 + padX,
            y: this.y - this.height / 2 + padY,
            width: this.width * (1 - 2 * this.hitboxPadding),
            height: this.height * (1 - 2 * this.hitboxPadding)
        };
    }

    setTargetLane(lane) {
        this.lane = Math.max(0, Math.min(2, lane));
        this.targetVx = 0;
    }

    update(dt, input) {
        // Hit recovery
        if (this.isHit) {
            this.hitTimer -= dt;
            if (this.hitTimer <= 0) {
                this.isHit = false;
            }
            return;
        }

        // Movimento orizzontale
        const horizontalInput = input.getHorizontalInput();
        
        // Calcola velocity target basata su input
        if (horizontalInput !== 0) {
            this.targetVx = horizontalInput * BUS_SPEED_X;
            // Tilt basato su direzione
            this.tilt = horizontalInput * 0.15;
        } else {
            this.targetVx = 0;
            this.tilt *= 0.9; // Ease back to neutral
        }

        // Smooth velocity transition
        const accel = 800; // px/s^2
        if (this.vx < this.targetVx) {
            this.vx = Math.min(this.vx + accel * dt, this.targetVx);
        } else if (this.vx > this.targetVx) {
            this.vx = Math.max(this.vx - accel * dt, this.targetVx);
        }

        // Applica movimento
        this.x += this.vx * dt;

        // Clamp dentro i bordi strada
        const roadMargin = 40;
        this.x = Math.max(roadMargin, Math.min(GAME_WIDTH - roadMargin, this.x));

        // Blink timer per frecce
        this.blinkTimer += dt;
    }

    hit() {
        this.isHit = true;
        this.hitTimer = 0.5; // 500ms freeze
        this.vx = -this.vx * 0.3; // Bounce back
    }

    openDoors() {
        this.doorsOpen = true;
    }

    closeDoors() {
        this.doorsOpen = false;
    }

    reset() {
        this.x = GAME_WIDTH / 2;
        this.vx = 0;
        this.isHit = false;
        this.hitTimer = 0;
        this.isAtStation = false;
        this.doorsOpen = false;
        this.tilt = 0;
        this.lane = 1;
    }
}

// ============================================================================
// OBSTACLE CLASS - Singolo ostacolo
// ============================================================================

class Obstacle {
    constructor() {
        this.active = false;
        this.type = 'cone'; // 'cone', 'cow', 'tree'
        this.x = 0;
        this.y = 0;
        this.width = 20;
        this.height = 30;
        this.lane = 0;
        this.direction = 1; // Per cow (attraversa orizzontalmente)
        this.vx = 0;
        this.vy = 0;
        this.hit = false;
        this.hitTimer = 0;
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    reset() {
        this.active = false;
        this.hit = false;
        this.hitTimer = 0;
    }
}

// ============================================================================
// OBSTACLE POOL - Pool di oggetti per coni/mucche/alberi
// ============================================================================

class ObstaclePool {
    constructor(maxSize = 20) {
        this.pool = [];
        this.maxSize = maxSize;
        
        for (let i = 0; i < maxSize; i++) {
            this.pool.push(new Obstacle());
        }
    }

    spawn(type, lane, y, options = {}) {
        const obstacle = this.getInactive();
        if (!obstacle) return null;

        obstacle.active = true;
        obstacle.type = type;
        obstacle.lane = lane;
        obstacle.y = y;
        obstacle.hit = false;
        obstacle.hitTimer = 0;

        // Posizione X basata su lane (o attraversamento per cow)
        if (type === 'cow') {
            obstacle.x = lane < 0 ? -50 : GAME_WIDTH + 50;
            obstacle.direction = lane < 0 ? 1 : -1;
            obstacle.vx = 60 * obstacle.direction; // cow attraversa lentamente
            obstacle.width = options.width || 40;
            obstacle.height = options.height || 30;
        } else {
            // Lane 0,1,2 mapping a X
            obstacle.x = 80 + lane * 120 + 60;
            obstacle.width = options.width || 20;
            obstacle.height = options.height || 30;
        }

        obstacle.vy = 0;
        return obstacle;
    }

    getInactive() {
        for (let obs of this.pool) {
            if (!obs.active) return obs;
        }
        return null;
    }

    update(dt, scrollSpeed) {
        for (let obs of this.pool) {
            if (!obs.active) continue;

            // Cow ha movimento orizzontale
            if (obs.type === 'cow') {
                obs.x += obs.vx * dt;
                obs.y += scrollSpeed * dt;
                
                // Deactivate se esce dallo schermo
                if ((obs.direction > 0 && obs.x > GAME_WIDTH + 100) ||
                    (obs.direction < 0 && obs.x < -100)) {
                    obs.reset();
                }
            } else {
                // Coni e alberi scrollano con la strada
                obs.y += scrollSpeed * dt;
            }

            // Hit animation timer
            if (obs.hit) {
                obs.hitTimer += dt;
            }
        }
    }

    getActiveObstacles() {
        return this.pool.filter(obs => obs.active);
    }

    reset() {
        for (let obs of this.pool) {
            obs.reset();
        }
    }
}

// ============================================================================
// STATION CLASS - Fermate del bus
// ============================================================================

class Station {
    constructor(data) {
        this.y = data.y;
        this.x = data.x || 160;
        this.collected = data.collected || false;
        this.children = data.children || 1;
        this.width = 40;
        this.height = 60;
        this.childVisible = false;
        this.childAnimTimer = 0;
        this.signWidth = 24;
        this.signHeight = 28;
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    isInRange(busY) {
        const range = 50;
        return Math.abs(busY - this.y) < range;
    }

    activateChild() {
        this.childVisible = true;
        this.childAnimTimer = 0;
    }

    update(dt) {
        if (this.childVisible) {
            this.childAnimTimer += dt;
        }
    }

    reset() {
        this.collected = false;
        this.childVisible = false;
        this.childAnimTimer = 0;
    }
}

// ============================================================================
// STAR CLASS - Stella collezionabile
// ============================================================================

class Star {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.scale = 1;
        this.scaleTimer = 0;
        this.collected = false;
        this.size = 16;
    }

    getHitbox() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    reset() {
        this.active = false;
        this.collected = false;
        this.rotation = 0;
        this.scale = 1;
        this.scaleTimer = 0;
    }
}

// ============================================================================
// STAR POOL - Pool di stelle
// ============================================================================

class StarPool {
    constructor(maxSize = 10) {
        this.pool = [];
        this.maxSize = maxSize;
        
        for (let i = 0; i < maxSize; i++) {
            this.pool.push(new Star());
        }
    }

    spawn(x, y) {
        const star = this.getInactive();
        if (!star) return null;

        star.active = true;
        star.x = x;
        star.y = y;
        star.rotation = Math.random() * Math.PI * 2;
        star.collected = false;
        star.scale = 1;
        star.scaleTimer = Math.random() * 1000;
        return star;
    }

    getInactive() {
        for (let star of this.pool) {
            if (!star.active) return star;
        }
        return null;
    }

    update(dt, scrollSpeed) {
        for (let star of this.pool) {
            if (!star.active || star.collected) continue;

            // Scroll con la strada
            star.y += scrollSpeed * dt;

            // Rotazione continua
            star.rotation += dt * 2;

            // Scale pulse
            star.scaleTimer += dt;
            star.scale = 1 + Math.sin(star.scaleTimer * 4) * 0.1;
        }
    }

    getActiveStars() {
        return this.pool.filter(star => star.active && !star.collected);
    }

    reset() {
        for (let star of this.pool) {
            star.reset();
        }
    }
}

// ============================================================================
// PARTICLE CLASS - Singola particella sparkle
// ============================================================================

class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 4;
        this.color = '#FFD700';
    }

    reset() {
        this.active = false;
    }
}

// ============================================================================
// PARTICLE SYSTEM - Sistema di particelle per sparkles
// ============================================================================

class ParticleSystem {
    constructor(maxParticles = 50) {
        this.particles = [];
        this.maxParticles = maxParticles;

        for (let i = 0; i < maxParticles; i++) {
            this.particles.push(new Particle());
        }
    }

    emit(x, y, count = 8, color = '#FFD700') {
        for (let i = 0; i < count; i++) {
            const particle = this.getInactive();
            if (!particle) break;

            particle.active = true;
            particle.x = x;
            particle.y = y;
            
            // Velocità random in cerchio
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            
            particle.life = 0;
            particle.maxLife = 0.4 + Math.random() * 0.3;
            particle.size = 3 + Math.random() * 3;
            particle.color = color;
        }
    }

    emitSparkle(x, y) {
        this.emit(x, y, 8, '#FFD700');
    }

    emitHit(x, y) {
        this.emit(x, y, 12, '#FF6B35');
    }

    getInactive() {
        for (let p of this.particles) {
            if (!p.active) return p;
        }
        return null;
    }

    update(dt) {
        for (let p of this.particles) {
            if (!p.active) continue;

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // Gravity leggera
            p.life += dt;

            if (p.life >= p.maxLife) {
                p.reset();
            }
        }
    }

    reset() {
        for (let p of this.particles) {
            p.reset();
        }
    }
}

// ============================================================================
// SCORE & LIVES MANAGER
// ============================================================================

class ScoreManager {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.maxLives = 3;
        this.childrenCollected = 0;
        this.totalChildren = 3;
        this.starsCollected = 0;
        this.totalStars = 8;
    }

    addScore(points) {
        this.score += points;
    }

    collectStar() {
        this.starsCollected++;
        this.addScore(100);
    }

    collectChild() {
        this.childrenCollected++;
        this.addScore(200);
    }

    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        return this.lives === 0;
    }

    reset() {
        this.score = 0;
        this.lives = this.maxLives;
        this.childrenCollected = 0;
        this.starsCollected = 0;
    }
}

// ============================================================================
// GAME CLASS - Main game controller con loop fixed timestep 60Hz
// ============================================================================

class Game {
    constructor() {
        this.state = STATE.TITLE;
        this.input = new Input();
        this.bus = new Bus();
        this.obstaclePool = new ObstaclePool(20);
        this.starPool = new StarPool(10);
        this.particles = new ParticleSystem(50);
        this.scoreManager = new ScoreManager();
        
        this.stations = [];
        this.scrollY = 0;
        this.scrollSpeed = BASE_SCROLL_SPEED;
        this.levelTime = 0;
        this.stateTimer = 0;
        this.introSkipped = false;

        // Timing per obstacles
        this.obstacleIndex = 0;
        this.starIndex = 0;
        this.stationIndex = 0;

        // Accumulator per fixed timestep
        this.accumulator = 0;
        this.lastTime = 0;
        this.running = false;

        // Level data
        this.currentLevel = null;
    }

    loadLevel(levelData) {
        this.currentLevel = levelData;
        this.scrollY = 0;
        this.scrollSpeed = levelData.scrollSpeed;
        this.levelTime = 0;
        
        // Reset everything
        this.bus.reset();
        this.obstaclePool.reset();
        this.starPool.reset();
        this.particles.reset();
        this.scoreManager.reset();
        
        // Setup stations
        this.stations = levelData.stations.map(s => new Station(s));
        
        // Reset indices
        this.obstacleIndex = 0;
        this.starIndex = 0;
        this.stationIndex = 0;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.running = false;
    }

    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Clamp delta per tab-switch safety
        this.accumulator += Math.min(deltaTime, MAX_ACCUMULATOR);

        // Fixed timestep update
        while (this.accumulator >= FIXED_TIMESTEP) {
            this.update(FIXED_TIMESTEP);
            this.accumulator -= FIXED_TIMESTEP;
        }

        // Request next frame
        requestAnimationFrame(() => this.loop());
    }

    update(dt) {
        this.input.update();
        this.stateTimer += dt;

        switch (this.state) {
            case STATE.TITLE:
                this.updateTitle(dt);
                break;
            case STATE.INTRO:
                this.updateIntro(dt);
                break;
            case STATE.PLAYING:
                this.updatePlaying(dt);
                break;
            case STATE.STATION_STOP:
                this.updateStationStop(dt);
                break;
            case STATE.HIT:
                this.updateHit(dt);
                break;
            case STATE.LEVEL_COMPLETE:
                this.updateLevelComplete(dt);
                break;
            case STATE.WIN:
                this.updateWin(dt);
                break;
        }
    }

    // ----------------------------------------------------------------
    // STATE UPDATE METHODS
    // ----------------------------------------------------------------

    updateTitle(dt) {
        // Attendi input per iniziare
        if (this.input.isLeftPressed() || this.input.isRightPressed() || 
            this.input.isActionPressed() || this.input.isTouching) {
            this.transitionTo(STATE.INTRO);
        }
    }

    updateIntro(dt) {
        // Intro semplice, skip dopo 3 secondi o con input
        this.scrollY += this.scrollSpeed * 0.2 * dt; // Scrolling lento

        if (this.stateTimer > 3 || this.input.isActionPressed() || this.input.isTouching) {
            this.loadLevel(LEVEL_1);
            this.transitionTo(STATE.PLAYING);
        }
    }

    updatePlaying(dt) {
        // Aggiorna scroll
        this.scrollY += this.scrollSpeed * dt;
        this.levelTime += dt;

        // Update bus
        this.bus.update(dt, this.input);

        // Spawn obstacles based on scroll position
        this.spawnObstacles();

        // Spawn stars based on scroll position
        this.spawnStars();

        // Update entities
        this.obstaclePool.update(dt, this.scrollSpeed);
        this.starPool.update(dt, this.scrollSpeed);
        this.particles.update(dt);

        // Update stations
        for (let station of this.stations) {
            station.update(dt);
        }

        // Check station proximity
        this.checkStationProximity();

        // Check collisions
        this.checkCollisions();

        // Check win condition
        if (this.scrollY >= this.currentLevel.worldHeight) {
            this.transitionTo(STATE.LEVEL_COMPLETE);
        }
    }

    updateStationStop(dt) {
        // Bus fermo, bambino sale
        this.bus.update(dt, this.input);
        this.particles.update(dt);

        // Update stations
        for (let station of this.stations) {
            station.update(dt);
        }

        // Station stop timer
        if (this.stateTimer > 2) {
            // Fine fermata
            const currentStation = this.getCurrentStation();
            if (currentStation && !currentStation.collected) {
                currentStation.collected = true;
                this.scoreManager.collectChild();
                this.particles.emitSparkle(this.bus.x, this.bus.y);
            }
            
            this.bus.closeDoors();
            this.transitionTo(STATE.PLAYING);
        }
    }

    updateHit(dt) {
        // Freeze per 500ms + shake
        this.bus.update(dt, this.input);
        this.particles.update(dt);
        this.obstaclePool.update(dt, this.scrollSpeed * 0.5);

        if (this.stateTimer > 0.5) {
            if (this.scoreManager.lives <= 0) {
                // Soft restart - torna a inizio livello
                this.loadLevel(LEVEL_1);
                this.scrollY = 0;
                this.transitionTo(STATE.PLAYING);
            } else {
                this.transitionTo(STATE.PLAYING);
            }
        }
    }

    updateLevelComplete(dt) {
        this.particles.update(dt);
        
        // Animazione festosa
        if (this.stateTimer > 3) {
            // Bonus per tutte le fermate completate
            const allStationsComplete = this.stations.every(s => s.collected);
            if (allStationsComplete) {
                this.scoreManager.addScore(500);
            }
            this.transitionTo(STATE.WIN);
        }
    }

    updateWin(dt) {
        this.particles.update(dt);
        
        // Attendi restart
        if (this.stateTimer > 5 && 
            (this.input.isActionPressed() || this.input.isTouching)) {
            this.transitionTo(STATE.TITLE);
        }
    }

    // ----------------------------------------------------------------
    // HELPER METHODS
    // ----------------------------------------------------------------

    spawnObstacles() {
        if (!this.currentLevel) return;

        while (this.obstacleIndex < this.currentLevel.obstacles.length) {
            const obs = this.currentLevel.obstacles[this.obstacleIndex];
            
            // Spawn quando scrollY raggiunge la posizione (con offset per lookahead)
            if (-this.scrollY <= obs.y + 300) {
                this.obstaclePool.spawn(obs.type, obs.lane, obs.y, {
                    width: obs.width,
                    height: obs.height
                });
                this.obstacleIndex++;
            } else {
                break;
            }
        }
    }

    spawnStars() {
        if (!this.currentLevel) return;

        while (this.starIndex < this.currentLevel.stars.length) {
            const star = this.currentLevel.stars[this.starIndex];
            
            if (-this.scrollY <= star.y + 300) {
                this.starPool.spawn(star.x, star.y);
                this.starIndex++;
            } else {
                break;
            }
        }
    }

    checkStationProximity() {
        if (this.bus.isHit) return;

        for (let station of this.stations) {
            if (station.collected) continue;

            const distance = Math.abs(this.bus.y - station.y);
            
            if (distance < 50 && Math.abs(this.bus.vx) < 10) {
                // Bus sufficiently slow and close - stop at station
                this.bus.isAtStation = true;
                this.bus.openDoors();
                this.bus.vx = 0;
                station.activateChild();
                this.setCurrentStation(station);
                this.transitionTo(STATE.STATION_STOP);
                return;
            } else if (distance < 30 && !station.collected) {
                // Passed station without stopping
                station.collected = true;
                const gameOver = this.scoreManager.loseLife();
                this.particles.emitHit(this.bus.x, this.bus.y);
                this.bus.hit();
                
                if (gameOver) {
                    // Go to HIT state which will trigger soft restart
                    this.transitionTo(STATE.HIT);
                }
            }
        }
    }

    checkCollisions() {
        if (this.bus.isHit) return;

        const busHitbox = this.bus.getHitbox();

        // Check obstacles
        const obstacles = this.obstaclePool.getActiveObstacles();
        for (let obs of obstacles) {
            if (obs.hit) continue;

            const obsHitbox = obs.getHitbox();
            if (this.aabbCollision(busHitbox, obsHitbox)) {
                obs.hit = true;
                const gameOver = this.scoreManager.loseLife();
                this.particles.emitHit(obs.x, obs.y);
                this.bus.hit();
                
                if (gameOver) {
                    this.transitionTo(STATE.HIT);
                } else {
                    this.transitionTo(STATE.HIT);
                }
                return;
            }
        }

        // Check stars
        const stars = this.starPool.getActiveStars();
        for (let star of stars) {
            const starHitbox = star.getHitbox();
            if (this.aabbCollision(busHitbox, starHitbox)) {
                star.collected = true;
                star.active = false;
                this.scoreManager.collectStar();
                this.particles.emitSparkle(star.x, star.y);
            }
        }
    }

    aabbCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    // ----------------------------------------------------------------
    // STATE MANAGEMENT
    // ----------------------------------------------------------------

    transitionTo(newState) {
        this.state = newState;
        this.stateTimer = 0;

        // Entry actions
        switch (newState) {
            case STATE.PLAYING:
                this.bus.isAtStation = false;
                break;
            case STATE.HIT:
                // Already handled in collision
                break;
        }
    }

    getCurrentStation() {
        return this._currentStation || null;
    }

    setCurrentStation(station) {
        this._currentStation = station;
    }

    // ----------------------------------------------------------------
    // GETTERS PER RENDERING (readonly access)
//    // ----------------------------------------------------------------

    getState() { return this.state; }
    getScrollY() { return this.scrollY; }
    getBus() { return this.bus; }
    getObstaclePool() { return this.obstaclePool; }
    getStarPool() { return this.starPool; }
    getParticles() { return this.particles; }
    getStations() { return this.stations; }
    getScoreManager() { return this.scoreManager; }
}

// ============================================================================
// EXPORT
// ============================================================================

// ES6 module export (se richiesto)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, Bus, Input, ObstaclePool, StarPool, ParticleSystem, Station, LEVEL_1, STATE };
}

// Global per HTML inline
if (typeof window !== 'undefined') {
    window.LeoneBusGame = {
        Game,
        Bus,
        Input,
        ObstaclePool,
        StarPool,
        ParticleSystem,
        Station,
        LEVEL_1,
        STATE
    };
}
