// ===== AUDIO =====
const bgMusic = document.getElementById('bgMusic');
let musicPlaying = false;

function toggleMusic() {
    const btn = document.getElementById('musicToggle');
    if (musicPlaying) {
        bgMusic.pause();
        btn.classList.remove('playing');
    } else {
        bgMusic.play().catch(()=>{});
        btn.classList.add('playing');
    }
    musicPlaying = !musicPlaying;
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

    // Hide envelope, show grand reveal
    setTimeout(() => {
        document.getElementById('envelopeOverlay').classList.add('hidden');
        triggerGrandReveal();
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
        const angle = (Math.PI * 2 * i) / 60;
        const dist = 100 + Math.random() * 400;
        s.style.top = '50%';
        s.style.left = '50%';
        s.style.width = (3 + Math.random() * 5) + 'px';
        s.style.height = s.style.width;
        const colors = ['#c9a96e','#ddb892','#e8c4c4','#fff','#f5cac3','#ffd700'];
        s.style.background = colors[Math.floor(Math.random() * colors.length)];
        s.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        s.style.animationDelay = (Math.random() * 0.5) + 's';
        s.style.animationDuration = (1.5 + Math.random()) + 's';
        gr.appendChild(s);
    }

    // Create confetti
    for (let i = 0; i < 80; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        const colors = ['#c9a96e','#e8c4c4','#ddb892','#f5cac3','#b08968','#ffd700','#ff6b6b','#a7b5a0'];
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.width = (5 + Math.random() * 8) + 'px';
        c.style.height = (8 + Math.random() * 15) + 'px';
        c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        c.style.setProperty('--cx', (-300 + Math.random() * 600) + 'px');
        c.style.setProperty('--cy', (-400 + Math.random() * 200) + 'px');
        c.style.animationDelay = (Math.random() * 0.8) + 's';
        c.style.animationDuration = (2 + Math.random() * 2) + 's';
        gr.appendChild(c);
    }

    // Fade out and enable scroll
    setTimeout(() => {
        gr.classList.add('fadeout');
        document.body.classList.remove('no-scroll');
        createPetals();
        createParticles();
    }, 2500);

    setTimeout(() => {
        gr.style.display = 'none';
    }, 6500);
}

// ===== PETALS =====
function createPetals() {
    const c = document.getElementById('petals');
    const colors = ['#f5cac3','#f7d1cd','#e8c4c4','#f2b5b5','#fce1e4','#ddb892','#e6ccb2','#f5e6e0'];
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'petal';
        const clr = colors[Math.floor(Math.random() * colors.length)];
        const sz = 8 + Math.random() * 14;
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDuration = (8 + Math.random() * 12) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';
        p.innerHTML = `<svg width="${sz}" height="${sz}" viewBox="0 0 20 20"><ellipse cx="10" cy="10" rx="8" ry="5" fill="${clr}" opacity=".7" transform="rotate(${Math.random()*360} 10 10)"/></svg>`;
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
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) el.classList.add('active');
    });
}
revealOnScroll();

// ===== COUNTDOWN — 29/03/2026 =====
function updateCountdown() {
    const target = new Date('2026-03-29T10:00:00+07:00').getTime();
    const now = new Date().getTime();
    const diff = target - now;
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

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        const t = document.querySelector(this.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
});

// ===== LIGHTBOX =====
const albumImgs = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85',
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=85',
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=85',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=85',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=85',
    'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=1200&q=85'
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
    try {
        return JSON.parse(localStorage.getItem(WISHES_KEY)) || [];
    } catch { return []; }
}

function saveWishes(wishes) {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
}

function renderWishes() {
    const list = document.getElementById('wishesList');
    const wishes = getWishes();
    if (wishes.length === 0) {
        list.innerHTML = '<div class="no-wishes">Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc! 💕</div>';
        return;
    }
    list.innerHTML = wishes.map((w, i) => {
        const initials = w.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        const timeAgo = getTimeAgo(w.time);
        return `
        <div class="wish-card reveal stagger-${(i % 3) + 1}" style="transition-delay:${i * 0.1}s">
            <div class="wish-card-quote">"</div>
            <p class="wish-text">${escapeHTML(w.message)}</p>
            <div class="wish-footer">
                <div class="wish-author">
                    <div class="wish-avatar">${initials}</div>
                    <div class="wish-author-info">
                        <div class="name">${escapeHTML(w.name)}</div>
                        ${w.relation ? `<div style="font-size:.78rem;color:var(--text-light)">${escapeHTML(w.relation)}</div>` : ''}
                    </div>
                </div>
                <div class="wish-time">${timeAgo}</div>
            </div>
        </div>`;
    }).join('');

    // Trigger reveal for new cards
    setTimeout(revealOnScroll, 100);
}

function submitWish(e) {
    e.preventDefault();
    const name = document.getElementById('wishName').value.trim();
    const relation = document.getElementById('wishRelation').value.trim();
    const message = document.getElementById('wishMessage').value.trim();

    if (!name || !message) return;

    const wishes = getWishes();
    wishes.unshift({
        name,
        relation,
        message,
        time: Date.now()
    });
    saveWishes(wishes);

    // Reset form
    document.getElementById('wishName').value = '';
    document.getElementById('wishRelation').value = '';
    document.getElementById('wishMessage').value = '';

    // Button feedback
    const btn = document.getElementById('wishSubmitBtn');
    btn.textContent = '✅ Đã gửi lời chúc!';
    btn.style.background = 'linear-gradient(135deg, #a7b5a0, #8fa888)';
    setTimeout(() => {
        btn.textContent = '💌 Gửi Lời Chúc';
        btn.style.background = '';
    }, 2500);

    renderWishes();
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

// Add some default wishes if empty
if (getWishes().length === 0) {
    const defaults = [
        { name: 'Gia đình nhà trai', relation: 'Ba Mẹ chú rể', message: 'Chúc hai con luôn hạnh phúc, yêu thương nhau trọn đời. Ba mẹ rất tự hào và hạnh phúc khi thấy con tìm được nửa kia của mình!', time: Date.now() - 86400000 },
        { name: 'Gia đình nhà gái', relation: 'Ba Mẹ cô dâu', message: 'Con gái yêu quý, ba mẹ chúc con và Minh luôn bên nhau, cùng xây dựng tổ ấm thật hạnh phúc. Mãi yêu con!', time: Date.now() - 72000000 },
        { name: 'Nguyễn Hoàng Nam', relation: 'Bạn thân chú rể', message: 'Chúc mừng hai bạn! Hạnh phúc mãi bên nhau nhé. Ông trời se duyên cho đôi đẹp nhất group mình rồi!', time: Date.now() - 36000000 },
        { name: 'Phạm Thu Hà', relation: 'Bạn thân cô dâu', message: 'Linh ơi, cuối cùng cũng đến ngày này rồi! Hạnh phúc thật nhiều nhé bạn yêu. Yêu cả hai lắm lắm!', time: Date.now() - 18000000 }
    ];
    saveWishes(defaults);
    renderWishes();
}

// ===== BACK TO TOP =====
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}