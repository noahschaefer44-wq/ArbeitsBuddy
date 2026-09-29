'use strict';
/* ===== RETRO ARCADIA – Engine ===== */
const G = {};
const ORDER = ['dino','snake','tetris','pong','invaders','pacman','memory','breakout','flappy','mines'];
const W = 640, H = 480;
const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const hsl = (h, s = 100, l = 60) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PX = n => `${n}px "Press Start 2P", monospace`;

const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let HS = store.get('ra_hs', {});
let CH = store.get('ra_cheats', {});   // CH[gameId] = ['GOD', ...]

/* ---------- Sound ---------- */
let AC = null, muted = store.get('ra_muted', false);
function beep(f = 440, d = .08, type = 'square', v = .04, slide = 0) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d);
  } catch {}
}

/* ---------- Zustand ---------- */
const canvas = () => $('#cv');
let ctx = null;
const keys = {};
const ptr = { down: false, x: 0, y: 0 };
const S = { id: null, g: null, state: 'menu', score: 0, lives: null, extra: '', tainted: false, msg: '', newHi: false };
const C = code => !!(S.id && CH[S.id] && CH[S.id].includes(code));
const activeCount = () => (S.id && CH[S.id] ? CH[S.id].length : 0);

const api = {
  get ctx() { return ctx; }, W, H, keys, C, beep, ptr,
  set(n) { S.score = Math.max(0, Math.floor(n)); hud(); },
  add(n) { S.score = Math.max(0, S.score + Math.floor(n)); hud(); },
  info(lives, extra = '') { S.lives = lives; S.extra = extra; hud(); },
  held() { return keys.Space || keys.ArrowUp || ptr.down; },
  over(msg) {
    if (S.state !== 'play') return;
    S.state = 'over'; S.msg = msg || 'GAME OVER'; S.newHi = false;
    if (!S.tainted && S.score > (HS[S.id] || 0)) { HS[S.id] = S.score; store.set('ra_hs', HS); S.newHi = true; }
    beep(220, .5, 'sawtooth', .06, -180);
    hud();
  }
};

function hud() {
  $('#score').textContent = S.score;
  $('#hi').textContent = HS[S.id] || 0;
  $('#livesBox').style.display = S.lives === null ? 'none' : '';
  $('#lives').textContent = S.lives === null ? '-' : (typeof S.lives === 'number' ? '♥'.repeat(Math.max(0, Math.min(S.lives, 8))) + (S.lives > 8 ? '+' + (S.lives - 8) : '') : S.lives);
}

/* ---------- Spiel starten / beenden ---------- */
function openGame(id) {
  const def = G[id]; if (!def) return;
  S.id = id;
  $('#menu').hidden = true; $('#view').hidden = false; document.body.classList.add('playing');
  $('#view').style.setProperty('--gc', def.color);
  $('#gtitle').textContent = def.icon + ' ' + def.name;
  $('#ctl').textContent = def.ctl;
  ctx = canvas().getContext('2d');
  S.g = def.make(api);
  S.lives = null;
  S.g.reset();
  S.tainted = activeCount() > 0;
  S.state = S.g.autostart ? 'play' : 'ready';
  hud(); refreshPanel();
  window.scrollTo(0, 0);
}
function closeGame() {
  S.state = 'menu'; S.g = null; S.id = null;
  $('#view').hidden = true; $('#menu').hidden = false; document.body.classList.remove('playing');
  document.querySelectorAll('[data-hs]').forEach(e => e.textContent = HS[e.dataset.hs] || 0);
  refreshPanel();
}
function restart() {
  if (!S.g) return;
  S.lives = null; S.score = 0;
  S.g.reset();
  S.tainted = activeCount() > 0;
  S.state = 'play'; S.msg = '';
  hud();
}
function togglePause() {
  if (S.state === 'play') S.state = 'paused';
  else if (S.state === 'paused') S.state = 'play';
}

