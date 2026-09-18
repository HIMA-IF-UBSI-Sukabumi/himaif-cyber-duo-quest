// js/player.js - Entitas Pemain (P1 & P2), kontrol, fisika, sprite rendering, dan interaksi

import { PHYSICS, ASSET_PATHS } from "./constants.js";
import { audio } from "./audio.js";

export class Player {
  constructor(config, startX, startY) {
    this.tag = config.tag; // "P1" or "P2"
    this.name = config.name;
    this.accentColor = config.accentColor;
    this.glowColor = config.glowColor;
    this.lightColor = config.lightColor;
    this.controls = config.controls;
    this.charId = config.defaultCharId || 1;

    // Posisi & Ukuran
    this.spawnX = startX;
    this.spawnY = startY;
    this.x = startX;
    this.y = startY;
    this.width = 44;
    this.height = 60;

    // Kecepatan & Gerakan
    this.vx = 0;
    this.vy = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.facing = 1; // 1: kanan, -1: kiri
    this.isGrounded = false;
    this.isCrouching = false;
    this.isDead = false;
    this.standingOnPlayer = null;
    this.standingOnBox = null;

    // Timers & FX
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.animTime = 0;
    this.squash = 1; // Skala Y saat squash/stretch
    this.stretch = 1; // Skala X

    // Ability System
    this.abilityCooldownMax = config.abilityCooldownMax || 360;
    this.abilityCooldown = 0;
    this.abilityActiveTimer = 0; // Durasi ability aktif
    this.canDoubleJump = false; // P1 Double Jump
    this.hasDoubleJumped = false;
    this.shieldRadius = 45;

    // Sprite
    this.image = new Image();
    this.imageLoaded = false;
    this.loadCharacterSprite(this.charId);
  }

  getAbilityStatus() {
    return {
      ready: this.abilityCooldown <= 0,
      percent: Math.min(1, Math.max(0, 1 - (this.abilityCooldown / this.abilityCooldownMax))),
      isActive: this.abilityActiveTimer > 0,
      activeRatio: this.abilityActiveTimer / 210
    };
  }

  loadCharacterSprite(id) {
    this.charId = id;
    this.imageLoaded = false;
    this.image.src = ASSET_PATHS.character(id);
    this.image.onload = () => {
      this.imageLoaded = true;
    };
  }

  reset(x = this.spawnX, y = this.spawnY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.squash = 1;
    this.stretch = 1;
    this.abilityCooldown = 0;
    this.abilityActiveTimer = 0;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
  }

