G.dino = {
  name: 'T-REX RUN', icon: '🦖', color: '#05d9e8',
  ctl: 'LEERTASTE / ↑ / TIPPEN = Springen · ↓ = Ducken',
  cheats: [
    { id: 'GOD', n: 'Unsterblich', d: 'Hindernisse können dir nichts anhaben' },
    { id: 'FLY', n: 'Luftsprung', d: 'Unendlich oft mitten in der Luft springen' },
    { id: 'SLOW', n: 'Zeitlupe', d: 'Das Spiel läuft nur halb so schnell' },
    { id: 'MOON', n: 'Mond-Gravitation', d: 'Riesige, sanfte Sprünge' },
    { id: 'GIANT', n: 'Riesen-Dino', d: 'Dein Dino ist 1,7× größer' },
    { id: 'TINY', n: 'Mini-Dino', d: 'Winzig und schwer zu treffen' },
    { id: 'AUTO', n: 'Autopilot', d: 'Der Dino spielt von selbst' },
    { id: 'X5', n: '5× Punkte', d: 'Jeder Punkt zählt fünffach' },
    { id: 'NOBIRD', n: 'Keine Vögel', d: 'Die Pterodaktylen sind ausgestorben' },
    { id: 'RAINBOW', n: 'Regenbogen', d: 'Alles leuchtet in Farbe' }
  ],
  make(a) {
    const { keys, C } = a; const GY = 400;
    let d, obs, spd, dist, gap, t, stars, duckNow;
    const scale = () => C('GIANT') ? 1.7 : C('TINY') ? .6 : 1;
    function jump() {
      if (d.y >= GY - .5 || C('FLY')) { d.vy = C('MOON') ? -560 : -680; a.beep(560, .12, 'square', .04, 380); }
    }
    return {
      reset() {
        d = { x: 90, y: GY, vy: 0 }; obs = []; spd = 290; dist = 0; gap = 420; t = 0; duckNow = false;
        stars = Array.from({ length: 40 }, () => ({ x: rand(0, W), y: rand(0, 260), r: rand(.5, 1.6) }));
        a.set(0);
      },
      key(c) { if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW' || c === 'Tap') jump(); },
      update(dt) {
        if (C('SLOW')) dt *= .5;
        t += dt; spd = Math.min(660, spd + dt * 7); dist += spd * dt;
        const s = scale(), w = 44 * s, ground = d.y >= GY - .5;
        let autoDuck = false;
        if (C('AUTO')) {
          const o = obs.find(o => o.x + o.w > d.x);
          if (o) {
            const g = o.x - (d.x + w);
            if (g < spd * .26 && g > -20) {
              if (o.bird && o.duck) autoDuck = true;
              else if (ground) jump();
            }
          }
        }
        duckNow = ground && (keys.ArrowDown || keys.KeyS || autoDuck);
        const h = (duckNow ? 26 : 48) * s;
        d.vy += (C('MOON') ? 950 : 2200) * dt; d.y += d.vy * dt;
        if (d.y >= GY) { d.y = GY; d.vy = 0; }
        gap -= spd * dt;
        if (gap <= 0) {
          if (!C('NOBIRD') && dist > 1600 && Math.random() < .3) {
            const duck = Math.random() < .5, lv = duck ? GY - 32 : GY - 6;
            obs.push({ x: W + 30, y: lv - 28, w: 44, h: 28, bird: true, duck });
          } else {
            const n = ri(1, 3), hh = ri(36, 66);
            obs.push({ x: W + 30, y: GY - hh, w: 16 * n + 8, h: hh, n });
          }
          gap = rand(420, 720) * (.55 + spd / 520) + (s > 1 ? 240 : 0);
        }
        obs.forEach(o => o.x -= spd * dt * (o.bird ? 1.12 : 1));
        obs = obs.filter(o => o.x > -90);
        const box = { x: d.x + 6 * s, y: d.y - h + 4, w: w - 12 * s, h: h - 6 };
        if (!C('GOD')) for (const o of obs) if (hit(box, { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 })) { a.over(); return; }
        const sc = Math.floor(dist / 12) * (C('X5') ? 5 : 1);
        if (sc !== undefined) a.set(Math.max(sc, 0));
      },
      draw() {
        const ctx = a.ctx, s = scale(), rb = C('RAINBOW');
        const g = ctx.createLinearGradient(0, 0, 0, GY);
        g.addColorStop(0, '#0a0420'); g.addColorStop(.7, '#3b0d5c'); g.addColorStop(1, '#ff2a6d');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        for (const st of stars) { ctx.globalAlpha = .4 + .4 * Math.sin(t * 2 + st.x); ctx.fillRect(st.x, st.y, st.r, st.r); }
        ctx.globalAlpha = 1;
        // Mond
        ctx.fillStyle = '#fff6c8'; ctx.shadowColor = '#fff6c8'; ctx.shadowBlur = 30;
        ctx.beginPath(); ctx.arc(520, 90, 34, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        // Berge (Parallax)
        for (let l = 0; l < 2; l++) {
          ctx.fillStyle = l ? '#1b0a3d' : '#2a1160';
          ctx.beginPath(); ctx.moveTo(0, GY);
          const off = (dist * (l ? .25 : .1)) % 320;
          for (let x = -320; x <= W + 320; x += 160) { ctx.lineTo(x - off + 80, GY - (l ? 70 : 110) - ((x / 160) % 2 ? 24 : 0)); ctx.lineTo(x - off + 160, GY); }
          ctx.fill();
        }
        // Boden
        ctx.fillStyle = '#12052e'; ctx.fillRect(0, GY, W, H - GY);
        ctx.strokeStyle = '#05d9e8'; ctx.shadowColor = '#05d9e8'; ctx.shadowBlur = 10; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, GY + 1); ctx.lineTo(W, GY + 1); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.strokeStyle = '#b026ff88'; ctx.lineWidth = 1;
        for (let x = -((dist * 1) % 60); x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, GY + 6); ctx.lineTo(x - 30, H); ctx.stroke(); }
        // Hindernisse
        for (const o of obs) {
          const col = rb ? hsl(t * 200 + o.x) : (o.bird ? '#ff2a6d' : '#39ff14');
          ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
          if (o.bird) {
            const fl = Math.floor(t * 8) % 2;
            ctx.fillRect(o.x + 6, o.y + 10, 30, 10); ctx.fillRect(o.x, o.y + 12, 8, 6); ctx.fillRect(o.x + 34, o.y + 8, 10, 8);
            ctx.fillRect(o.x + 10, fl ? o.y : o.y + 20, 16, 8);
          } else {
            const cw = 16;
            for (let i = 0; i < o.n; i++) {
              const x = o.x + i * cw + 4, hh = o.h - (i % 2) * 8;
              ctx.fillRect(x + 3, o.y + (o.h - hh), 8, hh); ctx.fillRect(x - 3, o.y + (o.h - hh) + 10, 6, 5); ctx.fillRect(x - 3, o.y + (o.h - hh) + 5, 3, 10);
              ctx.fillRect(x + 11, o.y + (o.h - hh) + 16, 6, 5); ctx.fillRect(x + 14, o.y + (o.h - hh) + 8, 3, 13);
            }
          }
          ctx.shadowBlur = 0;
        }
        // Dino
        ctx.save(); ctx.translate(d.x, d.y); ctx.scale(s, s);
        const col = rb ? hsl(t * 300) : '#05d9e8'; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
        const run = d.y >= GY - .5 ? Math.floor(dist / 30) % 2 : 0;
        if (!duckNow) {
          ctx.fillRect(0, -32, 30, 26); ctx.fillRect(18, -50, 28, 20); ctx.fillRect(-12, -28, 14, 8); ctx.fillRect(-20, -22, 10, 6);
          ctx.fillRect(28, -24, 10, 4); ctx.fillRect(38, -34, 6, 4);
          ctx.fillRect(4, -8, 8, 8 - (run ? 4 : 0)); ctx.fillRect(18, -8, 8, 8 - (run ? 0 : 4));
          ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.fillRect(34, -46, 5, 5);
        } else {
          ctx.fillRect(0, -18, 44, 14); ctx.fillRect(34, -26, 20, 14); ctx.fillRect(-12, -16, 14, 6);
          ctx.fillRect(6, -6, 8, 6 - (run ? 3 : 0)); ctx.fillRect(26, -6, 8, 6 - (run ? 0 : 3));
          ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.fillRect(46, -22, 4, 4);
        }
        ctx.restore(); ctx.shadowBlur = 0;
      }
    };
  }
};
