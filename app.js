// =============================================================
//  WEDDING INVITATION — main.js
//  Wishes storage: JSONBin.io (replaces localStorage)
// =============================================================

// ─────────────────────────────────────────────────────────────
//  CONFIG  (chỉ chỉnh sửa ở đây)
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  JSONBIN: {
    BIN_ID:  '69b3c6edb7ec241ddc651fa9',          // ← thay bằng Bin ID của bạn
    API_KEY: '$2a$10$CY6aJbbs.FOecFfpZJIEFuZgzTiJaYrYi4vY4VQWbdYzVtCzAM8vi',   // ← thay bằng Master/Access key
    BASE_URL: 'https://api.jsonbin.io/v3/b',
  },
  WEDDING_DATE: '2026-03-29T10:00:00',
  FIREWORKS_DURATION: 5000,
  MAX_FIREWORK_LAUNCHES: 18,
};

// ─────────────────────────────────────────────────────────────
//  JSONBIN API  —  thin wrapper, không lộ key ra ngoài DOM
// ─────────────────────────────────────────────────────────────
const WishesAPI = (() => {
  const { BIN_ID, API_KEY, BASE_URL } = CONFIG.JSONBIN;
  const endpoint = `${BASE_URL}/${BIN_ID}`;

  /** Headers dùng chung, API key không đặt trong HTML */
  function headers(withContent = false) {
    const h = { 'X-Master-Key': API_KEY, 'X-Bin-Meta': 'false' };
    if (withContent) h['Content-Type'] = 'application/json';
    return h;
  }

  async function read() {
    const res = await fetch(endpoint, { headers: headers() });
    if (!res.ok) throw new Error(`JSONBin read failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  async function write(wishes) {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(wishes),
    });
    if (!res.ok) throw new Error(`JSONBin write failed: ${res.status}`);
    return res.json();
  }

  return { read, write };
})();

// ─────────────────────────────────────────────────────────────
//  AUDIO
// ─────────────────────────────────────────────────────────────
const AudioController = (() => {
  const bgMusic  = document.getElementById('bgMusic');
  const musicBtn = document.getElementById('musicToggle');
  let playing = false;

  function toggle() {
    playing ? pause() : play();
  }

  function play() {
    bgMusic.play().then(() => {
      playing = true;
      musicBtn.classList.add('playing');
    }).catch(() => {});
  }

  function pause() {
    bgMusic.pause();
    musicBtn.classList.remove('playing');
    playing = false;
  }

  // Auto-pause khi rời tab
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  return { toggle, play, pause };
})();

// Expose cho HTML onclick
window.toggleMusic = AudioController.toggle;

// ─────────────────────────────────────────────────────────────
//  FIREWORKS ENGINE
// ─────────────────────────────────────────────────────────────
const FireworksEngine = (() => {
  const canvas = document.getElementById('fireworksCanvas');
  const ctx    = canvas.getContext('2d');

  let fireworks  = [];
  let particles  = [];
  let running    = false;
  let fadingOut  = false;
  let animId     = null;
  let launchTimer = null;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Firework {
    constructor(x, targetY) {
      this.x = x;
      this.y = canvas.height;
      this.targetY = targetY;
      this.speed   = 5 + Math.random() * 3;
      this.trail   = [];
      this.alive   = true;
      this.hue     = Math.random() * 360;
    }

    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 8) this.trail.shift();
      this.y -= this.speed;
      if (this.y <= this.targetY) {
        this.alive = false;
        this._explode();
      }
    }

    _explode() {
      const count = 25 + Math.floor(Math.random() * 10);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const vel   = 2 + Math.random() * 3;
        particles.push({
          x: this.x, y: this.y,
          vx: Math.cos(angle) * vel,
          vy: Math.sin(angle) * vel,
          alpha: 1,
          decay:   0.015 + Math.random() * 0.015,
          size:    1.5  + Math.random() * 1.5,
          gravity: 0.04,
          color: `hsl(${this.hue + Math.random() * 60 - 30},100%,${60 + Math.random() * 20}%)`,
        });
      }
    }

    draw() {
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = `hsla(${this.hue},100%,80%,0.6)`;
        ctx.lineWidth   = 2;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${this.hue},100%,85%)`;
      ctx.fill();
    }
  }

  function _launch() {
    const x       = canvas.width  * 0.15 + Math.random() * canvas.width  * 0.7;
    const targetY = canvas.height * 0.10 + Math.random() * canvas.height * 0.35;
    fireworks.push(new Firework(x, targetY));
  }

  function _animate() {
    if (!running) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = fadingOut ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    fireworks = fireworks.filter(f => f.alive);
    fireworks.forEach(f => { f.update(); f.draw(); });

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.alpha -= fadingOut ? p.decay * 3 : p.decay;

      if (p.alpha <= 0) { particles.splice(i, 1); continue; }

      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (fadingOut && fireworks.length === 0 && particles.length === 0) {
      return _stop();
    }

    animId = requestAnimationFrame(_animate);
  }

  function _stop() {
    running   = false;
    fadingOut = false;
    cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.zIndex = '-1';
    fireworks = [];
    particles = [];
  }

  function start(duration = CONFIG.FIREWORKS_DURATION) {
    running   = true;
    fadingOut = false;
    fireworks = [];
    particles = [];
    canvas.style.zIndex = '99997';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    _animate();

    // Wave launcher
    let count = 0;
    const max = CONFIG.MAX_FIREWORK_LAUNCHES;
    function wave() {
      if (count >= max || !running) return;
      const burst = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < burst && count < max; i++) { _launch(); count++; }
      launchTimer = setTimeout(wave, 250 + Math.random() * 300);
    }
    wave();

    // Begin fade-out
    setTimeout(() => {
      fadingOut = true;
      // Safety cleanup
      setTimeout(() => { if (running) _stop(); }, 3000);
    }, duration);
  }

  return { start };
})();