  update(inputKeys, level, otherPlayer, game) {
    if (this.isDead) return;

    this.animTime += 0.15;

    // Cooldown Ability
    if (this.abilityCooldown > 0) this.abilityCooldown--;
    if (this.abilityActiveTimer > 0) this.abilityActiveTimer--;

    // Baca input gerakan horizontal
    let moveDir = 0;
    if (inputKeys[this.controls.left]) moveDir -= 1;
    if (inputKeys[this.controls.right]) moveDir += 1;

    if (moveDir !== 0) {
      this.facing = moveDir;
      this.vx = moveDir * PHYSICS.walkSpeed;
    } else {
      this.vx *= PHYSICS.friction;
      if (Math.abs(this.vx) < 0.2) this.vx = 0;
    }

    // Baca input lompat
    const jumpPressed = inputKeys[this.controls.jump];
    if (jumpPressed && !this.wasJumpPressed) {
      this.jumpBufferTimer = PHYSICS.jumpBufferFrames;
      
      // Khusus P1: Double Jump jika sedang di udara dan belum double jump
      if (this.tag === "P1" && !this.isGrounded && this.coyoteTimer <= 0 && this.canDoubleJump && !this.hasDoubleJumped) {
        this.vy = PHYSICS.jumpForce * 0.95;
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
        this.squash = 0.8;
        this.stretch = 1.3;
        audio.playJump();
        if (game) {
          game.addParticle(this.x + this.width / 2, this.y + this.height, "#00f2fe", 8);
        }
      }
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }
    this.wasJumpPressed = jumpPressed;

    // Coyote time & Grounded reset
    if (this.isGrounded) {
      this.coyoteTimer = PHYSICS.coyoteTimeFrames;
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    // Eksekusi lompat utama jika buffer dan coyote valid
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = PHYSICS.jumpForce;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.isGrounded = false;
      this.canDoubleJump = true;
      this.squash = 0.8;
      this.stretch = 1.25;
      audio.playJump();
    }

    // Pemicu Kemampuan Khusus (Ability Trigger)
    const abilityPressed = inputKeys[this.controls.ability] || inputKeys[this.controls.abilityAlt];
    if (abilityPressed && !this.wasAbilityPressed && this.abilityCooldown <= 0) {
      this.activateAbility(level, otherPlayer, game);
    }
    this.wasAbilityPressed = abilityPressed;

    const oldX = this.x;
    const oldY = this.y;

    // Jika sedang berdiri di atas pemain lain, bawa gerakan horizontalnya
    if (this.standingOnPlayer && !this.standingOnPlayer.isDead) {
      const op = this.standingOnPlayer;
      if (
        this.x + this.width > op.x &&
        this.x < op.x + op.width &&
        Math.abs((this.y + this.height) - op.y) <= 8
      ) {
        if (op.deltaX) {
          this.x += op.deltaX;
        }
      } else {
        this.standingOnPlayer = null;
      }
    }

    // Terapkan Gravitasi
    this.vy += PHYSICS.gravity;
    if (this.vy > PHYSICS.maxFallSpeed) this.vy = PHYSICS.maxFallSpeed;

    // Normalisasi animasi squash/stretch
    this.squash += (1 - this.squash) * 0.15;
    this.stretch += (1 - this.stretch) * 0.15;

    // Terapkan Pergerakan Horizontal & Deteksi Tabrakan
    this.x += this.vx;
    this.handleHorizontalCollisions(level, otherPlayer);

    // Terapkan Pergerakan Vertikal & Deteksi Tabrakan
    const wasGrounded = this.isGrounded;
    this.isGrounded = false;
    this.y += this.vy;
    this.handleVerticalCollisions(level, otherPlayer);

    // Hitung perubahan posisi aktual (deltaX dan deltaY)
    this.deltaX = this.x - oldX;
    this.deltaY = this.y - oldY;

    // Efek mendarat
    if (!wasGrounded && this.isGrounded) {
      this.squash = 1.25;
      this.stretch = 0.8;
      audio.playLand();
    }

    // Cek batas layar jatuh
    if (this.y > level.height + 100) {
      this.die();
    }
  }

  activateAbility(level, otherPlayer, game) {
    this.abilityCooldown = this.abilityCooldownMax;

    if (this.tag === "P1") {
      // P1: Cyber EMP Pulse -> Lumpuhkan laser & drone di sekitar selama 4 detik
      audio.playEMP();
      const radius = 320;
      const center = { x: this.x + this.width / 2, y: this.y + this.height / 2 };

      // Efek partikel cincin EMP
      if (game) {
        for (let a = 0; a < Math.PI * 2; a += 0.3) {
          game.particles.push({
            x: center.x,
            y: center.y,
            vx: Math.cos(a) * 6,
            vy: Math.sin(a) * 6,
            size: 4,
            color: "#00f2fe",
            alpha: 1,
            life: 30
          });
        }
      }

      // Stun Drones dalam radius
      level.drones.forEach((d) => {
        const dCenter = { x: d.x + d.width / 2, y: d.y + d.height / 2 };
        if (Math.hypot(dCenter.x - center.x, dCenter.y - center.y) < radius) {
          d.applyStun(240); // 4 detik
        }
      });

      // Disable Lasers dalam radius
      level.lasers.forEach((l) => {
        const lCenter = { x: l.x + l.width / 2, y: l.y + l.height / 2 };
        if (Math.hypot(lCenter.x - center.x, lCenter.y - center.y) < radius) {
          l.applyDisrupt(240); // 4 detik
        }
      });

    } else if (this.tag === "P2") {
      // P2: Kinetic Shield -> Perisai gaya amber kebal laser & drone 3.5 detik
      audio.playShield();
      this.abilityActiveTimer = 210; // 3.5 detik
      if (game) {
        game.addParticle(this.x + this.width / 2, this.y + this.height / 2, "#ff9900", 12);
      }
    }
  }

