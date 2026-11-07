// Geluiden voor de alerts van Mattie (gwnlarss.nl/mattie), opgewekt in de browser zonder geluidsbestand.
// Gedeeld door alerts.html en de instelpagina, zodat de test op de pagina precies klinkt als in OBS.
// Per stijl een eigen klank: logo = marimba-loopje met een plop, blokken = blokjes die neergezet worden
// (korte tikken) met een chiptune-loopje, veeg = zwiep van links naar rechts met een vol akkoord.
// mattieGeluid(stijl, soort, volume).
window.mattieGeluid = (() => {
    let ac = null;
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    // hoe groter de alert, hoe langer het loopje
    const LOOP = { follower: [72, 76, 79], subscriber: [72, 76, 79, 84], resub: [72, 76, 79, 84], gift: [72, 76, 79, 84, 88], cheer: [74, 78, 81, 86], raid: [67, 72, 76, 79, 84], donatie: [72, 77, 81, 84] };

    function marimba(t, f, sterk, uit) {   // houtachtige toon: grondtoon plus een korte hoge tik
        for (const [mul, g, lang] of [[1, 1, 0.55], [4, 0.25, 0.08], [10, 0.08, 0.03]]) {
            const o = ac.createOscillator(), v = ac.createGain();
            o.type = 'sine'; o.frequency.value = f * mul;
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g * sterk, t + 0.004); v.gain.exponentialRampToValueAtTime(0.0001, t + lang);
            o.connect(v).connect(uit); o.start(t); o.stop(t + lang + 0.05);
        }
    }
    function ruis(t, lang, filterVan, filterNaar, sterk, uit) {
        const n = Math.floor(ac.sampleRate * lang), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
        s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2;
        f.frequency.setValueAtTime(filterVan, t); f.frequency.exponentialRampToValueAtTime(filterNaar, t + lang);
        v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(sterk, t + lang * 0.4); v.gain.linearRampToValueAtTime(0, t + lang);
        s.connect(f).connect(v).connect(uit); s.start(t); s.stop(t + lang);
    }
    function logo(t0, noten, uit) {
        // plop (zoals het logo dat erin stuitert), dan het loopje
        const o = ac.createOscillator(), v = ac.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(180, t0); o.frequency.exponentialRampToValueAtTime(620, t0 + 0.09);
        v.gain.setValueAtTime(0.35, t0); v.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(v).connect(uit); o.start(t0); o.stop(t0 + 0.2);
        noten.forEach((n, i) => marimba(t0 + 0.14 + i * 0.1, hz(n), 0.4, uit));
        marimba(t0 + 0.14 + noten.length * 0.1 + 0.05, hz(noten[0] + 12), 0.3, uit);
    }
    function blokken(t0, noten, uit) {
        // drie "blok neerzetten"-tikken (kort ruisje laag), dan een vierkant chiptune-loopje
        for (let i = 0; i < 3; i++) ruis(t0 + i * 0.13, 0.07, 900, 300, 0.5, uit);
        const t = t0 + 0.42;
        noten.forEach((n, i) => {
            const o = ac.createOscillator(), v = ac.createGain(), f = ac.createBiquadFilter();
            o.type = 'square'; o.frequency.value = hz(n); f.type = 'lowpass'; f.frequency.value = 3000;
            const s = t + i * 0.085;
            v.gain.setValueAtTime(0, s); v.gain.linearRampToValueAtTime(0.07, s + 0.005); v.gain.setValueAtTime(0.07, s + 0.07); v.gain.linearRampToValueAtTime(0, s + 0.08);
            o.connect(f).connect(v).connect(uit); o.start(s); o.stop(s + 0.09);
        });
        const s = t + noten.length * 0.085, o = ac.createOscillator(), v = ac.createGain();   // slottoon iets langer
        o.type = 'square'; o.frequency.value = hz(noten.at(-1) + 12);
        v.gain.setValueAtTime(0.06, s); v.gain.exponentialRampToValueAtTime(0.0001, s + 0.4);
        o.connect(v).connect(uit); o.start(s); o.stop(s + 0.45);
    }
    function veeg(t0, noten, uit) {
        // zwiep, dan een vol akkoord dat even blijft hangen met het loopje erboven
        ruis(t0, 0.45, 400, 5000, 0.35, uit);
        const t = t0 + 0.38, f = ac.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(700, t + 1.6); f.connect(uit);
        for (const n of [noten[0] - 12, noten[0] - 5, noten[0], noten[1]]) {
            const o = ac.createOscillator(), v = ac.createGain();
            o.type = 'sawtooth'; o.frequency.value = hz(n);
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.045, t + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
            o.connect(v).connect(f); o.start(t); o.stop(t + 1.75);
        }
        noten.forEach((n, i) => marimba(t + 0.15 + i * 0.08, hz(n + 12), 0.22, uit));
    }

    return (stijl, soort, volume = 0.7) => {
        try {
            ac ??= new (window.AudioContext || window.webkitAudioContext)();
            if (ac.state === 'suspended') ac.resume();
            const uit = ac.createGain(); uit.gain.value = Math.min(1, Math.max(0, volume)); uit.connect(ac.destination);
            const noten = LOOP[soort] ?? LOOP.follower, t0 = ac.currentTime + 0.05;
            ({ logo, blokken, veeg }[stijl] ?? logo)(t0, noten, uit);
        } catch { /* geen geluid mogelijk */ }
    };
})();
