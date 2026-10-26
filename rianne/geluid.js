// Geluiden voor de alerts van Rianne (gwnlarss.nl/rianne), opgewekt in de browser zonder geluidsbestand.
// Gedeeld door alerts.html en de instelpagina, zodat de test op de pagina precies klinkt als in OBS.
// Per stijl een eigen klank: glitter = glockenspiel-tinkel, ragebait = korte sirene met een stoot,
// led = warm akkoord dat aanzwelt met tinkels erboven. rianneGeluid(stijl, soort, volume).
window.rianneGeluid = (() => {
    let ac = null;
    const hz = n => 440 * 2 ** ((n - 69) / 12);
    // hoe groter de alert, hoe hoger en langer het loopje
    const LOOP = { follower: [79, 84, 88], subscriber: [79, 84, 88, 91], resub: [79, 84, 88, 91], gift: [79, 84, 88, 91, 96], cheer: [81, 86, 89, 93], raid: [76, 79, 84, 88, 91], donatie: [79, 83, 86, 91] };

    function belletje(t, f, sterk, uit) {   // glockenspiel: grondtoon met de typische hoge boventoon, snel uitklinkend
        for (const [mul, g, lang] of [[1, 1, 1.4], [2.76, 0.35, 0.5], [5.4, 0.12, 0.25]]) {
            const o = ac.createOscillator(), v = ac.createGain();
            o.type = 'sine'; o.frequency.value = f * mul;
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g * sterk, t + 0.006); v.gain.exponentialRampToValueAtTime(0.0001, t + lang);
            o.connect(v).connect(uit); o.start(t); o.stop(t + lang + 0.05);
        }
    }
    function glitter(t0, noten, uit) {
        noten.forEach((n, i) => belletje(t0 + i * 0.075, hz(n), 0.32, uit));
        // een paar losse hoge tinkels erachteraan, als glitter die nadwarrelt
        for (let i = 0; i < 5; i++) belletje(t0 + noten.length * 0.075 + 0.08 + i * 0.09 + Math.random() * 0.04, hz(noten.at(-1) + [12, 7, 16, 12, 19][i]), 0.09, uit);
    }
    function ragebait(t0, noten, uit) {
        // twee keer "wie-woe" (zacht, niet schel), dan een vrolijke stoot
        for (let i = 0; i < 2; i++) {
            const o = ac.createOscillator(), v = ac.createGain(), t = t0 + i * 0.32;
            o.type = 'triangle';
            o.frequency.setValueAtTime(hz(81), t); o.frequency.linearRampToValueAtTime(hz(86), t + 0.14); o.frequency.setValueAtTime(hz(77), t + 0.16); o.frequency.linearRampToValueAtTime(hz(74), t + 0.3);
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.16, t + 0.02); v.gain.setValueAtTime(0.16, t + 0.27); v.gain.linearRampToValueAtTime(0, t + 0.31);
            o.connect(v).connect(uit); o.start(t); o.stop(t + 0.33);
        }
        const t = t0 + 0.7;
        for (const n of [noten[0] - 12, noten[1] - 12, noten[2] - 12]) {   // akkoord als stoot
            const o = ac.createOscillator(), v = ac.createGain();
            o.type = 'square'; o.frequency.value = hz(n);
            const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
            v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(0.06, t + 0.01); v.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
            o.connect(f).connect(v).connect(uit); o.start(t); o.stop(t + 0.6);
        }
        belletje(t + 0.12, hz(noten.at(-1)), 0.25, uit);
    }
    function led(t0, noten, uit) {
        // warm akkoord dat opengaat (zoals een ledstrip die aanfloept), daarboven het tinkelloopje
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 2;
        f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(2600, t0 + 0.7); f.frequency.exponentialRampToValueAtTime(900, t0 + 2.6);
        f.connect(uit);
        for (const n of [60, 64, 67, 71, 74]) for (const ont of [-6, 6]) {
            const o = ac.createOscillator(), v = ac.createGain();
            o.type = 'sawtooth'; o.frequency.value = hz(n); o.detune.value = ont;
            v.gain.setValueAtTime(0, t0); v.gain.linearRampToValueAtTime(0.028, t0 + 0.45); v.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.8);
            o.connect(v).connect(f); o.start(t0); o.stop(t0 + 2.9);
        }
        noten.forEach((n, i) => belletje(t0 + 0.35 + i * 0.09, hz(n), 0.24, uit));
    }

    return (stijl, soort, volume = 0.7) => {
        try {
            ac ??= new (window.AudioContext || window.webkitAudioContext)();
            if (ac.state === 'suspended') ac.resume();
            const uit = ac.createGain(); uit.gain.value = Math.min(1, Math.max(0, volume)); uit.connect(ac.destination);
            const noten = LOOP[soort] ?? LOOP.follower, t0 = ac.currentTime + 0.05;
            ({ glitter, ragebait, led }[stijl] ?? glitter)(t0, noten, uit);
        } catch { /* geen geluid mogelijk */ }
    };
})();
