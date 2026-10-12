// Het deeltjesveld van gwnlarss.nl: duizenden lichtdeeltjes die samen een 3D-vorm vormen
// (je naam, een controller, een scherm, een hart, de tool-icoontjes) en daartussen
// overvloeien. Ze wijken uit voor de muis, ademen zacht en krijgen om de 12 s een schokgolf.
import * as THREE from 'three';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const EXTR = { depth: 0.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 3, curveSegments: 24 };
const plat = g => (g.index ? g.toNonIndexed() : g);
const samen = (...g) => mergeGeometries(g.map(x => { x = plat(x); x.deleteAttribute('uv'); return x; }));

// ---------- vormen ----------
export const VORM = {
    tekst(font, tekst) {
        return new TextGeometry(tekst, { font, size: 1, height: 0.35, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.035, bevelSegments: 3 });
    },
    hart() {
        const s = new THREE.Shape();
        s.moveTo(0, -0.95); s.bezierCurveTo(-0.35, -0.6, -1.05, -0.2, -1.05, 0.32);
        s.bezierCurveTo(-1.05, 0.8, -0.65, 1.05, -0.35, 1.05); s.bezierCurveTo(-0.12, 1.05, 0, 0.88, 0, 0.72);
        s.bezierCurveTo(0, 0.88, 0.12, 1.05, 0.35, 1.05); s.bezierCurveTo(0.65, 1.05, 1.05, 0.8, 1.05, 0.32);
        s.bezierCurveTo(1.05, -0.2, 0.35, -0.6, 0, -0.95);
        return new THREE.ExtrudeGeometry(s, { ...EXTR, depth: 0.6 });
    },
    controller() {
        const s = new THREE.Shape();
        s.moveTo(-1.2, 0.55); s.lineTo(1.2, 0.55);
        s.bezierCurveTo(1.75, 0.55, 2.05, 0.1, 2.1, -0.35); s.bezierCurveTo(2.2, -0.95, 1.95, -1.25, 1.6, -1.15);
        s.bezierCurveTo(1.25, -1.05, 1.05, -0.6, 0.7, -0.45); s.lineTo(-0.7, -0.45);
        s.bezierCurveTo(-1.05, -0.6, -1.25, -1.05, -1.6, -1.15); s.bezierCurveTo(-1.95, -1.25, -2.2, -0.95, -2.1, -0.35);
        s.bezierCurveTo(-2.05, 0.1, -1.75, 0.55, -1.2, 0.55);
        const kruis = new THREE.Path();
        const k = [[-1.35, 0.0], [-1.15, 0.0], [-1.15, -0.2], [-0.95, -0.2], [-0.95, -0.4], [-1.15, -0.4], [-1.15, -0.6], [-1.35, -0.6], [-1.35, -0.4], [-1.55, -0.4], [-1.55, -0.2], [-1.35, -0.2]];
        kruis.moveTo(...k[0]); k.slice(1).forEach(p => kruis.lineTo(...p));
        s.holes.push(kruis);
        [[1.15, 0.05], [1.45, -0.2], [0.85, -0.2], [1.15, -0.45]].forEach(([x, y]) => { const h = new THREE.Path(); h.absarc(x, y, 0.12, 0, Math.PI * 2, true); s.holes.push(h); });
        return new THREE.ExtrudeGeometry(s, EXTR);
    },
    scherm() {
        const buiten = new THREE.Shape();
        buiten.moveTo(-2, -1.1); buiten.lineTo(2, -1.1); buiten.lineTo(2, 1.3); buiten.lineTo(-2, 1.3); buiten.lineTo(-2, -1.1);
        const gat = new THREE.Path();
        gat.moveTo(-1.8, -0.9); gat.lineTo(-1.8, 1.1); gat.lineTo(1.8, 1.1); gat.lineTo(1.8, -0.9); gat.lineTo(-1.8, -0.9);
        buiten.holes.push(gat);
        const voet = new THREE.Shape();
        voet.moveTo(-0.25, -1.1); voet.lineTo(0.25, -1.1); voet.lineTo(0.45, -1.6); voet.lineTo(-0.45, -1.6);
        const play = new THREE.Shape();
        play.moveTo(-0.35, 0.55); play.lineTo(0.55, 0.1); play.lineTo(-0.35, -0.35);
        return new THREE.ExtrudeGeometry([buiten, voet, play], EXTR);
    },
    bubbel() {
        const s = new THREE.Shape();
        s.moveTo(-1.4, 1); s.lineTo(1.4, 1); s.quadraticCurveTo(1.8, 1, 1.8, 0.6); s.lineTo(1.8, -0.4);
        s.quadraticCurveTo(1.8, -0.8, 1.4, -0.8); s.lineTo(-0.4, -0.8); s.lineTo(-1.1, -1.4); s.lineTo(-0.9, -0.8);
        s.lineTo(-1.4, -0.8); s.quadraticCurveTo(-1.8, -0.8, -1.8, -0.4); s.lineTo(-1.8, 0.6); s.quadraticCurveTo(-1.8, 1, -1.4, 1);
        [-0.8, 0, 0.8].forEach(x => { const h = new THREE.Path(); h.absarc(x, 0.1, 0.2, 0, Math.PI * 2, true); s.holes.push(h); });
        return new THREE.ExtrudeGeometry(s, EXTR);
    },
    camera() {
        const s = new THREE.Shape();
        s.moveTo(-2, -1.2); s.lineTo(2, -1.2); s.lineTo(2, 1.2); s.lineTo(-2, 1.2);
        const h = new THREE.Path();
        h.moveTo(-1.75, -0.95); h.lineTo(-1.75, 0.95); h.lineTo(1.75, 0.95); h.lineTo(1.75, -0.95);
        s.holes.push(h);
        const punt = new THREE.Shape(); punt.absarc(1.35, -0.6, 0.18, 0, Math.PI * 2);
        return new THREE.ExtrudeGeometry([s, punt], EXTR);
    },
    paperclip() {
        const pad = new THREE.CatmullRomCurve3([
            [0.5, -1.6], [0.5, 1.1], [0, 1.6], [-0.5, 1.1], [-0.5, -1.3], [0, -1.8], [0.85, -1.3], [0.85, 1.4], [0, 2.1], [-0.85, 1.4], [-0.85, -0.6],
        ].map(([x, y]) => new THREE.Vector3(x, y * 0.75, 0)));
        return new THREE.TubeGeometry(pad, 200, 0.13, 12, false);
    },
    maan() {
        const s = new THREE.Shape();
        s.moveTo(0.3, 1.3); s.bezierCurveTo(-1.6, 1.2, -1.6, -1.2, 0.3, -1.3); s.bezierCurveTo(-0.6, -0.75, -0.6, 0.75, 0.3, 1.3);
        const z = [[0.7, 0.9, 0.42], [1.25, 1.35, 0.3]].map(([x, y, g]) => {
            const t = new THREE.Shape(); t.moveTo(x, y + g); t.lineTo(x + g, y + g); t.lineTo(x, y); t.lineTo(x + g, y);
            t.lineTo(x + g, y - 0.08); t.lineTo(x - 0.06, y - 0.08); t.lineTo(x + g - 0.08, y + g - 0.08); t.lineTo(x, y + g - 0.08); return t;
        });
        return new THREE.ExtrudeGeometry([s, ...z], EXTR);
    },
    film() {
        const s = new THREE.Shape();
        s.moveTo(-2, -0.9); s.lineTo(2, -0.9); s.lineTo(2, 0.9); s.lineTo(-2, 0.9);
        for (let i = 0; i < 8; i++) {
            [0.68, -0.68].forEach(y => { const h = new THREE.Path(); const x = -1.75 + i * 0.5; h.moveTo(x, y - 0.1); h.lineTo(x, y + 0.1); h.lineTo(x + 0.22, y + 0.1); h.lineTo(x + 0.22, y - 0.1); s.holes.push(h); });
        }
        [-1.15, 0.05].forEach(x => { const h = new THREE.Path(); h.moveTo(x, -0.42); h.lineTo(x, 0.42); h.lineTo(x + 1.0, 0.42); h.lineTo(x + 1.0, -0.42); s.holes.push(h); });
        return new THREE.ExtrudeGeometry(s, EXTR);
    },
    munt() {
        return samen(new THREE.CylinderGeometry(1.3, 1.3, 0.3, 64).rotateX(Math.PI / 2), new THREE.TorusGeometry(1.2, 0.1, 12, 64).translate(0, 0, 0.16), new THREE.TorusGeometry(0.6, 0.12, 12, 48).translate(0, 0, 0.18));
    },
    lingo() {
        const vakken = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
            const x = -2.1 + c * 0.86, y = 0.1 - r * 0.86, s = new THREE.Shape();
            s.moveTo(x, y); s.lineTo(x + 0.74, y); s.lineTo(x + 0.74, y + 0.74); s.lineTo(x, y + 0.74);
            vakken.push(s);
        }
        return new THREE.ExtrudeGeometry(vakken, EXTR);
    },
    stof() {
        // een losse wolk als beginpunt, de deeltjes "vliegen" daaruit naar de eerste vorm
        return new THREE.IcosahedronGeometry(6, 3);
    },
};

