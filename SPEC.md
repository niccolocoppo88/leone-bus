# SPEC — Leone Bus: Il Giorno dello Scuolabus

## 1. Concept & Vision

Un gioco per bambini di 3 anni: **Leone**, un bambino che guida il suo scuolabus giallo. Il bus si muove a sinistra/destra per evitare ostacoli mentre lo sfondo scorre verso il basso dando l'illusione di avanzare. Alle fermate, il bus deve fermarsi per raccogliere i bambini in attesa. Zero Game Over — se colpisce qualcosa, rallenta e perde un po' di tempo, ma non muore mai.

**Target:** 3 anni, prima esperienza con videogiochi.
**Tono:** Giocoso, colorato, rassicurante. Tutto è morbido, rotondo, sorridente.

---

## 2. Design Language

### Aesthetic Direction
**Late-SNES inspired** — colori saturati, forme morbide, nessun angolo tagliente. Personaggi tondi e amigurumi-style. Ispirazione: Yoshi's Island + design scandinavo per bambini.

### Color Palette
```
YELLOW BUS:      #F7C41F (giallo caldo)
YELLOW BUS DARK: #E5A800 (ombrascur)
ROAD:           #4A4A4A (grigio asfalto)
ROAD LINE:      #F7C41F (linee gialle tratteggiate)
SIDEWALK:       #B8D4A8 (verde pisello chiaro)
GRASS:          #6DC04A (verde prato)
SKY TOP:        #87CEEB (blu cielo)
SKY BOTTOM:     #C8E8F8 (blu cielo chiaro)
STOP SIGN:      #E53935 (rosso)
STOP POLE:      #8B8B8B (grigio)
CHILD:          #F4A460 (colore pelle)
CHILD SHIRT:    #42A5F5 (blu)
CHILD HAT:      #E53935 (rosso)
CONE:           #FF6B35 (arancione)
CONE STRIPE:    #FFFFFF (bianco)
COW:            #F5F5F5 (bianco con macchie marroni)
COW SPOTS:      #8B4513
TREE TRUNK:     #8B6914
TREE LEAVES:    #228B22
STARS:          #FFD700 (raccolti)
```

### Typography
Nessun testo nel gameplay — solo icone universali. Per schermate info, usare font arrotondato tipo **Fredoka One** o fallback a **Comic Sans MS**.

### Spatial System
- **Base resolution:** 480×270 (16:9)
- **Scale:** Integer scaling, max 4x, centrato
- **Pixel-perfect:** `imageSmoothingEnabled = false`

### Motion Philosophy
- Tutti i movimenti con **easing** (mai lineari)
- Transizioni di stato: 300ms ease-in-out
- Bus che frena: decelerazione morbida
- Particle burst su ogni raccolta

---

## 3. Layout & Structure

### Game Area
```
┌──────────────────────────────────────┐
│           SKY (gradient)              │  ← scrolling slow (0.2x)
├──────────────────────────────────────┤
│  ROAD (3 lanes)  ║  ROAD  ║  ROAD   │  ← scrolling normal (1x)
│  ─ ─ ─ ─ ─ ─ ─ ─║ ─ ─ ─ ║ ─ ─ ─ ─ ─│
│  BUS ←(Leone)   ║       ║           │  ← bus always visible center-ish
│                 ║       ║           │
├──────────────────────────────────────┤
│         SIDEWALK / GRASS             │  ← scrolling fast (1.5x)
└──────────────────────────────────────┘
```

### Lane System
- 3 corsie (lanes) — sinistra, centro, destra
- Bus può muoversi tra lane o in modo fluido continuo
- Ostacoli spawnano in lane specifiche

### Responsive Strategy
- Canvas 480×270 nativo
- CSS scale con `image-rendering: pixelated`
- Touch area copre l'intero schermo per drag/swipe

---

## 4. Features & Interactions

### Core Mechanics

