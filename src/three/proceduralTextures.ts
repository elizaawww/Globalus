import * as THREE from 'three';

let cachedSoftwareGl: boolean | null = null;

export function detectSoftwareGl(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === 'undefined') {
    cachedSoftwareGl = false;
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = false;
    return false;
  }
}

export function createMetallicFloorTexture(maxAniso = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#142038');
  grad.addColorStop(0.5, '#0e172a');
  grad.addColorStop(1, '#172542');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Main deck plates
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Anti-slip floor tread & corner bolts
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 512; x += 128) {
    for (let y = 0; y < 512; y += 128) {
      ctx.strokeRect(x + 10, y + 10, 108, 108);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.fillRect(x + 14, y + 14, 4, 4);
      ctx.fillRect(x + 110, y + 14, 4, 4);
      ctx.fillRect(x + 14, y + 110, 4, 4);
      ctx.fillRect(x + 110, y + 110, 4, 4);

      // Subtle diagonal grip lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      for (let d = 24; d < 104; d += 16) {
        ctx.beginPath();
        ctx.moveTo(x + d, y + 24);
        ctx.lineTo(x + d - 10, y + 34);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createWallPanelTexture(maxAniso = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#152038';
  ctx.fillRect(0, 0, 512, 512);

  // Structural header & kickplate
  ctx.fillStyle = '#203052';
  ctx.fillRect(0, 0, 512, 72);
  ctx.fillRect(0, 430, 512, 82);

  // Hazard trim near floor
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 422, 512, 8);

  // Panel vertical ribs
  ctx.strokeStyle = '#090e1c';
  ctx.lineWidth = 5;
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Tech conduit & indicator bars
  ctx.fillStyle = 'rgba(56, 189, 248, 0.42)';
  ctx.fillRect(16, 250, 480, 6);
  ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
  for (let x = 24; x < 512; x += 128) {
    ctx.fillRect(x, 108, 80, 14);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
    ctx.fillRect(x + 8, 134, 14, 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(x + 28, 134, 42, 6);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createBatikTexture(bgHex: string, goldHex = '#f59e0b'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Rich base fabric weave
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle woven diagonal Parang shadow bands
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 10;
  for (let i = -512; i < 1024; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 128, 170, i + 256, 340, i + 384, 512);
    ctx.stroke();
  }
  ctx.restore();

  // Stylized Mega Mendung layered cloud bands (top & bottom border bands)
  const drawCloudBand = (yBase: number, alpha: number) => {
    ctx.save();
    ctx.strokeStyle = goldHex;
    ctx.fillStyle = `rgba(253, 224, 71, ${alpha})`;
    ctx.lineWidth = 2.5;
    for (let x = -32; x <= 544; x += 128) {
      ctx.beginPath();
      ctx.arc(x, yBase, 42, Math.PI, 0, false);
      ctx.arc(x + 48, yBase + 6, 30, Math.PI, 0, false);
      ctx.arc(x + 92, yBase, 34, Math.PI, 0, false);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };
  drawCloudBand(92, 0.16);
  drawCloudBand(256, 0.14);
  drawCloudBand(420, 0.16);

  // Kawung 4-petal geometric medallions with gold filigree centers
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 2.8;
  const step = 128;
  for (let x = 0; x <= 512; x += step) {
    for (let y = 0; y <= 512; y += step) {
      for (let a = 0; a < 4; a++) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((a * Math.PI) / 2 + Math.PI / 4);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.34)';
        ctx.beginPath();
        ctx.ellipse(28, 0, 22, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Inner petal vein
        ctx.fillStyle = 'rgba(254, 243, 199, 0.55)';
        ctx.beginPath();
        ctx.ellipse(28, 0, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Cecek (golden dots) around hub
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      for (let d = 0; d < 8; d++) {
        const ang = (d / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * 44, y + Math.sin(ang) * 44, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Ornamental gold border trim along top/bottom for sash & chest wrap crispness
  ctx.fillStyle = goldHex;
  ctx.fillRect(0, 0, 512, 12);
  ctx.fillRect(0, 500, 512, 12);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createEarthTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const ocean = ctx.createLinearGradient(0, 0, 0, 512);
  ocean.addColorStop(0, '#1e3a8a');
  ocean.addColorStop(0.5, '#0369a1');
  ocean.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 1024, 512);

  ctx.fillStyle = '#15803d';
  const blobs = [
    [220, 160, 75, 55],
    [250, 230, 45, 35],
    [300, 320, 48, 78],
    [510, 140, 62, 42],
    [520, 260, 66, 85],
    [660, 155, 130, 72],
    [740, 225, 55, 40],
    [760, 275, 45, 16],
    [820, 345, 58, 38],
  ];
  for (const [cx, cy, rx, ry] of blobs) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
  ctx.fillRect(0, 0, 1024, 28);
  ctx.fillRect(0, 484, 1024, 28);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
  ctx.lineWidth = 2;
  const nodes: Array<[number, number]> = [
    [230, 170],
    [520, 145],
    [690, 170],
    [770, 275],
    [820, 345],
    [305, 315],
  ];
  for (let i = 0; i < nodes.length; i++) {
    const [x1, y1] = nodes[i];
    const [x2, y2] = nodes[(i + 1) % nodes.length];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 45, x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let i = 0; i < 24; i++) {
    const x = (i * 137) % 1024;
    const y = 50 + ((i * 89) % 400);
    ctx.beginPath();
    ctx.ellipse(x, y, 48 + (i % 3) * 18, 10, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createScreenTexture(
  mode: 'worldmap' | 'radar' | 'lab' | 'market' | 'network' | 'galaxy' | 'inequality' | 'impact' | 'info' | 'tv_culture'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#061124';
  ctx.fillRect(0, 0, 512, 256);

  // Grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  if (mode === 'worldmap') {
    ctx.fillStyle = '#0284c7';
    const lands = [
      [110, 95, 48, 35],
      [140, 170, 26, 42],
      [255, 85, 36, 26],
      [265, 145, 34, 46],
      [350, 95, 68, 40],
      [395, 158, 30, 12],
      [425, 190, 32, 22],
    ];
    for (const [cx, cy, rx, ry] of lands) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, 95);
    ctx.quadraticCurveTo(230, 20, 350, 95);
    ctx.quadraticCurveTo(380, 130, 395, 158);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    [
      [110, 95],
      [255, 85],
      [350, 95],
      [395, 158],
    ].forEach(([nx, ny]) => {
      ctx.beginPath();
      ctx.arc(nx, ny, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (mode === 'radar') {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    [36, 72, 108].forEach((r) => {
      ctx.beginPath();
      ctx.arc(256, 128, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.beginPath();
    ctx.moveTo(256, 128);
    ctx.arc(256, 128, 108, -0.5, 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(310, 96, 5, 0, Math.PI * 2);
    ctx.arc(200, 155, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (mode === 'market') {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const pts = [200, 165, 180, 130, 145, 95, 120, 75, 92, 60];
    pts.forEach((y, i) => {
      const x = 32 + i * 48;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#38bdf8';
      const h = 40 + ((i * 29) % 110);
      ctx.fillRect(40 + i * 56, 232 - h, 26, h);
    }
  } else if (mode === 'lab') {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 20; x < 492; x += 6) {
      const y = 128 + Math.sin(x * 0.045) * 48;
      if (x === 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let x = 20; x < 492; x += 6) {
      const y = 128 - Math.sin(x * 0.045) * 48;
      if (x === 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else if (mode === 'galaxy') {
    const grad = ctx.createRadialGradient(256, 128, 6, 256, 128, 120);
    grad.addColorStop(0, '#fde047');
    grad.addColorStop(0.25, '#38bdf8');
    grad.addColorStop(0.65, '#6366f1');
    grad.addColorStop(1, 'rgba(6, 17, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(256, 128, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 1.6;
    [52, 86, 118].forEach((r) => {
      ctx.beginPath();
      ctx.ellipse(256, 128, r * 1.45, r * 0.6, -0.25, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 45; i++) {
      ctx.fillRect((i * 73) % 500, (i * 41) % 246, 2.5, 2.5);
    }
  } else if (mode === 'inequality') {
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('WALLERSTEIN WORLD SYSTEM', 34, 34);
    const bars = [
      { label: 'CORE', w: 380, color: '#38bdf8', y: 66 },
      { label: 'SEMI', w: 235, color: '#f59e0b', y: 120 },
      { label: 'PERI', w: 105, color: '#ef4444', y: 174 },
    ];
    bars.forEach((b) => {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(b.label, 34, b.y + 22);
      ctx.fillStyle = b.color;
      ctx.fillRect(96, b.y, b.w, 30);
    });
  } else if (mode === 'impact') {
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('DAMPAK POSITIF   |   DAMPAK NEGATIF', 56, 36);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(42, 62, 195, 26);
    ctx.fillRect(42, 104, 175, 26);
    ctx.fillRect(42, 146, 185, 26);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(275, 62, 195, 26);
    ctx.fillRect(295, 104, 175, 26);
    ctx.fillRect(285, 146, 185, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(116, 198, 280, 22);
  } else if (mode === 'info') {
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('GLOBALUS STATION DIRECTORY', 64, 48);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(64, 68, 384, 4);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px monospace';
    ctx.fillText('W: COMM  -  TECH LAB  -  NAVIGATION', 64, 106);
    ctx.fillText('E: CULT  -  ECONOMIC  -  EXCHANGE', 64, 142);
    ctx.fillText('N: BALANCE  -  WORLD ECON  -  OBSERVATORY', 64, 178);
    ctx.fillStyle = '#10b981';
    ctx.fillText('STATUS: GLOBAL NETWORK RECOVERY ACTIVE', 64, 218);
  } else if (mode === 'tv_culture') {
    const bg = ctx.createLinearGradient(0, 0, 512, 256);
    bg.addColorStop(0, '#3b0764');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#701a75');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SIARAN BUDAYA GLOBAL', 36, 48);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('AKULTURASI · MUSIK DUNIA · EMOTE RAHASIA', 36, 78);
    const barCols = ['#ec4899', '#a855f7', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e'];
    for (let i = 0; i < 12; i++) {
      const h = 38 + ((i * 37) % 92);
      ctx.fillStyle = barCols[i % barCols.length];
      ctx.fillRect(36 + i * 38, 224 - h, 24, h);
    }
  } else {
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('GLOBALUS NETWORK STATUS', 72, 64);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(72, 92, 368, 18);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(72, 128, 290, 18);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(72, 164, 330, 18);
  }

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 508, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createArtworkTexture(
  variant: 'nusantara' | 'world_mosaic' | 'wayang'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  if (variant === 'nusantara') {
    const sky = ctx.createLinearGradient(0, 0, 0, 192);
    sky.addColorStop(0, '#7c2d12');
    sky.addColorStop(0.6, '#ea580c');
    sky.addColorStop(1, '#1e293b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(128, 86, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(70, 98);
    ctx.lineTo(132, 140);
    ctx.lineTo(192, 88);
    ctx.lineTo(256, 160);
    ctx.lineTo(256, 192);
    ctx.lineTo(0, 192);
    ctx.closePath();
    ctx.fill();
  } else if (variant === 'wayang') {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, 256, 192);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 232, 168);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(128, 30);
    ctx.lineTo(176, 120);
    ctx.lineTo(128, 162);
    ctx.lineTo(80, 120);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(128, 96, 18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 192);
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(46 + i * 41, 96 + (i % 2 === 0 ? -18 : 18), 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 236, 172);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNameplateTexture(
  name: string,
  accentHex = '#38bdf8',
  subtitle?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 72);
  ctx.fillStyle = 'rgba(6, 12, 28, 0.86)';
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(8, 8, 240, 56, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name.slice(0, 16), 128, subtitle ? 35 : 44);

  if (subtitle) {
    ctx.fillStyle = accentHex;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(subtitle, 128, 55);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
