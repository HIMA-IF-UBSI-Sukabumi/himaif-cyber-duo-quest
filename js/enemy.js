// js/enemy.js - Sentinel Drone AI (Patrol, Vision Cone Raycast, Alert State & Trap Mechanics)

import { audio } from "./audio.js";

export class SentinelDrone {
  constructor(config) {
    this.id = config.id || "drone_1";
    this.x = config.x;
    this.y = config.y;
    this.width = 46;
    this.height = 36;
    
    // Rute Patroli
    this.startX = config.x;
    this.endX = config.patrolEndX || config.x + 200;
    this.startY = config.y;
    this.endY = config.patrolEndY || config.y;
    this.speed = config.speed || 1.8;
    this.direction = 1; // 1: kanan, -1: kiri

    // Status: "PATROL", "ALERT", "SEARCHING"
    this.state = "PATROL";
    this.targetX = this.endX;
    this.targetY = this.endY;
    this.alertTimer = 0;
    this.searchTarget = null;
    this.alertCooldown = 0;

    // Sensor Penglihatan
    this.sightRange = config.sightRange || 240;
    this.sightAngle = (Math.PI / 180) * 55; // 55 derajat kerucut pandang
    this.animTime = 0;

    // Status Stun / Lumpuh oleh EMP
    this.stunTimer = 0;
  }

  applyStun(frames) {
    this.stunTimer = frames;
    this.state = "STUNNED";
    this.searchTarget = null;
  }

  update(players, level) {
    this.animTime += 0.08;
    if (this.alertCooldown > 0) this.alertCooldown--;

    // 0. Cek Efek Stun EMP
    if (this.stunTimer > 0) {
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.state = "PATROL";
      }
      return; // Tidak bergerak atau mendeteksi saat lumpuh
    }

    // 1. Cek Deteksi Pemain (abaikan pemain yang terlindungi perisai Kinetic)
    const detectedPlayer = this.checkVision(players, level);

    if (detectedPlayer) {
      if (this.state !== "ALERT") {
        this.state = "ALERT";
        if (this.alertCooldown <= 0) {
          audio.playAlert();
          this.alertCooldown = 120; // 2 detik cooldown SFX
        }
      }
      this.alertTimer = 180; // 3 detik fokus mengejar
      this.searchTarget = { x: detectedPlayer.x + detectedPlayer.width / 2, y: detectedPlayer.y + detectedPlayer.height / 2 };
    } else if (this.state === "ALERT") {
      this.alertTimer--;
      if (this.alertTimer <= 0) {
        this.state = "PATROL";
        this.searchTarget = null;
      }
    }

