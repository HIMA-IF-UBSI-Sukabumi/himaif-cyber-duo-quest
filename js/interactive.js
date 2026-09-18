// js/interactive.js - Objek Teka-Teki: Pressure Plate, Lever, Hydraulic Door, Laser Barrier, Pushable Box, Moving Platform, Logo Token, Exit Portal

import { PHYSICS, ASSET_PATHS } from "./constants.js";
import { audio } from "./audio.js";

// 1. PRESSURE PLATE (Tombol Injak)
export class PressurePlate {
  constructor(config) {
    this.id = config.id;
    this.targetId = config.targetId;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 48;
    this.height = 10;
    this.isPressed = false;
  }

  update(players, boxes) {
    const wasPressed = this.isPressed;
    this.isPressed = false;

    // Cek apakah ada pemain yang menginjak
    for (const p of players) {
      if (!p.isDead && this.checkStand(p)) {
        this.isPressed = true;
        break;
      }
    }

    // Cek apakah ada kotak yang menimpa
    if (!this.isPressed) {
      for (const b of boxes) {
        if (this.checkStand(b)) {
          this.isPressed = true;
          break;
        }
      }
    }

    if (!wasPressed && this.isPressed) {
      audio.playSwitch();
    }
  }

  checkStand(entity) {
    return (
      entity.x + entity.width > this.x + 4 &&
      entity.x < this.x + this.width - 4 &&
      Math.abs((entity.y + entity.height) - this.y) <= 10
    );
  }

  draw(ctx) {
    const pressOffset = this.isPressed ? 5 : 0;
    ctx.save();
    // Base plate
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(this.x, this.y + 4, this.width, 6);

    // Moving pad
    ctx.fillStyle = this.isPressed ? "#00f2fe" : "#e11d48";
    ctx.shadowColor = this.isPressed ? "rgba(0, 242, 254, 0.7)" : "rgba(225, 29, 72, 0.5)";
    ctx.shadowBlur = 8;
    ctx.fillRect(this.x + 3, this.y + pressOffset, this.width - 6, 5 - pressOffset * 0.4);

    ctx.restore();
  }
}

// 2. LEVER (Tuas Saklar)
export class Lever {
  constructor(config) {
    this.id = config.id;
    this.targetId = config.targetId;
    this.x = config.x;
    this.y = config.y;
    this.width = 32;
    this.height = 36;
    this.isActive = config.initialActive || false;
    this.interactCooldown = 0;
  }

