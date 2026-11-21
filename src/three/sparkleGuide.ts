import * as THREE from 'three';

function createSparkleGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.22, 'rgba(186, 230, 253, 0.92)');
    grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.42)');
    grad.addColorStop(0.78, 'rgba(250, 204, 21, 0.14)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface SparkleGuideController {
  group: THREE.Group;
  update: (pos: THREE.Vector3, intensity: number, elapsed: number) => void;
  dispose: () => void;
}

export function createSparkleGuide(): SparkleGuideController {
  const group = new THREE.Group();
  group.name = 'prolog_sparkle_guide';
  group.visible = false;

  const glowTex = createSparkleGlowTexture();

  const coreGeo = new THREE.OctahedronGeometry(0.15, 0);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.95,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  group.add(coreMesh);

  const auraGeo = new THREE.SphereGeometry(0.32, 14, 12);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  group.add(auraMesh);

  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowSprite = new THREE.Sprite(spriteMat);
  glowSprite.scale.set(1.45, 1.45, 1);
  group.add(glowSprite);

  const starArmGeo = new THREE.PlaneGeometry(0.92, 0.12);
  const starArmMat = new THREE.MeshBasicMaterial({
    color: 0xfef9c3,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const flareX = new THREE.Mesh(starArmGeo, starArmMat);
  const flareY = new THREE.Mesh(starArmGeo, starArmMat);
  flareY.rotation.z = Math.PI / 2;
  const flareZ = new THREE.Mesh(starArmGeo, starArmMat);
  flareZ.rotation.y = Math.PI / 2;
  group.add(flareX, flareY, flareZ);

  const moteGeo = new THREE.OctahedronGeometry(0.045, 0);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const motes: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    group.add(m);
    motes.push(m);
  }

  const light = new THREE.PointLight(0x7dd3fc, 1.6, 10, 1.5);
  group.add(light);

  const update = (pos: THREE.Vector3, rawIntensity: number, elapsed: number) => {
    const intensity = Math.max(0, Math.min(1, rawIntensity));
    if (intensity <= 0.01) {
      group.visible = false;
      light.intensity = 0;
      return;
    }
    group.visible = true;
    const bob = Math.sin(elapsed * 4.2) * 0.07;
    group.position.set(pos.x, pos.y + bob, pos.z);

    const pulse = 0.88 + Math.sin(elapsed * 7.2) * 0.14;
    const scaleFactor = (0.45 + 0.65 * intensity) * pulse;
    coreMesh.rotation.y = elapsed * 2.6;
    coreMesh.rotation.x = Math.sin(elapsed * 1.9) * 0.35;
    coreMesh.scale.setScalar(scaleFactor);

    auraMesh.scale.setScalar(scaleFactor * (1.05 + Math.sin(elapsed * 5.0) * 0.12));
    glowSprite.scale.set(1.55 * scaleFactor, 1.55 * scaleFactor, 1);

    flareX.rotation.z = elapsed * 1.3;
    flareY.rotation.z = elapsed * 1.3 + Math.PI / 2;
    flareZ.rotation.z = -elapsed * 1.1;

    coreMat.opacity = 0.95 * intensity;
    auraMat.opacity = 0.3 * intensity;
    spriteMat.opacity = 0.88 * intensity;
    starArmMat.opacity = 0.78 * intensity;
    moteMat.opacity = 0.9 * intensity;
    light.intensity = 2.1 * intensity;

    for (let i = 0; i < motes.length; i++) {
      const angle = elapsed * (2.2 + (i % 3) * 0.5) + (i * Math.PI * 2) / motes.length;
      const radius = (0.28 + (i % 2) * 0.18) * (0.65 + 0.35 * intensity);
      const yOff = Math.sin(elapsed * 3.5 + i * 1.2) * 0.24;
      motes[i].position.set(Math.cos(angle) * radius, yOff, Math.sin(angle) * radius);
      motes[i].rotation.y = angle * 1.5;
      motes[i].scale.setScalar(0.75 + 0.45 * Math.sin(elapsed * 6 + i));
    }
  };

  const dispose = () => {
    coreGeo.dispose();
    coreMat.dispose();
    auraGeo.dispose();
    auraMat.dispose();
    spriteMat.dispose();
    glowTex.dispose();
    starArmGeo.dispose();
    starArmMat.dispose();
    moteGeo.dispose();
    moteMat.dispose();
  };

  return { group, update, dispose };
}
