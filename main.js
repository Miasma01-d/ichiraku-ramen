/* ═══════════════════════════════════════════════════════════
   ICHIRAKU RAMEN — Complete Site
   ═══════════════════════════════════════════════════════════ */

const ALLEY_COUNT = 59;
const BOWL_COUNT = 59;

const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const window4 = (p, a, b, c, d) =>
  p < a || p > d ? 0 : p < b ? (p - a) / (b - a) : p > c ? 1 - (p - c) / (d - c) : 1;
const pad3 = n => String(n).padStart(3, '0');

/* ───────────────────────── preload ───────────────────────── */
const alleyFrames = [];
const bowlFrames = [];
let loaded = 0;
const total = ALLEY_COUNT + BOWL_COUNT;

const loaderEl  = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const loaderPct  = document.getElementById('loaderPct');

function load(src, bucket, index) {
  return new Promise(res => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = img.onerror = () => {
      bucket[index] = img;
      loaded++;
      const pct = loaded / total;
      loaderFill.style.width = (pct * 100).toFixed(1) + '%';
      loaderPct.textContent = String(Math.round(pct * 100)).padStart(2, '0');
      res();
    };
    img.src = src;
  });
}

const jobs = [];
for (let i = 1; i <= ALLEY_COUNT; i++) {
  jobs.push(load(`frames/alley/ezgif-frame-${pad3(i)}.jpg`, alleyFrames, i - 1));
}
for (let i = 1; i <= BOWL_COUNT; i++) {
  jobs.push(load(`frames/bowl/ezgif-frame-${pad3(i)}.jpg`, bowlFrames, i - 1));
}

Promise.all(jobs).then(() => {
  setTimeout(() => {
    loaderEl.classList.add('done');
    document.body.classList.add('ready');
    resizeAll();
    setTimeout(() => { loaderEl.style.display = 'none'; }, 1100);
  }, 420);
});

/* ─────────────────── canvas helpers ─────────────────── */
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(canvas.offsetWidth  * dpr);
  const h = Math.round(canvas.offsetHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
  return canvas.getContext('2d');
}

function syncSize(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(canvas.offsetWidth * dpr);
  const h = Math.round(canvas.offsetHeight * dpr);
  return canvas.width !== w || canvas.height !== h;
}

function drawCover(ctx, img, cw, ch, maxUp = 2.0) {
  if (!img || !img.naturalWidth) return false;
  const ir = img.naturalWidth / img.naturalHeight;
  let w = cw, h = cw / ir;
  if (h < ch) {
    const s = Math.min(ch / h, maxUp);
    w *= s; h *= s;
  }
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  return true;
}

/* ═══════════════════ ACT I — ALLEY ═══════════════════ */
const alleySection = document.getElementById('alley');
const mainCanvas   = document.getElementById('mainCanvas');
const scrubGlow    = document.getElementById('scrubGlow');
const titleblock   = document.getElementById('titleblock');
const phases       = [...document.querySelectorAll('.phase')];
let mainCtx = fitCanvas(mainCanvas);

let alleyTarget = 0, alleyShown = 0, alleyLast = -1;
let alleyProgress = 0;

function readAlley() {
  const rect = alleySection.getBoundingClientRect();
  const dist = alleySection.offsetHeight - window.innerHeight;
  alleyProgress = clamp(-rect.top / (dist || 1));
  alleyTarget = alleyProgress * (ALLEY_COUNT - 1);
}

const PHASE_WINDOWS = [
  [0.13, 0.17, 0.21, 0.25],
  [0.27, 0.31, 0.37, 0.42],
  [0.45, 0.49, 0.63, 0.69],
  [0.74, 0.79, 0.97, 1.01],
];

function paintAlleyOverlays(p) {
  phases.forEach((el, i) => {
    const o = window4(p, ...PHASE_WINDOWS[i]);
    el.style.opacity = o.toFixed(3);
    el.style.setProperty('--y', `${((1 - o) * 34).toFixed(1)}px`);
    el.style.filter = `blur(${((1 - o) * 7).toFixed(2)}px)`;
  });

  const t = window4(p, -0.10, -0.05, 0.07, 0.13);
  titleblock.style.opacity = t.toFixed(3);
  titleblock.style.transform = `translateX(-50%) translateY(${((1 - t) * 40).toFixed(1)}px) scale(${(0.97 + t * 0.03).toFixed(3)})`;

  scrubGlow.style.opacity = (clamp((p - 0.32) / 0.16) * 0.7).toFixed(3);
}

