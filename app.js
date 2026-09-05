const POLL_MS = 20_000;

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
        const res = await fetch('/api/live', { cache: 'no-store' });
        render(await res.json());
    } catch {
        els.badgeText.textContent = 'Live-status kon niet geladen worden';
    }
}

checkLive();
setInterval(checkLive, POLL_MS);

document.getElementById('footer-year').textContent = new Date().getFullYear();

// ---------- Overlay-showcases: iframe op echte resolutie renderen, dan schalen ----------
// Puur procentuele iframe-afmetingen (width/height:100%) gaven verkeerd geschaalde vw/vh-tekst
// binnenin de overlay-pagina's — de iframe rendert nu op zijn eigen echte resolutie (bijv.
// 1920x1080) en wordt daarna met een CSS-transform naar de kleine showcase-maat geschaald,
// zodat de overlay's eigen vw/vh-CSS altijd tegen de juiste, echte viewport-grootte rekent.
(() => {
    const iframes = document.querySelectorAll('.showcase-iframe[data-native-w]');
    if (!iframes.length) return;

    function schaal(iframe, canvasWidth) {
        const nativeW = Number(iframe.dataset.nativeW);
        const nativeH = Number(iframe.dataset.nativeH);
        if (!nativeW || !nativeH || !canvasWidth) return;

        iframe.style.width = `${nativeW}px`;
        iframe.style.height = `${nativeH}px`;
        iframe.style.transform = `scale(${canvasWidth / nativeW})`;
    }

    // ResizeObserver i.p.v. gokken op het juiste moment (load/resize-events): dit vuurt
    // gegarandeerd zodra de canvas zijn ECHTE, definitieve breedte heeft — voorkwam eerder dat
    // de schaalfactor werd berekend vóór de flex/aspect-ratio-layout klaar was, wat een
    // schaalfactor dicht bij 1 gaf (dus vrijwel ongeschaalde, veel te grote, uitgesneden tekst).
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const iframe = entry.target.querySelector('.showcase-iframe[data-native-w]');
                if (iframe) schaal(iframe, entry.contentRect.width);
            }
        });
        iframes.forEach(iframe => { if (iframe.parentElement) observer.observe(iframe.parentElement); });
    } else {
        // Fallback voor uitzonderlijk oude browsers zonder ResizeObserver.
        const schaalAlles = () => iframes.forEach(iframe => schaal(iframe, iframe.parentElement?.clientWidth));
        schaalAlles();
        window.addEventListener('load', schaalAlles);
        window.addEventListener('resize', schaalAlles);
    }
})();

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

// ---------- Kleurkiezer: verandert alleen de site-tint voor deze bezoeker (localStorage),
// niemand anders ziet dit en wij slaan het nergens gedeeld op. ----------
(() => {
    const STORAGE_KEY = 'gwnlarss-accentkleur';
    const NAAM_KEY = 'gwnlarss-eigen-naam';
    const STANDAARD_NAAM = 'GwnLarss';
    const toggle = document.getElementById('theme-picker-toggle');
    const panel = document.getElementById('theme-picker-panel');
    const customInput = document.getElementById('theme-picker-custom');
    const naamInput = document.getElementById('theme-picker-naam');
    const resetBtn = document.getElementById('theme-picker-reset');
    if (!toggle || !panel || !customInput || !resetBtn) return;

    // Puur de "GwnLarss"-badge in de cam-border-showcase, niet de rest van de site (logo,
    // hero-titel, live-status) — die blijven altijd echt.
    function pasNaamToe(naam) {
        document.querySelectorAll('.brand-name').forEach(el => { el.textContent = naam || STANDAARD_NAAM; });
    }
    function bewaarNaam(naam) {
        try {
            if (naam) localStorage.setItem(NAAM_KEY, naam);
            else localStorage.removeItem(NAAM_KEY);
        } catch { /* privénavigatie o.i.d. */ }
    }
    if (naamInput) {
        try {
            const opgeslagenNaam = localStorage.getItem(NAAM_KEY);
            if (opgeslagenNaam) { pasNaamToe(opgeslagenNaam); naamInput.value = opgeslagenNaam; }
        } catch { /* geen geldige opgeslagen naam */ }
        naamInput.addEventListener('input', () => {
            pasNaamToe(naamInput.value.trim());
            bewaarNaam(naamInput.value.trim());
        });
    }

    const STANDAARD = { purple: '#9146ff', pink: '#ff3ea5' };

    function pasToe(purple, pink) {
        document.documentElement.style.setProperty('--purple', purple);
        document.documentElement.style.setProperty('--pink', pink);
    }

    function bewaar(purple, pink) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ purple, pink })); } catch { /* privénavigatie o.i.d. */ }
    }

    // Voor de "eigen kleur"-optie: leidt een tweede tint af door de tint (hue) van de
    // gekozen kleur te draaien, zodat je niet zelf twee kleuren hoeft te kiezen die matchen.
    function hexNaarHsl(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        const d = max - min;
        if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));
            switch (max) {
                case r: h = ((g - b) / d) % 6; break;
                case g: h = (b - r) / d + 2; break;
                default: h = (r - g) / d + 4;
            }
            h *= 60;
            if (h < 0) h += 360;
        }
        return [h, s, l];
    }
    function hslNaarHex(h, s, l) {
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
        const naarHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
        return `#${naarHex(r)}${naarHex(g)}${naarHex(b)}`;
    }
    function afgeleideTint(hex) {
        const [h, s, l] = hexNaarHsl(hex);
        return hslNaarHex((h + 40) % 360, s, l);
    }

    // Bij laden: opgeslagen keuze van deze bezoeker terugzetten.
    try {
        const opgeslagen = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (opgeslagen?.purple && opgeslagen?.pink) pasToe(opgeslagen.purple, opgeslagen.pink);
    } catch { /* geen geldige opgeslagen keuze */ }

    toggle.addEventListener('click', () => {
        const open = panel.hidden;
        panel.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => {
        if (!panel.hidden && !document.getElementById('theme-picker').contains(e.target)) panel.hidden = true;
    });

    document.querySelectorAll('.theme-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const { purple, pink } = swatch.dataset;
            pasToe(purple, pink);
            bewaar(purple, pink);
            customInput.value = purple;
        });
    });

    customInput.addEventListener('input', () => {
        const purple = customInput.value;
        const pink = afgeleideTint(purple);
        pasToe(purple, pink);
        bewaar(purple, pink);
    });

    resetBtn.addEventListener('click', () => {
        pasToe(STANDAARD.purple, STANDAARD.pink);
        customInput.value = STANDAARD.purple;
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* privénavigatie o.i.d. */ }

        if (naamInput) {
            pasNaamToe('');
            naamInput.value = '';
            bewaarNaam('');
        }
    });
})();
