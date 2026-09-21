<p align="center">
  <img src="assets/logo/image.png" alt="Logo HIMAIF" width="120" />
</p>

<h1 align="center">HIMAIF Duo: Cyber Quest</h1>
<p align="center">
  <strong>Platformer Kooperatif 2 Pemain • 1 Perangkat Offline</strong><br />
  Game platformer puzzle bergaya cyberpunk buatan HIMAIF untuk organisasi mahasiswa informatika.
</p>

<p align="center">
  🌐 <a href="README.md"><strong>English (README.md)</strong></a>
</p>

---

## 📖 Tentang Game

**HIMAIF Duo: Cyber Quest** adalah game platformer kooperatif 2 pemain yang dimainkan secara offline di satu keyboard (terinspirasi *Fireboy & Watergirl*). Dua pemain memilih avatar dari **26 karakter HIMAIF yang unik**, lalu bekerja sama memecahkan puzzle sirkuit, menghindari drone sentinel yang berpatroli, dan mencapai portal keluar bersama-sama.

Dibangun murni dengan HTML, CSS, dan JavaScript vanilla (ES Modules) — tanpa framework, tanpa proses build, dan tanpa game engine eksternal.

---

## ✨ Fitur Unggulan

- **Ko-Op Lokal 2 Pemain** — Kedua pemain berbagi satu keyboard di satu perangkat.
- **26 Karakter Unik** — Setiap karakter punya nama, role, dan deskripsi; pilih lewat grid, navigasi keyboard, atau tombol 🎲 acak.
- **3 Stage Terkurasi** — Dari tutorial, stealth, hingga infiltrasi puzzle laser.
- **Kemampuan Unik Tiap Pemain** — Cyber EMP Pulse milik P1 vs Kinetic Shield milik P2.
- **Tema Cyberpunk** — HUD neon, grid cyber di latar, dan token logo HIMAIF.
- **AI Drone Sentinel** — Patroli dengan kerucut pandang dan raycast line-of-sight.
- **Audio Prosedural** — Musik latar dan efek suara dibuat langsung dengan Web Audio API (tanpa file audio).
- **Rating Bintang** — 1–3 bintang per stage berdasar token yang dikumpulkan dan waktu tempuh.
- **Tanpa Build Step** — Langsung berjalan di browser.

---

## 🚀 Cara Menjalankan

### Opsi A — Buka langsung
Buka `index.html` di browser modern mana pun (Chrome, Edge, Firefox). Tidak perlu server.

### Opsi B — Server lokal (disarankan)
```bash
# Python 3
python -m http.server 8000
# lalu buka http://localhost:8000

# Atau dengan Node
npx serve .
```

> 💡 Kontrol keyboard kedua pemain dibaca dari **perangkat yang sama**, jadi kedua pemain harus bermain di komputer/keyboard yang sama.

---

## 🎮 Kontrol

| Aksi | Player 1 (P1) | Player 2 (P2) |
|---|---|---|
| Gerak | `A` / `D` | `◄` / `►` |
| Lompat | `W` | `▲` |
| Interaksi (tuas) | `S` | `▼` |
| Kemampuan | `E` (atau `Q`) | `Shift` (atau `Enter`) |

### Hotkey saat bermain

| Tombol | Aksi |
|---|---|
| `R` | Ulangi stage yang sedang dimainkan |
| `M` | Aktif/nonaktifkan suara |
| `P` / `Esc` | Jeda / lanjutkan |
| `Space` / `Enter` | Mulai game (di layar pemilihan karakter) |

---

## ⚡ Kemampuan Pemain

| Pemain | Kemampuan | Efek |
|---|---|---|
| P1 — Cyber EMP Pulse | `E` | Menonaktifkan laser & drone dalam radius 320px selama **4 detik** (cooldown ~6 dtk) |
| P2 — Kinetic Shield | `Shift` | Kebal terhadap laser & deteksi drone selama **3,5 detik** (cooldown ~7 dtk) |

---

## 🧩 Elemen Permainan

| Elemen | Cara kerja |
|---|---|
| **Tombol Injak (Pressure Plate)** | Tekan dengan kaki atau timpa dengan kotak untuk membuka pintu terkait. |
| **Tuas (Lever)** | Berdiri di dekatnya lalu tekan tombol interaksi untuk mengaktifkan/menonaktifkan. |
| **Pintu Hidrolik** | Gerbang geser yang terbuka oleh tombol atau tuas terkait. |
| **Penghalang Laser** | Mematikan secara instan — nonaktifkan dengan tuas, EMP P1, atau blokir dengan kotak dorong. |
| **Kotak Dorong** | Balok yang bisa didorong; P2 (Heavy) mendorong lebih kuat. Berguna untuk menginjak tombol dan memblokir laser. |
| **Lift Bergerak** | Transportasi vertikal antar lantai. |
| **Logo Token** | Koin koleksi HIMAIF — 3 buah per stage. |
| **Portal Keluar** | Kedua pemain harus masuk bersamaan untuk menyelesaikan stage. |
| **Drone Sentinel** | Berpatroli dengan kerucut pandang; mendeteksi dan mengejar pemain, tapi buta terhadap pemain berperisai dan bisa di-stun oleh EMP. |

---

## 🗺️ Daftar Stage

| # | Nama | Tema |
|---|---|---|
| 1 | **SYSTEM BOOT** | Tutorial — tombol injak, tuas, pintu, dan kotak dorong pertama. |
| 2 | **SENTINEL INFILTRATION** | Stealth — patroli drone, jebakan kandang drone, dan lift menuju pintu keluar. |
| 3 | **CORE BREACH** | Laser, patroli drone ganda, dan Core Room terakhir. |

---

## 📁 Struktur Proyek

```
├── index.html           # Entry point & semua layar UI (select, HUD, modal)
├── css/
│   └── style.css        # Styling tema cyberpunk
├── js/
│   ├── constants.js     # Karakter, konfigurasi pemain, fisika, asset path
│   ├── game.js          # Core game loop, state management, UI hooks
│   ├── level.js         # Layout 3 stage & update/draw level
│   ├── player.js        # Entitas pemain: gerak, tabrakan, kemampuan, rendering
│   ├── interactive.js   # Tombol, tuas, pintu, laser, kotak, lift, token, portal
│   ├── enemy.js         # AI Drone Sentinel (patroli, kerucut pandang, state alert)
│   └── audio.js         # Engine Web Audio API untuk BGM & SFX prosedural
└── assets/
    ├── logo/image.png   # Logo HIMAIF (favicon, watermark, sprite token)
    └── charakter/       # 26 sprite karakter (1.png – 26.png)
```

---

## 🛠️ Teknologi

- **HTML5 Canvas** untuk semua rendering dalam game
- **JavaScript Vanilla (ES Modules)** — tanpa framework, tanpa build tool
- **Web Audio API** untuk musik & efek prosedural
- **Google Fonts** — *Outfit* & *Space Grotesk* (satu-satunya dependensi eksternal)

---

## 🧑‍💻 Mengembangkan Game

- **Tambah/edit karakter** — ubah array `CHARACTERS` di `js/constants.js:7` dan masukkan sprite sebagai `assets/charakter/<id>.png`.
- **Ubah fisika** — sesuaikan objek `PHYSICS` di `js/constants.js:79`.
- **Tambah stage baru** — tambahkan metode `initStageN()` di `js/level.js` dan daftarkan di `loadStage` (`js/level.js:40`).

---

## 🏆 Kredit

Dibuat dengan ❤️ oleh **HIMAIF Developer Team**.

---

*HIMAIF Duo: Cyber Quest — Himpunan Mahasiswa Informatika.*