  update(players, inputKeys) {
    if (this.interactCooldown > 0) this.interactCooldown--;

    for (const p of players) {
      if (p.isDead) continue;
      // Dekat dengan tuas
      const dist = Math.hypot((p.x + p.width / 2) - (this.x + this.width / 2), (p.y + p.height / 2) - (this.y + this.height / 2));
      if (dist < 44 && this.interactCooldown <= 0) {
        if (inputKeys[p.controls.interact]) {
          this.isActive = !this.isActive;
          this.interactCooldown = 25;
          audio.playSwitch();
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    // Dudukan tuas
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(this.x, this.y + 24, this.width, 12, 4);
    ctx.fill();

    // Gagang tuas
    const angle = this.isActive ? Math.PI / 4 : -Math.PI / 4;
    const pivotX = this.x + this.width / 2;
    const pivotY = this.y + 26;

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    const endX = pivotX + Math.sin(angle) * 22;
    const endY = pivotY - Math.cos(angle) * 22;
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Bola ujung tuas (bercahaya)
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.isActive ? "#10b981" : "#f59e0b";
    ctx.shadowColor = this.isActive ? "rgba(16, 185, 129, 0.8)" : "rgba(245, 158, 11, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.restore();
  }
}

// 3. HYDRAULIC DOOR (Pintu Gerbang Geser)
export class HydraulicDoor {
  constructor(config) {
    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 20;
    this.fullHeight = config.height || 90;
    this.currentHeight = this.fullHeight;
    this.isOpen = false;
    this.openSpeed = 3.5;
  }

  update(isTriggered, players = [], boxes = []) {
    this.isOpen = isTriggered;
    if (this.isOpen) {
      if (this.currentHeight > 4) {
        this.currentHeight = Math.max(0, this.currentHeight - this.openSpeed);
      }
    } else {
      if (this.currentHeight < this.fullHeight) {
        this.currentHeight = Math.min(this.fullHeight, this.currentHeight + this.openSpeed);
      }
    }
    this.height = this.currentHeight;

    // Jika pintu sedang aktif/menutup dan ada pemain atau kotak di bawahnya,
    // dorong mereka keluar secara halus ke arah terdekat agar tidak tertimpa/terjebak di dalam pintu
    if (this.height > 8) {
      const doorBounds = { x: this.x, y: this.y, width: this.width, height: this.height };

      if (players && players.length > 0) {
        for (const p of players) {
          if (!p.isDead && this.checkCollision(doorBounds, p)) {
            const pushLeftDist = (p.x + p.width) - this.x;
            const pushRightDist = (this.x + this.width) - p.x;
            if (pushLeftDist < pushRightDist) {
              p.x = this.x - p.width;
            } else {
              p.x = this.x + this.width;
            }
          }
        }
      }

      if (boxes && boxes.length > 0) {
        for (const b of boxes) {
          if (this.checkCollision(doorBounds, b)) {
            const pushLeftDist = (b.x + b.width) - this.x;
            const pushRightDist = (this.x + this.width) - b.x;
            if (pushLeftDist < pushRightDist) {
              b.x = this.x - b.width;
            } else {
              b.x = this.x + this.width;
            }
          }
        }
      }
    }
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
    if (this.currentHeight <= 2) return;

    ctx.save();
    // Bodi gerbang hidrolik
    const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.5, "#475569");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.width, this.currentHeight);

    // Garis hazard / pendar
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    for (let py = this.y + 10; py < this.y + this.currentHeight - 5; py += 16) {
      ctx.beginPath();
      ctx.moveTo(this.x + 2, py);
      ctx.lineTo(this.x + this.width - 2, py);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// 4. LASER BARRIER (Penghalang Laser yang Bisa Diblokir Kotak)
export class LaserBarrier {
  constructor(config) {
    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 12;
    this.height = config.height || 140;
    this.isHoriz = config.horizontal || false;
    this.isActive = config.initialActive !== undefined ? config.initialActive : true;
    this.animTime = 0;
    this.disruptTimer = 0; // Efek dilumpuhkan oleh EMP P1
    this.isBlockedByBox = false;
  }

  applyDisrupt(frames) {
    this.disruptTimer = frames;
  }

  update(isTriggered, boxes, players) {
    this.animTime += 0.15;

    // Cek efek EMP
    if (this.disruptTimer > 0) {
      this.disruptTimer--;
      this.isActive = false;
      return;
    }

    // Jika ada switch yang menonaktifkan
    if (isTriggered !== undefined) {
      this.isActive = !isTriggered;
    }

    if (!this.isActive) return;

    // Cek apakah ada kotak yang memblokir laser
    this.isBlockedByBox = false;
    for (const b of boxes) {
      if (this.checkCollision(this, b)) {
        this.isBlockedByBox = true;
        break; // Kotak menyerap laser!
      }
    }

    // Jika diblokir kotak, pemain aman di baliknya
    if (this.isBlockedByBox) return;

    // Cek apakah laser menyentuh pemain
    for (const p of players) {
      // Pemain dengan perisai aktif kebal terhadap laser!
      const isShielded = p.abilityActiveTimer > 0;
      if (!p.isDead && !isShielded && this.checkCollision(this, p)) {
        p.die();
      }
    }
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
    if (!this.isActive || this.disruptTimer > 0) {
      // Tampilkan emitor laser dalam mode nonaktif/mati
      ctx.save();
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(this.x - 3, this.y, this.width + 6, 8);
      ctx.fillRect(this.x - 3, this.y + this.height - 8, this.width + 6, 8);
      ctx.restore();
      return;
    }

    ctx.save();
    // Emitor laser
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(this.x - 3, this.y, this.width + 6, 8);
    ctx.fillRect(this.x - 3, this.y + this.height - 8, this.width + 6, 8);

    // Sinar laser berdenyut (atau terhenti di kotak)
    const drawHeight = this.isBlockedByBox ? this.height * 0.5 : this.height;
    const alpha = 0.7 + Math.sin(this.animTime * 4) * 0.25;
    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 12;
    ctx.fillRect(this.x, this.y + 8, this.width, drawHeight - 16);

    // Inti putih laser
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + this.width / 2 - 1.5, this.y + 8, 3, drawHeight - 16);

    ctx.restore();
  }
}

// 5. PUSHABLE BOX (Kotak Balok Dorong)
export class PushableBox {
  constructor(config) {
    this.id = config.id || "box";
    this.x = config.x;
    this.y = config.y;
    this.width = config.width || 50;
    this.height = config.height || 50;
    this.vx = 0;
    this.vy = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.isGrounded = false;
  }

  canMove(dx, level) {
    if (!level) return true;
    const testBox = {
      x: this.x + dx,
      y: this.y,
      width: this.width,
      height: this.height
    };
    const obstacles = [
      ...level.getSolidBlocks(),
      ...level.getClosedDoors(),
      ...level.getPushableBoxes().filter((b) => b !== this)
    ];
    for (const obs of obstacles) {
      if (this.checkCollision(testBox, obs)) {
        return false;
      }
    }
    return true;
  }

  push(forceX, forceY, level) {
    if (level) {
      if (this.canMove(Math.sign(forceX) * 2, level)) {
        this.vx = forceX;
      } else {
        this.vx = 0;
      }
    } else {
      this.vx = forceX;
    }
  }

  update(level, players = []) {
    const oldX = this.x;
    const oldY = this.y;

    // Gravitasi
    this.vy += PHYSICS.gravity;
    if (this.vy > PHYSICS.maxFallSpeed) this.vy = PHYSICS.maxFallSpeed;

    // Gesekan X
    this.vx *= PHYSICS.boxFriction;
    if (Math.abs(this.vx) < 0.1) this.vx = 0;

    // Obstacles padat: Solids + Closed Doors + Kotak Lain
    const obstacles = [
      ...level.getSolidBlocks(),
      ...level.getClosedDoors(),
      ...level.getPushableBoxes().filter((b) => b !== this)
    ];

    // Gerak Horizontal & Tabrakan
    this.x += this.vx;
    for (const s of obstacles) {
      if (this.checkCollision(this, s)) {
        if (this.vx > 0) {
          this.x = s.x - this.width;
        } else if (this.vx < 0) {
          this.x = s.x + s.width;
        } else {
          const overlapLeft = (this.x + this.width) - s.x;
          const overlapRight = (s.x + s.width) - this.x;
          if (overlapLeft < overlapRight) {
            this.x = s.x - this.width;
          } else {
            this.x = s.x + s.width;
          }
        }
        this.vx = 0;
      }
    }

    // Gerak Vertikal & Tabrakan
    this.isGrounded = false;
    const prevY = this.y;
    this.y += this.vy;
    for (const s of obstacles) {
      if (this.checkCollision(this, s)) {
        if (this.vy >= 0 && prevY + this.height <= s.y + Math.max(14, Math.abs(this.vy) + 4)) {
          this.y = s.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        } else if (this.vy < 0) {
          this.y = s.y + s.height;
          this.vy = 0;
        } else {
          const overlapTop = (this.y + this.height) - s.y;
          const overlapBottom = (s.y + s.height) - this.y;
          if (overlapTop < overlapBottom) {
            this.y = s.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
          } else {
            this.y = s.y + s.height;
            this.vy = 0;
          }
        }
      }
    }

    this.deltaX = this.x - oldX;
    this.deltaY = this.y - oldY;

    // Bawa pemain yang sedang berdiri di atas kotak mengikuti pergerakan kotak
    if (players && players.length > 0) {
      for (const p of players) {
        if (p && !p.isDead && (p.isGrounded || this.deltaY > 0) && this.isPlayerStandingOnTop(p, oldX, oldY)) {
          p.x += this.deltaX;
          p.y += this.deltaY;
        }
      }
    }
  }

  isPlayerStandingOnTop(p, oldX, oldY) {
    const refX = oldX !== undefined ? oldX : this.x;
    const refY = oldY !== undefined ? oldY : this.y;
    return (
      p.x + p.width > refX + 2 &&
      p.x < refX + this.width - 2 &&
      Math.abs((p.y + p.height) - refY) <= 10
    );
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
    ctx.save();
    // Bodi kotak
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 6);
    ctx.fill();

    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Aksen Cyber Grid pada kotak
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.x + 8, this.y + 8, this.width - 16, this.height - 16);

    // Simbol pegangan di tengah
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(this.x + this.width / 2 - 8, this.y + this.height / 2 - 4, 16, 8);

    ctx.restore();
  }
}

// 6. MOVING PLATFORM (Lift / Platform Bergerak)
export class MovingPlatform {
  constructor(config) {
    this.id = config.id;
    this.x = config.startX;
    this.y = config.startY;
    this.startX = config.startX;
    this.startY = config.startY;
    this.endX = config.endX;
    this.endY = config.endY;
    this.width = config.width || 100;
    this.height = config.height || 18;
    this.speed = config.speed || 1.8;
    this.progress = 0;
    this.forward = true;
    this.requireTrigger = config.requireTrigger || false;
    this.deltaX = 0;
    this.deltaY = 0;
    this.pauseTimer = 0;
  }