/* ---------- Hauptschleife ---------- */
let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
  if (!S.g) return;
  if (S.state === 'play') S.g.update(dt);
  S.g.draw();
  overlay(t);
}
function overlay(t) {
  if (S.state === 'play') return;
  ctx.save();
  ctx.fillStyle = 'rgba(6,2,20,.74)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const def = G[S.id], pulse = .55 + .45 * Math.sin(t / 260);
  if (S.state === 'ready') {
    ctx.font = '64px sans-serif'; ctx.fillText(def.icon, W / 2, H / 2 - 80);
    ctx.font = PX(24); ctx.fillStyle = def.color; ctx.shadowColor = def.color; ctx.shadowBlur = 18;
    ctx.fillText(def.name, W / 2, H / 2 - 10);
    ctx.shadowBlur = 0; ctx.font = PX(12); ctx.fillStyle = `rgba(249,240,2,${pulse})`;
    ctx.fillText(def.autostart ? 'KLICK / TIPPEN ZUM START' : 'LEERTASTE / TIPPEN ZUM START', W / 2, H / 2 + 50);
    ctx.font = PX(9); ctx.fillStyle = '#9a8fd8'; ctx.fillText('P = PAUSE   R = NEUSTART', W / 2, H / 2 + 90);
  } else if (S.state === 'paused') {
    ctx.font = PX(28); ctx.fillStyle = '#05d9e8'; ctx.shadowColor = '#05d9e8'; ctx.shadowBlur = 16;
    ctx.fillText('PAUSE', W / 2, H / 2 - 10); ctx.shadowBlur = 0;
    ctx.font = PX(11); ctx.fillStyle = `rgba(249,240,2,${pulse})`; ctx.fillText('P / TIPPEN = WEITER', W / 2, H / 2 + 44);
  } else if (S.state === 'over') {
    const win = /SIEG|GEWONNEN|WIN|GESCHAFFT/i.test(S.msg);
    ctx.font = PX(26); ctx.fillStyle = win ? '#39ff14' : '#ff2a6d'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
    ctx.fillText(S.msg, W / 2, H / 2 - 70); ctx.shadowBlur = 0;
    ctx.font = PX(14); ctx.fillStyle = '#fff'; ctx.fillText('SCORE ' + S.score, W / 2, H / 2 - 16);
    ctx.font = PX(10);
    if (S.newHi) { ctx.fillStyle = '#f9f002'; ctx.fillText('★ NEUER HIGHSCORE ★', W / 2, H / 2 + 22); }
    else if (S.tainted) { ctx.fillStyle = '#b026ff'; ctx.fillText('CHEATS AKTIV – KEIN HIGHSCORE', W / 2, H / 2 + 22); }
    else { ctx.fillStyle = '#05d9e8'; ctx.fillText('HIGHSCORE ' + (HS[S.id] || 0), W / 2, H / 2 + 22); }
    ctx.font = PX(11); ctx.fillStyle = `rgba(249,240,2,${pulse})`; ctx.fillText('LEERTASTE / TIPPEN = NOCHMAL', W / 2, H / 2 + 76);
  }
  ctx.restore();
}