function bemonster(geo, n, breedte) {
    geo = plat(geo);
    geo.computeBoundingBox();
    const b = geo.boundingBox, mid = new THREE.Vector3();
    b.getCenter(mid);
    const schaal = breedte / Math.max(b.max.x - b.min.x, b.max.y - b.min.y);
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
    const uit = new Float32Array(n * 3), p = new THREE.Vector3(), nrm = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
        // vooral de voorkant: dan lees je de vorm scherp, de zijkanten geven alleen wat diepte
        do sampler.sample(p, nrm); while (nrm.z < 0.5 && Math.random() > 0.22);
        uit[i * 3] = (p.x - mid.x) * schaal;
        uit[i * 3 + 1] = (p.y - mid.y) * schaal;
        uit[i * 3 + 2] = (p.z - mid.z) * schaal;
    }
    return uit;
}

const VERTEX = `
attribute float aRand;
attribute vec3 aKleur;
uniform float uTijd, uMaat, uPixel, uGolf, uAlpha;
uniform vec3 uMuis;
varying vec3 vKleur;
varying float vAlpha;
void main() {
    vec3 p = position;
    p += vec3(sin(uTijd * 1.3 + aRand * 40.0), cos(uTijd * 1.1 + aRand * 25.0), sin(uTijd * 0.9 + aRand * 60.0)) * 0.03;
    vec2 d = p.xy - uMuis.xy;
    float kracht = smoothstep(1.7, 0.0, length(d));
    p.xy += normalize(d + 1e-4) * kracht * 0.9;
    p.z += kracht * 1.2;
    float golf = uGolf - length(p.xy) * 0.3;
    float g = uGolf > 0.0 ? exp(-golf * golf * 20.0) : 0.0;
    p += normalize(p + 1e-4) * g * 0.45;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uMaat * uPixel * (0.55 + aRand) * (1.0 + g * 1.6 + kracht * 0.9) / -mv.z;
    vKleur = aKleur * (1.0 + g * 1.8 + kracht * 0.7);
    vAlpha = uAlpha;
}`;
const FRAGMENT = `
varying vec3 vKleur;
varying float vAlpha;
void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    gl_FragColor = vec4(vKleur, pow(1.0 - r * 2.0, 1.7) * vAlpha);
}`;

