G.mines = {
  name: 'MINESWEEPER', icon: '💣', color: '#8a9bff',
  ctl: 'Linksklick = Aufdecken · Rechtsklick / langes Tippen = Flagge · Klick auf Zahl = Umgebung öffnen',
  longpress: true,
  cheats: [
    { id: 'XRAY', n: 'Röntgen-Cursor', d: 'Zeigt unter dem Mauszeiger Mine oder sicher' },
    { id: 'REVEAL', n: 'Minen zeigen', d: 'Alle Minen schimmern durch' },
    { id: 'HINT', n: 'Tipp', d: 'Deckt ein sicheres Feld auf', once: true },
    { id: 'FLAGALL', n: 'Alle markieren', d: 'Setzt Flaggen auf alle Minen', once: true },
    { id: 'NOEXPLODE', n: 'Minenfest', d: 'Minen explodieren nicht, sondern werden markiert' },
    { id: 'FREEZE', n: 'Zeit anhalten', d: 'Die Uhr steht still' },
    { id: 'SOLVE', n: 'Sofort-Sieg', d: 'Löst das ganze Feld', once: true },
    { id: 'FEWMINES', n: 'Wenige Minen', d: 'Nur 12 statt 40 Minen (Neustart)' },
    { id: 'OPENZERO', n: 'Aufräumen', d: 'Deckt alle leeren Bereiche auf', once: true },
    { id: 'X2', n: '2× Punkte', d: 'Aufgedeckte Felder und Bonus doppelt' }
  ],
  make(a) {
    const { C } = a; const COLS = 16, ROWS = 12, CS = 32, OX = (W - COLS * CS) / 2, OY = 70;
    const NC = ['', '#4d7cff', '#39ff14', '#ff2a6d', '#b026ff', '#ff9f1c', '#05d9e8', '#fff', '#999'];
    let g, placed, revealed, flags, time, started, done, t, hov, mines;
    const inb = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS;
    const nbrs = (x, y) => { const r = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && inb(x + i, y + j)) r.push(g[y + j][x + i]); return r; };
    function empty() { g = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => ({ x, y, mine: false, open: false, flag: false, n: 0, boom: false }))); }
    function place(sx, sy) {
      const cells = shuffle(g.flat().filter(c => Math.abs(c.x - sx) > 1 || Math.abs(c.y - sy) > 1));
      cells.slice(0, mines).forEach(c => c.mine = true);
      g.flat().forEach(c => c.n = nbrs(c.x, c.y).filter(m => m.mine).length);
      placed = true;
    }
    function score() { a.set(revealed * 5 * (C('X2') ? 2 : 1)); }
    function open(c) {
      if (c.open || c.flag) return;
      const st = [c];
      while (st.length) {
        const k = st.pop(); if (k.open || k.flag) continue;
        k.open = true; if (!k.mine) revealed++;
        if (k.n === 0 && !k.mine) nbrs(k.x, k.y).forEach(m => { if (!m.open && !m.mine) st.push(m); });
      }
      score();
    }
    function win() {
      done = true; a.add(Math.max(0, 1000 - Math.floor(time) * 4) * (C('X2') ? 2 : 1)); a.beep(880, .5, 'square', .05, 500);
      g.flat().forEach(c => { if (c.mine) c.flag = true; }); setTimeout(() => a.over('GESCHAFFT!'), 400);
    }
    function check() { if (!done && revealed >= COLS * ROWS - mines) win(); }
    function lose(c) {
      done = true; c.boom = true; g.flat().forEach(k => { if (k.mine && !k.flag) k.open = true; });
      a.beep(90, .6, 'sawtooth', .07, -60); setTimeout(() => a.over('BOOM!'), 600);
    }
    function reveal(c) {
      if (done || c.flag) return;
      if (!placed) { place(c.x, c.y); started = true; }
      if (c.open) { // Chording
        if (c.n && nbrs(c.x, c.y).filter(m => m.flag).length === c.n) for (const m of nbrs(c.x, c.y)) if (!m.flag && !m.open) reveal(m);
        return;
      }
      if (c.mine) {
        if (C('NOEXPLODE')) { c.flag = true; a.beep(200, .1, 'sawtooth'); return; }
        lose(c); return;
      }
      open(c); a.beep(400 + Math.min(c.n, 6) * 60, .04); check();
    }
    function flag(c) { if (done || c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; a.beep(c.flag ? 700 : 400, .05); }
    return {
      autostart: true, longpress: true,
      reset() { mines = C('FEWMINES') ? 12 : 40; empty(); placed = false; revealed = 0; flags = 0; time = 0; started = false; done = false; t = 0; hov = null; a.set(0); a.info(null); },
      cheat(c, on) {
        if (c === 'FEWMINES') { a.set(0); mines = C('FEWMINES') ? 12 : 40; empty(); placed = false; revealed = 0; flags = 0; time = 0; started = false; done = false; return; }
        if (done) return;
        if (!placed) place(ri(0, COLS - 1), ri(0, ROWS - 1));
        started = true;
        if (c === 'HINT') { const s = shuffle(g.flat().filter(k => !k.mine && !k.open)); if (s[0]) { open(s[0]); check(); } }
        if (c === 'FLAGALL') g.flat().forEach(k => { if (k.mine && !k.flag) { k.flag = true; flags++; } });
        if (c === 'SOLVE') { g.flat().forEach(k => { if (!k.mine && !k.open) { k.open = true; revealed++; } }); score(); check(); }
        if (c === 'OPENZERO') { g.flat().filter(k => !k.mine && k.n === 0 && !k.open).forEach(k => open(k)); check(); }
      },
      pointer(type, x, y, btn) {
        const cx = Math.floor((x - OX) / CS), cy = Math.floor((y - OY) / CS);
        if (type === 'move') { hov = inb(cx, cy) ? g[cy][cx] : null; return; }
        if (type === 'down' && inb(cx, cy)) { btn === 2 ? flag(g[cy][cx]) : reveal(g[cy][cx]); }
      },
      key() {},
      update(dt) { t += dt; if (started && !done && !C('FREEZE')) time += dt; },
      draw() {
        const ctx = a.ctx;
        ctx.fillStyle = '#07071a'; ctx.fillRect(0, 0, W, H);
        ctx.font = PX(11); ctx.textAlign = 'left'; ctx.fillStyle = '#ff2a6d'; ctx.fillText('💣 ' + (mines - flags), 40, 46);
        ctx.textAlign = 'right'; ctx.fillStyle = '#8a9bff'; ctx.fillText('⏱ ' + Math.floor(time), W - 40, 46); ctx.textAlign = 'center';
        ctx.fillStyle = '#9a8fd8'; ctx.font = PX(8); ctx.fillText(C('FEWMINES') ? '12 MINEN' : '40 MINEN', W / 2, 44);
        ctx.textBaseline = 'middle';
        for (const row of g) for (const c of row) {
          const x = OX + c.x * CS, y = OY + c.y * CS;
          if (c.open) {
            ctx.fillStyle = c.boom ? '#ff2a6d' : '#10102e'; ctx.fillRect(x, y, CS - 1, CS - 1);
            if (c.mine) { ctx.font = '20px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.fillText('💣', x + CS / 2, y + CS / 2 + 1); }
            else if (c.n) { ctx.font = PX(14); ctx.fillStyle = NC[c.n]; ctx.shadowColor = NC[c.n]; ctx.shadowBlur = 8; ctx.fillText(c.n, x + CS / 2, y + CS / 2 + 1); ctx.shadowBlur = 0; }
          } else {
            const g2 = ctx.createLinearGradient(x, y, x, y + CS);
            g2.addColorStop(0, hov === c ? '#5b6bd8' : '#3d4a9e'); g2.addColorStop(1, '#232b6b');
            ctx.fillStyle = g2; ctx.fillRect(x, y, CS - 1, CS - 1);
            ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x, y, CS - 1, 2); ctx.fillRect(x, y, 2, CS - 1);
            if (c.flag) { ctx.font = '18px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.fillText('🚩', x + CS / 2, y + CS / 2 + 1); }
            else if (C('REVEAL') && c.mine && placed) { ctx.fillStyle = 'rgba(255,42,109,.55)'; ctx.beginPath(); ctx.arc(x + CS / 2, y + CS / 2, 6, 0, 7); ctx.fill(); }
            if (C('XRAY') && hov === c && placed) { ctx.fillStyle = c.mine ? 'rgba(255,42,109,.85)' : 'rgba(57,255,20,.55)'; ctx.fillRect(x, y, CS - 1, CS - 1); }
          }
        }
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
        if (C('XRAY') && hov && !placed) { ctx.fillStyle = '#39ff14'; ctx.font = PX(7); ctx.textAlign = 'center'; ctx.fillText('ERSTER KLICK IST IMMER SICHER', W / 2, H - 14); ctx.textAlign = 'start'; }
      }
    };
  }
};
