# Hero Sprites

Drop a PNG here named after the hero `id` and the game will use it
instead of the procedural / programmatic body drawing.

```
public/games/heroes/
  shelly.png        ← static idle render (Brawl Stars-style)
  bash.png
  scout.png
  ...
  shelly_walk.png   ← (optional, future) horizontal strip of N frames
  shelly_attack.png ← (optional, future) horizontal strip of N frames
```

## Requirements

| Property | Recommended |
|---|---|
| Format | PNG with transparent background |
| Size | ~256×384 (rendered at 130px tall in-game) |
| Anchor | Feet centered horizontally, bottom edge = ground |
| Facing | Toward camera (Brawl Stars convention — the gun arm rotates, body doesn't) |
| Background | Transparent (Blender → Render → Film → Transparent ✅) |

## Render settings (Blender)

For Brawl Stars-style 2.5D characters:

- **Camera**: Orthographic, tilted ~30° down (X-rotation = 60°)
- **Resolution**: 256×384 (or 512×768 for retina)
- **Engine**: Eevee (fast) or Cycles (cleaner edges)
- **Material**: Flat colour + cell-shaded shadow (NPR setup)
- **Outline**: Solidify modifier with inverted normals + black material
- **Lighting**: 1 key light at 45°, 1 fill light, no HDRI
- **Output**: PNG, RGBA, 8-bit, Film Transparent

## How the game picks the sprite

For each hero (scout / bash / boom / rush / shelly), on game load the
HTML5 client tries to fetch `/games/heroes/<id>.png`. If found, it
renders that image at the player's position. If not found (404), it
falls back to:

1. `drawShelly()` for shelly (the hand-coded 2.5D character)
2. `_drawDefaultBody()` for everyone else (the glow disc)

No game-side config needed — just drop the PNG and refresh.
