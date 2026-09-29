G.pacman = {
  name: 'PAC-MAN', icon: '🟡', color: '#f9f002',
  ctl: 'PFEILTASTEN / WASD / WISCHEN = Bewegen · Alle Punkte fressen!',
  cheats: [
    { id: 'GOD', n: 'Unsterblich', d: 'Geister können dir nichts anhaben' },
    { id: 'POWER', n: 'Dauer-Power', d: 'Alle Geister sind dauerhaft verängstigt' },
    { id: 'SPEED', n: 'Turbo-Pac', d: 'Pac-Man ist 60 % schneller' },
    { id: 'SLOWGHOST', n: 'Träge Geister', d: 'Geister kriechen nur noch' },
    { id: 'FREEZEG', n: 'Geister einfrieren', d: 'Geister bewegen sich nicht' },
    { id: 'NOGHOST', n: 'Keine Geister', d: 'Das Labyrinth gehört dir allein' },
    { id: 'X3', n: '3× Punkte', d: 'Alles gibt dreifache Punkte' },
    { id: 'MAGNET', n: 'Punkte-Magnet', d: 'Frisst Punkte im Umkreis von 2 Feldern' },
    { id: 'LIVES', n: '+3 Leben', d: 'Drei Extra-Leben sofort', once: true },
    { id: 'WARP', n: 'Teleport', d: 'Beamt dich an einen zufälligen Ort', once: true }
  ],
  make(a) {
    const { C } = a; const TS = 22, MW = 19, MH = 21, OX = (W - MW * TS) / 2, OY = (H - MH * TS) / 2;
    const MAZE = [
      '###################',
      '#........#........#',
      '#o##.###.#.###.##o#',
      '#.................#',
      '#.##.#.#####.#.##.#',
      '#....#...#...#....#',
      '####.### # ###.####',
      '   #.#       #.#   ',
      '####.# ## ## #.####',
      '    .  #   #  .    ',
      '####.# ##### #.####',
      '   #.#       #.#   ',
      '####.# ##### #.####',
      '#........#........#',
      '#.##.###.#.###.##.#',
      '#o.#.....P.....#.o#',
      '##.#.#.#####.#.#.##',
      '#....#...#...#....#',
      '#.######.#.######.#',
      '#.................#',
      '###################'];
    const GCOL = ['#ff2a6d', '#ff9ff3', '#05d9e8', '#ff9f1c'];
    const DIRS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    let dots, left, pac, ghosts, fright, lives, level, t, chain, pause, touch0, floors;
    const wall = (x, y) => y < 0 || y >= MH ? true : (x < 0 || x >= MW ? false : MAZE[y][x] === '#');
    const house = (x, y) => y === 9 && x >= 8 && x <= 10 || (x === 9 && y === 8);
    const wrapX = x => (x + MW) % MW;
    function canGo(e, dx, dy, isGhost) {
      const nx = wrapX(e.tx + dx), ny = e.ty + dy;
      if (wall(nx, ny)) return false;
      if (isGhost && !e.inHouse && house(nx, ny)) return false;
      return true;
    }
    function advance(e, dist, choose) {
      while (dist > 0) {
        if (e.t === 0) { choose(e); if (!e.dx && !e.dy) return; }
        const m = Math.min(1 - e.t, dist); e.t += m; dist -= m;
        if (e.t >= .99999) { e.tx = wrapX(e.tx + e.dx); e.ty += e.dy; e.t = 0; }
      }
    }
    const pos = e => ({ x: e.tx + e.dx * e.t, y: e.ty + e.dy * e.t });
    function spawnGhosts() {
      const st = [[9, 7, 0], [8, 9, 2], [9, 9, 4], [10, 9, 6]];
      ghosts = st.map(([x, y, w], i) => ({ i, tx: x, ty: y, dx: 0, dy: 0, t: 0, inHouse: y === 9, wait: w, eaten: false }));
    }
    function resetPos() {
      pac = { tx: 9, ty: 15, dx: 0, dy: 0, t: 0, want: null, ang: 0, last: [1, 0] };
      spawnGhosts(); fright = 0; chain = 0; pause = 1.2;
    }
    function fillDots() {
      dots = MAZE.map(r => [...r].map(c => c === '.' ? 1 : c === 'o' ? 2 : 0)); left = dots.flat().filter(Boolean).length;
    }
    function eat(x, y) {
      const v = dots[y] && dots[y][x]; if (!v) return;
      dots[y][x] = 0; left--; a.add((v === 2 ? 50 : 10) * (C('X3') ? 3 : 1)); a.beep(v === 2 ? 300 : 700 + (left % 2) * 120, .05, 'square', .03);
      if (v === 2) { fright = 7; chain = 0; }
    }
    function pacChoose(e) {
      if (e.want && canGo(e, e.want[0], e.want[1])) { e.dx = e.want[0]; e.dy = e.want[1]; }
      else if (!canGo(e, e.dx, e.dy)) { e.dx = 0; e.dy = 0; }
      if (e.dx || e.dy) e.last = [e.dx, e.dy];
    }
    function ghostChoose(g) {
      if (g.inHouse) {
        if (g.wait > 0) { g.dx = 0; g.dy = 0; return; }
        if (g.ty <= 7) { g.inHouse = false; }
        else if (g.tx < 9) { g.dx = 1; g.dy = 0; return; }
        else if (g.tx > 9) { g.dx = -1; g.dy = 0; return; }
        else { g.dx = 0; g.dy = -1; return; }
      }
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => canGo(g, d[0], d[1], true));
      let ch = opts.filter(d => !(d[0] === -g.dx && d[1] === -g.dy));
      if (!ch.length) ch = opts;
      if (!ch.length) { g.dx = 0; g.dy = 0; return; }
      let d;
      const p = pos(pac);
      if (fright > 0 || Math.random() < .12) d = pick(ch);
      else {
        let tx = pac.tx, ty = pac.ty;
        if (g.i === 1) { tx += pac.last[0] * 4; ty += pac.last[1] * 4; }
        else if (g.i === 2 && Math.hypot(g.tx - pac.tx, g.ty - pac.ty) < 7) { tx = 1; ty = 19; }
        else if (g.i === 3 && Math.hypot(g.tx - pac.tx, g.ty - pac.ty) < 6) { tx = 17; ty = 19; }
        d = ch.map(c => ({ c, s: Math.hypot(wrapX(g.tx + c[0]) - tx, g.ty + c[1] - ty) })).sort((q, r) => q.s - r.s)[0].c;
      }
      g.dx = d[0]; g.dy = d[1];
    }
    function turn(dx, dy) {
      pac.want = [dx, dy];
      if (pac.t > 0 && pac.dx === -dx && pac.dy === -dy && (dx || dy)) {
        pac.tx = wrapX(pac.tx + pac.dx); pac.ty += pac.dy; pac.dx = dx; pac.dy = dy; pac.t = 1 - pac.t; pac.last = [dx, dy];
      }
    }
    function die() {
      lives--; a.info(lives); a.beep(200, .6, 'sawtooth', .06, -160);
      if (lives <= 0) { a.over(); return; }
      resetPos();
    }
    return {
      reset() {
        lives = 3; level = 0; t = 0; fillDots(); floors = [];
        MAZE.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '#') floors.push([x, y]); }));
        resetPos(); a.set(0); a.info(lives);
      },
      cheat(c, on) {
        if (c === 'LIVES') { lives += 3; a.info(lives); }
        if (c === 'WARP') { const far = floors.filter(([x, y]) => Math.hypot(x - pac.tx, y - pac.ty) > 8 && !house(x, y)); const [x, y] = pick(far); Object.assign(pac, { tx: x, ty: y, t: 0, dx: 0, dy: 0 }); }
        if (c === 'POWER' && !on) fright = 0;
      },
      key(c) { const d = DIRS[c]; if (d) turn(d[0], d[1]); },
      pointer(type, x, y) {
        if (type === 'down') touch0 = { x, y };
        else if (type === 'up' && touch0) { const dx = x - touch0.x, dy = y - touch0.y; if (Math.hypot(dx, dy) > 20) Math.abs(dx) > Math.abs(dy) ? turn(Math.sign(dx), 0) : turn(0, Math.sign(dy)); touch0 = null; }
      },
      update(dt) {
        t += dt;
        if (pause > 0) { pause -= dt; return; }
        if (C('POWER')) fright = 9; else if (fright > 0) fright -= dt;
        advance(pac, 5 * (C('SPEED') ? 1.6 : 1) * dt, pacChoose);
        const pp = pos(pac), cx = Math.round(pp.x), cy = Math.round(pp.y);
        eat(wrapX(cx), cy);
        if (C('MAGNET')) for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (Math.hypot(x, y) <= 2.5) eat(wrapX(cx + x), cy + y);
        if (left <= 0) { level++; fillDots(); resetPos(); a.beep(880, .4, 'square', .05, 400); return; }
        if (C('NOGHOST')) return;
        for (const g of ghosts) {
          if (g.wait > 0) g.wait -= dt;
          if (!C('FREEZEG')) advance(g, (fright > 0 ? 2.6 : 4.1 + level * .25) * (C('SLOWGHOST') ? .5 : 1) * dt, ghostChoose);
          const gp = pos(g);
          if (Math.hypot(gp.x - pp.x, gp.y - pp.y) < .7) {
            if (fright > 0) { chain++; a.add(200 * Math.pow(2, chain - 1) * (C('X3') ? 3 : 1)); Object.assign(g, { tx: 9, ty: 9, dx: 0, dy: 0, t: 0, inHouse: true, wait: 2.5 }); a.beep(900, .2, 'square', .05, 500); }
            else if (!C('GOD')) { die(); return; }
          }
        }
      },
      draw() {
        const ctx = a.ctx;
        ctx.fillStyle = '#02020c'; ctx.fillRect(0, 0, W, H);
        // Wände
        ctx.strokeStyle = '#3a5bff'; ctx.lineWidth = 3; ctx.shadowColor = '#3a5bff'; ctx.shadowBlur = 10; ctx.lineCap = 'round'; ctx.beginPath();
        for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
          if (!wall(x, y)) continue; const px = OX + x * TS, py = OY + y * TS;
          if (!wall(x, y - 1) && y > 0) { ctx.moveTo(px + 3, py + 3); ctx.lineTo(px + TS - 3, py + 3); }
          if (!wall(x, y + 1) && y < MH - 1) { ctx.moveTo(px + 3, py + TS - 3); ctx.lineTo(px + TS - 3, py + TS - 3); }
          if (x > 0 && !wall(x - 1, y)) { ctx.moveTo(px + 3, py + 3); ctx.lineTo(px + 3, py + TS - 3); }
          if (x < MW - 1 && !wall(x + 1, y)) { ctx.moveTo(px + TS - 3, py + 3); ctx.lineTo(px + TS - 3, py + TS - 3); }
        }
        ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ff9ff3'; ctx.beginPath(); ctx.moveTo(OX + 8 * TS + 2, OY + 8 * TS + 11); ctx.lineTo(OX + 11 * TS - 2, OY + 8 * TS + 11); ctx.stroke();
        // Punkte
        for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
          const v = dots[y][x]; if (!v) continue;
          ctx.fillStyle = '#ffd9a8';
          if (v === 1) ctx.fillRect(OX + x * TS + TS / 2 - 2, OY + y * TS + TS / 2 - 2, 4, 4);
          else if (Math.floor(t * 4) % 2) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(OX + x * TS + TS / 2, OY + y * TS + TS / 2, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        }
        // Pac-Man
        const pp = pos(pac), px = OX + (pp.x + .5) * TS, py = OY + (pp.y + .5) * TS;
        const moving = pac.dx || pac.dy, mouth = moving ? Math.abs(Math.sin(t * 14)) * .8 : .1;
        const ang = Math.atan2(pac.last[1], pac.last[0]);
        ctx.fillStyle = '#f9f002'; ctx.shadowColor = '#f9f002'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, TS / 2 - 1, ang + mouth, ang + Math.PI * 2 - mouth); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        // Geister
        if (!C('NOGHOST')) for (const g of ghosts) {
          const gp = pos(g), gx = OX + (gp.x + .5) * TS, gy = OY + (gp.y + .5) * TS, r = TS / 2 - 1;
          const scared = fright > 0, blink = scared && fright < 2 && Math.floor(t * 8) % 2;
          const col = scared ? (blink ? '#fff' : '#2a3cff') : GCOL[g.i];
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(gx, gy - 1, r, Math.PI, 0); ctx.lineTo(gx + r, gy + r);
          const w = Math.floor(t * 8) % 2;
          for (let k = 0; k < 4; k++) ctx.lineTo(gx + r - (k + .5) * r / 2, gy + r - (k % 2 ^ w ? 4 : 0));
          ctx.lineTo(gx - r, gy + r); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff';
          if (scared) { ctx.fillRect(gx - 5, gy - 4, 3, 3); ctx.fillRect(gx + 2, gy - 4, 3, 3); }
          else {
            ctx.beginPath(); ctx.arc(gx - 4, gy - 3, 3.2, 0, 7); ctx.arc(gx + 4, gy - 3, 3.2, 0, 7); ctx.fill();
            ctx.fillStyle = '#00f'; ctx.fillRect(gx - 4 + g.dx * 1.6, gy - 4 + g.dy * 1.6, 2, 2); ctx.fillRect(gx + 4 + g.dx * 1.6, gy - 4 + g.dy * 1.6, 2, 2);
          }
        }
        if (pause > 0) { ctx.fillStyle = '#f9f002'; ctx.font = PX(10); ctx.textAlign = 'center'; ctx.fillText('READY!', W / 2, OY + 11.5 * TS); ctx.textAlign = 'start'; }
        ctx.fillStyle = '#9a8fd8'; ctx.font = PX(8); ctx.fillText('LV ' + (level + 1), 8, 16);
      }
    };
  }
};
