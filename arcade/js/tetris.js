G.tetris = {
  name: 'TETRIS', icon: '🧱', color: '#b026ff',
  ctl: '← → = Bewegen · ↑ = Drehen · ↓ = Schneller · LEERTASTE = Hard Drop · C = Halten (Cheat)',
  cheats: [
    { id: 'GHOST', n: 'Geisterstein', d: 'Zeigt, wo der Stein landet' },
    { id: 'NEXT3', n: 'Vorschau ×3', d: 'Die nächsten 3 Steine sichtbar' },
    { id: 'HOLD', n: 'Stein halten', d: 'Taste C tauscht den Stein' },
    { id: 'SLOW', n: 'Zeitlupe', d: 'Steine fallen viel langsamer' },
    { id: 'TURBO', n: 'Turbo', d: 'Steine fallen rasend schnell' },
    { id: 'ONLYI', n: 'Nur I-Steine', d: 'Lange Balken für Tetris-Reihen' },
    { id: 'X2', n: '2× Punkte', d: 'Alle Punkte verdoppelt' },
    { id: 'NOGRAV', n: 'Schwebe-Modus', d: 'Steine fallen nur, wenn du es willst' },
    { id: 'RAINBOW', n: 'Regenbogen', d: 'Bunte Steine' },
    { id: 'CLEAR', n: 'Feld leeren', d: 'Löscht sofort alle Steine', once: true }
  ],
  make(a) {
    const { keys, C } = a; const CS = 22, BX = 200, BY = 20, COLS = 10, ROWS = 20;
    const SH = {
      I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1],[0,0,0]],
      S: [[0,1,1],[1,1,0],[0,0,0]], Z: [[1,1,0],[0,1,1],[0,0,0]], J: [[1,0,0],[1,1,1],[0,0,0]], L: [[0,0,1],[1,1,1],[0,0,0]]
    };
    const COL = { I: '#05d9e8', O: '#f9f002', T: '#d300c5', S: '#39ff14', Z: '#ff2a6d', J: '#4d7cff', L: '#ff9f1c' };
    let b, cur, queue, hold, canHold, acc, lines, level, t, fx;
    const bag = () => C('ONLYI') ? ['I'] : shuffle(Object.keys(SH));
    const nextType = () => { while (queue.length < 5) queue.push(...bag()); return queue.shift(); };
    function make(tp) { const m = SH[tp].map(r => [...r]); return { t: tp, m, x: Math.floor((COLS - m[0].length) / 2), y: tp === 'I' ? -1 : 0 }; }
    function collide(p, dx = 0, dy = 0, m = p.m) {
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue;
        const nx = p.x + x + dx, ny = p.y + y + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && b[ny][nx]) return true;
      }
      return false;
    }
    function spawn(tp) {
      cur = make(tp || nextType()); canHold = true;
      if (collide(cur)) a.over();
    }
    function rotate() {
      const m = cur.m[0].map((_, i) => cur.m.map(r => r[i]).reverse());
      for (const k of [0, -1, 1, -2, 2]) if (!collide(cur, k, 0, m)) { cur.m = m; cur.x += k; a.beep(500, .04, 'square', .03); return; }
    }
    function move(dx) { if (!collide(cur, dx, 0)) { cur.x += dx; a.beep(300, .03, 'square', .02); } }
    function lock() {
      cur.m.forEach((r, y) => r.forEach((v, x) => { if (v && cur.y + y >= 0) b[cur.y + y][cur.x + x] = cur.t; }));
      let n = 0;
      for (let y = ROWS - 1; y >= 0; y--) if (b[y].every(Boolean)) { b.splice(y, 1); b.unshift(Array(COLS).fill(0)); n++; y++; }
      if (n) {
        a.add([0, 100, 300, 500, 800][n] * (level + 1) * (C('X2') ? 2 : 1));
        lines += n; level = Math.floor(lines / 10);
        a.beep(500 + n * 120, .2, 'square', .05, 400); fx = .25;
      } else a.beep(150, .05, 'square', .04);
      a.info(null);
      spawn();
    }
    function drop() { let n = 0; while (!collide(cur, 0, 1)) { cur.y++; n++; } a.add(n * 2); lock(); }
    const holdSwap = () => {
      if (!C('HOLD') || !canHold) return;
      const tp = cur.t; if (hold) spawn(hold); else spawn();
      hold = tp; canHold = false;
    };
    function block(x, y, col, alpha = 1) {
      const ctx = a.ctx; ctx.globalAlpha = alpha;
      ctx.fillStyle = col; ctx.fillRect(x, y, CS - 1, CS - 1);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, CS - 1, 3); ctx.fillRect(x, y, 3, CS - 1);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y + CS - 4, CS - 1, 3); ctx.fillRect(x + CS - 4, y, 3, CS - 1);
      ctx.globalAlpha = 1;
    }
    const colOf = (tp, x, y) => C('RAINBOW') ? hsl(t * 90 + x * 22 + y * 14, 90, 58) : COL[tp];
    function mini(tp, cx, cy, sz = 14) {
      const ctx = a.ctx, m = SH[tp], ox = cx - m[0].length * sz / 2, oy = cy - m.length * sz / 2;
      ctx.fillStyle = COL[tp];
      m.forEach((r, y) => r.forEach((v, x) => { if (v) ctx.fillRect(ox + x * sz, oy + y * sz, sz - 1, sz - 1); }));
    }
    return {
      reset() {
        b = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        queue = []; hold = null; acc = 0; lines = 0; level = 0; t = 0; fx = 0; a.set(0); a.info(null); spawn();
      },
      cheat(c) {
        if (c === 'CLEAR') { b = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); a.add(500); fx = .4; }
      },
      key(c) {
        if (c === 'ArrowLeft' || c === 'KeyA') move(-1);
        else if (c === 'ArrowRight' || c === 'KeyD') move(1);
        else if (c === 'ArrowUp' || c === 'KeyW' || c === 'KeyX') rotate();
        else if (c === 'Space') drop();
        else if (c === 'KeyC' || c === 'ShiftLeft') holdSwap();
      },
      pointer(type, x, y) { if (type === 'down') { if (x < 260) move(-1); else if (x > 380) move(1); else rotate(); } },
      update(dt) {
        t += dt; if (fx > 0) fx -= dt;
        const soft = keys.ArrowDown || keys.KeyS;
        let iv = Math.max(.06, .8 - level * .07);
        if (C('SLOW')) iv *= 2.6; if (C('TURBO')) iv *= .25;
        if (soft) iv = Math.min(iv, .04);
        if (C('NOGRAV') && !soft) return;
        acc += dt;
        while (acc >= iv) {
          acc -= iv;
          if (!collide(cur, 0, 1)) { cur.y++; if (soft) a.add(1); } else { lock(); break; }
        }
      },
      draw() {
        const ctx = a.ctx;
        ctx.fillStyle = '#07021a'; ctx.fillRect(0, 0, W, H);
        // Seitenleisten
        ctx.font = PX(9); ctx.textAlign = 'center'; ctx.fillStyle = '#b026ff';
        ctx.fillText('HOLD', 100, 40); ctx.fillText('NEXT', 540, 40);
        ctx.strokeStyle = '#b026ff88'; ctx.lineWidth = 2; ctx.strokeRect(45, 55, 110, 80); ctx.strokeRect(485, 55, 110, C('NEXT3') ? 240 : 80);
        if (hold) mini(hold, 100, 95);
        const nx = C('NEXT3') ? 3 : 1; for (let i = 0; i < nx; i++) if (queue[i]) mini(queue[i], 540, 95 + i * 78);
        ctx.fillStyle = '#f9f002'; ctx.textAlign = 'left'; ctx.font = PX(9);
        ctx.fillText('LEVEL', 40, 330); ctx.fillText('LINES', 40, 400);
        ctx.fillStyle = '#fff'; ctx.font = PX(14); ctx.fillText(level + 1, 40, 355); ctx.fillText(lines, 40, 425);
        // Spielfeld
        ctx.fillStyle = '#000'; ctx.fillRect(BX, BY, COLS * CS, ROWS * CS);
        ctx.strokeStyle = fx > 0 ? '#fff' : '#b026ff'; ctx.shadowColor = '#b026ff'; ctx.shadowBlur = 16; ctx.lineWidth = 3;
        ctx.strokeRect(BX - 2, BY - 2, COLS * CS + 4, ROWS * CS + 4); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#1a0b3e'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 1; x < COLS; x++) { ctx.moveTo(BX + x * CS + .5, BY); ctx.lineTo(BX + x * CS + .5, BY + ROWS * CS); }
        for (let y = 1; y < ROWS; y++) { ctx.moveTo(BX, BY + y * CS + .5); ctx.lineTo(BX + COLS * CS, BY + y * CS + .5); }
        ctx.stroke();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (b[y][x]) block(BX + x * CS, BY + y * CS, colOf(b[y][x], x, y));
        if (C('GHOST')) {
          let gy = 0; while (!collide(cur, 0, gy + 1)) gy++;
          cur.m.forEach((r, y) => r.forEach((v, x) => { if (v && cur.y + y + gy >= 0) block(BX + (cur.x + x) * CS, BY + (cur.y + y + gy) * CS, '#fff', .22); }));
        }
        cur.m.forEach((r, y) => r.forEach((v, x) => { if (v && cur.y + y >= 0) block(BX + (cur.x + x) * CS, BY + (cur.y + y) * CS, colOf(cur.t, cur.x + x, cur.y + y)); }));
        ctx.textAlign = 'start';
      }
    };
  }
};
