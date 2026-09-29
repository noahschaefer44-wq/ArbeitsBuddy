G.flappy = {
  name: 'FLAPPY BIRD', icon: '🐦', color: '#39ff14',
  ctl: 'LEERTASTE / ↑ / TIPPEN = Flattern · Weiche den Röhren aus',
  cheats: [
    { id: 'GOD', n: 'Unsterblich', d: 'Röhren und Boden schaden nicht' },
    { id: 'LOWGRAV', n: 'Mond-Gravitation', d: 'Der Vogel fällt sanft' },
    { id: 'AUTO', n: 'Autopilot', d: 'Der Vogel fliegt von allein' },
    { id: 'BIGGAP', n: 'Riesige Lücken', d: 'Viel mehr Platz zwischen den Röhren' },
    { id: 'SLOWPIPE', n: 'Langsame Röhren', d: 'Alles bewegt sich gemütlicher' },
    { id: 'TINY', n: 'Mini-Vogel', d: 'Winziger Vogel, winzige Trefferfläche' },
    { id: 'HOVER', n: 'Schwebemodus', d: 'Halten = steigen, loslassen = sinken' },
    { id: 'X2', n: '2× Punkte', d: 'Jede Röhre zählt doppelt' },
    { id: 'RAINBOW', n: 'Regenbogen', d: 'Röhren in Regenbogenfarben' },
    { id: 'THIN', n: 'Dünne Röhren', d: 'Schmale Röhren zum Durchschlüpfen' }
  ],
  make(a) {
    const { keys, C } = a; const BX = 160, FLOOR = H - 60;
    let y, vy, pipes, dist, t, tick, clouds, wing;
    const r = () => C('TINY') ? 8 : 15;
    const gapH = () => C('BIGGAP') ? 250 : 150;
    const pw = () => C('THIN') ? 34 : 66;
    function flap() { if (C('HOVER')) return; vy = C('LOWGRAV') ? -300 : -430; wing = .15; a.beep(600, .07, 'square', .03, 300); }
    function addPipe(x) { const g = gapH(); pipes.push({ x, gy: rand(70 + g / 2, FLOOR - 70 - g / 2), g, w: pw(), passed: false, hue: rand(0, 360) }); }
    return {
      reset() {
        y = H / 2 - 40; vy = 0; pipes = []; dist = 0; t = 0; tick = 0; wing = 0;
        clouds = Array.from({ length: 6 }, () => ({ x: rand(0, W), y: rand(30, 220), s: rand(.6, 1.4) }));
        addPipe(W + 100); a.set(0);
      },
      key(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW' || c === 'Tap') flap(); },
      update(dt) {
        t += dt; wing -= dt;
        const sp = C('SLOWPIPE') ? 105 : 180 + Math.min(80, dist / 60);
        dist += sp * dt;
        if (C('AUTO')) {
          const nxt = pipes.find(p => p.x + p.w > BX - 20);
          const tgt = nxt ? nxt.gy + 18 : H / 2;
          if (y > tgt && vy > -120 && !C('HOVER')) flap();
        }
        if (C('HOVER')) {
          const up = a.held() || (C('AUTO') && y > (pipes.find(p => p.x + p.w > BX - 20)?.gy ?? H / 2) + 6);
          vy += ((up ? -240 : 240) - vy) * Math.min(1, dt * 8);
        } else vy += (C('LOWGRAV') ? 800 : 1400) * dt;
        y += vy * dt;
        if (y < r()) { y = r(); vy = 0; }
        if (y > FLOOR - r()) { if (C('GOD')) { y = FLOOR - r(); vy = -200; } else { a.over(); return; } }
        for (const p of pipes) {
          p.x -= sp * dt;
          if (!p.passed && p.x + p.w < BX - r()) { p.passed = true; a.add(C('X2') ? 2 : 1); a.beep(880, .08, 'square', .04, 300); }
          if (!C('GOD') && BX + r() - 3 > p.x && BX - r() + 3 < p.x + p.w && (y - r() + 3 < p.gy - p.g / 2 || y + r() - 3 > p.gy + p.g / 2)) { a.over(); return; }
        }
        pipes = pipes.filter(p => p.x > -100);
        const last = pipes[pipes.length - 1];
        if (!last || last.x < W - 230 - (C('SLOWPIPE') ? -30 : 0)) addPipe(W + 40);
        clouds.forEach(c => { c.x -= sp * .2 * dt * c.s; if (c.x < -80) { c.x = W + 60; c.y = rand(30, 220); } });
      },
      draw() {
        const ctx = a.ctx;
        const g = ctx.createLinearGradient(0, 0, 0, FLOOR);
        g.addColorStop(0, '#1a0b4d'); g.addColorStop(.6, '#7a1f8a'); g.addColorStop(1, '#ff6a88');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        for (const c of clouds) { ctx.beginPath(); ctx.arc(c.x, c.y, 22 * c.s, 0, 7); ctx.arc(c.x + 24 * c.s, c.y + 4, 18 * c.s, 0, 7); ctx.arc(c.x - 22 * c.s, c.y + 6, 16 * c.s, 0, 7); ctx.fill(); }
        // Skyline
        ctx.fillStyle = '#240a45'; for (let i = 0; i < 14; i++) { const bx = ((i * 60 - dist * .3) % (14 * 60) + 14 * 60) % (14 * 60) - 60; ctx.fillRect(bx, FLOOR - 40 - (i * 37) % 70, 44, 200); }
        for (const p of pipes) {
          const col = C('RAINBOW') ? hsl(p.hue + t * 120, 90, 55) : '#39ff14';
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
          const top = p.gy - p.g / 2, bot = p.gy + p.g / 2;
          ctx.fillRect(p.x, 0, p.w, top); ctx.fillRect(p.x, bot, p.w, FLOOR - bot);
          ctx.fillRect(p.x - 5, top - 22, p.w + 10, 22); ctx.fillRect(p.x - 5, bot, p.w + 10, 22);
          ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(p.x + 5, 0, 6, top - 22); ctx.fillRect(p.x + 5, bot + 22, 6, FLOOR - bot - 22);
        }
        ctx.fillStyle = '#12052e'; ctx.fillRect(0, FLOOR, W, H - FLOOR);
        ctx.strokeStyle = '#05d9e8'; ctx.lineWidth = 3; ctx.shadowColor = '#05d9e8'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(0, FLOOR); ctx.lineTo(W, FLOOR); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#b026ff88'; ctx.lineWidth = 1; for (let x = -(dist % 40); x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, FLOOR + 4); ctx.lineTo(x - 20, H); ctx.stroke(); }
        // Vogel
        ctx.save(); ctx.translate(BX, y); ctx.rotate(clamp(vy / 700, -.5, 1)); const s = r() / 15;
        ctx.scale(s, s); ctx.shadowColor = '#f9f002'; ctx.shadowBlur = 16;
        ctx.fillStyle = C('RAINBOW') ? hsl(t * 300) : '#f9f002'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 14, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.ellipse(-5, wing > 0 ? -6 : 4, 9, 5, wing > 0 ? -.6 : .4, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(8, -5, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(10, -5, 2.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#ff2a6d'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(26, 3); ctx.lineTo(14, 8); ctx.fill();
        ctx.restore();
      }
    };
  }
};
