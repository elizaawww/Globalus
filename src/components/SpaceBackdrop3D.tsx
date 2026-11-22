import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createEarthTexture, detectSoftwareGl } from '../three/proceduralTextures';
import {
  applyWebKitSafeEnvironment,
  attachWebGLContextHandlers,
  getSafeMaxDpr,
  isIosOrWebKit,
} from '../utils/platform';

export const SpaceBackdrop3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const iosWebkit = isIosOrWebKit();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && !iosWebkit,
        powerPreference: iosWebkit ? 'default' : 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(getSafeMaxDpr('high', isSoftwareGl));
      renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
      container.appendChild(renderer.domElement);
    } catch {
      setWebglFailed(true);
      return;
    }

    const detachContext = attachWebGLContextHandlers(
      renderer.domElement,
      () => setWebglFailed(true),
      () => setWebglFailed(false)
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040714);
    scene.fog = new THREE.FogExp2(0x040714, 0.008);

    applyWebKitSafeEnvironment(renderer, scene, isSoftwareGl);

    const camera = new THREE.PerspectiveCamera(
      48,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      250
    );
    camera.position.set(4, 3.2, 17);
    camera.lookAt(1.8, 0, 0);

    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.8);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff7ed, 2.0);
    key.position.set(14, 12, 10);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rim.position.set(-12, -5, -10);
    scene.add(rim);

    // Distant Planet
    const earthTex = createEarthTexture();
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(14, 40, 32),
      new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.6,
        metalness: 0.08,
        emissive: 0x082f49,
        emissiveIntensity: 0.35,
      })
    );
    planet.position.set(11, -3.5, -24);
    scene.add(planet);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(14.8, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        side: THREE.BackSide,
      })
    );
    planet.add(atmo);

    // Distant Purple Moon
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.7, emissive: 0x2e1065, emissiveIntensity: 0.35 })
    );
    moon.position.set(-14, 7, -32);
    scene.add(moon);

    // Composite GLOBALUS Space Station in the center-right
    const station = new THREE.Group();
    station.position.set(3.2, 0.4, 0);
    station.rotation.z = 0.15;
    station.rotation.x = 0.22;
    scene.add(station);

    const hullMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.78, roughness: 0.28 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.35 });
    const cyanGlow = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.88, roughness: 0.22 });

    // Central spine & core dome
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 6.2, 16), hullMat);
    station.add(spine);

    const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 18), darkMat);
    station.add(coreSphere);

    const coreGlowRing = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.06, 8, 36), cyanGlow);
    coreGlowRing.rotation.x = Math.PI / 2;
    station.add(coreGlowRing);

    // Rotating habitat ring
    const habRingGroup = new THREE.Group();
    const habRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.32, 12, 48), hullMat);
    habRing.rotation.x = Math.PI / 2;
    habRingGroup.add(habRing);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 6.3), darkMat);
      spoke.rotation.y = a;
      habRingGroup.add(spoke);

      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.9), goldMat);
      pod.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
      pod.rotation.y = -a;
      habRingGroup.add(pod);
    }
    station.add(habRingGroup);

    // Solar Wing Arrays
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.85,
      roughness: 0.18,
      emissive: 0x0f172a,
    });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.05, 1.35), wingMat);
    wingL.position.set(-2.9, 2.2, 0);
    const wingR = wingL.clone();
    wingR.position.x = 2.9;
    station.add(wingL, wingR);

    // Starfield InstancedMesh
    const starCount = 420;
    const starMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      starCount
    );
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 95,
        (Math.random() - 0.5) * 60,
        -10 - Math.random() * 65
      );
      dummy.scale.setScalar(0.5 + Math.random() * 1.4);
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    starMesh.computeBoundingSphere();
    scene.add(starMesh);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) frameId = window.setTimeout(poll, 5);
        else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      planet.rotation.y += dt * 0.04;
      habRingGroup.rotation.y += dt * 0.28;
      station.position.y = 0.4 + Math.sin(t * 0.8) * 0.22;
      starMesh.rotation.z += dt * 0.008;

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      detachContext();
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, []);

  if (webglFailed) {
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 75% 45%, rgba(14, 165, 233, 0.25), transparent 45%), radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.18), transparent 40%), #040714',
        }}
      />
    );
  }

  return <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-none" />;
};