  handleHorizontalCollisions(level, otherPlayer) {
    // 1. Tabrakan dengan platform padat
    const solids = level.getSolidBlocks();
    for (const b of solids) {
      if (this.checkCollision(this, b)) {
        // Hanya tangani tabrakan horizontal jika benar-benar menabrak sisi samping (bukan sedang berdiri di atas permukaan)
        const isSideCollision = this.y + this.height > b.y + 6 && this.y < b.y + b.height - 4;
        if (!isSideCollision) continue;

        if (this.vx > 0) {
          this.x = b.x - this.width;
        } else if (this.vx < 0) {
          this.x = b.x + b.width;
        } else {
          const overlapLeft = (this.x + this.width) - b.x;
          const overlapRight = (b.x + b.width) - this.x;
          if (overlapLeft < overlapRight) {
            this.x = b.x - this.width;
          } else {
            this.x = b.x + b.width;
          }
        }
        this.vx = 0;
      }
    }

    // 2. Tabrakan / dorong Pushable Boxes
    const boxes = level.getPushableBoxes();
    for (const box of boxes) {
      if (this.checkCollision(this, box)) {
        const isSideCollision = this.y + this.height > box.y + 6 && this.y < box.y + box.height - 4;
        if (!isSideCollision) continue;

        const pushStrength = this.tag === "P2" ? 3.8 : 2.6; // P2 (Heavy) lebih kuat mendorong
        if (this.vx > 0) {
          if (box.canMove && box.canMove(pushStrength, level)) {
            this.x = box.x - this.width;
            box.push(pushStrength, 0, level);
          } else {
            // Kotak terblokir dinding atau pintu -> solid wall
            this.x = box.x - this.width;
            this.vx = 0;
          }
        } else if (this.vx < 0) {
          if (box.canMove && box.canMove(-pushStrength, level)) {
            this.x = box.x + box.width;
            box.push(-pushStrength, 0, level);
          } else {
            this.x = box.x + box.width;
            this.vx = 0;
          }
        } else {
          const overlapLeft = (this.x + this.width) - box.x;
          const overlapRight = (box.x + box.width) - this.x;
          if (overlapLeft < overlapRight) {
            this.x = box.x - this.width;
          } else {
            this.x = box.x + box.width;
          }
        }
      }
    }

    // 3. Tabrakan dengan Pintu Tertutup
    const doors = level.getClosedDoors();
    for (const d of doors) {
      if (this.checkCollision(this, d)) {
        const isSideCollision = this.y + this.height > d.y + 6 && this.y < d.y + d.height - 4;
        if (!isSideCollision) continue;

        if (this.vx > 0) {
          this.x = d.x - this.width;
        } else if (this.vx < 0) {
          this.x = d.x + d.width;
        } else {
          const overlapLeft = (this.x + this.width) - d.x;
          const overlapRight = (d.x + d.width) - this.x;
          if (overlapLeft < overlapRight) {
            this.x = d.x - this.width;
          } else {
            this.x = d.x + d.width;
          }
        }
        this.vx = 0;
      }
    }

    // 4. Tabrakan Horizontal Antar-Pemain (P1 vs P2)
    if (otherPlayer && !otherPlayer.isDead) {
      // Cek apakah berada di rentang vertikal yang sama (bukan sedang berdiri di atas kepala)
      const verticalOverlap =
        this.y + this.height > otherPlayer.y + 10 &&
        this.y < otherPlayer.y + otherPlayer.height - 10;

      if (verticalOverlap && this.checkCollision(this, otherPlayer)) {
        if (this.vx > 0) {
          this.x = otherPlayer.x - this.width;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = otherPlayer.x + otherPlayer.width;
          this.vx = 0;
        } else {
          const overlapLeft = (this.x + this.width) - otherPlayer.x;
          const overlapRight = (otherPlayer.x + otherPlayer.width) - this.x;
          if (overlapLeft < overlapRight) {
            this.x = otherPlayer.x - this.width;
          } else {
            this.x = otherPlayer.x + otherPlayer.width;
          }
        }
      }
    }
  }

