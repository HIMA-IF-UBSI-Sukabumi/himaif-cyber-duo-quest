// js/level.js - Konfigurasi 3 Stage Level MVP yang 100% Teruji, Solvabel, dan Menyenangkan

import { PressurePlate, Lever, HydraulicDoor, LaserBarrier, PushableBox, MovingPlatform, LogoToken, ExitPortal } from "./interactive.js";
import { SentinelDrone } from "./enemy.js";
import { ASSET_PATHS, CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants.js";

export class Level {
  constructor(levelIndex = 0) {
    this.index = levelIndex;
    this.width = CANVAS_WIDTH;
    this.height = CANVAS_HEIGHT;

    this.solids = [];
    this.plates = [];
    this.levers = [];
    this.doors = [];
    this.lasers = [];
    this.boxes = [];
    this.movingPlatforms = [];
    this.tokens = [];
    this.drones = [];
    this.portal = null;
    this.spawnP1 = { x: 80, y: 580 };
    this.spawnP2 = { x: 140, y: 580 };

    this.name = "";
    this.subtitle = "";

    // Logo HIMAIF untuk Watermark Stage
    this.logoImg = new Image();
    this.logoImg.src = ASSET_PATHS.logo;
    this.logoLoaded = false;
    this.logoImg.onload = () => {
      this.logoLoaded = true;
    };

    this.loadStage(levelIndex);
  }

  loadStage(index) {
    this.index = index;
    this.solids = [];
    this.plates = [];
    this.levers = [];
    this.doors = [];
    this.lasers = [];
    this.boxes = [];
    this.movingPlatforms = [];
    this.tokens = [];
    this.drones = [];

    // Tembok Pembatas Layar (Batas Luar)
    this.solids.push({ x: 0, y: 0, width: CANVAS_WIDTH, height: 32 }); // Atap
    this.solids.push({ x: 0, y: 650, width: CANVAS_WIDTH, height: 70 }); // Lantai Dasar
    this.solids.push({ x: 0, y: 0, width: 32, height: CANVAS_HEIGHT }); // Dinding Kiri
    this.solids.push({ x: CANVAS_WIDTH - 32, y: 0, width: 32, height: CANVAS_HEIGHT }); // Dinding Kanan

    if (index === 0) {
      this.initStage1();
    } else if (index === 1) {
      this.initStage2();
    } else {
      this.initStage3();
    }
  }

  // ====================================================================
  // STAGE 1: SYSTEM BOOT (Tutorial Sinergi & Pintu Hidrolik)
  // ====================================================================
  initStage1() {
    this.name = "STAGE 1: SYSTEM BOOT";
    this.subtitle = "Pelajari kontrol, tombol injak, tuas, dan pintu hidrolik";
    this.spawnP1 = { x: 80, y: 590 };
    this.spawnP2 = { x: 140, y: 590 };

    // --- ZONE 1 (KIRI) ---
    // Tangga pijakan awal agar single jump sangat mudah
    this.solids.push({ x: 190, y: 560, width: 90, height: 20 }); // Step 1 (diff 90px dari lantai 650)
    this.solids.push({ x: 60, y: 460, width: 220, height: 20 });  // Platform A (Lantai tombol P1)

    // Tombol Injak 1 di Platform A (diinjak P1 untuk membuka Door 1 di lantai bawah)
    const plate1 = new PressurePlate({ id: "plate_1", targetId: "door_1", x: 130, y: 450 });
    this.plates.push(plate1);

    // Dinding pemisah tengah antara Zone 1 dan Zone 2
    this.solids.push({ x: 340, y: 360, width: 24, height: 160 }); // Dinding pemisah tengah

    // Pintu Hidrolik 1 (di lantai dasar: x: 340, y: 520, h: 130) -> tertutup memblokir P2
    const door1 = new HydraulicDoor({ id: "door_1", x: 340, y: 520, width: 24, height: 130 });
    this.doors.push(door1);

    // Pintu Hidrolik 2 (di lantai atas: x: 340, y: 220, h: 140) -> tertutup memblokir P1
    const door2 = new HydraulicDoor({ id: "door_2", x: 340, y: 220, width: 24, height: 140 });
    this.doors.push(door2);

    // --- ZONE 2 (TENGAH) ---
    // Tangga untuk P2 setelah melewati Door 1 dari lantai dasar
    this.solids.push({ x: 400, y: 560, width: 80, height: 20 });  // Step 2
    this.solids.push({ x: 440, y: 460, width: 340, height: 20 }); // Platform B luas (Lantai Tuas, Kotak, dan Plate 2)

    // Tuas Saklar 1 di Platform B (ditarik P2 dengan tombol S/Down untuk membuka Door 2)
    const lever1 = new Lever({ id: "lever_1", targetId: "door_2", x: 480, y: 424 });
    this.levers.push(lever1);

    // Balok Kotak Dorong di Platform B
    const box1 = new PushableBox({ id: "box_1", x: 570, y: 410, width: 48, height: 48 });
    this.boxes.push(box1);

    // Tombol Injak 2 di Platform B (dorong kotak ke sini untuk membuka Door 3 di atas!)
    const plate2 = new PressurePlate({ id: "plate_2", targetId: "door_3", x: 700, y: 450 });
    this.plates.push(plate2);

    // Bumper kecil di ujung Platform B (tinggi 30px) agar kotak tertahan pas di atas Plate 2 & tidak jatuh
    this.solids.push({ x: 770, y: 430, width: 14, height: 30 });

    // --- ZONE 3 (KANAN / EXIT PORTAL) ---
    // Tangga keselamatan di bawah jika pemain jatuh
    this.solids.push({ x: 800, y: 560, width: 90, height: 20 });

    // Tangga menuju Exit Portal
    this.solids.push({ x: 820, y: 370, width: 100, height: 20 }); // Step 3
    this.solids.push({ x: 940, y: 280, width: 90, height: 20 });  // Step 4
    this.solids.push({ x: 1050, y: 190, width: 198, height: 20 }); // Platform D (Lantai Exit Portal)

    // Pintu Hidrolik 3 di depan Exit Portal (terbuka jika Plate 2 diinjak kotak)
    const door3 = new HydraulicDoor({ id: "door_3", x: 1050, y: 60, width: 24, height: 130 });
    this.doors.push(door3);

    // Tokens HIMAIF
    this.tokens.push(new LogoToken({ id: "t1", x: 80, y: 410 }));
    this.tokens.push(new LogoToken({ id: "t2", x: 620, y: 360 }));
    this.tokens.push(new LogoToken({ id: "t3", x: 1170, y: 130 }));

    // Exit Portal
    this.portal = new ExitPortal({ x: 1110, y: 90 });
  }

  // ====================================================================
  // STAGE 2: SENTINEL INFILTRATION (Stealth, Drone & Lift)
  // ====================================================================
  initStage2() {
    this.name = "STAGE 2: SENTINEL INFILTRATION";
    this.subtitle = "Gunakan jalur catwalk atas atau lumpuhkan sensor drone dengan EMP / Shield";
    this.spawnP1 = { x: 70, y: 590 };
    this.spawnP2 = { x: 130, y: 590 };

    // Tangga ke Catwalk Atas di sebelah kiri (ketinggian lompatan bertahap 90px)
    this.solids.push({ x: 170, y: 560, width: 80, height: 20 });
    this.solids.push({ x: 90, y: 470, width: 140, height: 20 });
    this.solids.push({ x: 180, y: 380, width: 80, height: 20 });

    // Catwalk Atas (Aman dari jangkauan drone di bawah)
    this.solids.push({ x: 280, y: 340, width: 480, height: 20 });

    // Tuas di catwalk atas untuk mengunci pintu sel kurungan drone
    const leverTrap = new Lever({ id: "lever_trap", targetId: "door_drone", x: 420, y: 304, initialActive: true });
    this.levers.push(leverTrap);

    // Koridor bawah yang dipatroli Drone Sentinel
    const drone1 = new SentinelDrone({
      id: "drone_sec",
      x: 380,
      y: 590,
      patrolEndX: 740,
      speed: 2.0,
      sightRange: 200
    });
    this.drones.push(drone1);

    // Pintu kurungan isolasi drone di kanan bawah
    this.solids.push({ x: 820, y: 420, width: 24, height: 130 });
    const doorDrone = new HydraulicDoor({ id: "door_drone", x: 820, y: 550, width: 24, height: 100 });
    this.doors.push(doorDrone);

    // Kotak balok dorong di catwalk untuk menahan tombol exit
    const box2 = new PushableBox({ id: "box_s2", x: 580, y: 290, width: 48, height: 48 });
    this.boxes.push(box2);

    // Tombol Injak pembuka pintu portal di catwalk
    const plateExit = new PressurePlate({ id: "plate_exit_s2", targetId: "door_exit_s2", x: 680, y: 330 });
    this.plates.push(plateExit);

    // Bumper kecil di ujung catwalk agar kotak tertahan tepat di atas tombol exit
    this.solids.push({ x: 750, y: 310, width: 14, height: 30 });

    // Moving Lift Platform di kanan (bergerak vertikal membawa pemain ke lantai portal atas)
    const lift = new MovingPlatform({
      id: "lift_s2",
      startX: 880,
      startY: 580,
      endX: 880,
      endY: 220,
      width: 90,
      height: 18,
      speed: 1.8
    });
    this.movingPlatforms.push(lift);

    // Ruang Portal Atas
    this.solids.push({ x: 1020, y: 220, width: 228, height: 20 });

    const doorExit = new HydraulicDoor({ id: "door_exit_s2", x: 1020, y: 90, width: 24, height: 130 });
    this.doors.push(doorExit);

    // Tokens HIMAIF
    this.tokens.push(new LogoToken({ id: "t1", x: 110, y: 420 }));
    this.tokens.push(new LogoToken({ id: "t2", x: 500, y: 290 }));
    this.tokens.push(new LogoToken({ id: "t3", x: 1160, y: 160 }));

    // Exit Portal
    this.portal = new ExitPortal({ x: 1110, y: 120 });
  }

  // ====================================================================
  // STAGE 3: CORE BREACH (Laser Shielding & Dual Drone Challenge)
  // ====================================================================
  initStage3() {
    this.name = "STAGE 3: CORE BREACH";
    this.subtitle = "Gunakan tuas/EMP/kotak untuk mematikan laser, hindari patroli drone, dan naik lift";
    this.spawnP1 = { x: 80, y: 590 };
    this.spawnP2 = { x: 140, y: 590 };

    // Kotak Pelindung Laser di area awal bawah
    const boxShield = new PushableBox({ id: "box_shield", x: 220, y: 600, width: 50, height: 50 });
    this.boxes.push(boxShield);

    // Tangga menuju Catwalk 1 (ketinggian bertahap nyaman 90px agar P1 & P2 bisa naik)
    this.solids.push({ x: 180, y: 560, width: 90, height: 20 });  // Step 1
    this.solids.push({ x: 280, y: 470, width: 100, height: 20 }); // Step 2
    this.solids.push({ x: 390, y: 380, width: 180, height: 20 }); // Catwalk 1

    // Tuas Penonaktif Laser di Catwalk 1 (mematikan laser permanen saat ditarik!)
    const leverLaser = new Lever({ id: "lever_laser", targetId: "laser_core", x: 450, y: 344 });
    this.levers.push(leverLaser);

    // Penghalang Laser Maut memotong antara Catwalk 1 dan Catwalk 2
    const laser1 = new LaserBarrier({
      id: "laser_core",
      x: 580,
      y: 380,
      width: 14,
      height: 270
    });
    this.lasers.push(laser1);

    // Catwalk 2 setelah Laser
    this.solids.push({ x: 610, y: 380, width: 230, height: 20 }); // Catwalk 2

    // Tuas Pembuka Pintu Core Room di Catwalk 2
    const leverCore = new Lever({ id: "lever_core", targetId: "door_core", x: 760, y: 344 });
    this.levers.push(leverCore);

    // Platform Pelindung di Sektor Bawah (Cover dari Drone Bawah)
    this.solids.push({ x: 680, y: 550, width: 130, height: 20 });

    // Drone 1: Patroli Koridor Bawah
    const droneBottom = new SentinelDrone({
      id: "drone_b",
      x: 640,
      y: 590,
      patrolEndX: 840,
      speed: 1.8,
      sightRange: 180
    });
    this.drones.push(droneBottom);

    // Drone 2: Patroli Udara Atas (terbang tinggi di y: 220, memberi celah di bawahnya)
    const droneTop = new SentinelDrone({
      id: "drone_t",
      x: 640,
      y: 220,
      patrolEndX: 840,
      speed: 2.0,
      sightRange: 200
    });
    this.drones.push(droneTop);

    // Moving Lift Platform menuju Core Room (bisa diakses dari lantai bawah 580 maupun catwalk 380!)
    const liftCore = new MovingPlatform({
      id: "lift_core",
      startX: 880,
      startY: 580,
      endX: 880,
      endY: 190,
      width: 90,
      height: 18,
      speed: 2.0
    });
    this.movingPlatforms.push(liftCore);

    // Core Room di Kanan Atas
    this.solids.push({ x: 1000, y: 190, width: 248, height: 20 });

    const doorCore = new HydraulicDoor({ id: "door_core", x: 1000, y: 60, width: 24, height: 130 });
    this.doors.push(doorCore);

    // Tokens HIMAIF
    this.tokens.push(new LogoToken({ id: "t1", x: 330, y: 420 }));
    this.tokens.push(new LogoToken({ id: "t2", x: 740, y: 600 }));
    this.tokens.push(new LogoToken({ id: "t3", x: 1170, y: 130 }));

    // Core Exit Portal
    this.portal = new ExitPortal({ x: 1110, y: 90 });
  }

  update(players, inputKeys) {
    // 1. Update Boxes
    for (const b of this.boxes) {
      b.update(this, players);
    }

    // 2. Update Plates & Levers
    for (const p of this.plates) {
      p.update(players, this.boxes);
    }
    for (const l of this.levers) {
      l.update(players, inputKeys);
    }

    // 3. Evaluasi Trigger untuk Pintu & Laser
    for (const d of this.doors) {
      const plate = this.plates.find(p => p.targetId === d.id);
      const lever = this.levers.find(l => l.targetId === d.id);
      const triggered = (plate && plate.isPressed) || (lever && lever.isActive);
      d.update(triggered, players, this.boxes);
    }

    for (const laser of this.lasers) {
      // Stage 3: laser bisa dimatikan jika sync_1 ATAU sync_2 ditekan, atau oleh switch/EMP
      const s1 = this.plates.find(p => p.id === "sync_1");
      const s2 = this.plates.find(p => p.id === "sync_2");
      const syncActive = (s1 && s1.isPressed) || (s2 && s2.isPressed);

      const lever = this.levers.find(l => l.targetId === laser.id);
      const plate = this.plates.find(p => p.targetId === laser.id);
      const triggered = syncActive || (lever && lever.isActive) || (plate && plate.isPressed);
      laser.update(triggered, this.boxes, players);
    }

    // 4. Update Moving Platforms
    for (const mp of this.movingPlatforms) {
      mp.update(true, players, this.boxes);
    }

    // 5. Update Drones
    for (const drone of this.drones) {
      drone.update(players, this);
    }

    // 6. Update Tokens & Portal
    for (const t of this.tokens) {
      t.update(players);
    }
    if (this.portal) {
      this.portal.update(players);
    }
  }

  getSolidBlocks() {
    return [...this.solids, ...this.movingPlatforms];
  }

  getClosedDoors() {
    return this.doors.filter(d => d.currentHeight > 10);
  }

  getPushableBoxes() {
    return this.boxes;
  }

  draw(ctx) {
    // 1. Background Grid & Watermark Logo HIMAIF
    ctx.save();
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle Cyber Grid
    ctx.strokeStyle = "rgba(14, 165, 233, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Watermark Megah Logo HIMAIF di Tengah Stage
    if (this.logoLoaded) {
      ctx.globalAlpha = 0.07;
      const logoSize = 420;
      ctx.drawImage(
        this.logoImg,
        this.width / 2 - logoSize / 2,
        this.height / 2 - logoSize / 2,
        logoSize,
        logoSize
      );
      ctx.globalAlpha = 1.0;
    }

    // Signage / Banner Nama HIMAIF di Background Dinding
    ctx.font = "bold 24px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.textAlign = "center";
    ctx.fillText("HIMAIF CYBER LAB", this.width / 2, 70);

    ctx.restore();

    // 2. Gambar Solid Platforms
    ctx.save();
    for (const s of this.solids) {
      ctx.fillStyle = "#162032";
      ctx.fillRect(s.x, s.y, s.width, s.height);

      ctx.fillStyle = "#0284c7";
      ctx.fillRect(s.x, s.y, s.width, 3);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(s.x, s.y, s.width, s.height);
    }
    ctx.restore();

    // 3. Gambar Objek Interaktif
    for (const p of this.plates) p.draw(ctx);
    for (const l of this.levers) l.draw(ctx);
    for (const d of this.doors) d.draw(ctx);
    for (const laser of this.lasers) laser.draw(ctx);
    for (const mp of this.movingPlatforms) mp.draw(ctx);
    for (const b of this.boxes) b.draw(ctx);
    for (const t of this.tokens) t.draw(ctx);
    if (this.portal) this.portal.draw(ctx);

    // 4. Gambar Drones
    for (const drone of this.drones) drone.draw(ctx);
  }
}