/* ═══════════════════ ACT II — BOWL ═══════════════════ */
const bowlSection = document.getElementById('bowl');
const bowlCanvas  = document.getElementById('bowlCanvas');
const bowlFrameLabel = document.getElementById('bowlFrame');
let bowlCtx = fitCanvas(bowlCanvas);

let bowlTarget = 0, bowlShown = 0, bowlLast = -1;
let bowlProgress = 0;

function readBowl() {
  const rect = bowlSection.getBoundingClientRect();
  const dist = bowlSection.offsetHeight - window.innerHeight;
  bowlProgress = clamp(-rect.top / (dist || 1));
  bowlTarget = bowlProgress * (BOWL_COUNT - 1);
}

/* ═════════════════ STEAM ═════════════════ */
const steamCanvas = document.getElementById('steamCanvas');
let steamCtx = fitCanvas(steamCanvas);
const steamParticles = [];

function seedSteam() {
  steamParticles.length = 0;
  const n = Math.max(20, Math.round(window.innerWidth / 40));
  for (let i = 0; i < n; i++) {
    steamParticles.push({
      x: Math.random(),
      y: Math.random(),
      s: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.01,
      vy: 0.002 + Math.random() * 0.006,
      sway: Math.random() * Math.PI * 2,
      a: 0.1 + Math.random() * 0.3,
    });
  }
}
seedSteam();

