G.invaders = {
  name: 'SPACE INVADERS', icon: '👾', color: '#ff2a6d',
  ctl: '← → / A D = Bewegen · LEERTASTE / A-Knopf = Schießen',
  cheats: [
    { id: 'GOD', n: 'Unsterblich', d: 'Kein Treffer kann dich verletzen' },
    { id: 'RAPID', n: 'Schnellfeuer', d: 'Unbegrenzt viele Schüsse, kurze Pause' },
    { id: 'TRIPLE', n: 'Dreifachschuss', d: 'Drei Schüsse im Fächer' },
    { id: 'NUKE', n: 'Atombombe', d: 'Vernichtet die gesamte Angriffswelle', once: true },
    { id: 'SLOWALIEN', n: 'Langsame Aliens', d: 'Die Invasoren kriechen nur' },
    { id: 'PEACE', n: 'Friedensvertrag', d: 'Aliens schießen nicht zurück' },
    { id: 'LIVES', n: '+5 Leben', d: 'Fünf Extra-Leben sofort', once: true },
    { id: 'PIERCE', n: 'Durchschlag', d: 'Schüsse durchdringen alle Aliens' },
    { id: 'X3', n: '3× Punkte', d: 'Alle Abschüsse zählen dreifach' },
    { id: 'FREEZE', n: 'Eiszeit', d: 'Die Aliens stehen komplett still' }
  ],
  make(a) {
    const { keys, C } = a; const COLS = 10, ROWS = 5, SX = 46, SY = 34, PY = H - 52;
    const SP = [
      ['00100000100','00010001000','00111111100','01101110110','11111111111','10111111101','10100000101','00011011000'],
      ['00001110000','00111111100','01111111110','11100100111','11111111111','00011011000','00110110110','11000000011'],
      ['00011111000','01111111110','11111111111','11100100111','11111111111','00110110110','01100000110','00110110110']
    ];
    const ALT = [['00100000100','01000000010'], ['01100000110','00011011000'], ['11000000011','01100000110']];
    const COLS_ = ['#ff2a6d', '#f9f002', '#05d9e8'];
    let P, bul, ebul, al, ox, oy, dir, lives, level, cool, fireT, inv, shields, ufo, ufoT, t, fr, parts;
    function sprite(k, frame, x, y, px, col) {
      const ctx = a.ctx; ctx.fillStyle = col;
      const rows = frame ? SP[k].slice(0, 6).concat(ALT[k]) : SP[k];
      rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '1') ctx.fillRect(x + i * px, y + j * px, px, px); });
    }
    function wave() {
      al = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => ({ alive: true, r, c })));
      ox = 50; oy = 56 + Math.min(level, 5) * 12; dir = 1; bul = []; ebul = [];
    }
    function mkShields() {
      shields = [];
      for (let s = 0; s < 4; s++) {
        const cells = [];
        for (let y = 0; y < 8; y++) for (let x = 0; x < 11; x++) { if (y >= 6 && x >= 4 && x <= 6) continue; if (y < 2 && (x < 1 || x > 9)) continue; cells.push({ x, y, hp: 1 }); }
        shields.push({ x: 70 + s * 150, y: PY - 68, cells });
      }
    }
    function hitShield(b, r = 1.6) {
      for (const s of shields) for (const c of s.cells) {
        if (c.hp <= 0) continue;
        const cx = s.x + c.x * 5, cy = s.y + c.y * 5;
        if (b.x > cx - 2 && b.x < cx + 7 && b.y > cy - 2 && b.y < cy + 7) {
          for (const d of s.cells) if (d.hp > 0 && Math.hypot(d.x - c.x, d.y - c.y) < r) d.hp = 0;
          return true;
        }
      }
      return false;
    }
    const alive = () => al.flat().filter(x => x.alive);
    function fire() {
      if (cool > 0) return;
      if (!C('RAPID') && bul.length >= 1) return;
      const sh = (vx) => bul.push({ x: P.x, y: PY - 6, vx, vy: -560 });
      sh(0); if (C('TRIPLE')) { sh(-130); sh(130); }
      cool = C('RAPID') ? .1 : .28; a.beep(900, .08, 'square', .03, -500);
    }
    function boom(x, y, col) { for (let i = 0; i < 10; i++) parts.push({ x, y, vx: rand(-120, 120), vy: rand(-120, 120), l: .5, col }); }
    function killAll() {
      for (const e of alive()) { e.alive = false; a.add((e.r === 0 ? 30 : e.r < 3 ? 20 : 10) * (C('X3') ? 3 : 1)); boom(ox + e.c * SX + 14, oy + e.r * SY + 10, COLS_[e.r === 0 ? 0 : e.r < 3 ? 1 : 2]); }
    }
    function hurt() {
      if (P.inv > 0 || C('GOD')) return;
      lives--; P.inv = 1.6; a.info(lives); boom(P.x, PY, '#fff'); a.beep(120, .4, 'sawtooth', .06, -80);
      if (lives <= 0) a.over();
    }
    return {
      reset() {
        P = { x: W / 2, inv: 0 }; lives = 3; level = 0; cool = 0; fireT = 1; t = 0; fr = 0; parts = []; ufo = null; ufoT = rand(12, 20);
        wave(); mkShields(); a.set(0); a.info(lives);
      },
      cheat(c) {
        if (c === 'NUKE') killAll();
        if (c === 'LIVES') { lives += 5; a.info(lives); }
      },
      key(c) { if (c === 'Space' || c === 'Tap') fire(); },
      pointer(type, x) { if (type === 'move' && a.ptr.down) P.x = clamp(x, 30, W - 30); },
      update(dt) {
        t += dt; cool -= dt; P.inv -= dt;
        const mv = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
        P.x = clamp(P.x + mv * 330 * dt, 30, W - 30);
        if (keys.Space) fire();
        // Aliens
        const live = alive();
        if (!live.length) { level++; wave(); a.beep(660, .3, 'square', .05, 400); return; }
        let sp = (26 + (ROWS * COLS - live.length) * 3.2) * (1 + level * .12);
        if (C('SLOWALIEN')) sp *= .35; if (C('FREEZE')) sp = 0;
        ox += dir * sp * dt; fr += sp * dt * .05;
        const minC = Math.min(...live.map(e => e.c)), maxC = Math.max(...live.map(e => e.c));
        if ((dir > 0 && ox + maxC * SX + 28 > W - 8) || (dir < 0 && ox + minC * SX < 8)) { dir = -dir; oy += 14; ox += dir * 2; }
        const lowY = Math.max(...live.map(e => oy + e.r * SY + 20));
        if (lowY > PY - 10 && !C('GOD')) { a.over(); return; }
        if (lowY > PY - 10) oy -= 80;
        // Alien-Schüsse
        fireT -= dt;
        if (fireT <= 0 && !C('PEACE') && !C('FREEZE')) {
          fireT = rand(.45, 1.3) / (1 + level * .12);
          const cols = [...new Set(live.map(e => e.c))], c = pick(cols);
          const e = live.filter(x => x.c === c).sort((p, q) => q.r - p.r)[0];
          ebul.push({ x: ox + e.c * SX + 14, y: oy + e.r * SY + 20, vy: 220 + level * 18 });
        }
        // Ufo
        ufoT -= dt; if (ufoT <= 0 && !ufo) { ufo = { x: -40, d: 1 }; if (Math.random() < .5) { ufo.x = W + 40; ufo.d = -1; } ufoT = rand(14, 24); }
        if (ufo) { ufo.x += ufo.d * 130 * dt; if (ufo.x < -60 || ufo.x > W + 60) ufo = null; }
        // Spieler-Schüsse
        for (const b of bul) {
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y < 0 || b.x < 0 || b.x > W) { b.dead = true; continue; }
          if (!C('PIERCE') && hitShield(b)) { b.dead = true; continue; }
          if (ufo && Math.abs(b.x - ufo.x) < 22 && Math.abs(b.y - 34) < 14) { a.add(pick([100, 150, 300]) * (C('X3') ? 3 : 1)); boom(ufo.x, 34, '#ff2a6d'); ufo = null; if (!C('PIERCE')) b.dead = true; a.beep(300, .3, 'sawtooth', .05, 600); continue; }
          for (const e of live) {
            if (!e.alive) continue;
            const ex = ox + e.c * SX, ey = oy + e.r * SY;
            if (b.x > ex && b.x < ex + 28 && b.y > ey && b.y < ey + 20) {
              e.alive = false; a.add((e.r === 0 ? 30 : e.r < 3 ? 20 : 10) * (C('X3') ? 3 : 1));
              boom(ex + 14, ey + 10, COLS_[e.r === 0 ? 0 : e.r < 3 ? 1 : 2]); a.beep(200, .12, 'square', .05, -100);
              if (!C('PIERCE')) { b.dead = true; break; }
            }
          }
        }
        bul = bul.filter(b => !b.dead);
        for (const b of ebul) {
          b.y += b.vy * dt;
          if (b.y > H) { b.dead = true; continue; }
          if (hitShield(b)) { b.dead = true; continue; }
          if (Math.abs(b.x - P.x) < 18 && b.y > PY - 8 && b.y < PY + 14) { b.dead = true; hurt(); }
        }
        ebul = ebul.filter(b => !b.dead);
        parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }); parts = parts.filter(p => p.l > 0);
      },
      draw() {
        const ctx = a.ctx;
        ctx.fillStyle = '#06020f'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) { ctx.globalAlpha = .3 + .3 * Math.sin(t + i); ctx.fillRect((i * 97) % W, (i * 53 + t * 8 * (1 + i % 3)) % H, 1.5, 1.5); }
        ctx.globalAlpha = 1;
        const f = Math.floor(fr) % 2;
        for (const row of al) for (const e of row) if (e.alive) {
          const k = e.r === 0 ? 0 : e.r < 3 ? 1 : 2;
          ctx.shadowColor = COLS_[k]; ctx.shadowBlur = 8; sprite(k, f, ox + e.c * SX, oy + e.r * SY, 2.5, COLS_[k]);
        }
        ctx.shadowBlur = 0;
        for (const s of shields) for (const c of s.cells) if (c.hp > 0) { ctx.fillStyle = '#39ff14'; ctx.fillRect(s.x + c.x * 5, s.y + c.y * 5, 5, 5); }
        if (ufo) { ctx.fillStyle = '#ff2a6d'; ctx.shadowColor = '#ff2a6d'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.ellipse(ufo.x, 34, 22, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(ufo.x - 6, 24, 12, 6); ctx.shadowBlur = 0; }
        // Spieler
        if (!(P.inv > 0 && Math.floor(t * 12) % 2)) {
          ctx.fillStyle = '#05d9e8'; ctx.shadowColor = '#05d9e8'; ctx.shadowBlur = 12;
          ctx.fillRect(P.x - 20, PY, 40, 12); ctx.fillRect(P.x - 12, PY - 6, 24, 8); ctx.fillRect(P.x - 3, PY - 14, 6, 10); ctx.shadowBlur = 0;
        }
        ctx.fillStyle = '#f9f002'; for (const b of bul) ctx.fillRect(b.x - 1.5, b.y - 8, 3, 12);
        ctx.fillStyle = '#ff2a6d'; for (const b of ebul) { ctx.fillRect(b.x - 1.5, b.y - 6, 3, 12); ctx.fillRect(b.x - 4, b.y - 2 + Math.sin(t * 30) * 2, 8, 2); }
        for (const p of parts) { ctx.globalAlpha = p.l * 2; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 3, 3); } ctx.globalAlpha = 1;
        ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, PY + 22); ctx.lineTo(W, PY + 22); ctx.stroke();
        ctx.fillStyle = '#9a8fd8'; ctx.font = PX(8); ctx.fillText('WELLE ' + (level + 1), 10, H - 8);
      }
    };
  }
};
