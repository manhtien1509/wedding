// ===== AUDIO =====
const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById("musicToggle");

let musicPlaying = false;

function toggleMusic() {
    if (musicPlaying) {
        bgMusic.pause();
        musicBtn.classList.remove('playing');
        musicPlaying = false;
    } else {
        bgMusic.play().catch(()=>{});
        musicBtn.classList.add("playing");
        musicPlaying = true;
    }
    musicPlaying = !musicPlaying;
}

// ===== AUTO PAUSE WHEN USER LEAVES PAGE =====
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        bgMusic.pause();
        musicBtn.classList.remove("playing");
        musicPlaying = false;
    }
});

// ===== FIREWORKS ENGINE (Optimized + Smooth ending) =====
const fwCanvas = document.getElementById('fireworksCanvas');
const fwCtx = fwCanvas.getContext('2d');
let fireworks = [];
let fwParticles = [];
let fwRunning = false;
let fwAnimId = null;
let fwFadingOut = false;

function resizeFWCanvas() {
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
}
resizeFWCanvas();
window.addEventListener('resize', resizeFWCanvas);

class Firework {
    constructor(x, targetY) {
        this.x = x;
        this.y = fwCanvas.height;
        this.targetY = targetY;
        this.speed = 5 + Math.random() * 3;
        this.trail = [];
        this.alive = true;
        this.hue = Math.random() * 360;
    }
    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > 8) this.trail.shift();
        this.trail.forEach(t => t.alpha -= 0.12);
        this.y -= this.speed;
        if (this.y < this.targetY) {
            this.alive = false;
            this.explode();
        }
    }
    explode() {
        const count = 25 + Math.floor(Math.random() * 10);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const vel = 2 + Math.random() * 3;
            fwParticles.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * vel,
                vy: Math.sin(angle) * vel,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.015,
                size: 1.5 + Math.random() * 1.5,
                gravity: 0.04,
                color: `hsl(${this.hue + Math.random() * 60 - 30}, 100%, ${60 + Math.random() * 20}%)`
            });
        }
    }
    draw() {
        if (this.trail.length > 1) {
            fwCtx.beginPath();
            fwCtx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                fwCtx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            fwCtx.strokeStyle = `hsla(${this.hue}, 100%, 80%, 0.6)`;
            fwCtx.lineWidth = 2;
            fwCtx.stroke();
        }
        fwCtx.beginPath();
        fwCtx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        fwCtx.fillStyle = `hsl(${this.hue}, 100%, 85%)`;
        fwCtx.fill();
    }
}

function animateFireworks() {
    if (!fwRunning) return;

    // Clear with trail effect
    fwCtx.globalCompositeOperation = 'destination-out';
    fwCtx.fillStyle = fwFadingOut ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.12)';
    fwCtx.fillRect(0, 0, fwCanvas.width, fwCanvas.height);
    fwCtx.globalCompositeOperation = 'lighter';

    // Update & draw fireworks
    fireworks = fireworks.filter(f => f.alive);
    for (let i = 0; i < fireworks.length; i++) {
        fireworks[i].update();
        fireworks[i].draw();
    }

    // Update & draw particles (reverse loop for splice)
    for (let i = fwParticles.length - 1; i >= 0; i--) {
        const p = fwParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;

        // Faster decay when fading out
        p.alpha -= fwFadingOut ? p.decay * 3 : p.decay;

        if (p.alpha <= 0) {
            fwParticles.splice(i, 1);
            continue;
        }

        fwCtx.globalAlpha = p.alpha;
        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        fwCtx.fillStyle = p.color;
        fwCtx.fill();
    }
    fwCtx.globalAlpha = 1;

    // Auto-stop when nothing left during fadeout
    if (fwFadingOut && fireworks.length === 0 && fwParticles.length === 0) {
        fwRunning = false;
        fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
        fwCanvas.style.zIndex = '-1';
        fwFadingOut = false;
        return;
    }

    fwAnimId = requestAnimationFrame(animateFireworks);
}