// ─────────────────────────────────────────────────────────────
//  ENVELOPE + GRAND REVEAL
// ─────────────────────────────────────────────────────────────
let envelopeOpened = false;

function openEnvelope() {
  if (envelopeOpened) return;
  envelopeOpened = true;

  document.getElementById('envelope').classList.add('open');

  setTimeout(() => AudioController.play(), 500);

  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('envelopeOverlay').classList.add('hidden');
    _triggerGrandReveal();
    FireworksEngine.start();
  }, 1800);
}
window.openEnvelope = openEnvelope;

function _triggerGrandReveal() {
  const gr = document.getElementById('grandReveal');
  gr.style.opacity = '1';
  gr.classList.add('active');

  _createSparkles(gr);
  _createConfetti(gr);

  setTimeout(() => {
    gr.classList.add('fadeout');
    document.body.classList.remove('no-scroll');
    window.scrollTo({ top: 0, behavior: 'instant' });
    _createPetals();
    _createParticles();
  }, 3000);

  setTimeout(() => { gr.style.display = 'none'; }, 7500);
}

function _createSparkles(container) {
  const colors = ['#FFD700','#FF69B4','#FFF','#c9a96e','#FF6347','#00CED1','#FF1493','#7CFC00'];
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    Object.assign(s.style, {
      background:         colors[Math.floor(Math.random() * colors.length)],
      left:               '50%',
      top:                '50%',
      width:              (3 + Math.random() * 5) + 'px',
      animationDelay:     (Math.random() * 1.2) + 's',
      animationDuration:  (1.5 + Math.random() * 1.5) + 's',
    });
    s.style.height = s.style.width;
    s.style.setProperty('--tx', (-250 + Math.random() * 500) + 'px');
    s.style.setProperty('--ty', (-350 + Math.random() * 500) + 'px');
    container.appendChild(s);
  }
}

function _createConfetti(container) {
  const colors = ['#FFD700','#FF69B4','#c9a96e','#e8c4c4','#FF6347','#4169E1','#FF1493','#32CD32','#FF4500','#8A2BE2'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    Object.assign(c.style, {
      background:         colors[Math.floor(Math.random() * colors.length)],
      width:              (5 + Math.random() * 8) + 'px',
      height:             (8 + Math.random() * 16) + 'px',
      borderRadius:       Math.random() > 0.5 ? '50%' : '2px',
      animationDelay:     (Math.random() * 1) + 's',
      animationDuration:  (2 + Math.random() * 2.5) + 's',
    });
    c.style.setProperty('--cx', (-400 + Math.random() * 800) + 'px');
    c.style.setProperty('--cy', (-500 + Math.random() * 300) + 'px');
    container.appendChild(c);
  }
}