  update(isTriggered, players, boxes) {
    if (this.requireTrigger && !isTriggered) return;

    const oldX = this.x;
    const oldY = this.y;

    if (this.pauseTimer > 0) {
      this.pauseTimer--;
      this.deltaX = 0;
      this.deltaY = 0;
    } else {
      // Kecepatan gerakan lift yang nyaman & terprediksi
      const step = 0.007 * this.speed;
      if (this.forward) {
        this.progress += step;
        if (this.progress >= 1) {
          this.progress = 1;
          this.forward = false;
          this.pauseTimer = 35; // Jeda 0.6 detik di puncak atas
        }
      } else {
        this.progress -= step;
        if (this.progress <= 0) {
          this.progress = 0;
          this.forward = true;
          this.pauseTimer = 35; // Jeda 0.6 detik di dasar bawah
        }
      }

      this.x = this.startX + (this.endX - this.startX) * this.progress;
      this.y = this.startY + (this.endY - this.startY) * this.progress;

      this.deltaX = this.x - oldX;
      this.deltaY = this.y - oldY;
    }

    // Pindahkan pemain yang berdiri di atas platform sebelum platform bergerak
    for (const p of players) {
      if (!p.isDead && (p.isGrounded || this.deltaY > 0) && this.isEntityStanding(p, oldX, oldY)) {
        p.x += this.deltaX;
        p.y += this.deltaY;
        p.isGrounded = true;
        p.vy = 0;
      }
    }

    // Pindahkan kotak yang berdiri di atas platform
    for (const b of boxes) {
      if ((b.isGrounded || this.deltaY > 0) && this.isEntityStanding(b, oldX, oldY)) {
        b.x += this.deltaX;
        b.y += this.deltaY;
        b.isGrounded = true;
        b.vy = 0;
      }
    }
  }

