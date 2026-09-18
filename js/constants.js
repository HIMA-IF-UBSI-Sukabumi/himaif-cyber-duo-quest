// js/constants.js - Konfigurasi dan konstanta game HIMAIF Duo

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// Daftar 26 Karakter yang tersedia di folder assets/charakter/
export const CHARACTERS = [
  { id: 1, name: "Alpha Byte", role: "Cyber Sentinel", desc: "Ahli navigasi sirkuit cepat" },
  { id: 2, name: "Binary Nova", role: "Quantum Scout", desc: "Gesit dan tanggap sensor" },
  { id: 3, name: "Cyber Fox", role: "Terminal Infiltrator", desc: "Cepat menyelinap di balik drone" },
  { id: 4, name: "Pixel Knight", role: "Firewall Guard", desc: "Tangguh menghadapi rintangan" },
  { id: 5, name: "Vortex Ray", role: "Energy Conduit", desc: "Spesialis aliran sirkuit" },
  { id: 6, name: "Glitch Echo", role: "Phase Runner", desc: "Lompatan ringan dan seimbang" },
  { id: 7, name: "Data Spectre", role: "Ghost Protocol", desc: "Tak terdeteksi sensor laser" },
  { id: 8, name: "Logic Core", role: "System Architect", desc: "Ahli memecahkan tombol & tuas" },
  { id: 9, name: "Neon Valkyrie", role: "Overclock Unit", desc: "Refleks gesit dan stabil" },
  { id: 10, name: "Matrix Pulse", role: "Signal Breaker", desc: "Mampu memanipulasi terminal" },
  { id: 11, name: "Aero Byte", role: "Skyline Hopper", desc: "Lompatan presisi tinggi" },
  { id: 12, name: "Chrono Shift", role: "Warp Specialist", desc: "Pengatur ritme kerja sama" },
  { id: 13, name: "Cipher Blade", role: "Kernel Slicer", desc: "Fokus tinggi dan akurat" },
  { id: 14, name: "Spark Drift", role: "Voltage Ranger", desc: "Penuh energi kinetik" },
  { id: 15, name: "Rune Hacker", role: "Decryption Expert", desc: "Pemecah teka-teki handal" },
  { id: 16, name: "Apex Drone", role: "Mecha Runner", desc: "Stabilitas tinggi di platform" },
  { id: 17, name: "Zero One", role: "Root Operator", desc: "Pemegang kunci pintu gerbang" },
  { id: 18, name: "Hyper Drive", role: "Boost Specialist", desc: "Akselerasi mulus dan responsif" },
  { id: 19, name: "Titan Proxy", role: "Heavy Anchor", desc: "Kuat mendorong balok blokade" },
  { id: 20, name: "Solar Flare", role: "Photon Striker", desc: "Penerang koridor gelap" },
  { id: 21, name: "Aura Weaver", role: "Link Master", desc: "Mempererat sinergi tim" },
  { id: 22, name: "Quantum Spark", role: "Particle Shifter", desc: "Lincah menembus jebakan" },
  { id: 23, name: "Sonic Wave", role: "Resonance Hacker", desc: "Peka terhadap sensor musuh" },
  { id: 24, name: "Terra Byte", role: "Solid Foundation", desc: "Pijakan kokoh bagi rekan" },
  { id: 25, name: "Cosmo Glider", role: "Orbital Striker", desc: "Pendaratan mulus di platform" },
  { id: 26, name: "Zenith Prime", role: "Supreme Hacker", desc: "Kombinasi kecepatan dan strategi" }
];

// Konfigurasi Pemain
export const PLAYER_CONFIG = {
  p1: {
    name: "Player 1",
    tag: "P1",
    accentColor: "#00f2fe",
    glowColor: "rgba(0, 242, 254, 0.4)",
    lightColor: "rgba(0, 242, 254, 0.8)",
    controls: {
      left: "KeyA",
      right: "KeyD",
      jump: "KeyW",
      interact: "KeyS",
      ability: "KeyE",
      abilityAlt: "KeyQ"
    },
    abilityName: "Cyber EMP Pulse",
    abilityDesc: "Lumpuhkan laser & drone 4 detik",
    abilityCooldownMax: 360, // ~6 detik (60 FPS)
    defaultCharId: 1
  },
  p2: {
    name: "Player 2",
    tag: "P2",
    accentColor: "#ff9900",
    glowColor: "rgba(255, 153, 0, 0.4)",
    lightColor: "rgba(255, 153, 0, 0.8)",
    controls: {
      left: "ArrowLeft",
      right: "ArrowRight",
      jump: "ArrowUp",
      interact: "ArrowDown",
      ability: "ShiftRight",
      abilityAlt: "Enter"
    },
    abilityName: "Kinetic Shield",
    abilityDesc: "Perisai kebal laser & sensor 3.5 detik",
    abilityCooldownMax: 420, // ~7 detik
    defaultCharId: 2
  }
};

// Konstanta Fisika
export const PHYSICS = {
  gravity: 0.58,
  friction: 0.82,
  walkSpeed: 4.6,
  jumpForce: -12.4,
  maxFallSpeed: 14,
  coyoteTimeFrames: 7,
  jumpBufferFrames: 6,
  boxMass: 1.8,
  boxFriction: 0.75
};

// Asset Path
export const ASSET_PATHS = {
  logo: "assets/logo/image.png",
  character: (id) => `assets/charakter/${id}.png`
};
