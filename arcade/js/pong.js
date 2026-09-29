G.pong = {
  name: 'PONG', icon: '🏓', color: '#05d9e8',
  ctl: 'W / S / ↑ / ↓ oder Maus / Finger = Schläger · Erster mit 7 Punkten gewinnt',
  cheats: [
    { id: 'BIGPAD', n: 'Riesen-Schläger', d: 'Dein Schläger ist fast doppelt so groß' },
    { id: 'TINYAI', n: 'Winziger Gegner', d: 'Der Gegner-Schläger schrumpft' },
    { id: 'SLOWBALL', n: 'Langsamer Ball', d: 'Der Ball bleibt gemütlich' },
    { id: 'FREEZEAI', n: 'Gegner eingefroren', d: 'Der Gegner bewegt sich nicht' },
    { id: 'AUTO', n: 'Autopilot', d: 'Dein Schläger spielt von allein' },
    { id: 'MULTI', n: 'Multiball', d: 'Drei Bälle gleichzeitig' },
    { id: 'TRAIL', n: 'Leuchtspur', d: 'Der Ball zieht einen Schweif hinter sich her' },
    { id: 'SAFEGOAL', n: 'Sicheres Tor', d: 'Dein Tor ist eine Wand – du kannst nicht verlieren' },
    { id: 'SUPER', n: 'Turbo-Schläger', d: 'Dein Schläger flitzt doppelt so schnell' },
    { id: 'X2', n: 'Doppelte Punkte', d: 'Jedes Tor zählt zweifach' }
  ],
  make(a) {
    const { keys, C } = a; const WIN = 7;
    let L, R, balls, ps, as, my, t;
    const newBall = () => ({ x: W / 2, y: H / 2, vx: 0, vy: 0, wait: .9, sp: 320, trail: [] });
    function launch(b, dir) { const ang = rand(-.5, .5); b.vx = Math.cos(ang) * b.sp * dir; b.vy = Math.sin(ang) * b.sp; }
    return {
      reset() {
        L = { x: 22, y: H / 2, w: 12, h: 80 }; R = { x: W - 34, y: H / 2, w: 12, h: 80 };
        balls = Array.from({ length: C('MULTI') ? 3 : 1 }, newBall); balls.forEach((b, i) => b.wait = .9 + i * .35);
        ps = 0; as = 0; my = null; t = 0; a.set(0);
      },
      cheat(c, on) {
        if (c === 'MULTI') { if (on) while (balls.length < 3) { const b = newBall(); b.wait = .4; balls.push(b); } else balls.length = 1; }
      },
      pointer(type, x, y) { if (type === 'move' || type === 'down') my = y; },
      update(dt) {
        t += dt;
        L.h = C('BIGPAD') ? 140 : 80; R.h = C('TINYAI') ? 34 : 80;
        const mv = (keys.KeyW || keys.ArrowUp ? -1 : 0) + (keys.KeyS || keys.ArrowDown ? 1 : 0);
        const sp = C('SUPER') ? 780 : 430;
        const track = (P, target, s) => { P.y += clamp(target - P.y, -s * dt, s * dt); };
        const incoming = dir => balls.filter(b => b.wait <= 0 && Math.sign(b.vx) === dir).sort((p, q) => dir > 0 ? q.x - p.x : p.x - q.x)[0];
        if (C('AUTO')) { const b = incoming(-1); track(L, b ? b.y : H / 2, 520); }
        else if (mv) { L.y += mv * sp * dt; my = null; }
        else if (my !== null) track(L, my, sp * 1.4);
        if (!C('FREEZEAI')) { const b = incoming(1); track(R, b ? b.y + Math.sin(t * 2) * 14 : H / 2, 250 + ps * 12); }
        L.y = clamp(L.y, L.h / 2 + 4, H - L.h / 2 - 4); R.y = clamp(R.y, R.h / 2 + 4, H - R.h / 2 - 4);
        for (const b of balls) {
          if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0) launch(b, Math.random() < .5 ? 1 : -1); continue; }
          const k = C('SLOWBALL') ? .55 : 1;
          b.x += b.vx * dt * k; b.y += b.vy * dt * k;
          b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 14) b.trail.shift();
          if (b.y < 7) { b.y = 7; b.vy = Math.abs(b.vy); a.beep(300, .04); }
          if (b.y > H - 7) { b.y = H - 7; b.vy = -Math.abs(b.vy); a.beep(300, .04); }
          const bounce = (P, dir) => {
            b.sp = Math.min(720, b.sp * 1.06); const rel = clamp((b.y - P.y) / (P.h / 2), -1, 1), ang = rel * .95;
            b.vx = Math.cos(ang) * b.sp * dir; b.vy = Math.sin(ang) * b.sp; a.beep(dir > 0 ? 440 : 520, .06, 'square', .05);
          };
          if (b.vx < 0 && b.x - 7 < L.x + L.w && b.x + 7 > L.x && Math.abs(b.y - L.y) < L.h / 2 + 7) { b.x = L.x + L.w + 7; bounce(L, 1); }
          if (b.vx > 0 && b.x + 7 > R.x && b.x - 7 < R.x + R.w && Math.abs(b.y - R.y) < R.h / 2 + 7) { b.x = R.x - 7; bounce(R, -1); }
          if (C('SAFEGOAL') && b.x < 8 && b.vx < 0) { b.vx = -b.vx; a.beep(200, .05); }
          if (b.x < -12) { as++; Object.assign(b, newBall()); a.beep(150, .3, 'sawtooth', .05, -80); }
          else if (b.x > W + 12) { const pts = C('X2') ? 2 : 1; ps += pts; a.add(100 * pts); Object.assign(b, newBall()); a.beep(880, .2, 'square', .05, 300); }
        }
        if (ps >= WIN) { a.add(300); a.over('SIEG!'); }
        else if (as >= WIN) a.over('NIEDERLAGE');
      },
      draw() {
        const ctx = a.ctx;
        ctx.fillStyle = '#02101a'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#05d9e855'; ctx.lineWidth = 4; ctx.setLineDash([14, 14]);
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#05d9e8'; ctx.lineWidth = 3; ctx.shadowColor = '#05d9e8'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(W, 2); ctx.moveTo(0, H - 2); ctx.lineTo(W, H - 2); ctx.stroke();
        if (C('SAFEGOAL')) { ctx.strokeStyle = '#39ff14'; ctx.shadowColor = '#39ff14'; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(3, H); ctx.stroke(); }
        ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.font = PX(40);
        ctx.fillStyle = '#05d9e866'; ctx.fillText(ps, W / 2 - 80, 70); ctx.fillStyle = '#ff2a6d66'; ctx.fillText(as, W / 2 + 80, 70);
        for (const [P, col] of [[L, '#05d9e8'], [R, '#ff2a6d']]) {
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.fillRect(P.x, P.y - P.h / 2, P.w, P.h);
        }
        for (const b of balls) {
          if (C('TRAIL')) b.trail.forEach((p, i) => { ctx.globalAlpha = i / b.trail.length * .5; ctx.fillStyle = '#f9f002'; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + i * .3, 0, 7); ctx.fill(); });
          ctx.globalAlpha = b.wait > 0 ? .4 + .4 * Math.sin(t * 20) : 1;
          ctx.fillStyle = '#fff'; ctx.shadowColor = '#f9f002'; ctx.shadowBlur = 18; ctx.fillRect(b.x - 7, b.y - 7, 14, 14);
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = 'start';
      }
    };
  }
};