function launchFirework() {
    const x = fwCanvas.width * 0.15 + Math.random() * fwCanvas.width * 0.7;
    const targetY = fwCanvas.height * 0.1 + Math.random() * fwCanvas.height * 0.35;
    fireworks.push(new Firework(x, targetY));
}

function startFireworks(duration) {
    fwRunning = true;
    fwFadingOut = false;
    fireworks = [];
    fwParticles = [];
    fwCanvas.style.zIndex = '99997';
    fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
    animateFireworks();

    let count = 0;
    const maxLaunches = 18;
    function launchWave() {
        if (count >= maxLaunches || !fwRunning) return;
        const burst = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < burst && count < maxLaunches; i++) {
            launchFirework();
            count++;
        }
        setTimeout(launchWave, 250 + Math.random() * 300);
    }
    launchWave();

    // Start fading out instead of hard stop
    setTimeout(() => {
        fwFadingOut = true;
        // Safety cleanup in case something hangs
        setTimeout(() => {
            if (fwRunning) {
                fwRunning = false;
                fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
                fwCanvas.style.zIndex = '-1';
                fireworks = [];
                fwParticles = [];
                fwFadingOut = false;
            }
        }, 3000);
    }, duration);
}

// ===== ENVELOPE + GRAND REVEAL =====
let envelopeOpened = false;

function openEnvelope() {
    if (envelopeOpened) return;
    envelopeOpened = true;
    document.getElementById('envelope').classList.add('open');

    // Start music
    setTimeout(() => {
        bgMusic.play().then(() => {
            musicPlaying = true;
            document.getElementById('musicToggle').classList.add('playing');
        }).catch(()=>{});
    }, 500);

    // Hide envelope, show grand reveal + fireworks
    setTimeout(() => {
        // Scroll to top first
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.getElementById('envelopeOverlay').classList.add('hidden');
        triggerGrandReveal();
        startFireworks(5000);
    }, 1800);
}

function triggerGrandReveal() {
    const gr = document.getElementById('grandReveal');
    gr.style.opacity = '1';
    gr.classList.add('active');

    // Create sparkles
    for (let i = 0; i < 60; i++) {
        const s = document.createElement('div');
        s.className = 'sparkle';
        const colors = ['#FFD700','#FF69B4','#FFF','#c9a96e','#FF6347','#00CED1','#FF1493','#7CFC00'];
        s.style.background = colors[Math.floor(Math.random() * colors.length)];
        s.style.left = '50%';
        s.style.top = '50%';
        s.style.width = (3 + Math.random() * 5) + 'px';
        s.style.height = s.style.width;
        s.style.setProperty('--tx', (-250 + Math.random() * 500) + 'px');
        s.style.setProperty('--ty', (-350 + Math.random() * 500) + 'px');
        s.style.animationDelay = (Math.random() * 1.2) + 's';
        s.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
        gr.appendChild(s);
    }

    // Create confetti
    for (let i = 0; i < 60; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        const confettiColors = ['#FFD700','#FF69B4','#c9a96e','#e8c4c4','#FF6347','#4169E1','#FF1493','#32CD32','#FF4500','#8A2BE2'];
        c.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        c.style.width = (5 + Math.random() * 8) + 'px';
        c.style.height = (8 + Math.random() * 16) + 'px';
        c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        c.style.setProperty('--cx', (-400 + Math.random() * 800) + 'px');
        c.style.setProperty('--cy', (-500 + Math.random() * 300) + 'px');
        c.style.animationDelay = (Math.random() * 1) + 's';
        c.style.animationDuration = (2 + Math.random() * 2.5) + 's';
        gr.appendChild(c);
    }

    // Fade out and enable scroll
    setTimeout(() => {
        gr.classList.add('fadeout');
        document.body.classList.remove('no-scroll');
        // Ensure at top after scroll unlock
        window.scrollTo({ top: 0, behavior: 'instant' });
        createPetals();
        createParticles();
    }, 3000);

    setTimeout(() => {
        gr.style.display = 'none';
    }, 7500);
}

