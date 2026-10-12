// Het massieve 3D-logo uit versie 1: parelwitte voorkant, paarse chroomkant, draaiende lampen,
// zwevende kristallen en een neonvloer. Transparant getekend boven het deeltjesveld; bij het
// scrollen draait het weg en vervaagt het.
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const PAARS = 0x9146ff, ROZE = 0xff3ea5, GOUD = 0xffc94a;
const glans = (kleur, extra = {}) => new THREE.MeshPhysicalMaterial({ color: kleur, roughness: 0.2, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.06, iridescence: 0.45, emissive: kleur, emissiveIntensity: 0.12, ...extra });
const centreer = g => { g.computeBoundingBox(); const b = g.boundingBox; return g.translate(-(b.max.x + b.min.x) / 2, -(b.max.y + b.min.y) / 2, -(b.max.z + b.min.z) / 2); };

export function logoPodium(canvas, font) {
    const rustig = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07060d, 0.05);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(0, 0.4, 9.5);

    const logoGeo = centreer(new TextGeometry('GwnLarss', { font, size: 1, height: 0.34, curveSegments: 12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.035, bevelSegments: 8 }));
    const logo = new THREE.Mesh(logoGeo, [
        new THREE.MeshPhysicalMaterial({ color: 0xfff6fb, roughness: 0.22, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.6, sheen: 0.4, sheenColor: new THREE.Color(ROZE) }),
        new THREE.MeshStandardMaterial({ color: PAARS, roughness: 0.28, metalness: 0.9 }),
    ]);
    const logoHouder = new THREE.Group();
    logoHouder.add(logo);
    scene.add(logoHouder);

    scene.add(new THREE.AmbientLight(0x6a5a8a, 0.35));
    const lampen = [[PAARS, 90, 5.5, 0.31, 0, 1.6], [ROZE, 80, 5, -0.23, 2.1, -1.2], [GOUD, 30, 4.2, 0.17, 4, 0.2]].map(([k, s, r, v, f, h]) => {
        const l = new THREE.PointLight(k, s, 30, 1.6); scene.add(l); return { l, r, v, f, h };
    });
    const zon = new THREE.DirectionalLight(0xffffff, 0.8); zon.position.set(2, 4, 6); scene.add(zon);

    const vloer = new THREE.GridHelper(120, 120, PAARS, 0x3a1d6e);
    vloer.material.transparent = true; vloer.material.opacity = 0.55; vloer.position.y = -3.2; scene.add(vloer);

    const vormen = [new THREE.OctahedronGeometry(0.32), new THREE.IcosahedronGeometry(0.26), new THREE.TetrahedronGeometry(0.3)];
    const kleuren = [PAARS, ROZE, GOUD, 0xffffff];
    const kristallen = Array.from({ length: 16 }, (_, i) => {
        const m = new THREE.Mesh(vormen[i % 3], glans(kleuren[i % 4], { flatShading: true }));
        m.scale.setScalar(0.6 + Math.random() * 0.9); scene.add(m);
        return { m, hoek: (i / 16) * Math.PI * 2, straal: 5 + (i % 4) * 1.1, hoogte: (Math.random() - 0.5) * 4.5, diepte: -2.8 - Math.random() * 5, snel: 0.05 + Math.random() * 0.06 };
    });

    let logoSchaal = 1;
    function maat() {
        const w = innerWidth, h = innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        const zicht = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
        logoSchaal = (zicht * (w < 700 ? 0.82 : 0.6)) / (logoGeo.boundingBox.max.x - logoGeo.boundingBox.min.x);
    }
    maat(); addEventListener('resize', maat);

    // muis kantelt het logo, scrollen laat het wegdraaien
    const muis = { x: 0, y: 0 }, doel = { x: 0, y: 0 };
    addEventListener('pointermove', e => { doel.x = e.clientX / innerWidth - 0.5; doel.y = e.clientY / innerHeight - 0.5; });

    const klok = new THREE.Clock();
    renderer.setAnimationLoop(() => {
        const scroll = Math.min(1, scrollY / innerHeight);
        const zicht = Math.max(0, 1 - scroll * 1.5);
        canvas.style.opacity = String(zicht);
        if (zicht <= 0) { klok.getDelta(); return; }
        const dt = Math.min(klok.getDelta(), 0.1), t = rustig ? 0 : klok.elapsedTime;
        muis.x += (doel.x - muis.x) * 0.06; muis.y += (doel.y - muis.y) * 0.06;
        const intro = rustig ? 1 : Math.min(1, klok.elapsedTime / 2.2), e = 1 - Math.pow(1 - intro, 4);
        const ronde = t > 2.2 ? ((t - 2.2) % 12) - 8 : -1, p = Math.min(1, Math.max(0, ronde / 1.9));
        const draai = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        logoHouder.scale.setScalar(Math.max(0.001, logoSchaal * e * (1 + Math.sin(p * Math.PI) * 0.08) * (1 - scroll * 0.35)));
        logo.rotation.y = (1 - e) * -Math.PI * 1.2 + draai * Math.PI * 2 + Math.sin(t * 0.45) * 0.15 + muis.x * 0.7 + scroll * 1.2;
        logo.rotation.x = muis.y * 0.4 - scroll * 0.5;
        logoHouder.position.y = 0.9 + Math.sin(t * 0.8) * 0.12 + scroll * 3.5;
        lampen.forEach(({ l, r, v, f, h }) => { const a = t * v + f; l.position.set(Math.cos(a) * r, h + Math.sin(a * 1.7) * 0.8, 2.6 + Math.sin(a) * 1.8); });
        vloer.position.z = (t * 1.6) % 1;
        camera.position.x = muis.x * 0.8; camera.position.y = 0.4 - muis.y * 0.4; camera.lookAt(0, 0.4, 0);
        kristallen.forEach(k => { const a = k.hoek + t * k.snel; k.m.position.set(Math.cos(a) * k.straal, k.hoogte + Math.sin(t * 0.7 + k.hoek * 3) * 0.35, k.diepte + Math.sin(a)); k.m.rotation.x += dt * 0.5; k.m.rotation.y += dt * 0.7; });
        renderer.render(scene, camera);
    });
}
