// VAULTLIGHT level data: the Meridian Trust bank at night.
// One screen, eight rooms. Every wall and cover block is an axis-aligned
// rectangle: the same rectangles drive collision, guard sight-blocking and
// the laser/camera layout, so what the player sees is exactly what the
// simulation uses.

export const FIELD = { x: 14, y: 82, w: 1252, h: 612 };

// Room floor tints and floor labels, drawn under everything else.
export const ROOMS = [
  { name: 'GALLERY', x: 14, y: 82, w: 456, h: 290, floor: '#1b2340', trim: '#7c5cff' },
  { name: 'LOBBY', x: 14, y: 382, w: 456, h: 312, floor: '#16203a', trim: '#2fb9ff' },
  { name: 'SECURITY', x: 480, y: 82, w: 320, h: 210, floor: '#231a38', trim: '#ff5470' },
  { name: 'LASER CORRIDOR', x: 480, y: 302, w: 320, h: 168, floor: '#101a30', trim: '#ff3860' },
  { name: 'COUNTING ROOM', x: 480, y: 480, w: 320, h: 214, floor: '#14283a', trim: '#2fe6a8' },
  { name: 'GOLD VAULT', x: 810, y: 82, w: 456, h: 168, floor: '#2a2118', trim: '#ffb52e' },
  { name: 'MAIN VAULT HALL', x: 810, y: 260, w: 456, h: 260, floor: '#241c2e', trim: '#ffb52e' },
  { name: 'GEM VAULT', x: 810, y: 530, w: 456, h: 164, floor: '#2a2118', trim: '#ff7ad9' },
];

// Solid walls. Door gaps are simply the spaces between segments.
export const WALLS = [
  // Outer shell.
  { x: 0, y: 72, w: 1280, h: 10 },
  { x: 0, y: 694, w: 1280, h: 10 },
  { x: 0, y: 72, w: 14, h: 632 },
  { x: 1266, y: 72, w: 14, h: 632 },
  // Gallery | Security + Lobby | Corridor/Counting divider (x = 470).
  { x: 470, y: 82, w: 10, h: 68 },
  { x: 470, y: 198, w: 10, h: 190 },
  { x: 470, y: 428, w: 10, h: 128 },
  { x: 470, y: 604, w: 10, h: 90 },
  // Security/Vaults divider (x = 800).
  { x: 800, y: 82, w: 10, h: 58 },
  { x: 800, y: 188, w: 10, h: 196 },
  { x: 800, y: 432, w: 10, h: 144 },
  { x: 800, y: 624, w: 10, h: 70 },
  // Gallery | Lobby (y = 372), door at x 296..344.
  { x: 14, y: 372, w: 282, h: 10 },
  { x: 344, y: 372, w: 126, h: 10 },
  // Security | Laser Corridor (y = 292), door at x 596..644.
  { x: 480, y: 292, w: 116, h: 10 },
  { x: 644, y: 292, w: 156, h: 10 },
  // Laser Corridor | Counting Room (y = 470), door at x 516..564.
  { x: 480, y: 470, w: 36, h: 10 },
  { x: 564, y: 470, w: 236, h: 10 },
  // Gold Vault | Main Vault Hall (y = 250), door at x 1176..1224.
  { x: 810, y: 250, w: 366, h: 10 },
  { x: 1224, y: 250, w: 42, h: 10 },
  // Main Vault Hall | Gem Vault (y = 520), door at x 856..904.
  { x: 810, y: 520, w: 46, h: 10 },
  { x: 904, y: 520, w: 362, h: 10 },
];

// Doors that slam shut at alarm level 3 (lockdown). Other routes stay open.
export const LOCKDOWN_DOORS = [
  { x: 470, y: 150, w: 10, h: 48 },
  { x: 800, y: 576, w: 10, h: 48 },
];

// Furniture and fixtures: block movement and sight alike (cover).
export const COVER = [
  // Lobby desks and planters.
  { x: 90, y: 470, w: 86, h: 26 }, { x: 250, y: 470, w: 86, h: 26 },
  { x: 170, y: 590, w: 86, h: 26 },
  { x: 400, y: 420, w: 26, h: 26 }, { x: 420, y: 640, w: 26, h: 26 },
  // Gallery pedestals and sofa.
  { x: 90, y: 140, w: 30, h: 30 }, { x: 200, y: 140, w: 30, h: 30 }, { x: 310, y: 140, w: 30, h: 30 },
  { x: 120, y: 270, w: 120, h: 24 },
  // Security desk and server racks.
  { x: 540, y: 150, w: 120, h: 26 },
  { x: 700, y: 120, w: 26, h: 70 }, { x: 700, y: 220, w: 26, h: 60 },
  // Corridor pillars.
  { x: 520, y: 340, w: 24, h: 24 }, { x: 740, y: 404, w: 24, h: 24 },
  // Counting room tables.
  { x: 540, y: 540, w: 100, h: 26 }, { x: 660, y: 600, w: 100, h: 26 }, { x: 540, y: 640, w: 100, h: 26 },
  // Main vault hall gold pallets.
  { x: 880, y: 330, w: 54, h: 40 }, { x: 1050, y: 430, w: 54, h: 40 },
  // Gem vault crates.
  { x: 880, y: 580, w: 44, h: 34 }, { x: 980, y: 620, w: 44, h: 34 },
];