  isEntityStanding(ent, oldX, oldY) {
    const refX = oldX !== undefined ? oldX : this.x;
    const refY = oldY !== undefined ? oldY : this.y;
    return (
      ent.x + ent.width > refX + 2 &&
      ent.x < refX + this.width - 2 &&
      Math.abs((ent.y + ent.height) - refY) <= 10
    );
  }

  draw(ctx) {
    ctx.save();
    // Bodi platform sci-fi
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Lampu indikator bergerak
    const lampX = this.x + this.width / 2 + Math.sin(this.progress * Math.PI) * (this.width / 3);
    ctx.beginPath();
    ctx.arc(lampX, this.y + this.height / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00f2fe";
    ctx.shadowColor = "#00f2fe";
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.restore();
  }
}

// 7. LOGO TOKEN (Collectible Koin HIMAIF)
export class LogoToken {
  constructor(config) {
    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.radius = 18;
    this.isCollected = false;
    this.animTime = Math.random() * 10;
    this.logoImg = new Image();
    this.logoImg.src = ASSET_PATHS.logo;
    this.imgLoaded = false;
    this.logoImg.onload = () => {
      this.imgLoaded = true;
    };
  }

  update(players) {
    if (this.isCollected) return;
    this.animTime += 0.08;

    for (const p of players) {
      if (p.isDead) continue;
      const dist = Math.hypot((p.x + p.width / 2) - this.x, (p.y + p.height / 2) - this.y);
      if (dist < this.radius + 24) {
        this.isCollected = true;
        audio.playToken();
        break;
      }
    }
  }