// ─────────────────────────────────────────────────────────────
//  PETALS & PARTICLES
// ─────────────────────────────────────────────────────────────
function _createPetals() {
  const container = document.getElementById('petals');
  const colors = ['#f5cac3','#f7d1cd','#e8c4c4','#f2b5b5','#fce1e4','#ddb892','#e6ccb2','#f5e6e0'];
  for (let i = 0; i < 25; i++) {
    const p    = document.createElement('div');
    const size = 8 + Math.random() * 18;
    const fill = colors[Math.floor(Math.random() * colors.length)];
    p.className = 'petal';
    Object.assign(p.style, {
      left:              Math.random() * 100 + '%',
      width:             size + 'px',
      height:            size + 'px',
      animationDuration: (8 + Math.random() * 12) + 's',
      animationDelay:    (Math.random() * 15) + 's',
    });
    p.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><ellipse cx="12" cy="12" rx="10" ry="6" fill="${fill}" opacity=".7" transform="rotate(${Math.random()*360} 12 12)"/></svg>`;
    container.appendChild(p);
  }
}

function _createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    Object.assign(p.style, {
      left:              Math.random() * 100 + '%',
      width:             (2 + Math.random() * 4) + 'px',
      background:        Math.random() > 0.5 ? 'rgba(201,169,110,.4)' : 'rgba(232,196,196,.4)',
      animationDuration: (10 + Math.random() * 15) + 's',
      animationDelay:    (Math.random() * 15) + 's',
    });
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}

// ─────────────────────────────────────────────────────────────
//  SCROLL & REVEAL
// ─────────────────────────────────────────────────────────────
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('show', window.scrollY > 500);
  _revealOnScroll();
}, { passive: true });

function _revealOnScroll() {
  const threshold = window.innerHeight * 0.88;
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => {
    if (el.getBoundingClientRect().top < threshold) el.classList.add('active');
  });
}

window.scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ─────────────────────────────────────────────────────────────
//  COUNTDOWN
// ─────────────────────────────────────────────────────────────
(function initCountdown() {
  const wedding = new Date(CONFIG.WEDDING_DATE).getTime();
  const ids = ['days', 'hours', 'minutes', 'seconds'];
  const dividers = [86400000, 3600000, 60000, 1000];

  function tick() {
    const diff = wedding - Date.now();
    if (diff > 0) {
      ids.forEach((id, i) => {
        document.getElementById(id).textContent =
          String(Math.floor((diff % (dividers[i - 1] || Infinity)) / dividers[i])).padStart(2, '0');
      });
      // Fix days (không có modulo trên)
      document.getElementById('days').textContent =
        String(Math.floor(diff / 86400000)).padStart(2, '0');
    } else {
      ids.forEach(id => document.getElementById(id).textContent = '00');
    }
  }
  tick();
  setInterval(tick, 1000);
})();

// ─────────────────────────────────────────────────────────────
//  LIGHTBOX
// ─────────────────────────────────────────────────────────────
const Lightbox = (() => {
  const images = [
    'image/wedding/0105 CB HUYEN TIEN ANH PHONG_1.jpg',
    'image/wedding/0473 CB HUYEN TIEN ANH PHONG_1.jpg',
    'image/wedding/0266 CB HUYEN TIEN ANH KHUNG_1.jpg',
    'image/wedding/0245 CB HUYEN TIEN ANH KHUNG_1.jpg',
    'image/wedding/0863 CB HUYEN TIEN_1.jpg',
    'image/wedding/0775 CB HUYEN TIEN ANH KHUNG_1.jpg',
    'image/wedding/0699 CB HUYEN TIEN_1.jpg',
    'image/wedding/0742 CB HUYEN TIEN_1.jpg'
  ];
  let current = 0;

  function _render() {
    document.getElementById('lbImg').src          = images[current];
    document.getElementById('lbCounter').textContent = `${current + 1} / ${images.length}`;
  }

  function open(i) {
    current = i;
    _render();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('lb-close')) return;
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigate(dir) {
    current = (current + dir + images.length) % images.length;
    _render();
  }

  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  return { open, close, navigate };
})();

window.openLB      = Lightbox.open;
window.closeLightbox = Lightbox.close;
window.navigateLB  = Lightbox.navigate;

// ─────────────────────────────────────────────────────────────
//  GIFT TABS
// ─────────────────────────────────────────────────────────────
window.switchGiftTab = function(tab, btn) {
  document.querySelectorAll('.gift-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.gift-card').forEach(card => {
    card.classList.toggle('show', tab === 'all' || card.dataset.side === tab);
  });
};

// ─────────────────────────────────────────────────────────────
//  COPY TO CLIPBOARD
// ─────────────────────────────────────────────────────────────
window.copyText = function(text, btn) {
  const reset = () => {
    btn.textContent = 'Copy';
    btn.classList.remove('copied');
  };
  const confirm = () => {
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(reset, 2000);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(confirm).catch(() => _fallbackCopy(text, confirm));
  } else {
    _fallbackCopy(text, confirm);
  }
};

function _fallbackCopy(text, cb) {
  const ta = Object.assign(document.createElement('textarea'), {
    value: text, readOnly: true,
    style: 'position:fixed;opacity:0',
  });
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  cb();
}

// ─────────────────────────────────────────────────────────────
//  WISHES — JSONBin
// ─────────────────────────────────────────────────────────────
const WishesUI = (() => {
  // Cache đơn giản để tránh gọi API liên tục
  let _cache = null;
  let _loadingState = false;

  function _escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function _timeAgo(ts) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1)  return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ngày trước`;
    return `${Math.floor(days / 30)} tháng trước`;
  }

  function _wishCard(w) {
    const initials = w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="wish-card">
        <div class="wish-card-quote">"</div>
        <div class="wish-text">${_escapeHTML(w.message)}</div>
        <div class="wish-footer">
          <div class="wish-author">
            <div class="wish-avatar">${initials}</div>
            <div class="wish-author-info">
              <div class="name">${_escapeHTML(w.name)}</div>
              ${w.relation ? `<div style="font-size:.75rem;color:var(--text-light)">${_escapeHTML(w.relation)}</div>` : ''}
            </div>
          </div>
          <div class="wish-time">${_timeAgo(w.time)}</div>
        </div>
      </div>`;
  }

  function render(wishes) {
    const list     = document.getElementById('wishesList');
    const countEl  = document.getElementById('wishesCount');
    countEl.textContent = `${wishes.length} lời chúc`;

    list.innerHTML = wishes.length
      ? wishes.map(_wishCard).join('')
      : '<div class="no-wishes">Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc! 💕</div>';
  }

  function setLoading(on) {
    _loadingState = on;
    const btn = document.getElementById('wishSubmitBtn');
    if (!btn) return;
    btn.disabled    = on;
    btn.textContent = on ? '⏳ Đang gửi...' : '💌 Gửi Lời Chúc';
  }

  async function load() {
    try {
      const wishes = await WishesAPI.read();
      _cache = wishes;
      render(wishes);
    } catch (err) {
      console.warn('Không thể tải lời chúc:', err.message);
      render([]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (_loadingState) return;

    const name     = document.getElementById('wishName').value.trim();
    const relation = document.getElementById('wishRelation').value.trim();
    const message  = document.getElementById('wishMessage').value.trim();
    if (!name || !message) return;

    setLoading(true);
    try {
      const current = _cache ?? await WishesAPI.read();
      const updated = [{ name, relation, message, time: Date.now() }, ...current];
      await WishesAPI.write(updated);
      _cache = updated;

      // Reset form
      ['wishName', 'wishRelation', 'wishMessage'].forEach(id => {
        document.getElementById(id).value = '';
      });

      const btn = document.getElementById('wishSubmitBtn');
      btn.textContent  = '✅ Đã gửi lời chúc!';
      btn.style.background = 'linear-gradient(135deg, #a7b5a0, #8fa888)';
      setTimeout(() => {
        btn.textContent  = '💌 Gửi Lời Chúc';
        btn.style.background = '';
        setLoading(false);
      }, 2500);

      render(updated);
      document.getElementById('wishesListWrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Gửi lời chúc thất bại:', err.message);
      alert('Không thể gửi lời chúc. Vui lòng thử lại sau.');
      setLoading(false);
    }
  }

  return { load, submit };
})();

// Bind form submit
document.getElementById('wishForm')?.addEventListener('submit', WishesUI.submit);

// Tải wishes khi khởi động
WishesUI.load();

// ─────────────────────────────────────────────────────────────
//  FOOTER HEARTS
// ─────────────────────────────────────────────────────────────
(function createFooterHearts() {
  const container = document.getElementById('footerHearts');
  if (!container) return;
  const hearts = ['💕','💗','💖','✨','💝','♥'];
  for (let i = 0; i < 12; i++) {
    const h = document.createElement('div');
    h.className = 'footer-heart';
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    Object.assign(h.style, {
      left:              (5 + Math.random() * 90) + '%',
      fontSize:          (0.6 + Math.random() * 0.8) + 'rem',
      animationDuration: (4 + Math.random() * 6) + 's',
      animationDelay:    (Math.random() * 8) + 's',
    });
    container.appendChild(h);
  }
})();