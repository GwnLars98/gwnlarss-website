// Deze site is een statische Netlify-deploy zonder eigen backend — /api/live en /api/content
// draaien op de bot-server zelf (Home Assistant-box). Daarom hier, anders dan in de kopie die
// same-origin op die bot-server draait, een absolute cross-origin URL nodig i.p.v. een relatief
// pad. Vereist dat api.gwnlarss.nl (Cloudflare Tunnel o.i.d.) naar die box wijst.
const API_BASE = 'https://api.gwnlarss.nl';

const POLL_MS = 20_000;
const CONTENT_POLL_MS = 60_000;

const els = {
    navDot: document.getElementById('nav-dot'),
    badge: document.getElementById('live-badge'),
    badgeText: document.getElementById('live-badge-text'),
    streamTitle: document.getElementById('stream-title'),
    watchBtn: document.getElementById('watch-btn'),
    embedContainer: document.getElementById('twitch-embed'),
    liveTag: document.getElementById('preview-live-tag'),
    avatar: document.getElementById('avatar'),
    avatarPlaceholder: document.getElementById('avatar-placeholder'),
    previewName: document.getElementById('preview-name'),
    previewSub: document.getElementById('preview-sub'),
};

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function mountTwitchEmbed(login) {
    if (els.embedContainer.dataset.mounted === login) return;
    els.embedContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.twitch.tv/?channel=${encodeURIComponent(login)}&parent=${encodeURIComponent(location.hostname)}&muted=true`;
    iframe.allowFullscreen = true;
    iframe.title = `${login} live op Twitch`;
    els.embedContainer.appendChild(iframe);
    els.embedContainer.dataset.mounted = login;
}

function render(data) {
    if (!data.geconfigureerd) {
        els.badgeText.textContent = 'Live-status niet beschikbaar';
        return;
    }

    els.previewName.textContent = data.displayName || 'GwnLarss';
    document.querySelectorAll('a[href^="https://twitch.tv/"]').forEach(a => {
        a.href = `https://twitch.tv/${data.twitchLogin}`;
    });
    mountTwitchEmbed(data.twitchLogin);

    if (data.profileImageUrl) {
        els.avatar.src = data.profileImageUrl;
        els.avatar.hidden = false;
        els.avatarPlaceholder.hidden = true;
    }

    if (data.live) {
        els.navDot.classList.add('dot--live');
        els.badge.classList.add('badge--live');
        els.badgeText.textContent = '🔴 Live nu';
        els.watchBtn.textContent = 'Kijk nu op Twitch';
        els.watchBtn.classList.add('is-live');
        els.streamTitle.textContent = data.game
            ? `"${data.title}" · ${data.game}${data.viewers != null ? ` · ${data.viewers} kijkers` : ''}`
            : data.title || '';
        els.liveTag.hidden = false;
        els.previewSub.textContent = 'is live';
    } else {
        els.navDot.classList.remove('dot--live');
        els.badge.classList.remove('badge--live');
        els.badgeText.textContent = '⚫ Momenteel offline';
        els.watchBtn.textContent = 'Volg op Twitch';
        els.watchBtn.classList.remove('is-live');
        els.streamTitle.textContent = '';
        els.liveTag.hidden = true;
        els.previewSub.textContent = 'op Twitch';
    }
}

async function checkLive() {
    try {
        const res = await fetch(`${API_BASE}/api/live`, { cache: 'no-store' });
        render(await res.json());
    } catch {
        els.badgeText.textContent = 'Live-status kon niet geladen worden';
    }
}

function renderPostCard(container, data, emptyText) {
    if (!data) {
        container.innerHTML = `<p class="post-card__empty">${escapeHtml(emptyText)}</p>`;
        return;
    }
    container.innerHTML = `
        <p class="post-card__title">${escapeHtml(data.titel)}</p>
        <p class="post-card__body">${escapeHtml(data.beschrijving)}</p>
        ${data.afbeelding ? `<img src="${escapeHtml(data.afbeelding)}" alt="">` : ''}
        <p class="post-card__meta">Geplaatst door ${escapeHtml(data.auteur)} · ${new Date(data.tijdstip).toLocaleString('nl-NL')}</p>
    `;
}

async function checkContent() {
    try {
        const res = await fetch(`${API_BASE}/api/content`, { cache: 'no-store' });
        const data = await res.json();
        renderPostCard(document.getElementById('schema-card'), data.schema, 'Nog geen schema geplaatst, check het schema-kanaal op Discord.');
        renderPostCard(document.getElementById('updates-card'), data.update, 'Nog geen berennieuws, check het updates-kanaal op Discord.');
    } catch { /* laat de bestaande inhoud gewoon staan */ }
}

checkLive();
setInterval(checkLive, POLL_MS);
checkContent();
setInterval(checkContent, CONTENT_POLL_MS);

document.getElementById('footer-year').textContent = new Date().getFullYear();

// ---------- Showcase: MSN-toastje ("eerste chat van de stream") ----------
(() => {
    const toast = document.getElementById('msn-toast');
    const replayBtn = document.getElementById('showcase-replay');
    const muteBtn = document.getElementById('showcase-mute');
    if (!toast || !replayBtn || !muteBtn) return;

    let timer1 = null, timer2 = null;

    // Onthouden per bezoeker (niet gedeeld, niet gelezen door ons) zodat de voorkeur blijft
    // staan als iemand de pagina later nog eens bezoekt.
    let gedempt = false;
    try { gedempt = localStorage.getItem('gwnlarss-showcase-gedempt') === '1'; } catch { /* privénavigatie o.i.d. */ }

    function updateMuteKnop() {
        muteBtn.textContent = gedempt ? '🔇 Geluid uit' : '🔊 Geluid aan';
        muteBtn.setAttribute('aria-pressed', String(gedempt));
    }
    updateMuteKnop();

    muteBtn.addEventListener('click', () => {
        gedempt = !gedempt;
        updateMuteKnop();
        try { localStorage.setItem('gwnlarss-showcase-gedempt', gedempt ? '1' : '0'); } catch { /* privénavigatie o.i.d. */ }
    });

    // Klassiek MSN-"ding"-geluidje, zelf gesynthetiseerd — geen audiobestand nodig, en werkt dus
    // ook op deze statische showcase-pagina zonder eigen backend.
    function speelMsnDing() {
        if (gedempt) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            // Opwaarts belletje-arpeggio (C6-E6-G6-C7), met een zachte boventoon per noot voor
            // een klokkerige klank i.p.v. een kale sinustoon — de klassieke "messenger-ding"-vibe.
            [1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, i) => {
                const start = now + i * 0.07;
                const duur = 0.22;
                for (const [ratio, piek] of [[1, 0.28], [2, 0.09]]) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq * ratio;
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(piek, start + 0.008);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + duur);
                    osc.connect(gain).connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + duur + 0.02);
                }
            });
        } catch { /* Web Audio niet beschikbaar, dan maar geen geluid */ }
    }

    function play() {
        replayBtn.disabled = true;
        clearTimeout(timer1); clearTimeout(timer2);
        toast.classList.remove('is-visible');
        void toast.offsetWidth; // forceer reflow zodat de transitie altijd opnieuw start
        speelMsnDing();
        requestAnimationFrame(() => toast.classList.add('is-visible'));
        timer1 = setTimeout(() => {
            toast.classList.remove('is-visible');
            timer2 = setTimeout(() => { replayBtn.disabled = false; }, 450);
        }, 5000);
    }

    replayBtn.addEventListener('click', play);
    setTimeout(play, 600);
})();