#### Movement
- **← / → (A/D):** Muove bus a sinistra/destra
- **Touch/Drag:** Trascina il bus orizzontalmente
- Bus ha velocità costante orizzontale (200 px/s base)
- Il bus NON si muove verticalmente — solo orizzontalmente
- Scrolling verticale è continuo e automatico

#### Obstacles
| Ostacolo | Comportamento | Penalità |
|----------|---------------|----------|
| Cono arancione | Appare in lane, scrolling | -1 vita (3 vite totali, 0 = freeze + restart soft) |
| Mucca | Attraversa orizzontalmente | -1 vita |
| Albero caduto | Blocca lane | Bus deve usare lane diversa |

Vite = cuori ❤️❤️❤️ in alto a sinistra. Zero vite = "Ops!" + restart soft (torna a inizio livello, no game over).

#### Stations (Fermate)
- Segnale ROSSO con "FERMATA" in alto
- Quando il bus si avvicina alla fermata:
  1. Bus DEVE rallentare (o fermarsi se troppo veloce)
  2. Se fermo + vicino → animazione porte che si aprono
  3. 1-2 secondi → bambino sale (animazione)
  4. "+1 Amico!" appare
- Se si passa la fermata SENZA fermarsi: -1 vita

#### Stars (Collezionabili)
- Stelle dorate in cielo o sulla strada
- Raccolta = suono + particelle + contatore

### Game States
```
TITLE → INTRO → PLAYING → STATION_STOP → LEVEL_COMPLETE → WIN
                ↓
            VITA_ZERO (soft restart)
```

### Edge Cases
- **Collision durante fermata:** Ignorata (bambini che salgono sono "invincibili")
- **Fermata mancata:** Solo penalità vita, non blocca il gioco
- **Tutte le fermate completate:** Bonus +500 punti
- **Livello completato:** Animazione festosa + score finale

---

## 5. Component Inventory

### Bus (Scuolabus Giallo)
- **Shape:** Rettangolo arrotondato giallo con finestrini blu
- **States:**
  - Default: Bus in movimento, Leone visible nel finestrino
  - Stopping: Frecce arancioni lampeggianti
  - Doors open: Portiere aperte a sinistra
  - Hit: Lampeggio rosso + bounce back
  - Moving left/right: Leggero tilt nella direzione

### Road (Strada)
- 3 corsie con linee tratteggiate gialle
- Moving stripe pattern (scrolling down)
- Road edges (curb) in grigio scuro

### Station (Fermata)
- Segnale rosso rotondo con "F"
- Paletto grigio
- Penso marrone (ammortizzatore)
- Bimbo in attesa (quando il bus si avvicina, animazione saluto)

### Leone (Driver)
- Bimbo dentro il bus (finestrino)
- Mani sul volante (animazione rotazione)
- Espressione felice sempre

### Cone (Cuccia/Cono)
- Cono arancione/bianco classico
- Ombra sotto
- Sparkle quando colpito

### Cow (Mucca)
- Mucca bianca con macchie marroni
- Movimento lento orizzontale
- States: walking, hit (stunned stars)

### Star (Stella)
- Stella dorata 5 punte
- Rotazione continua
- Sparkle + scale pulse

### Lives (Vite)
- 3 cuori ❤️❤️❤️ in alto a sinistra
- Animazione: cuore vuoto quando perso (break + fade)

### Station Progress
- Indicatore in alto: "👥 2/5 bambini" raccolti

### Score
- Stelle totali raccolte in alto a destra
- Font grande, color oro

---

## 6. Technical Approach

### Architecture
Single HTML file — tutto inline, zero dipendenze esterne tranne font opzionale.

### Game Loop
- Fixed timestep: 60Hz (dt = 1/60)
- Interpolated rendering per smooth movement
- Accumulator capped per tab-switch safety