// ===== PETALS =====
function createPetals() {
    const c = document.getElementById('petals');
    const colors = ['#f5cac3','#f7d1cd','#e8c4c4','#f2b5b5','#fce1e4','#ddb892','#e6ccb2','#f5e6e0'];
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'petal';
        const size = 8 + Math.random() * 18;
        const color = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = Math.random() * 100 + '%';
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.animationDuration = (8 + Math.random() * 12) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        p.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><ellipse cx="12" cy="12" rx="10" ry="6" fill="${color}" opacity=".7" transform="rotate(${Math.random()*360} 12 12)"/></svg>`;
        c.appendChild(p);
    }
}

// ===== PARTICLES =====
function createParticles() {
    const c = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
        p.style.background = Math.random() > 0.5 ? 'rgba(201,169,110,.4)' : 'rgba(232,196,196,.4)';
        p.style.animationDuration = (10 + Math.random() * 15) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        c.appendChild(p);
    }
}

// ===== SCROLL =====
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 500);
    revealOnScroll();
});

function revealOnScroll() {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
            el.classList.add('active');
        }
    });
}

// ===== COUNTDOWN =====
function updateCountdown() {
    const wedding = new Date('2026-03-29T10:00:00').getTime();
    const diff = wedding - Date.now();
    if (diff > 0) {
        document.getElementById('days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
        document.getElementById('hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
        document.getElementById('minutes').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        document.getElementById('seconds').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    } else {
        ['days','hours','minutes','seconds'].forEach(id => document.getElementById(id).textContent = '00');
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ===== SMOOTH SCROLL (Fixed scroll-down) =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        const t = document.querySelector(href);
        if (t) {
            t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== LIGHTBOX =====
const albumImgs = [
    'image/wedding/0015 CB HUYEN TIEN.JPG',
    'image/wedding/0473 CB HUYEN TIEN.JPG',
    'image/wedding/0266 CB HUYEN TIEN.JPG',
    'image/wedding/0245 CB HUYEN TIEN.JPG',
    'image/wedding/0863 CB HUYEN TIEN.JPG',
    'image/wedding/0775 CB HUYEN TIEN.JPG',
    'image/wedding/0696 CB HUYEN TIEN.JPG',
    'image/wedding/0742 CB HUYEN TIEN.JPG'
];
let curImg = 0;

function openLB(i) {
    curImg = i; updateLB();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeLightbox(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('lb-close')) return;
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
}
function navigateLB(dir) {
    curImg = (curImg + dir + albumImgs.length) % albumImgs.length;
    updateLB();
}
function updateLB() {
    document.getElementById('lbImg').src = albumImgs[curImg];
    document.getElementById('lbCounter').textContent = `${curImg + 1} / ${albumImgs.length}`;
}
document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLB(-1);
    if (e.key === 'ArrowRight') navigateLB(1);
});

// ===== GIFT TABS =====
function switchGiftTab(tab, btn) {
    document.querySelectorAll('.gift-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.gift-card').forEach(card => {
        card.classList.toggle('show', tab === 'all' || card.dataset.side === tab);
    });
}

// ===== COPY =====
function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '✓ Copied'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '✓ Copied'; btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
}

// ===== WISHES — localStorage =====
const WISHES_KEY = 'wedding_wishes_ml2026';

function getWishes() {
    try { return JSON.parse(localStorage.getItem(WISHES_KEY)) || []; }
    catch { return []; }
}

function saveWishes(wishes) {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
}

function renderWishes() {
    const list = document.getElementById('wishesList');
    const countEl = document.getElementById('wishesCount');
    const wishes = getWishes();

    countEl.textContent = `${wishes.length} lời chúc`;

    if (wishes.length === 0) {
        list.innerHTML = '<div class="no-wishes">Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc! 💕</div>';
        return;
    }
    list.innerHTML = wishes.map((w) => {
        const initials = w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const timeAgo = getTimeAgo(w.time);
        return `
        <div class="wish-card">
            <div class="wish-card-quote">"</div>
            <div class="wish-text">${escapeHTML(w.message)}</div>
            <div class="wish-footer">
                <div class="wish-author">
                    <div class="wish-avatar">${initials}</div>
                    <div class="wish-author-info">
                        <div class="name">${escapeHTML(w.name)}</div>
                        ${w.relation ? `<div style="font-size:.75rem;color:var(--text-light)">${escapeHTML(w.relation)}</div>` : ''}
                    </div>
                </div>
                <div class="wish-time">${timeAgo}</div>
            </div>
        </div>`;
    }).join('');
}

function submitWish(e) {
    e.preventDefault();
    const name = document.getElementById('wishName').value.trim();
    const relation = document.getElementById('wishRelation').value.trim();
    const message = document.getElementById('wishMessage').value.trim();

    if (!name || !message) return;

    const wishes = getWishes();
    wishes.unshift({ name, relation, message, time: Date.now() });
    saveWishes(wishes);

    document.getElementById('wishName').value = '';
    document.getElementById('wishRelation').value = '';
    document.getElementById('wishMessage').value = '';

    const btn = document.getElementById('wishSubmitBtn');
    btn.textContent = '✅ Đã gửi lời chúc!';
    btn.style.background = 'linear-gradient(135deg, #a7b5a0, #8fa888)';
    setTimeout(() => {
        btn.textContent = '💌 Gửi Lời Chúc';
        btn.style.background = '';
    }, 2500);

    renderWishes();

    // Scroll wish list to top to show new wish
    const wrapper = document.getElementById('wishesListWrapper');
    wrapper.scrollTo({ top: 0, behavior: 'smooth' });
}

function getTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    return `${months} tháng trước`;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Init wishes
renderWishes();

if (getWishes().length === 0) {
    const defaults = [
        { name: 'Gia đình nhà trai', relation: 'Ba Mẹ chú rể', message: 'Chúc hai con luôn hạnh phúc, yêu thương nhau trọn đời. Ba mẹ rất tự hào và hạnh phúc khi thấy con tìm được nửa kia của mình!', time: Date.now() - 86400000 },
        { name: 'Gia đình nhà gái', relation: 'Ba Mẹ cô dâu', message: 'Con gái yêu quý, ba mẹ chúc con và Minh luôn bên nhau, cùng xây dựng tổ ấm thật hạnh phúc. Mãi yêu con!', time: Date.now() - 72000000 },
        { name: 'Nguyễn Hoàng Nam', relation: 'Bạn thân chú rể', message: 'Chúc mừng hai bạn! Hạnh phúc mãi bên nhau nhé. Ông trời se duyên cho đôi đẹp nhất group mình rồi! 🎉🥂', time: Date.now() - 36000000 },
        { name: 'Phạm Thu Hà', relation: 'Bạn thân cô dâu', message: 'Linh ơi, cuối cùng cũng đến ngày này rồi! Hạnh phúc thật nhiều nhé bạn yêu. Yêu cả hai lắm lắm! 💕✨', time: Date.now() - 18000000 },
        { name: 'Trần Minh Tuấn', relation: 'Đồng nghiệp', message: 'Chúc anh chị trăm năm hạnh phúc, sớm có tin vui nhé! Couple đẹp nhất công ty mình! 🎊', time: Date.now() - 7200000 },
        { name: 'Lê Hoàng Yến', relation: 'Bạn đại học', message: 'Happy Wedding nghen hai đứa! Từ hồi đại học tới giờ, cuối cùng cũng chịu cưới. Hạnh phúc mãi mãi nha! 🥰💒', time: Date.now() - 3600000 }
    ];
    saveWishes(defaults);
    renderWishes();
}

// ===== FOOTER FLOATING HEARTS =====
function createFooterHearts() {
    const container = document.getElementById('footerHearts');
    const hearts = ['💕', '💗', '💖', '✨', '💝', '♥'];
    for (let i = 0; i < 12; i++) {
        const h = document.createElement('div');
        h.className = 'footer-heart';
        h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        h.style.left = (5 + Math.random() * 90) + '%';
        h.style.fontSize = (0.6 + Math.random() * 0.8) + 'rem';
        h.style.animationDuration = (4 + Math.random() * 6) + 's';
        h.style.animationDelay = (Math.random() * 8) + 's';
        container.appendChild(h);
    }
}
createFooterHearts();

// ===== BACK TO TOP =====
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}