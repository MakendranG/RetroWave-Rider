# RetroWave Rider

A retro-styled arcade driving game with neon aesthetics where you drive through a procedurally generated road, avoiding obstacles and collecting data packets.

## Project Structure

```
retrowave-rider/
├── index.html
├── style.css
└── game.js
```

## Game Overview

RetroWave Rider is a simple arcade game inspired by classics like Spy Hunter with OutRun aesthetics. The game features:

### Core Game Mechanics
- Player-controlled car that moves between three lanes
- Procedurally generated obstacles, data packets, and power-ups
- Collision detection between the player and game objects
- Score system based on distance traveled and data packets collected
- Lives system with game over state

### Visual Effects
- Retro neon aesthetic with glowing elements
- Perspective road with scrolling grid background
- Particle effects for collisions and pickups
- CRT-style screen with subtle flicker effect

### Game Features
- Multiple power-ups (Shield, Time Warp, Data Magnet, Extra Life)
- Boost mechanic with cooldown
- Increasing difficulty as score grows
- Start and game over screens

## How to Play

1. Open `index.html` in a web browser
2. Click "START GAME" on the title screen
3. Use arrow keys to navigate between lanes
4. Collect blue data packets for points
5. Avoid obstacles (pink and red objects)
6. Collect power-ups (diamond shapes) for special abilities
7. Press Space to activate boost for temporary speed increase

## Controls
- **Left/Right arrows** or **A/D keys**: Change lanes
- **Space**: Activate boost
- **P**: Pause the game

## Technical Implementation Details

### Player Movement
The player car moves between three lanes using a smooth transition effect. The car's position is updated based on the selected lane with easing for a natural feel.

### Procedural Generation
Obstacles, data packets, and power-ups are generated procedurally with increasing frequency as the game progresses. They appear at the horizon and move toward the player with perspective scaling.

### Collision Detection
The game uses a simple but effective rectangle-based collision detection system:

```javascript
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}
```

### Power-up System
The game includes four different power-ups:
1. **Shield** - Protects from obstacles
2. **Time Warp** - Slows down game speed
3. **Data Magnet** - Attracts data packets
4. **Extra Life** - Gives an additional life

## Files

### index.html
This file contains the HTML structure for the game, including the canvas element and UI components.

### style.css
This file contains the CSS styling for the game, creating the retro neon aesthetic.

### game.js
This file contains the JavaScript game logic, including:
- Game initialization and setup
- Player controls and movement
- Procedural generation of obstacles and items
- Collision detection
- Rendering and animation
- Power-up system implementation

## Development

The game was developed using vanilla JavaScript and HTML5 Canvas, with no external dependencies. The visual style is achieved through CSS and canvas drawing operations.

## Credits

Created with assistance from Amazon Q Developer.
