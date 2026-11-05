/* =========================================================
   CUTTING CHAI  —  script.js
   Builds the 3-D store with three.js (r128).

   How it is organised (search for the "// ----------" markers):
     · palette  const C            → scene colours (match style.css tokens)
     · helpers  box / cyl / plane  → simple shapes
     · textures canvasTex          → signs, menu and posters drawn in 2-D
     · store parts                 → sign, awning, counter, chai station,
                                     menu board, poster wall, standing bar…
     · camera views                → street, window, counter, standing,
                                     retail, top
   To change wording on a sign: search for fillText('
   To change a colour: edit const C below.
   ========================================================= */

(function () {
  // ---------- palette: Cutting Chai brand colours ----------
  const C = {
    pink:   '#D6246E', // Rani Pink   · primary
    yellow: '#F6C330', // Haldi Yellow · primary
    brown:  '#3B1D10', // Chai Brown  · type + lines
    chai:   '#5A2E1A', // lighter chai brown · surfaces
    cream:  '#F3E3C3', // Doodh Cream · paper
    white:  '#FFF6E4', // warm white
    steel:  '#C9CFD2'  // steel pots + glasses
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch (e) { document.getElementById('err').style.display = 'flex'; return; }
  const stage = document.getElementById('stage');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.cream);
  scene.fog = new THREE.Fog(C.cream, 28, 60);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 3; controls.maxDistance = 34;

  // ---------- helpers ----------
  const mat = (color, opts) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0 }, opts || {}));
  function box(w, h, d, m, x, y, z, parent) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    (parent || scene).add(mesh); return mesh;
  }
  function cyl(rt, rb, h, m, x, y, z, seg) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), m);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function plane(w, h, tex, x, y, z, ry) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
    mesh.position.set(x, y, z); mesh.rotation.y = ry || 0; mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  function stripes(g, w, h, size, vertical) {
    const cols = [C.pink, C.yellow, C.chai, C.cream];
    for (let i = 0; i * size < (vertical ? h : w); i++) {
      g.fillStyle = cols[i % 4];
      if (vertical) g.fillRect(0, i * size, w, size); else g.fillRect(i * size, 0, size, h);
    }
  }
  function sunburst(g, cx, cy, r, a, b, n) {
    for (let i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(cx, cy);
      g.arc(cx, cy, r, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2);
      g.closePath(); g.fillStyle = i % 2 ? a : b; g.fill();
    }
  }
  function frame(g, w, h, outer, inner, s) {
    g.lineWidth = s; g.strokeStyle = outer; g.strokeRect(s / 2, s / 2, w - s, h - s);
    g.lineWidth = s * 0.6; g.strokeStyle = inner; g.strokeRect(s * 1.8, s * 1.8, w - s * 3.6, h - s * 3.6);
  }

  function build() {
    // ---------- lights ----------
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75);
    sun.position.set(-8, 14, 12); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
    scene.add(sun);

    // Store box: 8 wide (x -4..4), 7 deep (z -7..0), 3.6 tall. Front open at z = 0.
    const W = 8, D = 7, H = 3.6;

    // ---------- street + sidewalk ----------
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat('#8E8A84'));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
    const walkTex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = '#CFC8BC'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#B4AC9F'; g.lineWidth = 3;
      for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    });
    walkTex.wrapS = walkTex.wrapT = THREE.RepeatWrapping; walkTex.repeat.set(4, 1);
    const walk = new THREE.Mesh(new THREE.BoxGeometry(24, 0.15, 4.5), new THREE.MeshStandardMaterial({ map: walkTex, roughness: 0.95 }));
    walk.position.set(0, 0.075, 2.25); walk.receiveShadow = true; scene.add(walk);

    // ---------- shell ----------
    const wallTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#F0D48A'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(90,46,26,0.10)';
      for (let i = 0; i < 900; i++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    });
    const wallM = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
    const floorTex = canvasTex(512, 512, (g, w, h) => {
      const s = 64;
      for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
        g.fillStyle = ((x + y) / s) % 2 ? '#2E7F84' : '#F3E3C3'; g.fillRect(x, y, s, s);
      }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(2, 1.75);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }));
    floor.position.set(0, 0.16, -D / 2); floor.receiveShadow = true; scene.add(floor);
    box(W, H, 0.2, wallM, 0, H / 2, -D);            // back wall
    box(0.2, H, D, wallM, -W / 2, H / 2, -D / 2);    // left wall
    box(0.2, H, D, wallM, W / 2, H / 2, -D / 2);     // right wall
    // facade pillars + header above the opening
    const facadeM = mat(C.cream);
    box(1.0, H, 0.3, facadeM, -W / 2 + 0.4, H / 2, 0);
    box(1.0, H, 0.3, facadeM, W / 2 - 0.4, H / 2, 0);
    box(W + 0.4, 0.25, 0.4, mat(C.brown), 0, H + 0.12, 0); // cornice; roof left open like a diorama
    // ---------- shop sign ----------
    const signTex = canvasTex(1024, 256, (g, w, h) => {
      g.fillStyle = C.yellow; g.fillRect(0, 0, w, h);
      sunburst(g, 120, 128, 300, C.cream, C.yellow, 28);
      g.fillStyle = C.chai; g.beginPath(); g.arc(120, 128, 92, 0, Math.PI * 2); g.fill();
      g.lineWidth = 8; g.strokeStyle = C.brown; g.stroke();
      // half glass
      g.fillStyle = C.cream; g.beginPath(); g.moveTo(92, 82); g.lineTo(148, 82); g.lineTo(140, 176); g.lineTo(100, 176); g.closePath(); g.fill();
      g.fillStyle = '#B8732E'; g.beginPath(); g.moveTo(96, 130); g.lineTo(144, 130); g.lineTo(140, 176); g.lineTo(100, 176); g.closePath(); g.fill();
      g.fillStyle = C.pink; g.fillRect(250, 0, w - 250, h);
      g.font = '100px "Rozha One", Georgia, serif'; g.textBaseline = 'middle';
      g.fillStyle = C.brown; g.fillText('CUTTING CHAI', 290, 112);
      g.fillStyle = C.yellow; g.fillText('CUTTING CHAI', 283, 105);
      g.font = '60px "Rozha One", serif'; g.fillStyle = '#FFFFFF'; g.fillText('कटिंग चाय', 300, 210);
      frame(g, w, h, C.brown, C.yellow, 14);
    });
    const sign = box(W - 0.4, 1.0, 0.12, new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }), 0, H - 0.35, 0.18);
    sign.castShadow = false;

    // ---------- striped awning ----------
    const awnTex = canvasTex(512, 64, (g, w, h) => stripes(g, w, h, 32, false));
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.6, 1.4), new THREE.MeshStandardMaterial({ map: awnTex, side: THREE.DoubleSide, roughness: 0.8 }));
    awning.position.set(0, H - 1.15, 0.85); awning.rotation.x = -Math.PI / 2 + 0.55; awning.castShadow = true; scene.add(awning);
    // scalloped edge
    for (let i = 0; i < 14; i++) {
      const scal = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16, 0, Math.PI), new THREE.MeshStandardMaterial({ color: [C.pink, C.yellow, C.chai, C.cream][i % 4], side: THREE.DoubleSide }));
      scal.position.set(-W / 2 + 0.6 + i * ((W - 1.2) / 13), H - 1.82, 1.42); scal.rotation.z = Math.PI; scene.add(scal);
    }
    // rolled-up shutter
    const shut = cyl(0.22, 0.22, W - 1.6, mat('#9EA5AA', { metalness: 0.5, roughness: 0.4 }), 0, H - 0.98, 0.05);
    shut.rotation.z = Math.PI / 2;

    // ---------- front: pickup window counter ----------
    const frontCounter = box(W - 1.8, 1.05, 0.7, mat(C.chai), 0, 0.68, -0.4);
    const fcTex = canvasTex(1024, 160, (g, w, h) => {
      g.fillStyle = C.chai; g.fillRect(0, 0, w, h);
      stripes(g, w, 22, 22, false);
      g.fillStyle = C.yellow; g.font = '64px "Rozha One", Georgia, serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
      g.fillText('EK CUTTING · $2', w / 2, 92);
    });
    plane(W - 1.8, 0.75, fcTex, 0, 0.62, -0.04);
    box(W - 1.6, 0.08, 0.95, mat(C.chai), 0, 1.24, -0.4); // counter top
    // two glasses on the window ledge
    glass(-0.6, 1.28, -0.25); glass(-0.35, 1.28, -0.3);

    // ---------- chai station (left, behind window) ----------
    box(2.6, 0.95, 0.9, mat(C.brown), -2.4, 0.63, -2.2);
    box(2.7, 0.06, 1.0, mat('#B9BEC3', { metalness: 0.6, roughness: 0.35 }), -2.4, 1.13, -2.2);
    const potM = mat(C.steel, { metalness: 0.75, roughness: 0.25 });
    const pots = [cyl(0.36, 0.32, 0.55, potM, -3.0, 1.45, -2.2), cyl(0.3, 0.27, 0.45, potM, -2.2, 1.4, -2.25)];
    const chaiTop = mat('#B8732E');
    cyl(0.33, 0.33, 0.02, chaiTop, -3.0, 1.7, -2.2); cyl(0.27, 0.27, 0.02, chaiTop, -2.2, 1.61, -2.25);
    // stove flames
    [-3.0, -2.2].forEach(x => { const f = cyl(0.25, 0.25, 0.04, new THREE.MeshBasicMaterial({ color: 0x3a7bff }), x, 1.18, -2.2); f.castShadow = false; });
    // a row of steel glasses waiting
    for (let i = 0; i < 6; i++) glass(-1.6 + (i % 3) * 0.22, 1.18, -2.0 - Math.floor(i / 3) * 0.22);
    // kulhad stack
    for (let i = 0; i < 4; i++) cyl(0.11, 0.08, 0.16, mat('#A9502A'), -1.25, 1.24 + i * 0.13, -2.45);

    // ---------- menu board on the back wall ----------
    const menuTex = canvasTex(600, 840, (g, w, h) => {
      g.fillStyle = C.chai; g.fillRect(0, 0, w, h); frame(g, w, h, C.brown, C.yellow, 16);
      g.textAlign = 'center'; g.fillStyle = C.yellow; g.font = '56px "Rozha One", Georgia, serif'; g.fillText('CUTTING CHAI', w / 2, 120);
      g.font = '52px "Rozha One", serif'; g.fillText('आज का मेनू', w / 2, 200);
      const rows = [['Cutting Chai', '$2'], ['Adrak', '$2'], ['Elaichi', '$2'], ['Masala', '$2'], ['Kadak', '$2'], ['Gavti Chaha', '$2.50'], ['Sulaimani', '$2.50'], ['Kashmiri Kahwa', '$3.50'], ['Noon Chai', '$3.50']];
      g.font = '700 30px "Playfair Display", serif'; g.fillStyle = '#FFFFFF';
      rows.forEach((r, i) => { const y = 270 + i * 50; g.textAlign = 'left'; g.fillText(r[0], 60, y); g.textAlign = 'right'; g.fillText(r[1], w - 60, y); });
      g.fillStyle = C.pink; g.fillRect(40, h - 130, w - 80, 80);
      g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.font = '40px "Rozha One", Georgia, serif'; g.fillText('DO CUTTING · $4', w / 2, h - 76);
    });
    plane(1.5, 2.1, menuTex, -2.2, 2.35, -D + 0.12);

    // ---------- poster wall (back, right of menu) ----------
    const posterA = canvasTex(400, 600, (g, w, h) => {
      g.fillStyle = C.yellow; g.fillRect(0, 0, w, h); frame(g, w, h, C.brown, C.yellow, 12);
      g.textAlign = 'center'; g.fillStyle = C.pink; g.font = '78px "Rozha One", serif';
      g.fillText('Missed', w / 2, 250); g.fillText('Connection', w / 2, 330);
      g.fillStyle = C.brown; g.font = '34px "Rozha One", serif'; g.fillText('आधी चाय, पूरा प्यार', w / 2, 390);
      g.font = '700 18px "Playfair Display", serif'; g.fillText('CUTTING CHAI PRESENTS', w / 2, 90);
    });
    const posterB = canvasTex(400, 600, (g, w, h) => {
      g.fillStyle = C.pink; g.fillRect(0, 0, w, h); frame(g, w, h, C.yellow, C.pink, 12);
      g.textAlign = 'center'; g.fillStyle = C.yellow; g.font = '64px "Rozha One", serif';
      g.fillText('Who gets', w / 2, 230); g.fillText('your other', w / 2, 300); g.fillText('half?', w / 2, 370);
      g.fillStyle = '#F3E3C3'; g.font = '700 20px "Playfair Display", serif'; g.fillText('Write it down. Then bring them.', w / 2, 450);
    });
    const posterC = canvasTex(400, 600, (g, w, h) => {
      g.fillStyle = C.brown; g.fillRect(0, 0, w, h); frame(g, w, h, C.yellow, C.brown, 12);
      g.textAlign = 'center'; g.fillStyle = '#F3E3C3'; g.font = '86px "Rozha One", serif'; g.fillText('LAPTOP', w / 2, 230);
      g.fillStyle = C.pink; g.font = 'italic 900 80px "Playfair Display", serif'; g.fillText('off', w / 2, 320);
      g.strokeStyle = C.yellow; g.lineWidth = 2.5; g.font = '84px "Rozha One", serif'; g.strokeText('PLEASE', w / 2, 410);
    });
    plane(0.9, 1.35, posterA, -0.4, 2.3, -D + 0.12);
    plane(0.9, 1.35, posterB, 0.65, 2.3, -D + 0.12);

    // ---------- standing bar along the left wall ----------
    box(0.5, 0.08, 3.4, mat(C.chai), -W / 2 + 0.38, 1.15, -4.9);
    box(0.06, 1.1, 0.06, mat(C.brown), -W / 2 + 0.55, 0.62, -3.3);
    box(0.06, 1.1, 0.06, mat(C.brown), -W / 2 + 0.55, 0.62, -6.5);
    plane(1.4, 2.0, posterC, -W / 2 + 0.12, 2.35, -4.9, Math.PI / 2);
    glass(-W / 2 + 0.35, 1.19, -4.2); glass(-W / 2 + 0.4, 1.19, -4.45); glass(-W / 2 + 0.38, 1.19, -5.6);
    // "no laptops" sign
    const noLap = canvasTex(400, 160, (g, w, h) => {
      g.fillStyle = C.yellow; g.fillRect(0, 0, w, h); frame(g, w, h, C.brown, C.cream, 8);
      g.fillStyle = C.brown; g.textAlign = 'center'; g.font = '34px "Rozha One", Georgia, serif'; g.fillText('STAND · SIP · TALK', w / 2, 70);
      g.font = '700 24px "Playfair Display", serif'; g.fillText('No laptops at the counter, please', w / 2, 118);
    });
    plane(1.2, 0.48, noLap, -W / 2 + 0.12, 1.55, -6.2, Math.PI / 2);

    // ---------- retail wall (right) ----------
    for (let s = 0; s < 3; s++) box(0.45, 0.05, 3.6, mat(C.chai), W / 2 - 0.33, 0.9 + s * 0.75, -3.9);
    const blends = [
      { name: 'कड़क', en: 'KADAK', bg: C.pink },
      { name: 'अदरक', en: 'ADRAK', bg: C.yellow },
      { name: 'इलायची', en: 'ELAICHI', bg: C.chai }
    ];
    const boxTex = blends.map(b => canvasTex(200, 280, (g, w, h) => {
      g.fillStyle = b.bg; g.fillRect(0, 0, w, h); frame(g, w, h, C.brown, b.bg === C.yellow ? C.cream : C.yellow, 8);
      sunburst(g, w / 2, 125, 62, C.cream, C.yellow, 18);
      g.fillStyle = C.chai; g.beginPath(); g.arc(w / 2, 125, 42, 0, Math.PI * 2); g.fill();
      g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.font = '26px "Rozha One", serif'; g.fillText(b.name, w / 2, 133);
      g.fillStyle = b.bg === C.yellow ? C.brown : C.yellow; g.font = '22px "Rozha One", Georgia, serif'; g.fillText('CUTTING CHAI', w / 2, 46); g.fillText(b.en, w / 2, 236);
    }));
    for (let s = 0; s < 3; s++) for (let i = 0; i < 7; i++) {
      const t = boxTex[(i + s) % 3];
      const m = [mat(C.brown), mat(C.brown), mat(C.brown), mat(C.brown), new THREE.MeshStandardMaterial({ map: t }), mat(C.brown)];
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.12), m);
      b.position.set(W / 2 - 0.36, 0.9 + s * 0.75 + 0.24, -5.4 + i * 0.47);
      b.rotation.y = -Math.PI / 2; b.castShadow = true; scene.add(b);
    }
    // sachet strips hanging like a paan-shop string
    const sachetTex = canvasTex(80, 640, (g, w, h) => {
      const cols = [C.cream, C.yellow, C.chai, C.pink, '#2F6B3A', C.brown];
      cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 106, w, 104); g.fillStyle = '#FFFFFF'; g.fillRect(0, i * 106 + 104, w, 2); });
    });
    for (let i = 0; i < 4; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.5), new THREE.MeshStandardMaterial({ map: sachetTex, side: THREE.DoubleSide }));
      strip.position.set(W / 2 - 1.1 - i * 0.32, H - 1.1, -0.85); scene.add(strip);
    }

    // ---------- outside: stools + chalk sign ----------
    for (let i = 0; i < 4; i++) {
      const x = -2.4 + i * 1.6;
      cyl(0.26, 0.26, 0.06, mat([C.cream, C.yellow, C.chai, C.pink][i]), x, 0.72, 2.0);
      cyl(0.04, 0.05, 0.56, mat(C.brown), x, 0.44, 2.0, 8);
    }
    const aTex = canvasTex(300, 420, (g, w, h) => {
      g.fillStyle = '#2A2A2A'; g.fillRect(0, 0, w, h); frame(g, w, h, C.chai, C.yellow, 12);
      g.fillStyle = C.yellow; g.textAlign = 'center'; g.font = '40px "Rozha One", Georgia, serif'; g.fillText('TODAY', w / 2, 80);
      g.fillStyle = '#FFFFFF'; g.font = '700 28px "Playfair Display", serif';
      ['2 people =', '1 free', 'cutting'].forEach((l, i) => g.fillText(l, w / 2, 170 + i * 50));
      g.fillStyle = C.pink; g.font = '42px "Rozha One", serif'; g.fillText('एक और?', w / 2, 360);
    });
    const aBoard = plane(0.8, 1.1, aTex, 3.1, 0.7, 3.2, -0.3);
    aBoard.rotation.x = -0.15;

    // ---------- hanging bulbs ----------
    [-2.4, 0, 2.4].forEach(x => {
      cyl(0.008, 0.008, 0.7, mat('#222'), x, H - 0.55, -3.0, 6);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd98a }));
      bulb.position.set(x, H - 0.95, -3.0); scene.add(bulb);
      const pl = new THREE.PointLight(0xffc977, 0.55, 7, 2); pl.position.copy(bulb.position); scene.add(pl);
    });

    // ---------- steam ----------
    const steamTex = canvasTex(64, 64, (g, w, h) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const puffs = [];
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false }));
      s.userData = { base: i % 2 ? pots[0].position : pots[1].position, t: Math.random() };
      scene.add(s); puffs.push(s);
    }
    return { puffs };
  }

  function glass(x, y, z) {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.2, 18, 1, true),
      new THREE.MeshStandardMaterial({ color: C.steel, metalness: 0.7, roughness: 0.25, side: THREE.DoubleSide }));
    g.position.set(x, y + 0.1, z); g.castShadow = true; scene.add(g);
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.055, 0.1, 18), mat('#B8732E'));
    tea.position.set(x, y + 0.05, z); scene.add(tea);
  }

  // ---------- views ----------
  const views = {
    street:   { pos: [9, 6, 13], target: [0, 1.4, -2.5], title: 'The street', text: 'A narrow, loud, hand-painted tapri. The pickup window faces the sidewalk, with stools outside and the steam visible from the corner.' },
    window:   { pos: [0.6, 1.8, 3.4], target: [0, 1.3, -0.4], title: 'Order window', text: 'Order "ek cutting" or "do cutting" at the window. Two glasses sit ready on the ledge, because the default order is for two.' },
    counter:  { pos: [-0.8, 2.3, -0.6], target: [-2.6, 1.3, -2.3], title: 'Chai counter', text: 'Two steel pots on the boil. The chai-wala pours from height into steel glasses or stamped kulhads, so the pour is the show.' },
    standing: { pos: [1.2, 2.0, -3.2], target: [-3.8, 1.3, -5.0], title: 'Standing bar', text: 'A long counter instead of laptop tables. Stand, sip, talk for five minutes. Return the glass for a stamp on your card.' },
    retail:   { pos: [0.4, 2.0, -2.0], target: [3.8, 1.5, -4.0], title: 'Retail wall', text: 'Kadak, Adrak and Elaichi boxes and the six collectible sachet strips, so you can take the tapri home.' },
    top:      { pos: [0.01, 22, -2.6], target: [0, 0, -2.8], title: 'Floor plan', text: 'About 400 sq ft. Window and stools at the front, chai station back-left, standing bar on the left wall, retail wall on the right.' }
  };
  const noteTitle = document.getElementById('noteTitle'), noteText = document.getElementById('noteText');
  let tween = null;
  function go(name, instant) {
    const v = views[name]; if (!v) return;
    noteTitle.textContent = v.title; noteText.textContent = v.text;
    document.querySelectorAll('.views button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
    const to = { pos: new THREE.Vector3(...v.pos), target: new THREE.Vector3(...v.target) };
    if (instant || reduce) { camera.position.copy(to.pos); controls.target.copy(to.target); controls.update(); tween = null; return; }
    tween = { from: { pos: camera.position.clone(), target: controls.target.clone() }, to, t: 0 };
  }
  document.querySelectorAll('.views button').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < 640 ? 55 : 42; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function start() {
    const { puffs } = build();
    resize(); go('street', true);
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      if (tween) {
        tween.t = Math.min(1, tween.t + dt / 1.1);
        const e = tween.t < 0.5 ? 4 * tween.t ** 3 : 1 - Math.pow(-2 * tween.t + 2, 3) / 2;
        camera.position.lerpVectors(tween.from.pos, tween.to.pos, e);
        controls.target.lerpVectors(tween.from.target, tween.to.target, e);
        if (tween.t >= 1) tween = null;
      }
      puffs.forEach(p => {
        const u = p.userData; if (!reduce) u.t = (u.t + dt * 0.35) % 1;
        p.position.set(u.base.x + Math.sin(u.t * 6 + u.base.x) * 0.12, u.base.y + 0.35 + u.t * 1.3, u.base.z + Math.cos(u.t * 5) * 0.08);
        const s = 0.25 + u.t * 0.55; p.scale.set(s, s, s); p.material.opacity = 0.7 * (1 - u.t);
      });
      controls.update(); renderer.render(scene, camera);
    });
  }

  // Draw the canvas signs only after the brand fonts arrive, so the textures use them.
  const fontsReady = document.fonts ? Promise.all([
    document.fonts.load('120px "Rozha One"'), document.fonts.load('60px "Rozha One"', 'कटिंग'), document.fonts.load('700 30px "Playfair Display"')
  ]).catch(() => {}) : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]).then(start);
})();