function paintSteam(t) {
  const w = steamCanvas.width, h = steamCanvas.height;
  steamCtx.clearRect(0, 0, w, h);

  for (const p of steamParticles) {
    p.y -= p.vy;
    p.x += p.vx + Math.sin(p.sway + t) * 0.002;
    p.sway += 0.02;

    if (p.y < -0.1) {
      p.y = 1.1;
      p.x = Math.random();
    }
    if (p.x < -0.1) p.x = 1.1;
    if (p.x > 1.1) p.x = -0.1;

    const x = p.x * w + Math.sin(p.sway + t * 0.5) * 15;
    const y = p.y * h;
    const r = 15 * p.s * (w / 1280 + 0.5);

    const g = steamCtx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(232,228,220,${p.a * 0.25})`);
    g.addColorStop(0.5, `rgba(232,228,220,${p.a * 0.08})`);
    g.addColorStop(1, 'rgba(232,228,220,0)');

    steamCtx.fillStyle = g;
    steamCtx.beginPath();
    steamCtx.arc(x, y, r, 0, Math.PI * 2);
    steamCtx.fill();
  }
}

/* ═════════════════════ custom cursor ═════════════════════ */
const cursorEl = document.getElementById('cursor');
let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
let cx = cursorX, cy = cursorY;

document.querySelectorAll('a, .ingredient-card').forEach(el => {
  el.addEventListener('pointerenter', () => cursorEl.classList.add('hot'));
  el.addEventListener('pointerleave', () => cursorEl.classList.remove('hot'));
});

window.addEventListener('pointermove', e => {
  cursorX = e.clientX;
  cursorY = e.clientY;
}, { passive: true });

/* ═════════════════════ scroll chrome ═════════════════════ */
const hint = document.getElementById('hint');
const railScroll = document.getElementById('railScroll');
let lastScrollY = window.scrollY;

function readScroll() {
  const y = window.scrollY;
  lastScrollY = y;

  const doc = document.documentElement.scrollHeight - window.innerHeight;
  const pct = Math.round((y / (doc || 1)) * 100);
  railScroll.textContent = `SCROLL ${String(pct).padStart(3, '0')}%`;
  hint.classList.toggle('hide', y > window.innerHeight * 0.4);
}

/* ═════════════════════ resize ═════════════════════ */
function resizeAll() {
  mainCtx = fitCanvas(mainCanvas);
  bowlCtx = fitCanvas(bowlCanvas);
  steamCtx = fitCanvas(steamCanvas);
  alleyLast = -1;
  bowlLast = -1;
  seedSteam();
}
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resizeAll, 140); });

/* ═════════════════════ main loop ═════════════════════ */
function tick() {
  readScroll();
  readAlley();
  readBowl();

  if (syncSize(mainCanvas) || syncSize(bowlCanvas) || syncSize(steamCanvas)) resizeAll();

  // Steam
  paintSteam(performance.now() / 1000);

  // Alley scrub
  alleyShown = lerp(alleyShown, alleyTarget, 0.14);
  const alleyIdx = Math.round(clamp(alleyShown, 0, ALLEY_COUNT - 1));
  if (alleyIdx !== alleyLast) {
    const w = mainCanvas.width, h = mainCanvas.height;
    mainCtx.clearRect(0, 0, w, h);
    if (drawCover(mainCtx, alleyFrames[alleyIdx], w, h)) alleyLast = alleyIdx;
  }
  paintAlleyOverlays(alleyProgress);

  // Bowl scrub
  bowlShown = lerp(bowlShown, bowlTarget, 0.14);
  const bowlIdx = Math.round(clamp(bowlShown, 0, BOWL_COUNT - 1));
  if (bowlIdx !== bowlLast) {
    const w = bowlCanvas.width, h = bowlCanvas.height;
    bowlCtx.clearRect(0, 0, w, h);
    if (drawCover(bowlCtx, bowlFrames[bowlIdx], w, h, 1.5)) {
      bowlLast = bowlIdx;
      bowlFrameLabel.textContent = `FRAME ${pad3(bowlIdx + 1)} / ${pad3(BOWL_COUNT)}`;
    }
  }

  // Cursor
  cx = lerp(cx, cursorX, 0.2);
  cy = lerp(cy, cursorY, 0.2);
  cursorEl.style.transform = `translate(${cx}px, ${cy}px)`;

  requestAnimationFrame(tick);
}

/* ═════════════════════ INGREDIENT DATA ═════════════════════ */
const ingredientData = {
  noodles: {
    jp: '麺',
    ro: 'NOODLES',
    num: '01 / 08',
    img: 'frames/ingredients/noodles.jpg',
    desc: 'Hand-pulled wheat noodles with the perfect spring and chew. The backbone of every bowl — a foundation built on technique, not luck.',
    fact: 'Traditional ramen noodles use kansui (alkaline water) that gives them their signature yellow color and springy texture.'
  },
  broth: {
    jp: '出汁',
    ro: 'BROTH',
    num: '02 / 08',
    img: 'frames/ingredients/broth.jpg',
    desc: 'Eighteen hours of pork bone, fire, and patience. The soul of the bowl — rich, creamy, and impossibly deep.',
    fact: 'Tonkotsu broth is boiled for so long that the collagen breaks down, creating that milky, opaque appearance.'
  },
  chashu: {
    jp: '叉焼',
    ro: 'CHASHU',
    num: '03 / 08',
    img: 'frames/ingredients/chashu.jpg',
    desc: 'Slow-braised pork belly, caramelized at the edges and meltingly tender within. A secret told in layers.',
    fact: 'Chashu is traditionally rolled into a cylinder, braised, then sliced into the perfect rounds you see in your bowl.'
  },
  egg: {
    jp: '味玉',
    ro: 'SEASONED EGG',
    num: '04 / 08',
    img: 'frames/ingredients/egg.jpg',
    desc: 'A six-minute egg with a jammy golden yolk that runs like liquid sunlight. Marinated in soy and mirin.',
    fact: 'The perfect ramen egg is cooked for exactly 6 minutes and 30 seconds, then shocked in ice water to stop the cooking.'
  },
  narutomaki: {
    jp: '鳴門巻',
    ro: 'NARUTOMAKI',
    num: '05 / 08',
    img: 'frames/ingredients/narutomaki.jpg',
    desc: 'The iconic white fish cake with the pink spiral — a nod to the boy who never gave up on his dream.',
    fact: 'Narutomaki is named after the Naruto whirlpools in Japan, which is also where the character Naruto gets his name.'
  },
  onions: {
    jp: '葱',
    ro: 'GREEN ONIONS',
    num: '06 / 08',
    img: 'frames/ingredients/onions.jpg',
    desc: 'Sharp, fresh, and bright. These cut through the richness of the broth like truth cuts through illusion.',
    fact: 'In Japanese ramen shops, green onions are often sliced so thin they curl into delicate rings.'
  },
  bamboo: {
    jp: '麺麻',
    ro: 'BAMBOO SHOOTS',
    num: '07 / 08',
    img: 'frames/ingredients/bamboo.jpg',
    desc: 'Fermented and seasoned bamboo shoots with a satisfying crunch. Resilience in a soft world.',
    fact: 'Menma is actually the Japanese name for a Chinese preparation of bamboo shoots — it means "noodle bamboo."'
  },
  nori: {
    jp: '海苔',
    ro: 'NORI',
    num: '08 / 08',
    img: 'frames/ingredients/nori.jpg',
    desc: 'Ocean in a sheet. Crisp, briny, and full of umami — the final whisper of the sea.',
    fact: 'Nori is made from red algae that is shredded, pressed into sheets, and dried — the same process used for centuries.'
  }
};

/* ═════════════════════ SOUND ENGINE ═════════════════════ */
let audioCtx = null;

function initAudio() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function playNoise(duration, frequency, gainValue, type = 'bandpass') {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const frames = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    d[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  src.start(now);
  src.stop(now + duration);
}

function playTone(freq, duration, gainValue, type = 'sine') {
  const ctx = initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);

  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/* Sound effects for each ingredient */
const ingredientSounds = {
  noodles: () => {
    playNoise(0.4, 1800, 0.25, 'bandpass');
    playTone(600, 0.3, 0.15, 'sine');
    setTimeout(() => playNoise(0.3, 1200, 0.2, 'bandpass'), 150);
  },
  broth: () => {
    playNoise(0.8, 300, 0.3, 'lowpass');
    playTone(80, 0.6, 0.2, 'sine');
  },
  chashu: () => {
    playNoise(0.2, 3000, 0.2, 'highpass');
    setTimeout(() => playNoise(0.15, 2500, 0.15, 'highpass'), 80);
    setTimeout(() => playNoise(0.15, 2000, 0.12, 'highpass'), 160);
  },
  egg: () => {
    playTone(120, 0.2, 0.3, 'sine');
    playNoise(0.15, 200, 0.15, 'lowpass');
  },
  narutomaki: () => {
    playTone(800, 0.1, 0.2, 'sine');
    playTone(1200, 0.08, 0.15, 'sine');
  },
  onions: () => {
    playNoise(0.06, 4000, 0.25, 'highpass');
    setTimeout(() => playNoise(0.06, 3500, 0.2, 'highpass'), 100);
    setTimeout(() => playNoise(0.06, 3000, 0.18, 'highpass'), 200);
  },
  bamboo: () => {
    playNoise(0.12, 2500, 0.25, 'bandpass');
    setTimeout(() => playNoise(0.1, 2000, 0.2, 'bandpass'), 100);
    setTimeout(() => playNoise(0.08, 1500, 0.15, 'bandpass'), 200);
  },
  nori: () => {
    playNoise(0.5, 1500, 0.12, 'highpass');
  }
};

/* ═════════════════════ MODAL LOGIC ═════════════════════ */
const modal = document.getElementById('ingredientModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalImg = document.getElementById('modalImg');
const modalNum = document.getElementById('modalNum');
const modalJp = document.getElementById('modalJp');
const modalRo = document.getElementById('modalRo');
const modalDesc = document.getElementById('modalDesc');
const modalFact = document.getElementById('modalFact');

function openModal(key) {
  const data = ingredientData[key];
  if (!data) return;

  // Play sound
  if (ingredientSounds[key]) ingredientSounds[key]();

  // Fill modal
  modalImg.style.backgroundImage = `url('${data.img}')`;
  modalNum.textContent = data.num;
  modalJp.textContent = data.jp;
  modalRo.textContent = data.ro;
  modalDesc.textContent = data.desc;
  modalFact.innerHTML = `<strong>DID YOU KNOW?</strong><span>${data.fact}</span>`;

  // Open
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // prevent scroll
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* Click handlers for ingredient cards */
document.querySelectorAll('.ingredient-card').forEach(card => {
  const img = card.querySelector('.ingredient-card__img');
  const bg = img ? img.style.backgroundImage : '';
  const match = bg.match(/frames\/ingredients\/(\w+)\.jpg/);
  const key = match ? match[1] : null;

  card.addEventListener('click', () => {
    if (key) openModal(key);
  });
});

/* Modal close handlers */
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

/* Escape key closes modal */
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    closeModal();
  }
});

requestAnimationFrame(tick);