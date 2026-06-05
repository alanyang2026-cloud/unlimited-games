# Hero Brawl — Map Editor (Godot 4)

A tiny Godot 4 project that lets you draw walls + bushes for the
`/games/hero-brawl.html` arena visually, then export to JSON the game
can load.

## 1. Install Godot

Download **Godot Engine 4.x (Standard)** from
https://godotengine.org/download/macos/

```sh
# After downloading
mv ~/Downloads/Godot*.app /Applications/
# First launch: right-click → Open → Allow (Gatekeeper)
```

## 2. Open this project

1. Launch Godot
2. Click **Import**
3. Pick `godot-map-editor/project.godot` from this folder
4. Click **Import & Edit**
5. Hit `F5` (or the ▶ button) to run

## 3. Build your map

The editor opens at the game's exact aspect (1280×720) with a 64-px grid.

| Key | Action |
| --- | --- |
| `1` | Wall tool — drag with the mouse to draw a rectangle |
| `2` | Bush tool — click to place a circle |
| `3` | Erase tool — click on a wall/bush to remove |
| `[` / `]` | Shrink / grow the bush radius |
| `B` | Add default outer border walls |
| `C` | Clear the whole map |
| `E` | Export to `user://map.json` |
| `L` | Load `user://map.json` back into the editor |

The `user://` folder on macOS resolves to:

```
~/Library/Application Support/Godot/app_userdata/Hero Brawl Map Editor/
```

When you press `E`, Godot prints the absolute path of `map.json` to the
**Output** panel. Copy that to anywhere you like.

## 4. Load it into the game

Open Hero Brawl. In the lobby, click the left-side **英雄** button to
open the brawler picker — at the bottom is **📁 加载自定义地图**. Pick
your exported `map.json` and hit **对战**. The mode pill at the bottom
will show your map's name.

Three ways to load a custom map:

1. **File picker in the lobby** (above)
2. **URL parameter** — host the JSON anywhere and open:
   `https://unlimitedgames.vercel.app/games/hero-brawl.html?map=https://your.host/map.json`
3. **Drag-drop into the page** (not yet implemented — let me know if you want this)

## 5. JSON format

If you ever want to write maps by hand:

```json
{
  "name": "my-arena",
  "w": 1280,
  "h": 720,
  "walls":  [{"x":0,"y":0,"w":1280,"h":20}, ...],
  "bushes": [{"x":130,"y":130,"r":55}, ...]
}
```

- `walls` are axis-aligned rectangles (no rotation, no diagonals).
- `bushes` are circles; players inside one are hidden from enemies.
- Coordinates are in pixels, **0,0 = top-left**, arena is **1280×720**.
- Always include the 4 outer border walls (the `B` key fills them in).

## Tips

- Leave the four corners (140, 140), (1140, 140), (140, 580), (1140, 580)
  clear — those are player spawn points.
- The danger zone shrinks toward the center (W/2, H/2 = 640, 360),
  so make sure that's reachable.
- Stack bushes for chunky cover.
- The game uses a 64-px grid; the editor snaps walls to 16 px for finer
  control.
