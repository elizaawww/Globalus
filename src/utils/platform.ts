import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function isIosOrWebKit(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  const isIosDevice =
    /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  if (isIosDevice) return true;

  // Desktop / mobile pure Safari (AppleWebKit without Chrome/Edge/Firefox)
  const isSafariEngine =
    /AppleWebKit/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|Edg|OPR|Android/i.test(ua);
  return isSafariEngine;
}

export function getSafeMaxDpr(quality: 'low' | 'medium' | 'high' = 'medium', isSoftwareGl = false): number {
  if (isSoftwareGl || quality === 'low') return 1;
  const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const iosWebkit = isIosOrWebKit();
  if (iosWebkit) {
    // Keep WebGL buffer within iOS Safari GPU memory budget so canvas never stalls or reloads tab
    return Math.min(rawDpr, quality === 'high' ? 1.5 : 1.25);
  }
  return quality === 'high' ? Math.min(rawDpr, 1.85) : Math.min(rawDpr, 1.5);
}

/**
 * Applies RoomEnvironment PMREM safely.
 * On iOS / WebKit devices, synchronous PMREM compilation of RoomEnvironment can stall the WebGL context
 * or exceed mobile GPU shader memory, so we skip synchronous PMREM there and rely on calibrated Three.js lights.
 */
export function applyWebKitSafeEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  isSoftwareGl = false
): boolean {
  if (isSoftwareGl || isIosOrWebKit()) {
    return false;
  }
  let pmrem: THREE.PMREMGenerator | null = null;
  let roomEnv: THREE.Scene | null = null;
  try {
    pmrem = new THREE.PMREMGenerator(renderer);
    roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    return true;
  } catch {
    return false;
  } finally {
    try {
      pmrem?.dispose();
    } catch {
      // ignore
    }
    try {
      (roomEnv as { dispose?: () => void } | null)?.dispose?.();
    } catch {
      // ignore
    }
  }
}

export function attachWebGLContextHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void
): () => void {
  const handleLost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  const handleRestored = () => {
    onRestored();
  };
  canvas.addEventListener('webglcontextlost', handleLost, false);
  canvas.addEventListener('webglcontextrestored', handleRestored, false);
  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost, false);
    canvas.removeEventListener('webglcontextrestored', handleRestored, false);
  };
}