/* ---------- Eingabe ---------- */
const PREVENT = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
function keyDown(c, e) {
  if (!S.g) return;
  if (c === 'KeyR') { restart(); return; }
  if (c === 'KeyP') { togglePause(); return; }
  if (S.state === 'ready' && (c === 'Space' || c === 'Enter')) { S.state = 'play'; return; }
  if (S.state === 'over' && (c === 'Space' || c === 'Enter')) { restart(); return; }
  if (S.state === 'paused' && (c === 'Space' || c === 'Enter')) { S.state = 'play'; return; }
  if (S.state === 'play' && S.g.key) S.g.key(c, e);
}
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kbuf = [];
function bind() {
  window.addEventListener('keydown', e => {
    const typing = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
    if (!typing) {
      kbuf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key); if (kbuf.length > 10) kbuf.shift();
      if (kbuf.join() === KONAMI.join()) { kbuf = []; togglePanel(); return; }
      if (e.key === '`' || e.key === '^') { togglePanel(); e.preventDefault(); return; }
      if (panelOpen && unlocked && /^[0-9]$/.test(e.key)) { panelHotkey(e.key === '0' ? 9 : +e.key - 1); return; }
    }
    if (e.key === 'Escape' && panelOpen) { togglePanel(false); return; }
    if (typing) { if (e.key === 'Enter' && e.target.id === 's-pass') tryLogin(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (PREVENT.includes(e.code)) e.preventDefault();
    if (!e.repeat || ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyA', 'KeyD', 'KeyS'].includes(e.code)) {
      keys[e.code] = true; keyDown(e.code, e);
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (S.state === 'play') S.state = 'paused'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.state === 'play') S.state = 'paused'; });

  // Canvas-Zeiger
  const cv = canvas();
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
  let lpTimer = null, lpFired = false, down0 = null;
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    if (!S.g) return;
    e.preventDefault(); cv.setPointerCapture?.(e.pointerId);
    const p = pos(e); ptr.down = true; ptr.x = p.x; ptr.y = p.y;
    if (S.state === 'ready') { S.state = 'play'; return; }
    if (S.state === 'over') { restart(); return; }
    if (S.state === 'paused') { S.state = 'play'; return; }
    const g = S.g;
    if (e.pointerType === 'touch' && g.longpress) {
      lpFired = false; down0 = p;
      lpTimer = setTimeout(() => { lpFired = true; g.pointer && g.pointer('down', p.x, p.y, 2); navigator.vibrate?.(30); }, 420);
    } else {
      g.pointer && g.pointer('down', p.x, p.y, e.button === 2 ? 2 : 0);
      g.key && g.key('Tap');
    }
  });
  cv.addEventListener('pointermove', e => {
    if (!S.g) return; const p = pos(e); ptr.x = p.x; ptr.y = p.y;
    if (lpTimer && down0 && Math.hypot(p.x - down0.x, p.y - down0.y) > 14) { clearTimeout(lpTimer); lpTimer = null; }
    if (S.state === 'play' && S.g.pointer) S.g.pointer('move', p.x, p.y);
  });
  const up = e => {
    if (!S.g) return; const p = pos(e); ptr.down = false;
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; if (!lpFired && S.state === 'play') { S.g.pointer('down', p.x, p.y, 0); } }
    if (S.state === 'play' && S.g.pointer) S.g.pointer('up', p.x, p.y);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  // Touch-Buttons
  document.querySelectorAll('#touch button').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('on'); keys[k] = true; keyDown(k); });
    const off = () => { b.classList.remove('on'); keys[k] = false; };
    b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });

  $('#back').onclick = closeGame;
  $('#pause').onclick = togglePause;
  const mb = $('#mute'); const setM = () => mb.textContent = muted ? '🔇' : '🔊'; setM();
  mb.onclick = () => { muted = !muted; store.set('ra_muted', muted); setM(); };

  // Geheimzugang zusätzlich: Logo 7× klicken
  let clicks = 0, ct = null;
  $('#logo').addEventListener('click', () => { clicks++; clearTimeout(ct); ct = setTimeout(() => clicks = 0, 1500); if (clicks >= 7) { clicks = 0; togglePanel(); } });
  $('#heart').addEventListener('click', () => { clicks++; clearTimeout(ct); ct = setTimeout(() => clicks = 0, 1500); if (clicks >= 5) { clicks = 0; togglePanel(); } });
}

/* ---------- Menü ---------- */
function buildCards() {
  $('#cards').innerHTML = ORDER.map((id, i) => {
    const g = G[id];
    return `<button class="card" data-id="${id}" style="--c:${g.color};--i:${i}" aria-label="${g.name} spielen">
      <span class="num">${String(i + 1).padStart(2, '0')}</span><span class="ico">${g.icon}</span>
      <span class="nm">${g.name}</span><span class="hs">HI <b data-hs="${id}">${HS[id] || 0}</b></span><span class="go">▶ PLAY</span></button>`;
  }).join('');
  document.querySelectorAll('.card').forEach(c => {
    c.addEventListener('click', () => openGame(c.dataset.id));
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 14 + 'deg');
      c.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5)) * 14 + 'deg');
    });
    c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });
}

