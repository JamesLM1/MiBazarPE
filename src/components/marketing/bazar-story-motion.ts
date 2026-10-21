/**
 * Adapted from Codrops Scroll3DGrid (MIT), by Manoela Ilic.
 * Four local scenes retain the original's choreography with fewer, unique
 * photographs. Motion drives local progress; no global scroll hijacking.
 * Full attribution/license: public/licenses/codrops-scroll3dgrid.txt.
 */
export type SceneParameters = {
  z: number; startX: number; endX: number; startY: number; endY: number;
  rotationX: number; x: number; y: number;
};
export type TileFrame = { transform: string; imageTransform: string; opacity: number };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (from: number, to: number, p: number) => from + (to - from) * p;
const out2 = (p: number) => 1 - (1 - clamp(p)) ** 3;

/** Stable randomness prevents hydration differences and paths changing on resize. */
export function sceneParameters(scene: number, count: number): SceneParameters[] {
  let seed = (scene + 1) * 12347;
  const random = (min: number, max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return min + (seed / 4294967296) * (max - min);
  };
  return Array.from({ length: count }, () => ({
    z: scene === 0 ? random(-1600, 200) : scene === 1 ? random(-900, -250) : random(-1600, -600),
    startX: random(-1000, -500), endX: random(500, 1000),
    startY: random(40, 180), endY: random(-180, -40),
    rotationX: random(-45, -25), x: random(-80, 80),
    y: random(-90, 90),
  }));
}

export function gridFrame(scene: number, progress: number) {
  const p = clamp(progress);
  switch (scene) {
    case 0: return "rotateY(25deg)";
    case 1: return `rotateX(${mix(20, -20, p)}deg) rotateZ(${mix(-5, 10, p)}deg) scale(${mix(1, 1.2, p)})`;
    case 2: return `translateZ(${2100 * p}px)`;
    case 3: return "translateX(-55%) rotateY(20deg)";
    default: return "none";
  }
}

export function tileFrame(scene: number, index: number, count: number, params: SceneParameters, progress: number): TileFrame {
  const p = clamp(progress);
  const imageTransform = `scale(${mix(1.25, 1, p)})`;
  switch (scene) {
    case 0:
      return { transform: `translate3d(${mix(params.startX, params.endX, p)}%,0,${params.z}px)`, imageTransform, opacity: 1 };
    case 1: {
      const q = out2(p);
      return { transform: `translate3d(0,${mix(params.startY, params.endY, q)}%,${params.z}px) rotateY(${mix(-30, 30, q)}deg)`, imageTransform, opacity: 1 - .55 * q };
    }
    case 2:
      return { transform: `translate3d(${params.x * p}%,${params.y * p}%,${params.z}px) rotateX(${mix(params.rotationX, 0, p)}deg)`, imageTransform, opacity: .2 + .8 * p };
    case 3: {
      const time = p * (1 + .04 * (count - 1));
      const local = clamp(time - index * .04);
      const z = local < .5 ? 500 * out2(local / .5) : 500 * (1 - ((local - .5) / .5) ** 3);
      return { transform: `translateZ(${z}px) rotateX(${mix(-70, 70, local)}deg)`, imageTransform: "none", opacity: 1 - local };
    }
    default: return { transform: "none", imageTransform: "none", opacity: 1 };
  }
}