// Bouwt het veld op een canvas. `vormen` = { naam: { geo, breedte } }; `stand()` wordt elk frame
// aangeroepen en geeft { van, naar, mix, x, y, alpha } terug (waar en hoe het veld nu staat).
export async function deeltjesVeld(canvas, vormen, stand) {
    const klein = innerWidth < 700;
    const N = klein ? 7000 : 14000;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06050c);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    const doelen = {};
    for (const [naam, v] of Object.entries(vormen)) doelen[naam] = bemonster(v.geo, N, v.breedte);

    const pos = new Float32Array(N * 3), rand = new Float32Array(N), kleur = new Float32Array(N * 3);
    const paars = new THREE.Color(0x9146ff), roze = new THREE.Color(0xff3ea5), goud = new THREE.Color(0xffc94a), tmp = new THREE.Color();
    const eerste = doelen[Object.keys(doelen)[1] ?? Object.keys(doelen)[0]];
    for (let i = 0; i < N; i++) {
        rand[i] = Math.random();
        const f = THREE.MathUtils.clamp((eerste[i * 3] + 4) / 8, 0, 1);
        tmp.copy(f < 0.5 ? paars : roze).lerp(f < 0.5 ? roze : goud, f < 0.5 ? f * 2 : (f - 0.5) * 2);
        if (Math.random() < 0.07) tmp.set(0xffffff);
        kleur.set([tmp.r * 0.9, tmp.g * 0.9, tmp.b * 0.9], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    geo.setAttribute('aKleur', new THREE.BufferAttribute(kleur, 3));
    const uniforms = { uTijd: { value: 0 }, uMaat: { value: klein ? 26 : 30 }, uPixel: { value: renderer.getPixelRatio() }, uGolf: { value: -1 }, uAlpha: { value: 1 }, uMuis: { value: new THREE.Vector3(99, 99, 0) } };
    const punten = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const groep = new THREE.Group();
    groep.add(punten);
    scene.add(groep);

    // verre sterren
    const sterPos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) sterPos.set([(Math.random() - 0.5) * 60, (Math.random() - 0.5) * 36, -15 - Math.random() * 20], i * 3);
    const sterGeo = new THREE.BufferGeometry();
    sterGeo.setAttribute('position', new THREE.BufferAttribute(sterPos, 3));
    scene.add(new THREE.Points(sterGeo, new THREE.PointsMaterial({ color: 0x8f86b8, size: 0.06, transparent: true, opacity: 0.7 })));

    const muis = new THREE.Vector2(9, 9), muisDoel = new THREE.Vector2(9, 9);
    addEventListener('pointermove', e => { muisDoel.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); });
    addEventListener('pointerleave', () => muisDoel.set(9, 9));
    const straal = new THREE.Raycaster(), vlak = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), raak = new THREE.Vector3();

    function maat() {
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }
    maat();
    addEventListener('resize', maat);

    const rustig = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const klok = new THREE.Clock();
    const huidig = { x: 0, y: 0, alpha: 1 };
    renderer.setAnimationLoop(() => {
        const tijd = klok.getElapsedTime();
        const s = stand(tijd);
        const A = doelen[s.van], B = doelen[s.naar];
        huidig.x += (s.x - huidig.x) * 0.08;
        huidig.y += (s.y - huidig.y) * 0.08;
        huidig.alpha += (s.alpha - huidig.alpha) * 0.08;
        for (let i = 0; i < N; i++) {
            const m = THREE.MathUtils.clamp(s.mix * 1.6 - rand[i] * 0.6, 0, 1);
            const e = m * m * (3 - 2 * m);
            const j = i * 3;
            pos[j] = A[j] + (B[j] - A[j]) * e;
            pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * e;
            pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * e + Math.sin(e * Math.PI) * (rand[i] - 0.5) * 3;
        }
        geo.attributes.position.needsUpdate = true;

        muis.lerp(muisDoel, 0.15);
        straal.setFromCamera(muis, camera);
        if (straal.ray.intersectPlane(vlak, raak)) uniforms.uMuis.value.set(raak.x - huidig.x, raak.y - huidig.y, 0);
        uniforms.uTijd.value = rustig ? 0 : tijd;
        uniforms.uAlpha.value = huidig.alpha;
        const ronde = (tijd - 3) % 12;
        uniforms.uGolf.value = !rustig && tijd > 3 && ronde < 2.2 ? ronde * 9 : -1;

        groep.position.set(huidig.x, huidig.y, 0);
        groep.rotation.y = rustig ? 0 : Math.sin(tijd * 0.25) * 0.25 + muis.x * 0.25 * (Math.abs(muis.x) < 2 ? 1 : 0);
        groep.rotation.x = rustig ? 0 : Math.sin(tijd * 0.2) * 0.08 - (Math.abs(muis.y) < 2 ? muis.y * 0.12 : 0);
        renderer.render(scene, camera);
    });
}

export async function laadFont(url) {
    return new Font(await (await fetch(url)).json());
}