/* ---------- Geheimes Menü ---------- */
const PASS = 'ARCADE';
let panelOpen = false, unlocked = false, panelGame = 'dino';
try { unlocked = sessionStorage.getItem('ra_unlocked') === '1'; } catch {}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1800);
}
function togglePanel(force) {
  panelOpen = typeof force === 'boolean' ? force : !panelOpen;
  $('#secret').hidden = !panelOpen;
  if (panelOpen) {
    if (S.id) panelGame = S.id;
    refreshPanel();
    if (!unlocked) setTimeout(() => $('#s-pass').focus(), 50);
  } else if (document.activeElement) document.activeElement.blur();
}
function tryLogin() {
  const inp = $('#s-pass');
  if (inp.value.trim().toUpperCase() === PASS) {
    unlocked = true; try { sessionStorage.setItem('ra_unlocked', '1'); } catch {}
    inp.value = ''; $('#s-err').textContent = ''; refreshPanel(); beep(880, .15, 'square', .05, 400);
  } else {
    $('#s-err').textContent = 'ZUGRIFF VERWEIGERT'; inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); beep(120, .3, 'sawtooth');
  }
}
function refreshPanel() {
  $('#s-login').hidden = unlocked; $('#s-main').hidden = !unlocked;
  if (!unlocked) return;
  $('#s-chips').innerHTML = ORDER.map(id => `<button class="chip ${id === panelGame ? 'on' : ''}" data-id="${id}" title="${G[id].name}">${G[id].icon}</button>`).join('');
  const def = G[panelGame], act = CH[panelGame] || [];
  $('#s-sub').textContent = `${def.name} · ${act.length}/${def.cheats.filter(c => !c.once).length} CHEATS AKTIV` + (S.id === panelGame ? ' · LIVE' : ' · (SPIEL NICHT GESTARTET)');
  $('#s-list').innerHTML = def.cheats.map((c, i) => `<button class="cheat ${c.once ? 'once' : ''} ${act.includes(c.id) ? 'on' : ''}" data-code="${c.id}">
    <span class="k">${(i + 1) % 10}</span><span><span class="n">${c.n}</span><span class="d">${c.d}</span></span>
    <span class="sw">${c.once ? 'JETZT' : (act.includes(c.id) ? 'AN' : 'AUS')}</span></button>`).join('');
}
function panelHotkey(i) { const c = G[panelGame].cheats[i]; if (c) toggleCheat(panelGame, c.id); }
function toggleCheat(gid, code) {
  const def = G[gid].cheats.find(c => c.id === code); if (!def) return;
  const live = S.id === gid && S.g;
  if (def.once) {
    if (live && (S.state === 'play' || S.state === 'ready')) {
      if (S.state === 'ready') S.state = 'play';
      S.tainted = true; S.g.cheat && S.g.cheat(code, true); toast('★ ' + def.n.toUpperCase()); beep(700, .12, 'square', .05, 500);
    } else toast('NUR IM LAUFENDEN SPIEL');
    return;
  }
  const set = new Set(CH[gid] || []); const on = !set.has(code);
  on ? set.add(code) : set.delete(code);
  CH[gid] = [...set]; store.set('ra_cheats', CH);
  if (live) { S.tainted = true; S.g.cheat && S.g.cheat(code, on); }
  refreshPanel(); toast((on ? '✔ ' : '✘ ') + def.n.toUpperCase()); beep(on ? 660 : 330, .08, 'square', .04);
}
function bindPanel() {
  $('#s-close').onclick = () => togglePanel(false);
  $('#s-go').onclick = tryLogin;
  $('#s-chips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { panelGame = b.dataset.id; refreshPanel(); } });
  $('#s-list').addEventListener('click', e => { const b = e.target.closest('.cheat'); if (b) toggleCheat(panelGame, b.dataset.code); });
  $('#s-all').onclick = () => { CH[panelGame] = G[panelGame].cheats.filter(c => !c.once).map(c => c.id); store.set('ra_cheats', CH); if (S.id === panelGame) { S.tainted = true; CH[panelGame].forEach(c => S.g.cheat && S.g.cheat(c, true)); } refreshPanel(); toast('ALLE CHEATS AN'); };
  $('#s-none').onclick = () => { const old = CH[panelGame] || []; CH[panelGame] = []; store.set('ra_cheats', CH); if (S.id === panelGame) old.forEach(c => S.g.cheat && S.g.cheat(c, false)); refreshPanel(); toast('ALLE CHEATS AUS'); };
  $('#s-restart').onclick = () => { if (S.id === panelGame) { restart(); toast('NEUSTART'); } else toast('SPIEL NICHT GESTARTET'); };
}

function init() { buildCards(); bind(); bindPanel(); requestAnimationFrame(frame); }
