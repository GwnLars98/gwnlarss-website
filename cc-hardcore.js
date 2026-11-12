// Creator Cove Hardcore: gedeeld script van creatorcove-stats.html en creatorcove-deaths.html.
// Gegevens van api.gwnlarss.nl/api/creatorcove (utils/creatorCove.js in de bot). Crew logt in met een code die
// ze in de game krijgen met /webcode; de sessie (12 uur) staat alleen in deze browser.
const CC = (() => {
    const API = 'https://api.gwnlarss.nl/api/creatorcove/';
    const SLEUTEL = 'cc_crew';

    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const nl = new Intl.NumberFormat('nl-NL');
    const nl1 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });
    const nl2 = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function sessie() {
        try { const s = JSON.parse(localStorage.getItem(SLEUTEL) || 'null'); return s && s.tot > Date.now() ? s : null; } catch { return null; }
    }
    function zetSessie(s) { try { s ? localStorage.setItem(SLEUTEL, JSON.stringify(s)) : localStorage.removeItem(SLEUTEL); } catch { /* geen opslag */ } }

    async function haal(pad) {
        const r = await fetch(API + pad, { cache: 'no-store' });
        if (!r.ok) throw new Error('status ' + r.status);
        return r.json();
    }
    async function post(pad, body) {
        const s = sessie();
        const r = await fetch(API + pad, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, token: s?.token }) });
        const j = await r.json().catch(() => ({ ok: false, fout: 'Geen antwoord van de server.' }));
        if (r.status === 401) { zetSessie(null); veranderd(); }
        return j;
    }

    const hoofd = (uuid, maat = 40) => `https://mc-heads.net/avatar/${encodeURIComponent(uuid)}/${maat}`;
    const teamNaam = t => ({ stormhaven: 'Stormhaven', sunspire: 'Sunspire', crew: 'Crew' })[t] || '';
    const ICOON = {
        twitch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2 2.5 6v14h5v3h3l3-3h4l5-5V2H4Zm16 12-3 3h-5l-3 3v-3H5V4h15v10Zm-4-7h-2v6h2V7Zm-5 0H9v6h2V7Z"/></svg>',
        youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.8 15.1V8.9L15.6 12l-5.8 3.1Z"/></svg>',
    };
    function kanalen(lijst) {
        if (!lijst?.length) return '';
        return `<span class="kanalen">${lijst.map(k => `<a class="kanaal ${esc(k.platform)}${k.live ? ' live' : ''}" href="${esc(k.url)}" target="_blank" rel="noopener" title="${esc(k.naam)} op ${k.platform === 'twitch' ? 'Twitch' : 'YouTube'}">${ICOON[k.platform] || ''}${k.live ? '<span class="livepil">LIVE</span>' : esc(k.naam)}</a>`).join('')}</span>`;
    }
    function duur(minuten) {
        const m = Math.round(minuten || 0);
        if (m < 60) return `${m} min`;
        const u = Math.floor(m / 60), r = m % 60;
        return r ? `${nl.format(u)} u ${r} min` : `${nl.format(u)} u`;
    }
    function waarde(stat, v) {
        if (stat?.eenheid === 'minuten') return duur(v);
        if (stat?.eenheid === 'km') return `${nl2.format(v || 0)} km`;
        if (stat?.eenheid === 'hartjes') return `${nl1.format(v || 0)} ♥`;
        return nl.format(Math.round(v || 0));
    }

    // ---------- kop met crew-knop en inlogvenster ----------
    const luisteraars = [];
    function veranderd() { for (const f of luisteraars) f(sessie()); tekenKnop(); }
    function opCrew(f) { luisteraars.push(f); f(sessie()); }

    let knop, dialoog;
    function tekenKnop() {
        if (!knop) return;
        const s = sessie();
        knop.classList.toggle('in', Boolean(s));
        knop.textContent = s ? `Crew: ${s.naam} (uitloggen)` : 'Crew';
    }
    function kop(huidig) {
        const plek = document.getElementById('kop');
        plek.innerHTML = `
          <a class="merk" href="creatorcove-stats"><b>Creator Cove</b><span>Hardcore</span></a>
          <nav class="nav" aria-label="Pagina's">
            <a href="creatorcove-stats" ${huidig === 'stats' ? 'aria-current="page"' : ''}>Statistieken</a>
            <a href="creatorcove-deaths" ${huidig === 'deaths' ? 'aria-current="page"' : ''}>Deaths</a>
          </nav>
          <button type="button" class="crewknop" id="crewknop">Crew</button>`;
        knop = document.getElementById('crewknop');
        dialoog = document.createElement('dialog');
        dialoog.className = 'login';
        dialoog.innerHTML = `
          <form method="dialog" id="loginform">
            <h2>Crew-login</h2>
            <p>Typ in Minecraft <code>/webcode</code>. Je krijgt dan een code van zes tekens die tien minuten geldig is.</p>
            <div class="rij"><input type="text" id="logincode" maxlength="10" autocomplete="one-time-code" placeholder="Bijvoorbeeld K7PQ2M" aria-label="Inlogcode">
            <button class="knop" type="submit" id="loginknop">Inloggen</button></div>
            <p class="melding" id="loginmelding" role="status"></p>
            <button type="button" class="knop licht klein" id="loginsluit">Sluiten</button>
          </form>`;
        document.body.append(dialoog);
        knop.addEventListener('click', () => {
            if (sessie()) { zetSessie(null); veranderd(); return; }
            dialoog.showModal();
            dialoog.querySelector('#logincode').focus();
        });
        dialoog.querySelector('#loginsluit').addEventListener('click', () => dialoog.close());
        dialoog.querySelector('#loginform').addEventListener('submit', async e => {
            e.preventDefault();
            const melding = dialoog.querySelector('#loginmelding');
            const code = dialoog.querySelector('#logincode').value.trim();
            if (!code) return;
            melding.className = 'melding'; melding.textContent = 'Even kijken...';
            const r = await fetch(API + 'login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).then(x => x.json()).catch(() => ({ ok: false, fout: 'Geen verbinding met de server.' }));
            if (!r.ok) { melding.className = 'melding fout'; melding.textContent = r.fout || 'Dat lukte niet.'; return; }
            zetSessie({ token: r.token, naam: r.naam, tot: Date.now() + 11.5 * 3600000 });
            dialoog.close();
            veranderd();
        });
        tekenKnop();
    }

    return { API, esc, nl, haal, post, sessie, opCrew, kop, hoofd, teamNaam, kanalen, waarde, duur };
})();
