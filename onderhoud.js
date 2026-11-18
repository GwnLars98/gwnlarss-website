// Onderhoudsmelding van GwnLarss. Aan te zetten op api.gwnlarss.nl/status.html; dit script leest
// api.gwnlarss.nl/api/onderhoud en toont onderin een kaartje. Staat bewust hier op gwnlarss.nl, zodat het
// ook laadt als api.gwnlarss.nl even plat ligt. Geladen door de tools hier en (automatisch ingevoegd) door
// de instel- en beheerpagina's op api.gwnlarss.nl, nooit door de OBS-overlays.
(() => {
    const API = 'https://api.gwnlarss.nl/api/onderhoud';
    const stijl = document.createElement('style');
    stijl.textContent = `
        .gl-onderhoud { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 2147483000; width: min(640px, calc(100vw - 32px));
            display: flex; gap: 14px; align-items: flex-start; padding: 16px 18px; border-radius: 18px; box-sizing: border-box;
            background: rgba(15, 12, 28, 0.96); border: 1.5px solid #ffc94a; color: #f3f1fa; box-shadow: 0 18px 50px -12px rgba(0, 0, 0, 0.8);
            font: 500 15px/1.5 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; }
        .gl-onderhoud[hidden] { display: none; }
        .gl-onderhoud.gepland { border-color: #9146ff; }
        .gl-onderhoud .gl-o-icoon { font-size: 1.5rem; line-height: 1.2; }
        .gl-onderhoud b { display: block; font-family: 'Baloo 2', 'Trebuchet MS', sans-serif; font-weight: 800; font-size: 1.1rem; margin-bottom: 2px; }
        .gl-onderhoud p { margin: 0; color: #c9c5dd; }
        .gl-onderhoud p + p { margin-top: 6px; color: #f3f1fa; }
        .gl-onderhoud button { margin-left: auto; flex-shrink: 0; font: inherit; font-size: 1.2rem; line-height: 1; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.15); background: transparent; color: #a9a5c2; cursor: pointer; }
        .gl-onderhoud button:hover { color: #fff; }
        .gl-onderhoud button[hidden] { display: none; }`;
    const kaart = document.createElement('div');
    kaart.className = 'gl-onderhoud';
    kaart.setAttribute('role', 'status');
    kaart.hidden = true;
    kaart.innerHTML = '<span class="gl-o-icoon" aria-hidden="true"></span><div><b></b><p></p><p></p></div><button type="button" aria-label="Sluiten">×</button>';
    const [icoon, , knop] = kaart.children;
    const [titel, zin, eigen] = kaart.querySelector('div').children;
    let sleutel = '';
    knop.addEventListener('click', () => {
        kaart.hidden = true;
        try { sessionStorage.setItem('gl-onderhoud-dicht', sleutel); } catch { /* geen opslag, dan gewoon tot herladen */ }
    });
    const zet = () => { if (!kaart.isConnected && document.body) { document.head.append(stijl); document.body.append(kaart); } };

    const tijd = ms => new Date(ms).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
    const dag = ms => new Date(ms).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' });

    function toon(soort, kop, regel, tekst, sluitbaar, id) {
        sleutel = id;
        let dicht = '';
        try { dicht = sessionStorage.getItem('gl-onderhoud-dicht') || ''; } catch { /* zie hierboven */ }
        if (sluitbaar && dicht === id) { kaart.hidden = true; return; }
        zet();
        kaart.classList.toggle('gepland', soort === 'gepland');
        icoon.textContent = soort === 'gepland' ? '📅' : '🛠️';
        titel.textContent = kop;
        zin.textContent = regel;
        eigen.textContent = tekst || '';
        eigen.hidden = !tekst;
        knop.hidden = !sluitbaar;
        kaart.hidden = false;
    }

    let mislukt = 0;
    async function check() {
        try {
            const d = await (await fetch(API, { cache: 'no-store' })).json();
            mislukt = 0;
            if (d.actief) {
                toon('actief', 'Onderhoud bezig', `De tools krijgen even onderhoud, sommige dingen werken misschien tijdelijk niet.${d.tot ? ` Klaar rond ${tijd(d.tot)}.` : ''}`, d.tekst, false, 'actief');
            } else if (d.gepland) {
                const g = d.gepland;
                toon('gepland', 'Gepland onderhoud', `Op ${dag(g.start)} vanaf ${tijd(g.start)}${g.eind ? ` tot ${tijd(g.eind)}` : ''} krijgen de tools onderhoud. Sommige dingen werken dan misschien even niet.`, g.tekst, true, `gepland-${g.start}`);
            } else {
                kaart.hidden = true;
            }
        } catch {
            // twee keer achter elkaar geen antwoord: de server ligt waarschijnlijk plat voor onderhoud
            if (++mislukt >= 2) toon('actief', 'Even niet bereikbaar', 'De server achter de tools reageert nu niet. Waarschijnlijk wordt er aan gewerkt, probeer het zo opnieuw.', '', false, 'weg');
        }
    }
    check();
    setInterval(check, 60000);
})();