    // 2. Eksekusi Pergerakan berdasarkan State
    if (this.state === "ALERT" && this.searchTarget) {
      // Kejar posisi terakhir target
      const dx = this.searchTarget.x - (this.x + this.width / 2);
      const dy = this.searchTarget.y - (this.y + this.height / 2);
      const dist = Math.hypot(dx, dy);

      if (dist > 8) {
        const moveX = (dx / dist) * (this.speed * 1.5);
        const moveY = (dy / dist) * (this.speed * 1.5);

        this.moveWithCollision(moveX, moveY, level);
        this.direction = moveX >= 0 ? 1 : -1;
      }
    } else {
      // Patroli rute biasa bolak-balik
      let targetX = this.direction === 1 ? this.endX : this.startX;
      let targetY = this.direction === 1 ? this.endY : this.startY;

      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6) {
        this.direction *= -1; // Balik arah patroli
      } else {
        const moveX = (dx / dist) * this.speed;
        const moveY = (dy / dist) * this.speed;
        this.moveWithCollision(moveX, moveY, level);
      }
    }

    // 3. Cek Tabrakan Fisik dengan Pemain (Tertangkap!)
    for (const p of players) {
      // Pemain yang memiliki perisai aktif kebal terhadap drone!
      const isShielded = p.abilityActiveTimer > 0;
      if (!p.isDead && !isShielded && this.checkCollision(this, p)) {
        p.die();
      }
    }
  }

  moveWithCollision(vx, vy, level) {
    // Gerak X & cek tabrakan dengan tembok, pintu, dan kotak
    const oldX = this.x;
    this.x += vx;

    const obstacles = [...level.getSolidBlocks(), ...level.getClosedDoors(), ...level.getPushableBoxes()];
    for (const obs of obstacles) {
      if (this.checkCollision(this, obs)) {
        this.x = oldX;
        this.direction *= -1; // Jika menabrak rintangan, balik arah
        break;
      }
    }

    // Gerak Y & cek tabrakan
    const oldY = this.y;
    this.y += vy;
    for (const obs of obstacles) {
      if (this.checkCollision(this, obs)) {
        this.y = oldY;
        break;
      }
    }
  }

  checkVision(players, level) {
    const droneCenter = {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };

    for (const p of players) {
      if (p.isDead) continue;
      // Jika pemain sedang mengaktifkan perisai kinetic, sensor drone tidak mendeteksinya!
      if (p.abilityActiveTimer > 0) continue;

      const pCenter = {
        x: p.x + p.width / 2,
        y: p.y + p.height / 2
      };

      const dx = pCenter.x - droneCenter.x;
      const dy = pCenter.y - droneCenter.y;
      const dist = Math.hypot(dx, dy);

      // Cek jarak
      if (dist > this.sightRange) continue;

      // Cek sudut arah pandang
      const angleToPlayer = Math.atan2(dy, dx);
      const droneBaseAngle = this.direction === 1 ? 0 : Math.PI;
      let angleDiff = Math.abs(angleToPlayer - droneBaseAngle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);

      if (angleDiff > this.sightAngle / 2) continue;

      // Raycast line-of-sight: Cek apakah terhalang tembok, pintu tertutup, atau kotak
      if (!this.hasLineOfSight(droneCenter, pCenter, level)) continue;

      return p; // Pemain terdeteksi!
    }
    return null;
  }

  hasLineOfSight(from, to, level) {
    const obstacles = [...level.getSolidBlocks(), ...level.getClosedDoors(), ...level.getPushableBoxes()];
    for (const obs of obstacles) {
      if (this.lineIntersectsRect(from, to, obs)) {
        return false; // Terhalang cover / balok!
      }
    }
    return true;
  }

  lineIntersectsRect(p1, p2, r) {
    // Cek garis dengan 4 sisi rectangle
    const lines = [
      [{ x: r.x, y: r.y }, { x: r.x + r.width, y: r.y }],
      [{ x: r.x + r.width, y: r.y }, { x: r.x + r.width, y: r.y + r.height }],
      [{ x: r.x + r.width, y: r.y + r.height }, { x: r.x, y: r.y + r.height }],
      [{ x: r.x, y: r.y + r.height }, { x: r.x, y: r.y }]
    ];
    for (const [s1, s2] of lines) {
      if (this.linesIntersect(p1, p2, s1, s2)) return true;
    }
    return false;
  }

  linesIntersect(a, b, c, d) {
    const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
    if (det === 0) return false;
    const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
    const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }

  checkCollision(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  draw(ctx) {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + Math.sin(this.animTime * 3) * 3;

    // 1. Gambar Cone Penglihatan (Hanya jika tidak sedang STUNNED)
    if (this.state !== "STUNNED") {
      ctx.save();
      const coneColor = this.state === "ALERT" ? "rgba(255, 45, 85, 0.25)" : "rgba(255, 204, 0, 0.15)";
      const coneEdgeColor = this.state === "ALERT" ? "rgba(255, 45, 85, 0.7)" : "rgba(255, 204, 0, 0.45)";
      const baseAngle = this.direction === 1 ? 0 : Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, this.sightRange, baseAngle - this.sightAngle / 2, baseAngle + this.sightAngle / 2);
      ctx.closePath();
      ctx.fillStyle = coneColor;
      ctx.fill();

      ctx.strokeStyle = coneEdgeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Gambar Bodi Drone Sci-Fi
    ctx.save();
    ctx.translate(centerX, centerY);

    // Baling-baling / Antigrav ring
    ctx.strokeStyle = this.state === "STUNNED" ? "#38bdf8" : "rgba(0, 242, 254, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -this.height * 0.45, 22, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Bodi utama
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
    ctx.fill();

    ctx.strokeStyle = this.state === "STUNNED" ? "#00f2fe" : (this.state === "ALERT" ? "#ff2d55" : "#64748b");
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mata / Core Sensor Kamera
    ctx.beginPath();
    ctx.arc(this.direction * 6, 0, 8, 0, Math.PI * 2);
    let eyeColor = "#ffcc00";
    if (this.state === "ALERT") eyeColor = "#ff2d55";
    if (this.state === "STUNNED") eyeColor = "#00f2fe"; // Biru saat ter-stun!
    ctx.fillStyle = eyeColor;
    ctx.fill();

    // Kilau mata
    ctx.beginPath();
    ctx.arc(this.direction * 6 - 2, -2, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Pendar Core Eye
    ctx.beginPath();
    ctx.arc(this.direction * 6, 0, 14, 0, Math.PI * 2);
    let pendarColor = "rgba(255, 204, 0, 0.2)";
    if (this.state === "ALERT") pendarColor = "rgba(255, 45, 85, 0.3)";
    if (this.state === "STUNNED") pendarColor = "rgba(0, 242, 254, 0.4)";
    ctx.fillStyle = pendarColor;
    ctx.fill();

    // Spark listrik jika sedang stunned
    if (this.state === "STUNNED") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const sx = (Math.random() - 0.5) * 36;
        const sy = (Math.random() - 0.5) * 30;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 10, sy + (Math.random() - 0.5) * 10);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