// Loose loot: walk over it to pocket it. Vault loot is paid on cracking.
export const LOOT = [
  { x: 133, y: 483, value: 500, kind: 'cash', label: 'register' },
  { x: 293, y: 483, value: 500, kind: 'cash', label: 'register' },
  { x: 105, y: 122, value: 900, kind: 'art', label: 'painting' },
  { x: 215, y: 122, value: 900, kind: 'art', label: 'painting' },
  { x: 325, y: 122, value: 900, kind: 'art', label: 'painting' },
  { x: 600, y: 140, value: 600, kind: 'drive', label: 'server drive' },
  { x: 590, y: 530, value: 350, kind: 'bag', label: 'money bag' },
  { x: 710, y: 590, value: 350, kind: 'bag', label: 'money bag' },
  { x: 590, y: 630, value: 350, kind: 'bag', label: 'money bag' },
  { x: 745, y: 520, value: 350, kind: 'bag', label: 'money bag' },
];

// Crackable vaults. Hold E at the interact point; the main vault also
// unlocks the roof stairs.
export const VAULTS = [
  { id: 'gold', name: 'GOLD VAULT', door: { x: 1196, y: 120, w: 58, h: 84 }, at: { x: 1166, y: 162 }, seconds: 2, value: 1800 },
  { id: 'main', name: 'MAIN VAULT', door: { x: 1196, y: 330, w: 58, h: 96 }, at: { x: 1166, y: 378 }, seconds: 4, value: 4000 },
  { id: 'gem', name: 'GEM VAULT', door: { x: 1196, y: 566, w: 58, h: 84 }, at: { x: 1166, y: 608 }, seconds: 2, value: 1800 },
];

// Roof stairs: the way out, sealed until the main vault is cracked.
export const STAIRS = { x: 846, y: 270, w: 96, h: 50 };

// Sweeping security cameras. Standing in a camera's cone builds exposure;
// 1.5 s of it raises the alarm.
export const CAMERAS = [
  { x: 458, y: 690, base: -2.35, sweep: 0.55, speed: 0.5, range: 175 },
  { x: 640, y: 314, base: Math.PI / 2, sweep: 0.7, speed: 0.65, range: 175 },
  { x: 826, y: 274, base: 0.9, sweep: 0.55, speed: 0.55, range: 175 },
];

// Laser tripwires across the corridor: vertical beams that blink on a
// period. Crossing a live beam raises the alarm.
export const LASERS = [
  { x: 556, y0: 306, y1: 466, period: 3.2, duty: 0.62, phase: 0 },
  { x: 640, y0: 306, y1: 466, period: 4.1, duty: 0.62, phase: 1.3 },
  { x: 724, y0: 306, y1: 466, period: 2.6, duty: 0.62, phase: 2.1 },
];

// Guard patrols (waypoint loops, all inside one room or through a door the
// loop actually fits). minAlarm: reinforcements that only take the floor
// once the alarm reaches that level.
export const PATROLS = [
  { name: 'Gallery guard', minAlarm: 0, points: [[80, 320], [400, 320], [400, 120], [80, 120]] },
  { name: 'Lobby guard', minAlarm: 0, points: [[120, 640], [400, 640], [400, 450], [120, 450]] },
  { name: 'Security guard', minAlarm: 0, points: [[540, 140], [750, 140], [750, 240], [540, 240]] },
  { name: 'Corridor guard', minAlarm: 0, points: [[520, 345], [760, 345], [760, 428], [520, 428]] },
  { name: 'Vault guard', minAlarm: 0, points: [[860, 300], [1200, 300], [1200, 470], [860, 470]] },
  { name: 'Counting guard', minAlarm: 1, points: [[520, 655], [760, 655], [760, 520], [520, 520]] },
  { name: 'Gem guard', minAlarm: 2, points: [[860, 565], [1200, 565], [1200, 665], [860, 665]] },
  { name: 'Gallery relief', minAlarm: 3, points: [[60, 210], [420, 210], [420, 335], [60, 335]] },
];

export const PLAYER_START = { x: 76, y: 636 };

export const TOTAL_LOOT = LOOT.reduce((sum, item) => sum + item.value, 0)
  + VAULTS.reduce((sum, vault) => sum + vault.value, 0);
