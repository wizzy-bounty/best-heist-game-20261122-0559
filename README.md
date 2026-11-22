# VAULTLIGHT

[![Competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/wizzy-bounty/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/wizzy-bounty/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist in a neon night bank. You are the thief inside the
Meridian Trust after hours: eight rooms on one screen — lobby, gallery,
security office, laser corridor, counting room and three vaults — all of it
watched by patrols, sweeping cameras and blinking tripwires.

**The job:** crack the MAIN VAULT (its take also unseals the roof stairs),
grab what you can carry on the way, and climb out. Every alarm level makes
the bank angrier: patrols speed up, reinforcements take the floor, and at
level 3 the lockdown doors slam shut.

## How to play

- **WASD / arrow keys** — move
- **SHIFT** — run: faster, but loud; detection fills half again as fast and
  your noise ring shows
- **E (hold)** — crack the vault you are standing at; you cannot move while
  cracking, and the guards know it
- **ENTER** — start · **R** — run it again

## The systems

- **Vision cones that respect cover.** Guard and camera cones are raycast
  against the real walls, desks, pedestals and pillars every frame — break
  the line and you are dark. The detection meter fills faster the closer
  and louder you are; a full meter raises the alarm (and costs the ghost
  bonus). A guard who touches you ends the run on the spot.
- **Cameras.** Three sweeping cameras build exposure while you stand in
  their cones; 1.5 s of footage raises the alarm.
- **Laser tripwires.** Three beams blink on their own periods across the
  corridor. Cross a live one and the alarm climbs.
- **Alarm levels 0–3.** Each level speeds patrols by 18% and posts another
  guard (counting room, gem vault, gallery relief). Level 3 locks two
  doors — the long way round stays open. A full meter at level 3, or a
  guard's hand on your shoulder, is BUSTED.
- **Vaults.** Gold and Gem vaults crack in 2 s for $1,800 each; the Main
  Vault takes 4 s, pays $4,000 and opens the roof stairs. Loose loot —
  registers, paintings, a server drive, money bags — adds $5,700 more.
- **Scoring.** Loot + time bonus (up to $3,000) + a $1,500 ghost bonus if
  the detection meter never once filled.

## Layout of the entry

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes the dossier exactly as `buildDossier` returns
  it
- `serve.ts` — a tiny static server for playing locally
  (`node serve.ts`, then open http://localhost:8080)
- `game/index.html` — the page; everything else is under `game/src/`
  - `level.js` — the bank: rooms, walls, cover, loot, vaults, cameras,
    lasers, patrols
  - `vision.js` — raycast sight and vision-cone polygons
  - `physics.js` — circle movement sliding against the level's rectangles
  - `guards.js` — patrol behaviour and cone constants
  - `player.js` — the thief: movement, sprint, interaction scan
  - `alarms.js` — detection meter, camera exposure, laser trips, lockdown
  - `audio.js` — generated WebAudio blips (no audio files)
  - `render.js` — the bank, the dense HUD, the floor-plan minimap, overlays
  - `main.js` — game state, the loop, cracking, and the deterministic
    `?shot=N` states the screenshots in `screenshots/` were taken with
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

The game is plain static files: no build step, no network request, every
asset under `game/`.
