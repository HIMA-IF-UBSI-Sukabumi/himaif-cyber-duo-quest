// js/game.js - Core Game Loop, State Management, Particle FX, and UI Hooking

import { CANVAS_WIDTH, CANVAS_HEIGHT, CHARACTERS, PLAYER_CONFIG } from "./constants.js";
import { Player } from "./player.js";
import { Level } from "./level.js";
import { audio } from "./audio.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Resolusi Internal
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    // State: "SELECT", "PLAYING", "PAUSED", "STAGE_CLEAR", "GAME_OVER"
    this.state = "SELECT";
    this.currentStageIndex = 0;
    this.totalStages = 3;

    // Entities
    this.player1 = null;
    this.player2 = null;
    this.level = null;

    // Pilihan Karakter P1 & P2 (1-26)
    this.p1CharId = 1;
    this.p2CharId = 2;

    // Input Tracking
    this.inputKeys = {};

    // Timer & Statistik Stage
    this.stageTimer = 0;
    this.stageStartTime = 0;
    this.particles = [];

    // Setup Event Listeners & UI
    this.initInputs();
    this.initUI();
    this.renderCharacterGrid();

    // Game Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initInputs() {
    window.addEventListener("keydown", (e) => {
      this.inputKeys[e.code] = true;

      // Navigasi Keyboard saat di SELECT SCREEN
      if (this.state === "SELECT") {
        // Kontrol Player 1 (WASD)
        if (e.code === "KeyA") {
          const next = this.p1CharId > 1 ? this.p1CharId - 1 : 26;
          this.selectCharacter("p1", next, true);
          audio.playClick();
          e.preventDefault();
        } else if (e.code === "KeyD") {
          const next = this.p1CharId < 26 ? this.p1CharId + 1 : 1;
          this.selectCharacter("p1", next, true);
          audio.playClick();
          e.preventDefault();
        } else if (e.code === "KeyW") {
          let next = this.p1CharId - 6;
          if (next < 1) next += 26;
          this.selectCharacter("p1", next, true);
          audio.playClick();
          e.preventDefault();
        } else if (e.code === "KeyS") {
          let next = this.p1CharId + 6;
          if (next > 26) next -= 26;
          this.selectCharacter("p1", next, true);
          audio.playClick();
          e.preventDefault();
        }

        // Kontrol Player 2 (Arrow Keys)
        if (e.code === "ArrowLeft") {
          const next = this.p2CharId > 1 ? this.p2CharId - 1 : 26;
          this.selectCharacter("p2", next, true);
          audio.playClick();
          e.preventDefault();
        } else if (e.code === "ArrowRight") {
          const next = this.p2CharId < 26 ? this.p2CharId + 1 : 1;
          this.selectCharacter("p2", next, true);
          audio.playClick();
          e.preventDefault();
        } else if (e.code === "ArrowUp") {
          let next = this.p2CharId - 6;
          if (next < 1) next += 26;
          this.selectCharacter("p2", next, true);
          audio.playClick();
          e.preventDefault();
        } else if (e.code === "ArrowDown") {
          let next = this.p2CharId + 6;
          if (next > 26) next -= 26;
          this.selectCharacter("p2", next, true);
          audio.playClick();
          e.preventDefault();
        }

        // Mulai Game dengan Space atau Enter
        if (e.code === "Space" || e.code === "Enter") {
          audio.init();
          audio.startBGM();
          this.startStage(0);
          e.preventDefault();
        }
      }

      // Quick hotkeys saat bermain
      if (e.code === "KeyR" && (this.state === "PLAYING" || this.state === "GAME_OVER")) {
        this.restartCurrentStage();
      }
      if (e.code === "KeyM") {
        const muted = audio.toggleMute();
        this.updateAudioButton(muted);
      }
      if (e.code === "Escape" || e.code === "KeyP") {
        if (this.state === "PLAYING") this.pauseGame();
        else if (this.state === "PAUSED") this.resumeGame();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.inputKeys[e.code] = false;
    });

    // Resize Handler untuk kanvas responsif
    window.addEventListener("resize", () => this.resizeCanvas());
    this.resizeCanvas();
  }

  resizeCanvas() {
    const container = document.getElementById("canvasContainer");
    if (!container) return;
    const contW = container.clientWidth;
    const contH = container.clientHeight;
    const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;

    let w = contW;
    let h = contW / aspect;

    if (h > contH) {
      h = contH;
      w = contH * aspect;
    }

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }

  initUI() {
    // Tombol Mulai Game dari Character Select
    document.getElementById("btnStartGame").addEventListener("click", () => {
      audio.init();
      audio.startBGM();
      this.startStage(0);
    });

    // Tombol Random Karakter
    document.getElementById("btnRandomChar").addEventListener("click", () => {
      audio.playClick();
      this.randomizeCharacters();
    });

    // Tombol Audio Toggle di HUD
    document.getElementById("btnMute").addEventListener("click", () => {
      const muted = audio.toggleMute();
      this.updateAudioButton(muted);
    });

    // Tombol Restart Stage di HUD
    document.getElementById("btnRestart").addEventListener("click", () => {
      this.restartCurrentStage();
    });

    // Tombol Menu / Ganti Karakter
    document.getElementById("btnMenu").addEventListener("click", () => {
      this.showCharacterSelect();
    });

    // Tombol Pause
    document.getElementById("btnPause").addEventListener("click", () => {
      if (this.state === "PLAYING") this.pauseGame();
      else if (this.state === "PAUSED") this.resumeGame();
    });

    // Modal Victory Buttons
    document.getElementById("btnNextStage").addEventListener("click", () => {
      if (this.currentStageIndex < this.totalStages - 1) {
        this.startStage(this.currentStageIndex + 1);
      } else {
        // Tamat semua stage!
        this.showCharacterSelect();
      }
    });
    document.getElementById("btnReplayStage").addEventListener("click", () => {
      this.restartCurrentStage();
    });
    document.getElementById("btnVictoryMenu").addEventListener("click", () => {
      this.showCharacterSelect();
    });

    // Modal Game Over Buttons
    document.getElementById("btnRetry").addEventListener("click", () => {
      this.restartCurrentStage();
    });
    document.getElementById("btnGameOverMenu").addEventListener("click", () => {
      this.showCharacterSelect();
    });
  }

  updateAudioButton(isMuted) {
    const btn = document.getElementById("btnMute");
    if (btn) {
      btn.innerHTML = isMuted
        ? `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`
        : `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
    }
  }

  renderCharacterGrid() {
    const grid = document.getElementById("characterGrid");
    grid.innerHTML = "";

    CHARACTERS.forEach((char) => {
      const card = document.createElement("div");
      card.className = "char-card";
      card.id = `char-card-${char.id}`;

      // Highlight jika terpilih
      if (char.id === this.p1CharId) card.classList.add("selected-p1");
      if (char.id === this.p2CharId) card.classList.add("selected-p2");

      card.innerHTML = `
        <div class="char-badge-p1">P1</div>
        <div class="char-badge-p2">P2</div>
        <div class="char-img-wrap">
          <img src="assets/charakter/${char.id}.png" alt="${char.name}" loading="lazy" />
        </div>
        <div class="char-name">#${char.id} ${char.name}</div>
        <div class="char-role">${char.role}</div>
      `;

      // Klik kiri untuk P1, Klik kanan (atau shift click) untuk P2
      card.addEventListener("click", (e) => {
        audio.playClick();
        if (e.shiftKey) {
          this.selectCharacter("p2", char.id);
        } else {
          // Toggle giliran pemilihan jika P1 sudah pilih
          this.selectCharacter("p1", char.id);
        }
      });

      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        audio.playClick();
        this.selectCharacter("p2", char.id);
      });

      grid.appendChild(card);
    });

    this.updatePlayerCards();
  }

  selectCharacter(playerKey, charId, scrollIntoView = false) {
    if (playerKey === "p1") {
      this.p1CharId = charId;
    } else {
      this.p2CharId = charId;
    }

    // Update class di grid
    document.querySelectorAll(".char-card").forEach((c) => {
      c.classList.remove("selected-p1", "selected-p2");
    });
    const cardP1 = document.getElementById(`char-card-${this.p1CharId}`);
    if (cardP1) cardP1.classList.add("selected-p1");
    const cardP2 = document.getElementById(`char-card-${this.p2CharId}`);
    if (cardP2) cardP2.classList.add("selected-p2");

    // Auto-scroll ke card jika dipicu keyboard
    if (scrollIntoView) {
      const activeCard = playerKey === "p1" ? cardP1 : cardP2;
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }

    this.updatePlayerCards();
  }

  randomizeCharacters() {
    const id1 = Math.floor(Math.random() * 26) + 1;
    let id2 = Math.floor(Math.random() * 26) + 1;
    while (id2 === id1) id2 = Math.floor(Math.random() * 26) + 1;

    this.selectCharacter("p1", id1);
    this.selectCharacter("p2", id2);
  }

  updatePlayerCards() {
    const char1 = CHARACTERS.find((c) => c.id === this.p1CharId);
    const char2 = CHARACTERS.find((c) => c.id === this.p2CharId);

    if (char1) {
      document.getElementById("p1PreviewImg").src = `assets/charakter/${char1.id}.png`;
      document.getElementById("p1PreviewName").textContent = char1.name;
      document.getElementById("p1PreviewRole").textContent = char1.role;
    }
    if (char2) {
      document.getElementById("p2PreviewImg").src = `assets/charakter/${char2.id}.png`;
      document.getElementById("p2PreviewName").textContent = char2.name;
      document.getElementById("p2PreviewRole").textContent = char2.role;
    }
  }

  startStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    this.level = new Level(stageIndex);

    // Inisialisasi Players
    const p1Conf = { ...PLAYER_CONFIG.p1, defaultCharId: this.p1CharId };
    const p2Conf = { ...PLAYER_CONFIG.p2, defaultCharId: this.p2CharId };

    this.player1 = new Player(p1Conf, this.level.spawnP1.x, this.level.spawnP1.y);
    this.player2 = new Player(p2Conf, this.level.spawnP2.x, this.level.spawnP2.y);

    this.stageStartTime = performance.now();
    this.stageTimer = 0;
    this.particles = [];

    // Sembunyikan UI Select, Tampilkan Game HUD
    document.getElementById("selectScreen").classList.add("hidden");
    document.getElementById("gameOverlay").classList.remove("hidden");
    document.getElementById("modalVictory").classList.add("hidden");
    document.getElementById("modalGameOver").classList.add("hidden");

    // Update HUD Info
    document.getElementById("hudStageName").textContent = this.level.name;
    document.getElementById("hudStageSubtitle").textContent = this.level.subtitle;
    document.getElementById("hudP1Avatar").src = `assets/charakter/${this.p1CharId}.png`;
    document.getElementById("hudP2Avatar").src = `assets/charakter/${this.p2CharId}.png`;

    this.updateTokenHUD();
    this.state = "PLAYING";
    this.resizeCanvas();
  }

  restartCurrentStage() {
    this.startStage(this.currentStageIndex);
  }

  showCharacterSelect() {
    this.state = "SELECT";
    document.getElementById("selectScreen").classList.remove("hidden");
    document.getElementById("gameOverlay").classList.add("hidden");
    document.getElementById("modalVictory").classList.add("hidden");
    document.getElementById("modalGameOver").classList.add("hidden");
  }

  pauseGame() {
    this.state = "PAUSED";
  }

  resumeGame() {
    this.state = "PLAYING";
  }

  updateTokenHUD() {
    const container = document.getElementById("hudTokens");
    container.innerHTML = "";
    if (!this.level) return;

    this.level.tokens.forEach((t) => {
      const tokenIcon = document.createElement("div");
      tokenIcon.className = `token-slot ${t.isCollected ? "collected" : ""}`;
      tokenIcon.innerHTML = `<img src="assets/logo/image.png" alt="Token" />`;
      container.appendChild(tokenIcon);
    });
  }

  updateAbilityHUD() {
    if (!this.player1 || !this.player2) return;

    const p1Status = this.player1.getAbilityStatus();
    const p2Status = this.player2.getAbilityStatus();

    const p1Bar = document.getElementById("p1AbilityBar");
    const p1Text = document.getElementById("p1AbilityText");
    if (p1Bar && p1Text) {
      p1Bar.style.width = `${p1Status.percent * 100}%`;
      p1Text.textContent = p1Status.ready ? "⚡ EMP READY [E]" : `⚡ EMP RECHARGE...`;
      p1Bar.className = `ability-progress-bar ${p1Status.ready ? "ready" : ""}`;
    }

    const p2Bar = document.getElementById("p2AbilityBar");
    const p2Text = document.getElementById("p2AbilityText");
    if (p2Bar && p2Text) {
      if (p2Status.isActive) {
        p2Bar.style.width = `${p2Status.activeRatio * 100}%`;
        p2Text.textContent = "🛡️ SHIELD AKTIF!";
        p2Bar.className = "ability-progress-bar active";
      } else {
        p2Bar.style.width = `${p2Status.percent * 100}%`;
        p2Text.textContent = p2Status.ready ? "🛡️ SHIELD READY [Shift]" : `🛡️ SHIELD RECHARGE...`;
        p2Bar.className = `ability-progress-bar ${p2Status.ready ? "ready" : ""}`;
      }
    }
  }

  addParticle(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        life: 25 + Math.random() * 15
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  loop(currentTime) {
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.state === "PLAYING") {
      this.update();
    }

    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    this.stageTimer = (performance.now() - this.stageStartTime) / 1000;
    const timerElem = document.getElementById("hudTimer");
    if (timerElem) {
      const mins = Math.floor(this.stageTimer / 60);
      const secs = Math.floor(this.stageTimer % 60).toString().padStart(2, "0");
      timerElem.textContent = `${mins}:${secs}`;
    }

    // 1. Update Players dengan parameter game instance
    this.player1.update(this.inputKeys, this.level, this.player2, this);
    this.player2.update(this.inputKeys, this.level, this.player1, this);

    // Update Ability HUD status
    this.updateAbilityHUD();

    // Cek Debu Langkah/Lompat
    if (Math.abs(this.player1.vx) > 2 && this.player1.isGrounded && Math.random() < 0.2) {
      this.addParticle(this.player1.x + this.player1.width / 2, this.player1.y + this.player1.height, "rgba(0, 242, 254, 0.6)", 1);
    }
    if (Math.abs(this.player2.vx) > 2 && this.player2.isGrounded && Math.random() < 0.2) {
      this.addParticle(this.player2.x + this.player2.width / 2, this.player2.y + this.player2.height, "rgba(255, 153, 0, 0.6)", 1);
    }

    // 2. Update Level, Objek Puzzle, dan AI Drones
    this.level.update([this.player1, this.player2], this.inputKeys);
    this.updateTokenHUD();
    this.updateParticles();

    // 3. Cek Kematian / Kalah
    if (this.player1.isDead || this.player2.isDead) {
      this.triggerGameOver();
      return;
    }

    // 4. Cek Penyelesaian Stage (Kedua pemain di Exit Portal)
    if (this.level.portal && this.level.portal.isCompleted()) {
      this.triggerStageClear();
    }
  }

  triggerGameOver() {
    this.state = "GAME_OVER";
    document.getElementById("modalGameOver").classList.remove("hidden");
  }

  triggerStageClear() {
    this.state = "STAGE_CLEAR";
    audio.playVictory();

    const collectedTokens = this.level.tokens.filter((t) => t.isCollected).length;
    const mins = Math.floor(this.stageTimer / 60);
    const secs = Math.floor(this.stageTimer % 60).toString().padStart(2, "0");

    document.getElementById("victoryTime").textContent = `${mins}:${secs}`;
    document.getElementById("victoryTokens").textContent = `${collectedTokens} / 3`;

    // Render Bintang Kemenangan
    const starsContainer = document.getElementById("victoryStars");
    starsContainer.innerHTML = "";
    let starCount = 1;
    if (collectedTokens >= 2) starCount = 2;
    if (collectedTokens === 3 && this.stageTimer < 90) starCount = 3;

    for (let i = 0; i < 3; i++) {
      const star = document.createElement("span");
      star.className = `star-icon ${i < starCount ? "active" : ""}`;
      star.innerHTML = "★";
      starsContainer.appendChild(star);
    }

    // Cek apakah stage terakhir
    const nextBtn = document.getElementById("btnNextStage");
    if (this.currentStageIndex >= this.totalStages - 1) {
      nextBtn.textContent = "TAMAT (MENU UTAMA)";
    } else {
      nextBtn.textContent = "STAGE BERIKUTNYA ➔";
    }

    document.getElementById("modalVictory").classList.remove("hidden");
  }

  draw() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.state === "SELECT") {
      // Visual background saat select screen
      return;
    }

    if (this.level) {
      this.level.draw(this.ctx);
    }

    if (this.player1) this.player1.draw(this.ctx);
    if (this.player2) this.player2.draw(this.ctx);

    this.drawParticles();

    if (this.state === "PAUSED") {
      this.ctx.fillStyle = "rgba(10, 14, 23, 0.75)";
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.ctx.font = "bold 36px 'Space Grotesk', sans-serif";
      this.ctx.fillStyle = "#ffffff";
      this.ctx.textAlign = "center";
      this.ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      this.ctx.font = "16px Outfit, sans-serif";
      this.ctx.fillStyle = "#94a3b8";
      this.ctx.fillText("Tekan ESC atau P untuk melanjutkan", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
  }
}

// Inisialisasi Game saat dokumen siap
window.addEventListener("DOMContentLoaded", () => {
  window.gameApp = new Game();
});
