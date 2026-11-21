import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CharacterConfig } from '../types/game';
import { animateCharacterRig, buildAstronautRig, CharacterRig } from '../three/characterBuilder';
import { detectSoftwareGl } from '../three/proceduralTextures';

interface CharacterPreview3DProps {
  config: CharacterConfig;
  className?: string;
  autoRotate?: boolean;
}

export const CharacterPreview3D: React.FC<CharacterPreview3DProps> = ({
  config,
  className = '',
  autoRotate = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const rigRef = useRef<CharacterRig | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const dragYawRef = useRef(0.35);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const celebrateUntilRef = useRef(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth || 320, container.clientHeight || 360);
      container.appendChild(renderer.domElement);
    } catch {
      setWebglFailed(true);
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      38,
      (container.clientWidth || 320) / (container.clientHeight || 360),
      0.1,
      50
    );
    camera.position.set(0, 1.45, 4.1);
    camera.lookAt(0, 1.05, 0);

    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.9);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff7ed, 1.8);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    // Pedestal disc
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.2, 0.14, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.25 })
    );
    pedestal.position.y = -0.07;
    scene.add(pedestal);

    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.025, 8, 40),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.2 })
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.01;
    scene.add(glowRing);

    const rig = buildAstronautRig(config);
    rigRef.current = rig;
    scene.add(rig.root);

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
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (autoRotateRef.current && !isDraggingRef.current) {
        dragYawRef.current += dt * 0.55;
      }
      if (rigRef.current) {
        rigRef.current.root.rotation.y = dragYawRef.current;
        const isCelebrating = performance.now() < celebrateUntilRef.current;
        animateCharacterRig(
          rigRef.current,
          elapsed,
          isCelebrating ? 'celebrate' : 'idle',
          dt,
          isCelebrating ? undefined : 'explain'
        );
      }
      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };
    tick();

    const ro = new ResizeObserver(() => {
      if (!container || disposed) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    const dom = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      dragYawRef.current += dx * 0.012;
    };
    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointercancel', onPointerUp);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointercancel', onPointerUp);
      renderer.dispose();
      if (dom.parentNode === container) container.removeChild(dom);
    };
  }, []);

  // Live update character rig when config changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (rigRef.current) {
      scene.remove(rigRef.current.root);
    }
    const newRig = buildAstronautRig(config);
    newRig.root.rotation.y = dragYawRef.current;
    rigRef.current = newRig;
    scene.add(newRig.root);
    celebrateUntilRef.current = performance.now() + 750;
  }, [config]);

  if (webglFailed) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center p-4 text-center text-xs text-slate-300 ${className}`}>
        Pratinjau 3D tidak tersedia karena WebGL diblokir pada peramban ini.
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing ${className}`}
      title="Geser untuk memutar karakter 360°"
    />
  );
};
