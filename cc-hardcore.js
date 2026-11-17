// Creator Cove Hardcore: gedeeld script van de creatorcove-pagina's (home, stats, deelnemers, deaths, crew).
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
    // ---------- kop: de openbare pagina's hebben geen crew-knop, beheren gaat op creatorcove-crew ----------
    let luisteraar = null;
    function veranderd() { if (luisteraar) luisteraar(sessie()); }
    function opCrew(f) { luisteraar = f; f(sessie()); }
    async function login(code) {
        const r = await fetch(API + 'login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
            .then(x => x.json()).catch(() => ({ ok: false, fout: 'Geen verbinding met de server.' }));
        if (r.ok) { zetSessie({ token: r.token, naam: r.naam, tot: Date.now() + 11.5 * 3600000 }); veranderd(); }
        return r;
    }
    function uitloggen() { zetSessie(null); veranderd(); }
    function kop(huidig) {
        document.getElementById('kop').innerHTML = `
          <a class="merk" href="creatorcove-hardcore"><b>Creator Cove</b><span>Hardcore</span></a>
          <nav class="nav" aria-label="Pagina's">
            <a href="creatorcove-hardcore" ${huidig === 'home' ? 'aria-current="page"' : ''}>Home</a>
            <a href="creatorcove-stats" ${huidig === 'stats' ? 'aria-current="page"' : ''}>Statistieken</a>
            <a href="creatorcove-deelnemers" ${huidig === 'deelnemers' ? 'aria-current="page"' : ''}>Deelnemers</a>
            <a href="creatorcove-deaths" ${huidig === 'deaths' ? 'aria-current="page"' : ''}>Deaths</a>
            ${huidig === 'crew' ? '<a href="creatorcove-crew" aria-current="page">Crew</a>' : ''}
          </nav>
          <button class="geluidknop" id="geluidknop" type="button" title="Speelt een geluid af als er iemand uitgeschakeld wordt"></button>`;
        const knop = document.getElementById('geluidknop');
        // stond het geluid nog aan van een vorig bezoek, dan mag de browser het pas afspelen na een klik op de pagina
        if (geluidAan && navigator.userActivation && !navigator.userActivation.hasBeenActive) geblokkeerd = true;
        knop.addEventListener('click', () => {
            // stond het al aan en wachtte het alleen op een klik, dan blijft het aan: deze klik is die toestemming
            if (!(geluidAan && geblokkeerd)) geluidAan = !geluidAan;
            geblokkeerd = false;
            try { localStorage.setItem(GELUID_SLEUTEL, geluidAan ? '1' : '0'); } catch { /* geen opslag */ }
            if (geluidAan) speel(laatsteGeluid); // zo klinkt het; de klik zelf geeft de browser ook toestemming voor geluid
            tekenGeluidknop();
        });
        tekenGeluidknop();
        startWachter();
    }

    // ---------- een nieuwe death: perkament rechtsonder en, als het aan staat, het geluid ----------
    // Elke pagina kijkt elke 30 seconden of er een death bij is gekomen. Per nieuwe death schuift rechtsonder een
    // perkament in beeld (hooguit drie tegelijk, 12 seconden, blijft staan zolang de muis erop staat). Bij een verborgen
    // tabblad wordt alleen gekeken als het geluid aan staat (zo hoor je deaths met het tabblad op de achtergrond);
    // anders wordt er weer gekeken zodra het tabblad terugkomt, en verschijnen de gemiste deaths dan alsnog.
    // Het geluid zetten bezoekers zelf aan met de knop in de kop; het staat standaard uit en de keuze blijft in deze
    // browser bewaard. Het is het geluid dat ook in de game klonk (death.geluid, gekozen met /hardcore geluid). Alleen
    // de eigen geluiden uit het resourcepack staan hier als mp3; bij een Minecraft-geluid of een death zonder geluid
    // klinkt de scheepshoorn. Daarna krijgt de pagina 'cc:death', zodat de lijsten meteen verversen. Een browser speelt
    // pas geluid af nadat de bezoeker iets op de pagina heeft gedaan; tot die tijd staat dat op de knop.
    const GELUID_SLEUTEL = 'cc_geluid';
    const GELUIDEN = { 'creatorcove:scheepshoorn': 'minecraft/geluid-scheepshoorn.mp3', 'creatorcove:death_bong': 'minecraft/geluid-death-bong.mp3' };
    const STANDAARD_GELUID = 'creatorcove:scheepshoorn';
    const LUIDSPREKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3Z"/><path class="golf" d="M15.5 8.5a5 5 0 0 1 0 7l-1.2-1.2a3.3 3.3 0 0 0 0-4.6l1.2-1.2Zm2.6-2.6a8.7 8.7 0 0 1 0 12.2l-1.2-1.2a7 7 0 0 0 0-9.8l1.2-1.2Z"/><path class="kruis" d="m15.2 9.4 1.2-1.2 2.1 2.1 2.1-2.1 1.2 1.2-2.1 2.1 2.1 2.1-1.2 1.2-2.1-2.1-2.1 2.1-1.2-1.2 2.1-2.1-2.1-2.1Z"/></svg>';
    let geluidAan = false, geblokkeerd = false, laatsteDeath = null, laatsteGeluid = null, wachter = null;
    try { geluidAan = localStorage.getItem(GELUID_SLEUTEL) === '1'; } catch { /* geen opslag */ }

    function speel(naam) {
        const geluid = new Audio(GELUIDEN[naam] || GELUIDEN[STANDAARD_GELUID]);
        geluid.volume = 0.7;
        geluid.play().then(() => { if (geblokkeerd) { geblokkeerd = false; tekenGeluidknop(); } })
            .catch(() => { geblokkeerd = true; tekenGeluidknop(); });
    }
    function tekenGeluidknop() {
        const knop = document.getElementById('geluidknop');
        if (!knop) return;
        knop.setAttribute('aria-pressed', String(geluidAan));
        knop.classList.toggle('blok', geluidAan && geblokkeerd);
        knop.innerHTML = `${LUIDSPREKER}<span>${!geluidAan ? 'Geluid uit' : geblokkeerd ? 'Geluid: klik op de pagina' : 'Geluid aan'}</span>`;
    }
    function perkament(d) {
        let vak = document.getElementById('cc-meldingen');
        if (!vak) {
            vak = document.createElement('div');
            vak.id = 'cc-meldingen';
            vak.className = 'meldingen';
            vak.setAttribute('aria-live', 'polite');
            document.body.append(vak);
        }
        const el = document.createElement('div');
        el.className = 'deathmelding';
        el.innerHTML = `
          <img class="hoofd" src="${hoofd(d.uuid, 48)}" alt="" width="48" height="48">
          <div class="tekst">
            <span class="label">Uitgeschakeld${d.dag ? ` · Dag ${d.dag}` : ''}</span>
            <b>${esc(d.naam)}</b>
            <span class="oorzaak">${esc(d.oorzaak || 'Doodgegaan')}</span>
            <a href="creatorcove-deaths?zoek=${encodeURIComponent(d.naam)}">Bekijk de death</a>
          </div>
          <button type="button" class="sluit" aria-label="Melding sluiten">&times;</button>`;
        let klok = null;
        const weg = () => {
            clearTimeout(klok);
            el.classList.add('weg');
            setTimeout(() => el.remove(), 300);
        };
        const wacht = ms => { clearTimeout(klok); klok = setTimeout(weg, ms); };
        el.querySelector('.sluit').addEventListener('click', weg);
        el.addEventListener('mouseenter', () => clearTimeout(klok));
        el.addEventListener('mouseleave', () => wacht(4000));
        el.addEventListener('focusin', () => clearTimeout(klok));
        vak.append(el);
        while (vak.children.length > 3) vak.firstElementChild.remove();
        wacht(12000);
    }
    async function kijkDeaths() {
        if (document.hidden && !geluidAan) return;
        let d;
        try { d = await haal('deaths'); } catch { return; }
        const nieuwste = d.deaths[0]; // de lijst komt met de nieuwste death eerst
        if (nieuwste) laatsteGeluid = nieuwste.geluid;
        if (laatsteDeath !== null) {
            const nieuw = d.deaths.filter(x => x.tijd > laatsteDeath).reverse(); // oudste eerst, zoals ze gebeurden
            if (nieuw.length) {
                nieuw.slice(-3).forEach(perkament);
                if (geluidAan) speel(nieuwste.geluid);
                document.dispatchEvent(new CustomEvent('cc:death', { detail: nieuwste }));
            }
        }
        laatsteDeath = Math.max(laatsteDeath ?? 0, nieuwste?.tijd ?? 0);
    }
    function startWachter() {
        if (wachter) return;
        kijkDeaths();
        wachter = setInterval(kijkDeaths, 30000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) kijkDeaths(); });
    }
    // na de eerste klik of toets op de pagina mag de browser geluid afspelen: dan klopt de tekst op de knop weer
    for (const soort of ['pointerdown', 'keydown']) {
        document.addEventListener(soort, e => { if (geblokkeerd && !e.target.closest?.('#geluidknop')) { geblokkeerd = false; tekenGeluidknop(); } }, { passive: true });
    }

    return { API, esc, nl, haal, post, sessie, opCrew, login, uitloggen, kop, hoofd, teamNaam, kanalen, waarde, duur };
})();
