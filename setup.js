// Gedeelde helpers voor de live voorbeelden op de setup-pagina's: het deeltjesveld met het
// icoon van de tool, het kantelende voorbeeld, IM-toastjes met de echte geluidjes en een nep-chat.
// De echte logica (activeren, opslaan) zit los in elke pagina en weet hier niks van.
import { deeltjesVeld, VORM } from './deeltjes.js';

export const $ = id => document.getElementById(id);
export const wacht = ms => new Promise(r => setTimeout(r, ms));
export const veilig = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function startVeld(vorm, breedte) {
    const klein = innerWidth < 860;
    await deeltjesVeld($('veld'), {
        stof: { geo: VORM.stof(), breedte: 22 },
        [vorm]: { geo: VORM[vorm](), breedte },
    }, tijd => {
        const opHeld = scrollY < innerHeight * 0.35;
        const plek = klein ? { x: 0, y: 2.6, alpha: opHeld ? 0.9 : 0.25 } : (opHeld ? { x: 3.8, y: 1.9, alpha: 1 } : { x: 4.8, y: 2.2, alpha: 0.3 });
        if (tijd < 2.6) return { van: 'stof', naar: vorm, mix: tijd / 2.6, ...plek };
        return { van: vorm, naar: vorm, mix: 0, ...plek };
    });
}

// Het voorbeeld kantelt licht mee met de muis.
export function kantel(el) {
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.style.transition = 'transform 0.5s cubic-bezier(0.2, 1, 0.3, 1)';
    el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `perspective(1400px) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 9}deg) rotateX(${-((e.clientY - r.top) / r.height - 0.5) * 9}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}

// Nep-chat: voegt een regel toe en houdt er hooguit `max` over.
export function chatRegel(chat, html, max = 7) {
    const m = document.createElement('div');
    m.className = 'msg';
    m.innerHTML = html;
    chat.append(m);
    requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('aan')));
    const regels = chat.querySelectorAll('.msg');
    if (regels.length > max) regels[0].remove();
    return m;
}

// IM-thema's, zelfde kleuren als de echte toastjes in first-chat.html/lurk.html.
export const THEMAS = {
    msn: { titel: '💬 Nieuw bericht', balk: 'linear-gradient(180deg, #6ea8fb, #1958c9)', balkTekst: '#fff', body: '#fff', tekst: '#1b2a4a', font: 'Tahoma, Segoe UI, sans-serif' },
    aim: { titel: '🏃 IM ontvangen', balk: 'linear-gradient(180deg, #fff35c, #ffce00)', balkTekst: '#4a3b00', body: '#fff', tekst: '#222', font: 'Verdana, Arial, sans-serif' },
    icq: { titel: '🌼 Nieuw bericht', balk: 'linear-gradient(180deg, #b2e07a, #4c9a2a)', balkTekst: '#fff', body: '#fff', tekst: '#1f3312', font: 'Tahoma, sans-serif' },
    yahoo: { titel: '💜 Yahoo!-bericht', balk: 'linear-gradient(180deg, #d9a6f0, #7b1fa2)', balkTekst: '#fff', body: '#fff', tekst: '#2d0d3a', font: 'Tahoma, sans-serif' },
    xp: { titel: 'ℹ️ Bericht ontvangen', balk: 'linear-gradient(180deg, #eef7ff, #cfe8fb)', balkTekst: '#003c74', body: 'linear-gradient(180deg, #eef7ff, #cfe8fb)', tekst: '#003c74', font: 'Tahoma, sans-serif' },
    skype: { titel: '📞 Skype-bericht', balk: 'linear-gradient(180deg, #00aff0, #0078d4)', balkTekst: '#fff', body: '#fff', tekst: '#10324a', font: 'Segoe UI, sans-serif' },
    nokia: { titel: '📱 Nieuw bericht', balk: '#08150c', balkTekst: '#8fce6a', body: '#0d1f0d', tekst: '#8fce6a', font: 'Courier New, monospace' },
    bbm: { titel: '📍 BBM PING!', balk: '#000', balkTekst: '#ee2737', body: '#1a1a1a', tekst: '#f2f2f2', font: 'Segoe UI, sans-serif' },
    discord: { titel: '🎮 Nieuw bericht', balk: '#5865f2', balkTekst: '#fff', body: '#313338', tekst: '#dbdee1', font: 'Segoe UI, sans-serif' },
    instagram: { titel: '📸 Nieuw DM-bericht', balk: 'linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)', balkTekst: '#fff', body: '#fff', tekst: '#262626', font: 'Segoe UI, sans-serif' },
};

// Speelt het echte geluidje van een thema, hetzelfde bestand als de overlay gebruikt.
const geluiden = {};
export function speelGeluid(thema, volume = 1) {
    const a = (geluiden[thema] ??= new Audio(`https://api.gwnlarss.nl/first-chat-sounds/${thema}.mp3`));
    a.volume = Math.max(0, Math.min(1, volume));
    a.currentTime = 0;
    a.play().catch(() => {});
}

// IM-toast-voorbeeld dat meeloopt met de thema-kaarten, grootte-knoppen en volumeschuif van
// de pagina zelf (luistert alleen mee, verandert niks aan de echte instellingen).
export function toastVoorbeeld(el, voorbeelden) {
    const zet = sleutel => {
        const t = THEMAS[sleutel] ?? THEMAS.msn;
        Object.entries({ '--t-font': t.font, '--t-balk': t.balk, '--t-balk-tekst': t.balkTekst, '--t-body': t.body, '--t-tekst': t.tekst }).forEach(([k, v]) => el.style.setProperty(k, v));
        el.querySelector('.im-toast__balk').textContent = t.titel;
    };
    const grootte = g => el.style.setProperty('--grootte', { normaal: 1, groot: 1.2, extragroot: 1.4 }[g] ?? 1);
    const volume = () => Number($('volume-slider')?.value ?? 100) / 100;
    const actiefThema = () => document.querySelector('.thema-kaart.is-actief')?.dataset.thema ?? 'msn';
    // Volgt de pagina: ook als de echte instellingen na het laden worden opgehaald.
    const volg = () => {
        zet(actiefThema());
        grootte(document.querySelector('.grootte-knop.is-actief')?.dataset.grootte);
    };
    new MutationObserver(volg).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    volg();
    document.querySelectorAll('.thema-kaart').forEach(k => k.addEventListener('click', () => speelGeluid(k.dataset.thema, volume())));
    $('speel-geluid')?.addEventListener('click', () => speelGeluid(actiefThema(), volume()));
    (async () => {
        for (let i = 0; ; i = (i + 1) % voorbeelden.length) {
            const [naam, bericht, kleur] = voorbeelden[i];
            el.querySelector('.im-toast__naam').textContent = naam;
            el.querySelector('.im-toast__bericht').textContent = bericht;
            const av = el.querySelector('.im-toast__avatar');
            av.textContent = naam.replace(/[^a-z0-9]/gi, '').charAt(0).toUpperCase() || '?';
            av.style.background = kleur;
            el.classList.add('aan');
            await wacht(3600);
            el.classList.remove('aan');
            await wacht(1100);
        }
    })();
}