  draw(ctx) {
    if (this.isCollected) return;

    const floatY = this.y + Math.sin(this.animTime * 2.5) * 5;
    const scaleX = Math.cos(this.animTime * 2); // Efek koin 3D berputar

    ctx.save();
    ctx.translate(this.x, floatY);

    // Cincin pendar neon
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
    ctx.fill();

    ctx.scale(Math.max(0.15, Math.abs(scaleX)), 1);

    // Cincin emas koin
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Gambar Logo HIMAIF di tengah
    if (this.imgLoaded) {
      ctx.drawImage(this.logoImg, -this.radius * 0.7, -this.radius * 0.7, this.radius * 1.4, this.radius * 1.4);
    } else {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("H", 0, 4);
    }

    ctx.restore();
  }
}

// 8. EXIT PORTAL (Pintu Keluar Bersama P1 & P2)
export class ExitPortal {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.width = 90;
    this.height = 100;
    this.p1Inside = false;
    this.p2Inside = false;
    this.animTime = 0;
  }

  update(players) {
    this.animTime += 0.08;
    this.p1Inside = false;
    this.p2Inside = false;

    const [p1, p2] = players;
    if (p1 && !p1.isDead && this.checkInside(p1)) {
      this.p1Inside = true;
    }
    if (p2 && !p2.isDead && this.checkInside(p2)) {
      this.p2Inside = true;
    }
  }

  isCompleted() {
    return this.p1Inside && this.p2Inside;
  }

  checkInside(player) {
    return (
      player.x + player.width > this.x + 10 &&
      player.x < this.x + this.width - 10 &&
      player.y + player.height > this.y + 10 &&
      player.y < this.y + this.height
    );
  }

  draw(ctx) {
    this.animTime += 0.04;
    ctx.save();

    // Bingkai Portal Futuristik
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 12);
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vortex Portal
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const vortexGrad = ctx.createRadialGradient(centerX, centerY, 8, centerX, centerY, 42);
    vortexGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    vortexGrad.addColorStop(0.4, "rgba(56, 189, 248, 0.6)");
    vortexGrad.addColorStop(1, "rgba(15, 23, 42, 0)");

    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 32, 42, Math.sin(this.animTime) * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Indikator Status P1 & P2 di atas portal
    const p1Color = this.p1Inside ? "#00f2fe" : "#475569";
    const p2Color = this.p2Inside ? "#ff9900" : "#475569";

    // P1 Lamp
    ctx.beginPath();
    ctx.arc(this.x + 28, this.y - 12, 7, 0, Math.PI * 2);
    ctx.fillStyle = p1Color;
    if (this.p1Inside) {
      ctx.shadowColor = "#00f2fe";
      ctx.shadowBlur = 10;
    }
    ctx.fill();

    // P2 Lamp
    ctx.beginPath();
    ctx.arc(this.x + this.width - 28, this.y - 12, 7, 0, Math.PI * 2);
    ctx.fillStyle = p2Color;
    if (this.p2Inside) {
      ctx.shadowColor = "#ff9900";
      ctx.shadowBlur = 10;
    }
    ctx.fill();

    ctx.restore();
  }
}
