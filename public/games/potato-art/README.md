# Potato Bros — Art Assets

Drop a PNG here named after the in-game `id` and the game uses it
instead of the emoji wherever the icon shows up (character pick
screen, shop cards, level-up cards, HUD inventory slots).

Missing PNGs silently fall back to the emoji — you can drop assets
in one at a time, no need to fill the whole set before testing.

## Folder layout

```
public/games/potato-art/
├── characters/                       (one PNG per playable potato)
│   ├── potato.png
│   ├── gunner.png
│   ├── scout.png
│   ├── tank.png
│   ├── lucky.png
│   └── demon.png
└── items/                            (one PNG per weapon + shop item)
    ├── pistol.png  smg.png  shotgun.png  sniper.png  shuriken.png  laser.png
    ├── armor.png   boots.png  glove.png  ring.png  magnet.png
    ├── heart.png   thorns.png tonic.png
    ├── glassc.png  sadtom.png virus.png  tomes.png
    ├── eye.png     mines.png  wind.png   tyler.png
    └── adren.png   ghost.png  anvil.png  crown.png
```

## File format

| Property      | Recommended            |
|---------------|------------------------|
| Format        | PNG, transparent bg    |
| Size          | 256×256 (or 512×512)   |
| Style         | top-down icon, single subject centered, bold outlines |
| Display size  | 48 px (cards), 26 px (HUD slots) |

The renderer scales each PNG with `object-fit: contain`, so a square
image always fits without distortion.

## Suggested generator: Leonardo.ai (free)

1. https://leonardo.ai → sign in with Google
2. Pick "PixelArt SDXL" (characters) or "Leonardo Diffusion XL" (items)
3. Resolution: 512×512, 4 images per generate
4. Negative prompt: `text, words, letters, logo, watermark, blurry,
   low quality, multiple subjects, border, frame`
5. After generating, click the result → "Remove Background" → download
6. Rename to match the `id` from this README → drop into the folder

## File-to-id mapping

Character `id` ↔ filename:
- `potato`, `gunner`, `scout`, `tank`, `lucky`, `demon`

Item `id` ↔ filename — see the `ITEMS` array in
`/public/games/potato-bros.html`. Common ones:
- Weapons: `pistol`, `smg`, `shotgun`, `sniper`, `shuriken`, `laser`
- Simple stat items: `armor`, `boots`, `glove`, `ring`, `magnet`, `heart`, `thorns`, `tonic`
- Trade-off items: `glassc`, `sadtom`, `virus`, `tomes`
- Trigger items: `eye`, `mines`, `wind`, `tyler`
- Conditional items: `adren`, `ghost`, `anvil`, `crown`
