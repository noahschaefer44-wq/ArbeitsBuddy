G.snake = {
  name: 'SNAKE', icon: '🐍', color: '#39ff14',
  ctl: 'PFEILTASTEN / WASD / WISCHEN = Steuern',
  cheats: [
    { id: 'WRAP', n: 'Durch Wände', d: 'Am Rand tauchst du auf der anderen Seite auf' },
    { id: 'GHOST', n: 'Geistermodus', d: 'Du kannst durch dich selbst kriechen' },
    { id: 'SLOW', n: 'Zeitlupe', d: 'Die Schlange bewegt sich gemütlich' },
    { id: 'TURBO', n: 'Turbo', d: 'Doppelt so schnell – nur für Profis' },
    { id: 'AUTO', n: 'Autopilot', d: 'Sucht selbstständig das Futter' },
    { id: 'RAINBOW', n: 'Regenbogen', d: 'Bunte Schlange' },
    { id: 'X3', n: '3× Punkte', d: 'Jedes Futter gibt 30 statt 10' },
    { id: 'MULTI', n: 'Futter-Regen', d: 'Immer 5 Äpfel gleichzeitig' },
    { id: 'NOGROW', n: 'Kein Wachstum', d: 'Die Schlange bleibt immer kurz' },
    { id: 'REVERSE', n: 'Verkehrte Welt', d: 'Links und rechts vertauscht' }
  ],
  make(a) {
    const { keys, C } = a; const CS = 20, CW = 32, CHH = 24;
    let sn, dir, q, foods, acc, t, touch0;
    const DIRS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    function place() {
      let p, n = 0;
      do { p = { x: ri(0, CW - 1), y: ri(0, CHH - 1) }; } while (n++ < 500 && (sn.some(s => s.x === p.x && s.y === p.y) || foods.some(f => f.x === p.x && f.y === p.y)));
      foods.push(p);
    }
    const fill = () => { const n = C('MULTI') ? 5 : 1; while (foods.length < n) place(); if (!C('MULTI')) foods.length = 1; };
    function steer(dx, dy) {
      if (C('REVERSE')) { dx = -dx; dy = -dy; }
      const last = q.length ? q[q.length - 1] : dir;
      if ((dx === -last.x && dy === -last.y) || (dx === last.x && dy === last.y)) return;
      if (q.length < 3) q.push({ x: dx, y: dy });
    }
    function flood(x, y, occ, limit) {
      const seen = new Set([x + ',' + y]), st = [[x, y]]; let n = 0;
      while (st.length && n < limit) {
        const [cx, cy] = st.pop(); n++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let nx = cx + dx, ny = cy + dy;
          if (C('WRAP')) { nx = (nx + CW) % CW; ny = (ny + CHH) % CHH; } else if (nx < 0 || ny < 0 || nx >= CW || ny >= CHH) continue;
          const k = nx + ',' + ny; if (seen.has(k) || occ.has(k)) continue; seen.add(k); st.push([nx, ny]);
        }
      }
      return n;
    }
    function auto() {
      const occ = C('GHOST') ? new Set() : new Set(sn.slice(0, -1).map(s => s.x + ',' + s.y));
      let best = null;
      for (const o of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
        if (o.x === -dir.x && o.y === -dir.y) continue;
        let x = sn[0].x + o.x, y = sn[0].y + o.y;
        if (C('WRAP')) { x = (x + CW) % CW; y = (y + CHH) % CHH; } else if (x < 0 || y < 0 || x >= CW || y >= CHH) continue;
        if (occ.has(x + ',' + y)) continue;
        const dd = Math.min(...foods.map(f => Math.abs(f.x - x) + Math.abs(f.y - y)));
        const room = flood(x, y, occ, sn.length + 8);
        const sc = (room < sn.length + 4 ? 1000 : 0) + dd;
        if (!best || sc < best.sc) best = { o, sc };
      }
      if (best) q = [best.o];
    }
    function step() {
      if (C('AUTO')) auto();
      const d = q.shift() || dir; dir = d;
      let h = { x: sn[0].x + d.x, y: sn[0].y + d.y };
      if (C('WRAP')) { h.x = (h.x + CW) % CW; h.y = (h.y + CHH) % CHH; }
      else if (h.x < 0 || h.y < 0 || h.x >= CW || h.y >= CHH) { a.over(); return; }
      if (!C('GHOST') && sn.some((s, i) => i < sn.length - 1 && s.x === h.x && s.y === h.y)) { a.over(); return; }
      sn.unshift(h);
      const fi = foods.findIndex(f => f.x === h.x && f.y === h.y);
      if (fi >= 0) {
        foods.splice(fi, 1); a.add(10 * (C('X3') ? 3 : 1)); a.beep(700, .07, 'square', .04, 500);
        if (C('NOGROW')) sn.pop();
        fill();
      } else sn.pop();
    }
    return {
      reset() {
        sn = [{ x: 16, y: 12 }, { x: 15, y: 12 }, { x: 14, y: 12 }, { x: 13, y: 12 }];
        dir = { x: 1, y: 0 }; q = []; foods = []; acc = 0; t = 0; fill(); a.set(0);
      },
      cheat(c) { if (c === 'MULTI') fill(); },
      key(c) { const d = DIRS[c]; if (d) steer(d[0], d[1]); },
      pointer(type, x, y) {
        if (type === 'down') touch0 = { x, y };
        else if (type === 'up' && touch0) {
          const dx = x - touch0.x, dy = y - touch0.y;
          if (Math.hypot(dx, dy) > 24) { Math.abs(dx) > Math.abs(dy) ? steer(Math.sign(dx), 0) : steer(0, Math.sign(dy)); }
          touch0 = null;
        }
      },
      update(dt) {
        t += dt;
        let iv = Math.max(.055, .12 - sn.length * .0009);
        if (C('SLOW')) iv = .2; if (C('TURBO')) iv = Math.min(iv, .055) * .7;
        acc += dt;
        while (acc >= iv) { acc -= iv; step(); if (Number.isNaN(acc)) acc = 0; }
      },
      draw() {
        const ctx = a.ctx;
        ctx.fillStyle = '#04120a'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#0f3a1f'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 0; x <= W; x += CS) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
        for (let y = 0; y <= H; y += CS) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
        ctx.stroke();
        if (!C('WRAP')) { ctx.strokeStyle = '#39ff14'; ctx.lineWidth = 3; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 12; ctx.strokeRect(1.5, 1.5, W - 3, H - 3); ctx.shadowBlur = 0; }
        for (const f of foods) {
          const p = 1 + .15 * Math.sin(t * 8);
          ctx.fillStyle = '#ff2a6d'; ctx.shadowColor = '#ff2a6d'; ctx.shadowBlur = 16;
          ctx.beginPath(); ctx.arc(f.x * CS + 10, f.y * CS + 11, 7 * p, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = '#39ff14'; ctx.fillRect(f.x * CS + 10, f.y * CS + 1, 2, 5);
        }
        const rb = C('RAINBOW');
        for (let i = sn.length - 1; i >= 0; i--) {
          const s = sn[i], col = rb ? hsl(i * 18 + t * 200) : (i === 0 ? '#b8ff9a' : `hsl(${110 + Math.min(i, 30) * 1.2} 100% ${58 - Math.min(i, 30) * .6}%)`);
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = i === 0 ? 14 : 6;
          const r = i === 0 ? 8 : 6;
          ctx.beginPath(); ctx.roundRect(s.x * CS + 1, s.y * CS + 1, CS - 2, CS - 2, r); ctx.fill();
        }
        ctx.shadowBlur = 0;
        const h = sn[0]; ctx.fillStyle = '#000';
        const ex = dir.y ? [5, 13] : [dir.x > 0 ? 12 : 4, dir.x > 0 ? 12 : 4], ey = dir.y ? [dir.y > 0 ? 12 : 4, dir.y > 0 ? 12 : 4] : [5, 13];
        for (let k = 0; k < 2; k++) ctx.fillRect(h.x * CS + ex[k], h.y * CS + ey[k], 3, 3);
      }
    };
  }
};
