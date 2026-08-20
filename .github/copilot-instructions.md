# Copilot Instructions for my-first-app

## Project Overview

This is a **vanilla JavaScript side-scrolling action game** built with plain HTML, CSS, and JavaScript—no frameworks or build tools. The game features a player character that avoids incoming enemies to accumulate score while managing a limited health pool.

## Architecture

### Game Structure (game.js)
The game uses two main classes:
- **Player**: Handles movement (arrow keys), jumping (spacebar), gravity physics, and collision detection
- **Enemy**: Spawns from the right side, moves left, and disappears when off-screen

The game loop runs via `requestAnimationFrame()` and continuously:
1. Updates player/enemy positions based on input
2. Checks collisions and applies score/health changes
3. Spawns enemies at regular intervals (80 frames)
4. Renders everything to the canvas

### UI & Styling (index.html, style.css)
- Single canvas element (800×400) serves as the main game viewport
- HUD displays current score and lives at the top
- Game-over overlay appears when health reaches 0
- Gradient backgrounds and responsive design for multiple screen sizes

## Key Conventions

### Game Loop Pattern
```javascript
function gameLoop() {
    update();    // Physics & logic
    draw();      // Render to canvas
    requestAnimationFrame(gameLoop);
}
```

### Collision Detection
Simple AABB (axis-aligned bounding box) collision check:
```javascript
collidesWith(enemy) {
    return this.x < enemy.x + enemy.width && ...
}
```

### Coordinate System
- Origin (0, 0) is top-left of canvas
- X increases rightward, Y increases downward
- Ground level is at `canvas.height - 50` (grass area)

## Development Notes

- **No build step required**: Open `index.html` directly in a browser
- **No dependencies**: Pure JavaScript—no npm packages needed
- **Testing approach**: Manual browser testing; use browser DevTools console for debugging
- **Canvas rendering**: Uses 2D context (`ctx.fillRect`, `ctx.fillStyle`, etc.)
- **Input handling**: Keyboard events populate a `keys` object for frame-based input polling

## When Modifying Game Logic

- Update `spawnCounter` threshold to adjust enemy frequency (currently 80)
- Modify `Player.speed` or `Player.jumpPower` to adjust difficulty
- Change `Enemy.speed` to make enemies faster/slower
- Adjust `Player.gravity` for different jump feel
- Score increases by 10 points per enemy avoided; modify in `update()` function

## Common Tasks

**Add a new visual element**: Add to the `draw()` function using canvas drawing methods (`ctx.fillRect`, `ctx.strokeRect`, etc.)

**Adjust game difficulty**: Modify spawn rate, enemy speed, or player speed constants in the class constructors

**Change game dimensions**: Update canvas dimensions in `index.html` and adjust ground level calculation in `Player.update()`

## Important

**説明は日本語で表示するようにしてください。ユーザーとのやりとりはすべて日本語で行ってください。**