### State Machine (Game)
```
TITLE: logo + "TAP TO START"
INTRO: Leone guida, tutorial leggero (skip se >3s inactivity)
PLAYING: gameplay attivo
STATION_STOP: fermata, porte aperte, attesa
HIT: freeze 500ms + shake
LEVEL_COMPLETE: finale animato
WIN: score + "BRAVO!"
```

### Entity System
- Bus: oggetto singolo con x, y, vx
- Obstacles: object pool (max 20)
- Stars: object pool (max 10)
- Stations: array prefissato per livello

### Collision
- AABB per tutti gli oggetti
- Bus hitbox = 80% della sua area visiva (forgiving)
- Check collision solo in PLAYING state

### Level Data (JSON-like)
```javascript
const LEVEL_1 = {
  duration: 60, // secondi per completare
  scrollSpeed: 80, // px/s base
  stations: [
    { y: -500, collected: false },
    { y: -1200, collected: false },
    { y: -2000, collected: false },
  ],
  obstacles: [
    { type: 'cone', lane: 1, y: -300 },
    { type: 'cow', y: -600, direction: 1 },
    // ...
  ],
  stars: [
    { x: 100, y: -200 },
    { x: 380, y: -400 },
    // ...
  ]
};
```

### Audio
- **Web Audio API synthesis** — zero file audio
- **BGM:** Melodia semplice 8-bit ripetuta (loop)
- **SFX:** Jump sound, star collect, station ding, hit boing, victory fanfare

### Performance
- Object pooling per obstacles e particles
- No garbage collection mid-frame
- Canvas cleared once per frame

---

## 7. Level 1 — Detail

### Overview
- Lunghezza: ~2500px di scrolling verticale
- Durata stimata: 45-60 secondi
- 3 fermate da completare
- 5 ostacoli
- 8 stelle da raccogliere

### Scroll
- Background scroll: 80px/s
- Total world height: ~3000px
- Camera follows scroll position

### Station Layout
| Station | Y pos | Bimbi |
|---------|-------|-------|
| 1 | -600 | 1 |
| 2 | -1400 | 1 |
| 3 | -2300 | 1 |

### Obstacle Layout
| Type | Lane | Y pos | Timing |
|------|------|-------|--------|
| Cone | 1 | -300 | dopo intro |
| Cow | crossing | -700 | quando player in centro |
| Cone | 0 | -1100 | |
| Cone | 2 | -1700 | |
| Tree | 1 | -2100 | blocca lane centrale |

### Stars
Sparse lungo il percorso, gruppetti di 2-3.

---

## 8. Audio Design

### BGM (Loop)
Melodia allegra in 4/4, 120 BPM. Usa solo note do-mi-sol-la (ragaionevole per sintesi).

```
[Do, Mi, Sol, La] x2
[Fa, La, Do+1] x2
[Sol, Si, Re+1] x2
[Pausa 2 beat]
```

### SFX
| Event | Sound | Type |
|-------|-------|------|
| Star collect | "Ding!" | square wave, 880Hz → 1760Hz, 100ms |
| Hit | "Boing!" | triangle, 200→100Hz sweep, 200ms |
| Station arrive | "Ding dong!" | square, 523+392Hz stagger |
| Station complete | "Yay!" | noise burst + square |
| Victory | Fanfare | [523, 659, 784, 1047] arpeggio |
| Bus move | Squeak! | noise burst, 50ms |

---

## 9. Implementation Plan

### Sub-Agents (parallel work)
1. **Engine Core:** Game loop, FSM, input, bus movement, collision
2. **Assets & Rendering:** Bus, road, sky, obstacles, stations, stars (all drawn with Canvas 2D)
3. **Audio System:** Web Audio synthesis, BGM, SFX

### Assembly
- Assemblaggio in un singolo file HTML
- Integrazione di tutti i componenti
- Test con Playwright

### Files
```
leone-bus-game/
├── SPEC.md
├── index.html       ← game completo (single file)
└── test_game.js    ← Playwright test
```
