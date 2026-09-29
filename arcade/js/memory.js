G.memory = {
  name: 'MEMORY', icon: '🃏', color: '#ff9f1c',
  ctl: 'Klicke / tippe auf Karten und finde alle Paare – mit möglichst wenigen Zügen',
  cheats: [
    { id: 'PEEK', n: 'Spick', d: 'Deckt alle Karten für 2 Sekunden auf', once: true },
    { id: 'SOLVE1', n: 'Ein Paar lösen', d: 'Findet automatisch ein Paar', once: true },
    { id: 'SOLVEALL', n: 'Sofort-Sieg', d: 'Löst das komplette Spiel', once: true },
    { id: 'REVEAL', n: 'Röntgenblick', d: 'Alle Karten schimmern durch' },
    { id: 'HINT', n: 'Tipp-Modus', d: 'Nach der 1. Karte leuchtet die passende' },
    { id: 'FREEZE', n: 'Zeit anhalten', d: 'Die Uhr steht still' },
    { id: 'X2', n: '2× Punkte', d: 'Paare & Bonus doppelt' },
    { id: 'NOPENALTY', n: 'Keine Strafzüge', d: 'Fehlversuche zählen nicht als Zug' },
    { id: 'LONGLOOK', n: 'Lange Sicht', d: 'Falsche Paare bleiben 2 Sekunden sichtbar' },
    { id: 'BIG', n: 'Großes Feld', d: 'Sechs Spalten, 12 Paare (Neustart)' }
  ],
  make(a) {
    const { C } = a; const EM = ['🍎','🍒','🍋','🍇','🚀','👾','🎮','⭐','🎲','🔥','💎','🍕','🎸','🐙','🍩','🦄'];
    let cards, cols, rows, first, lock, moves, time, matched, t, peek, mistakes, done, hover, layout;
    function build() {
      cols = C('BIG') ? 6 : 4; rows = 4; const n = cols * rows / 2;
      const set = shuffle([...EM]).slice(0, n);
      cards = shuffle([...set, ...set]).map((e, i) => ({ e, i, up: 0, flip: 0, ok: false, glow: 0 }));
      const gap = 12, s = Math.min((W - 60 - gap * (cols - 1)) / cols, (H - 120 - gap * (rows - 1)) / rows);
      layout = { s, gap, x0: (W - (cols * s + (cols - 1) * gap)) / 2, y0: 80 };
      cards.forEach((c, i) => { c.x = layout.x0 + (i % cols) * (s + gap); c.y = layout.y0 + Math.floor(i / cols) * (s + gap); });
    }
    function score() { a.set(matched * 100 * (C('X2') ? 2 : 1)); }
    function checkWin() {
      if (matched === cards.length / 2) {
        const bonus = Math.max(0, 600 - moves * 12 - Math.floor(time) * 3) * (C('X2') ? 2 : 1);
        a.add(bonus); a.beep(880, .5, 'square', .05, 500); done = true; setTimeout(() => a.over('GESCHAFFT!'), 500);
      }
    }
    function flip(c) {
      if (done || lock || c.ok || c.up) return;
      c.up = 1; a.beep(500, .05);
      if (!first) { first = c; return; }
      if (!C('NOPENALTY')) moves++;
      const f = first; first = null;
      if (f.e === c.e) {
        setTimeout(() => { f.ok = c.ok = true; f.glow = c.glow = 1; matched++; score(); a.beep(880, .15, 'square', .05, 300); checkWin(); }, 350);
      } else {
        lock = true; mistakes++;
        setTimeout(() => { f.up = 0; c.up = 0; lock = false; a.beep(200, .12, 'sawtooth', .04); }, C('LONGLOOK') ? 2000 : 800);
      }
    }
    return {
      autostart: true,
      reset() { matched = 0; moves = 0; time = 0; t = 0; first = null; lock = false; peek = 0; mistakes = 0; done = false; hover = -1; build(); a.set(0); a.info(null); },
      cheat(c, on) {
        if (c === 'BIG') { a.set(0); matched = 0; moves = 0; time = 0; first = null; lock = false; build(); }
        if (c === 'PEEK') peek = 2;
        if (c === 'SOLVE1') {
          const f = cards.find(k => !k.ok && !k.up) || null; if (!f) return;
          if (first) { const m = cards.find(k => !k.ok && k !== first && k.e === first.e); if (m) { first.up = 1; m.up = 1; const x = first; first = null; setTimeout(() => { x.ok = m.ok = true; matched++; score(); checkWin(); }, 250); } return; }
          const m = cards.find(k => !k.ok && !k.up && k !== f && k.e === f.e); f.up = m.up = 1;
          setTimeout(() => { f.ok = m.ok = true; matched++; score(); checkWin(); }, 250);
        }
        if (c === 'SOLVEALL') { cards.forEach(k => { k.ok = true; k.up = 1; }); matched = cards.length / 2; score(); checkWin(); }
      },
      pointer(type, x, y) {
        const i = cards.findIndex(c => x >= c.x && x <= c.x + layout.s && y >= c.y && y <= c.y + layout.s);
        if (type === 'move') hover = i;
        if (type === 'down' && i >= 0) flip(cards[i]);
      },
      update(dt) {
        t += dt; if (!done && !C('FREEZE')) time += dt; if (peek > 0) peek -= dt;
        for (const c of cards) { const target = (c.up || c.ok || peek > 0) ? 1 : 0; c.flip += clamp(target - c.flip, -dt * 6, dt * 6); if (c.glow > 0) c.glow -= dt; }
      },
      draw() {
        const ctx = a.ctx, s = layout.s;
        ctx.fillStyle = '#140a02'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff9f1c'; ctx.font = PX(11); ctx.textAlign = 'left'; ctx.fillText('ZÜGE ' + moves, 30, 40);
        ctx.textAlign = 'center'; ctx.fillText('PAARE ' + matched + '/' + cards.length / 2, W / 2, 40);
        ctx.textAlign = 'right'; ctx.fillText('ZEIT ' + Math.floor(time) + 's', W - 30, 40); ctx.textAlign = 'center';
        let hintE = null; if (C('HINT') && first) hintE = first.e;
        for (const c of cards) {
          const cx = c.x + s / 2, cy = c.y + s / 2, sx = Math.abs(Math.cos(c.flip * Math.PI)) || .02;
          ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, 1);
          const face = c.flip > .5;
          const isHover = hover >= 0 && cards[hover] === c && !c.ok && !c.up;
          ctx.shadowColor = c.ok ? '#39ff14' : '#ff9f1c'; ctx.shadowBlur = c.ok ? 16 : (isHover ? 18 : 6);
          ctx.fillStyle = face ? (c.ok ? '#0e2a14' : '#2a1a05') : '#3d1466';
          ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, 12); ctx.fill(); ctx.shadowBlur = 0;
          ctx.strokeStyle = face ? (c.ok ? '#39ff14' : '#ff9f1c') : '#b026ff'; ctx.lineWidth = 3; ctx.stroke();
          if (face) { ctx.font = `${s * .55}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(c.e, 0, 3); }
          else {
            ctx.fillStyle = '#b026ff'; ctx.font = PX(s * .3); ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 2);
            if (C('REVEAL')) { ctx.globalAlpha = .28; ctx.font = `${s * .45}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`; ctx.fillText(c.e, 0, 3); ctx.globalAlpha = 1; }
          }
          if (hintE && !c.up && !c.ok && c.e === hintE) { ctx.strokeStyle = '#f9f002'; ctx.lineWidth = 4; ctx.shadowColor = '#f9f002'; ctx.shadowBlur = 14 + 6 * Math.sin(t * 8); ctx.stroke(); }
          ctx.restore();
        }
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      }
    };
  }
};