  handleVerticalCollisions(level, otherPlayer) {
    this.standingOnBox = null;
    this.standingOnPlayer = null;

    // 1. Tabrakan dengan platform padat dan pintu tertutup
    const solidObstacles = [...level.getSolidBlocks(), ...level.getClosedDoors()];
    for (const b of solidObstacles) {
      if (this.checkCollision(this, b)) {
        const prevY = this.y - this.vy;
        if (this.vy >= 0 && prevY + this.height <= b.y + Math.max(14, Math.abs(this.vy) + 4)) {
          this.y = b.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        } else if (this.vy < 0 && prevY >= b.y + b.height - Math.max(14, Math.abs(this.vy) + 4)) {
          this.y = b.y + b.height;
          this.vy = 0;
        } else {
          const overlapTop = (this.y + this.height) - b.y;
          const overlapBottom = (b.y + b.height) - this.y;
          if (overlapTop < overlapBottom) {
            this.y = b.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
          } else {
            this.y = b.y + b.height;
            this.vy = 0;
          }
        }
      }
    }

    // 2. Tabrakan dengan Pushable Boxes (bisa dipanjat)
    const boxes = level.getPushableBoxes();
    for (const box of boxes) {
      if (this.checkCollision(this, box)) {
        const prevY = this.y - this.vy;
        if (this.vy >= 0 && prevY + this.height <= box.y + Math.max(16, Math.abs(this.vy) + 6)) {
          this.y = box.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.standingOnBox = box;
        } else if (this.vy < 0) {
          this.y = box.y + box.height;
          this.vy = 0;
        } else {
          const overlapTop = (this.y + this.height) - box.y;
          const overlapBottom = (box.y + box.height) - this.y;
          if (overlapTop < overlapBottom) {
            this.y = box.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.standingOnBox = box;
          } else {
            this.y = box.y + box.height;
            this.vy = 0;
          }
        }
      }
    }

    // 3. Stacking: Pemain bisa berdiri di atas pemain lain!
    if (otherPlayer && !otherPlayer.isDead) {
      if (this.checkCollision(this, otherPlayer)) {
        const prevY = this.y - this.vy;
        if (this.vy >= 0 && prevY + this.height <= otherPlayer.y + Math.max(18, Math.abs(this.vy) + 6)) {
          this.y = otherPlayer.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.standingOnPlayer = otherPlayer;
        } else if (this.vy < 0 && this.y < otherPlayer.y + otherPlayer.height && prevY >= otherPlayer.y + otherPlayer.height - 18) {
          // Co-op lift saat melompat di bawah rekan
          otherPlayer.y = this.y - otherPlayer.height;
          otherPlayer.vy = Math.min(otherPlayer.vy, this.vy);
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

  die() {
    if (this.isDead) return;
    this.isDead = true;
    audio.playDefeat();
  }

  draw(ctx) {
    if (this.isDead) return;

    ctx.save();

    // 1. Bayangan bawah
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height + 2,
      this.width * 0.45,
      6,
      0,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fill();

    // 2. Halo Pendar Karakter sesuai P1/P2
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 10,
      centerX, centerY, 48
    );
    gradient.addColorStop(0, this.glowColor);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 48, 0, Math.PI * 2);
    ctx.fill();

    // 3. Render Sprite Karakter
    ctx.translate(centerX, this.y + this.height);
    ctx.scale(this.facing * this.stretch, this.squash);

    // Animasi bobbing saat lari
    const bob = Math.abs(this.vx) > 0.5 ? Math.sin(this.animTime * 3) * 3 : 0;

    if (this.imageLoaded) {
      // Gambar sprite karakter
      const drawW = this.width * 1.5;
      const drawH = this.height * 1.4;
      ctx.drawImage(
        this.image,
        -drawW / 2,
        -drawH + bob,
        drawW,
        drawH
      );
    } else {
      // Fallback placeholder jika sprite belum terload
      ctx.fillStyle = this.accentColor;
      ctx.fillRect(-this.width / 2, -this.height + bob, this.width, this.height);
    }

    ctx.restore();

    // 4. Kinetic Shield Sphere Effect jika aktif
    if (this.abilityActiveTimer > 0) {
      ctx.save();
      ctx.translate(centerX, centerY);
      const shieldPulse = Math.sin(this.animTime * 6) * 3;
      const r = this.shieldRadius + shieldPulse;

      // Glow luar
      const shieldGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r);
      shieldGrad.addColorStop(0, "rgba(255, 153, 0, 0.08)");
      shieldGrad.addColorStop(0.7, "rgba(255, 153, 0, 0.25)");
      shieldGrad.addColorStop(1, "rgba(255, 200, 50, 0.7)");

      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Hexagon ring
      ctx.strokeStyle = "#ffaa00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3) + this.animTime;
        const hx = Math.cos(angle) * r;
        const hy = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    // 5. Badge Nama & Tag di Atas Kepala
    ctx.save();
    ctx.font = "bold 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    
    // Background pill badge
    const badgeText = `${this.tag}`;
    const badgeW = 32;
    const badgeH = 16;
    const badgeX = this.x + this.width / 2 - badgeW / 2;
    const badgeY = this.y - 24;

    ctx.fillStyle = "rgba(10, 14, 23, 0.85)";
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();

    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = this.accentColor;
    ctx.fillText(badgeText, this.x + this.width / 2, badgeY + 12);
    ctx.restore();
  }
}
