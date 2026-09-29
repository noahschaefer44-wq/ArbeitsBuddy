G.breakout = {
  name: 'BREAKOUT', icon: '🧨', color: '#f9f002',
  ctl: '← → / Maus / Finger = Schläger · LEERTASTE / Klick = Ball starten',
  cheats: [
    { id: 'BIGPAD', n: 'Riesen-Schläger', d: 'Fast doppelt so breit' },
    { id: 'SLOWBALL', n: 'Langsamer Ball', d: 'Der Ball ist gemütlicher unterwegs' },
    { id: 'STICKY', n: 'Klebriger Schläger', d: 'Ball klebt fest, Leertaste = Abschuss' },
    { id: 'MULTI', n: 'Multiball', d: 'Zwei zusätzliche Bälle', once: true },
    { id: 'LASER', n: 'Laser', d: 'Leertaste schießt Ziegel weg' },
    { id: 'FIREBALL', n: 'Feuerball', d: 'Der Ball pflügt durch alle Ziegel' },
    { id: 'LIVES', n: '+5 Leben', d: 'Fünf Extra-Leben sofort', once: true },
    { id: 'SKIP', n: 'Level überspringen', d: 'Räumt das Level sofort ab', once: true },
    { id: 'AUTO', n: 'Autopilot', d: 'Der Schläger folgt dem Ball' },
    { id: 'X3', n: '3× Punkte', d: 'Jeder Ziegel gibt dreifache Punkte' }
  ],
  make(a) {
    const { keys, C } = a; const PY = H - 34, BW = 58, BH = 20, BROWS = 6, BCOLS = 10;
    const RC = ['#ff2a6d', '#ff9f1c', '#f9f002', '#39ff14', '#05d9e8', '#b026ff'];
    let pad, balls, bricks, lives, level, lasers, lcool, parts, mx, t;
    const padW = () => C('BIGPAD') ? 160 : 92;
    function level_() {
      bricks = [];
      for (let r = 0; r < BROWS; r++) for (let c = 0; c < BCOLS; c++) {
        const pat = level % 4;
        if (pat === 1 && (r + c) % 2) continue;
        if (pat === 2 && r % 3 === 2) continue;
        if (pat === 3 && (c < r || c > BCOLS - 1 - r) && r > 0) continue;
        bricks.push({ x: 10 + c * (BW + 4), y: 56 + r * (BH + 4), w: BW, h: BH, r, hp: 1 });
      }
    }
    const speed = () => (330 + level * 25) * (C('SLOWBALL') ? .65 : 1);
    function newBall(stuck = true) { return { x: pad.x, y: PY - 10, vx: 0, vy: 0, stuck, off: 0 }; }
    function serve(b) { const ang = rand(-.5, .5) - Math.PI / 2; b.stuck = false; b.vx = Math.cos(ang) * speed(); b.vy = Math.sin(ang) * speed(); a.beep(500, .08, 'square', .04, 300); }
    function boom(x, y, col) { for (let i = 0; i < 8; i++) parts.push({ x, y, vx: rand(-140, 140), vy: rand(-140, 140), l: .5, col }); }
    function breakBrick(b) { b.dead = true; a.add((7 - b.r) * 10 * (C('X3') ? 3 : 1)); boom(b.x + b.w / 2, b.y + b.h / 2, RC[b.r]); a.beep(300 + (6 - b.r) * 90, .07, 'square', .04); }
    function fire() {
      for (const b of balls) if (b.stuck) serve(b);
      if (C('LASER') && lcool <= 0) { lasers.push({ x: pad.x - padW() / 2 + 6, y: PY }, { x: pad.x + padW() / 2 - 6, y: PY }); lcool = .28; a.beep(1000, .05, 'sawtooth', .03, -600); }
    }
    return {
      reset() { pad = { x: W / 2 }; lives = 3; level = 0; lasers = []; lcool = 0; parts = []; mx = null; t = 0; balls = [newBall()]; level_(); a.set(0); a.info(lives); },
      cheat(c) {
        if (c === 'MULTI') { const src = balls[0] || newBall(); for (let i = 0; i < 2; i++) { const b = { x: src.x, y: src.y, vx: 0, vy: 0, stuck: false }; const ang = -Math.PI / 2 + (i ? .5 : -.5); b.vx = Math.cos(ang) * speed(); b.vy = Math.sin(ang) * speed(); balls.push(b); } }
        if (c === 'LIVES') { lives += 5; a.info(lives); }
        if (c === 'SKIP') bricks.forEach(b => { if (!b.dead) breakBrick(b); });
      },
      key(c) { if (c === 'Space' || c === 'Tap') fire(); },
      pointer(type, x) { if (type === 'move' || type === 'down') mx = x; },
      update(dt) {
        t += dt; lcool -= dt;
        const pw = padW(), mv = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
        if (C('AUTO')) { const b = balls.filter(b => !b.stuck).sort((p, q) => q.y - p.y)[0] || balls[0]; pad.x += clamp(b.x - pad.x, -700 * dt, 700 * dt); for (const s of balls) if (s.stuck) serve(s); }
        else if (mv) { pad.x += mv * 520 * dt; mx = null; }
        else if (mx !== null) pad.x += clamp(mx - pad.x, -900 * dt, 900 * dt);
        pad.x = clamp(pad.x, pw / 2, W - pw / 2);
        if (C('LASER') && keys.Space) fire();
        for (const b of balls) {
          if (b.stuck) { b.x = pad.x + b.off; b.y = PY - 10; continue; }
          const steps = 3;
          for (let s = 0; s < steps; s++) {
            b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
            if (b.x < 7) { b.x = 7; b.vx = Math.abs(b.vx); } if (b.x > W - 7) { b.x = W - 7; b.vx = -Math.abs(b.vx); }
            if (b.y < 7) { b.y = 7; b.vy = Math.abs(b.vy); }
            if (b.vy > 0 && b.y + 7 >= PY && b.y - 7 <= PY + 12 && Math.abs(b.x - pad.x) <= pw / 2 + 6) {
              const rel = clamp((b.x - pad.x) / (pw / 2), -1, 1), sp = Math.min(760, Math.hypot(b.vx, b.vy) * 1.005);
              if (C('STICKY')) { b.stuck = true; b.off = clamp(b.x - pad.x, -pw / 2, pw / 2); b.vx = b.vy = 0; break; }
              const ang = rel * 1.05 - Math.PI / 2; b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; b.y = PY - 8; a.beep(260, .05);
            }
            for (const br of bricks) {
              if (br.dead) continue;
              if (b.x + 7 > br.x && b.x - 7 < br.x + br.w && b.y + 7 > br.y && b.y - 7 < br.y + br.h) {
                breakBrick(br);
                if (!C('FIREBALL')) {
                  const ox = Math.min(b.x + 7 - br.x, br.x + br.w - (b.x - 7)), oy = Math.min(b.y + 7 - br.y, br.y + br.h - (b.y - 7));
                  if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy;
                  break;
                }
              }
            }
          }
        }
        // Laser
        for (const l of lasers) { l.y -= 700 * dt; for (const br of bricks) if (!br.dead && l.x > br.x && l.x < br.x + br.w && l.y < br.y + br.h && l.y > br.y - 20) { breakBrick(br); l.dead = true; break; } if (l.y < 0) l.dead = true; }
        lasers = lasers.filter(l => !l.dead); bricks = bricks.filter(b => !b.dead);
        balls = balls.filter(b => b.y < H + 20);
        if (!balls.length) {
          lives--; a.info(lives); a.beep(150, .4, 'sawtooth', .06, -100);
          if (lives <= 0) { a.over(); return; }
          balls = [newBall()];
        }
        if (!bricks.length) { level++; a.add(200); level_(); balls = [newBall()]; lasers = []; a.beep(880, .4, 'square', .05, 500); }
        parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }); parts = parts.filter(p => p.l > 0);
      },
      draw() {
        const ctx = a.ctx, pw = padW();
        ctx.fillStyle = '#0a0a02'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#1c1c08'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
        for (const b of bricks) {
          ctx.fillStyle = RC[b.r]; ctx.shadowColor = RC[b.r]; ctx.shadowBlur = 8; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(b.x, b.y, b.w, 4); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);
        }
        ctx.fillStyle = '#05d9e8'; ctx.shadowColor = '#05d9e8'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.roundRect(pad.x - pw / 2, PY, pw, 12, 6); ctx.fill();
        if (C('LASER')) { ctx.fillStyle = '#ff2a6d'; ctx.fillRect(pad.x - pw / 2 + 2, PY - 6, 8, 8); ctx.fillRect(pad.x + pw / 2 - 10, PY - 6, 8, 8); }
        ctx.fillStyle = '#ff2a6d'; for (const l of lasers) ctx.fillRect(l.x - 1.5, l.y, 3, 16);
        for (const b of balls) {
          const fb = C('FIREBALL'); ctx.fillStyle = fb ? '#ff9f1c' : '#fff'; ctx.shadowColor = fb ? '#ff2a6d' : '#f9f002'; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, 7); ctx.fill();
        }
        ctx.shadowBlur = 0;
        for (const p of parts) { ctx.globalAlpha = p.l * 2; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 4, 4); } ctx.globalAlpha = 1;
        ctx.fillStyle = '#9a8fd8'; ctx.font = PX(8); ctx.fillText('LEVEL ' + (level + 1), 10, 22);
        if (balls.some(b => b.stuck)) { ctx.fillStyle = `rgba(249,240,2,${.6 + .4 * Math.sin(t * 6)})`; ctx.textAlign = 'center'; ctx.fillText('LEERTASTE / KLICK = START', W / 2, PY - 40); ctx.textAlign = 'start'; }
      }
    };
  }
};
