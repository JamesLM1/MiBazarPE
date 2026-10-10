type Point = { x: number; y: number };
type Arc = { points: Point[]; seed: number; width: number; strength: number; branches: Point[][] };
const WIDTH = 1200;
const HEIGHT = 230;

// Midpoint displacement makes each discharge a new shape, rather than moving an image.
function fracture(from: Point, to: Point, roughness: number, depth: number): Point[] {
  if (!depth) return [from, to];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const displacement = (Math.random() - .5) * roughness;
  const middle = { x: (from.x + to.x) / 2 - dy / length * displacement, y: (from.y + to.y) / 2 + dx / length * displacement };
  return [...fracture(from, middle, roughness * .56, depth - 1).slice(0, -1), ...fracture(middle, to, roughness * .56, depth - 1)];
}

function arc(from: Point, to: Point, strength: number, width = 1): Arc {
  const points = fracture(from, to, Math.min(85, Math.hypot(to.x - from.x, to.y - from.y) * .3), 5);
  const branches = [8, 16, 24].map((index, branch) => {
    const origin = points[index];
    const side = branch % 2 ? -1 : 1;
    return fracture(origin, { x: origin.x + 25 + Math.random() * 55, y: origin.y + side * (20 + Math.random() * 65) }, 25, 3);
  });
  return { points, branches, seed: Math.random() * 20, width, strength };
}

export function startElectricField(canvas: HTMLCanvasElement, stage: HTMLElement, isPaused: () => boolean) {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  const context = ctx;
  const mask = document.createElement("canvas");
  const maskContext = mask.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const pointer = { x: 600, y: 112, active: false };
  const focus = { x: 600, y: 112, energy: 0 };
  let visible = false;
  let frame = 0;
  let lastFrame = 0;
  let clock = 0;
  let elapsed = 0;
  let rebuildAt = 0;
  let tapUntil = 0;
  let arcs: Arc[] = [];
  let disposed = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(1.5, Math.max(.5, stage.clientWidth / WIDTH * dpr));
    canvas.width = Math.round(WIDTH * scale);
    canvas.height = Math.round(HEIGHT * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    mask.width = canvas.width; mask.height = canvas.height;
    if (maskContext) {
      maskContext.setTransform(scale, 0, 0, scale, 0, 0);
      const letters = stage.querySelector("svg text");
      if (letters) {
        const style = getComputedStyle(letters);
        maskContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        maskContext.letterSpacing = style.letterSpacing;
        maskContext.textAlign = "center";
        maskContext.fillStyle = "white";
        maskContext.fillText("MiBazarPE", 600, 178);
      }
    }
    if (reduced.matches || isPaused()) paint();
  }

  function trace(points: Point[], seed: number, jitter: number) {
    context.beginPath();
    points.forEach((point, index) => {
      const x = point.x + Math.sin(index * 2.3 + clock * 7 + seed) * jitter;
      const y = point.y + Math.sin(index * 1.7 - clock * 9 + seed) * jitter;
      if (index) context.lineTo(x, y); else context.moveTo(x, y);
    });
  }

  function rebuild() {
    const center = pointer.active || tapUntil > performance.now() ? focus.x : 600 + Math.sin(clock * .6) * 280;
    const height = pointer.active ? focus.y : 112;
    arcs = [
      arc({ x: 30, y: 130 }, { x: 1160, y: 93 }, .38, .85),
      arc({ x: 50, y: 80 }, { x: 1140, y: 155 }, .24, .6),
      ...[-1, 1].flatMap(side => [
        arc({ x: center, y: height }, { x: center + side * (145 + Math.random() * 160), y: 62 + Math.random() * 105 }, .95, 1.6),
        arc({ x: center + side * 20, y: height + 12 }, { x: center + side * (95 + Math.random() * 120), y: 38 + Math.random() * 155 }, .5, .7),
        arc({ x: center + side * 50, y: height - 65 }, { x: center + side * 100, y: height + 65 }, .7, 1.1),
      ]),
    ];
  }

  function paint() {
    context.clearRect(0, 0, WIDTH, HEIGHT);
    const quiet = reduced.matches;
    const centerX = quiet ? 600 : focus.x;
    const centerY = quiet ? 112 : focus.y;
    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
    glow.addColorStop(0, `rgba(235,238,242,${quiet ? .12 : .08 + focus.energy * .42})`);
    glow.addColorStop(.3, `rgba(152,162,175,${quiet ? .08 : .07 + focus.energy * .2})`);
    glow.addColorStop(1, "rgba(125,135,150,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    if (quiet) { applyMask(); return; }
    const phase = Math.min(1, (clock - rebuildAt) / .65);
    // Smooth charge/discharge envelopes; no whole-word flashes or strobe.
    const pulse = .2 + .8 * Math.sin(phase * Math.PI);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalCompositeOperation = "lighter";
    arcs.forEach((bolt, index) => {
      const local = index > 1;
      context.save();
      if (local && (pointer.active || tapUntil > performance.now())) {
        const anchor = arcs[2].points[0];
        context.translate(focus.x - anchor.x, focus.y - anchor.y);
      }
      const power = bolt.strength * (local ? .12 + focus.energy * .88 : .65) * pulse;
      const jitter = local ? 2.3 : 1.2;
      trace(bolt.points, bolt.seed, jitter);
      context.strokeStyle = `rgba(172,183,198,${power * .13})`;
      context.lineWidth = bolt.width * 11;
      context.stroke();
      context.strokeStyle = `rgba(210,218,231,${power * .32})`;
      context.lineWidth = bolt.width * 4;
      context.stroke();
      context.strokeStyle = `rgba(250,251,255,${power})`;
      context.lineWidth = bolt.width;
      context.stroke();
      bolt.branches.forEach((branch, branchIndex) => {
        trace(branch, bolt.seed + branchIndex, jitter * .6);
        context.strokeStyle = `rgba(224,231,239,${power * .6})`;
        context.lineWidth = .7;
        context.stroke();
      });
      if (local) {
        const spark = bolt.points[12];
        const radius = 1 + pulse * 1.5;
        context.fillStyle = `rgba(245,248,252,${power * .65})`;
        context.beginPath(); context.arc(spark.x, spark.y, radius, 0, Math.PI * 2); context.fill();
      }
      context.restore();
    });
    context.globalCompositeOperation = "source-over";
    applyMask();
  }

  function applyMask() {
    context.globalCompositeOperation = "destination-in";
    context.drawImage(mask, 0, 0, WIDTH, HEIGHT);
    context.globalCompositeOperation = "source-over";
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || reduced.matches) return;
    if (!lastFrame) lastFrame = now;
    if (now - lastFrame >= 1000 / 30) {
      const dt = Math.min(.05, (now - lastFrame) / 1000);
      lastFrame = now;
      if (!isPaused()) {
        clock += dt; elapsed += dt;
        const targetEnergy = pointer.active || tapUntil > now ? 1 : .12;
        const smoothing = 1 - Math.exp(-dt * 12);
        focus.x += (pointer.x - focus.x) * smoothing;
        focus.y += (pointer.y - focus.y) * smoothing;
        focus.energy += (targetEnergy - focus.energy) * smoothing;
        if (elapsed >= .65 || !arcs.length) { rebuildAt = clock; rebuild(); elapsed = 0; }
        paint();
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastFrame = 0;
    if (reduced.matches) paint();
    else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    stage.dataset.motion = reduced.matches ? "reduced" : "animated";
  }
  function locate(event: PointerEvent) {
    const box = stage.getBoundingClientRect();
    pointer.x = Math.max(30, Math.min(1170, (event.clientX - box.left) / box.width * WIDTH));
    pointer.y = Math.max(45, Math.min(178, (event.clientY - box.top) / (box.width * HEIGHT / WIDTH) * HEIGHT));
  }
  function move(event: PointerEvent) {
    if (!fine.matches || reduced.matches || (event.target instanceof Element && event.target.closest("button"))) return;
    locate(event); pointer.active = true;
  }
  function leave() { pointer.active = false; }
  function tap(event: PointerEvent) {
    if (reduced.matches || (event.target instanceof Element && event.target.closest("button"))) return;
    locate(event); tapUntil = performance.now() + 1200;
  }
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .05 });
  const resizeObserver = new ResizeObserver(resize);
  observer.observe(stage); resizeObserver.observe(stage);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerleave", leave);
  stage.addEventListener("pointerdown", tap);
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  resize(); sync();
  void document.fonts.ready.then(() => { if (!disposed) resize(); });
  return () => {
    disposed = true; cancelAnimationFrame(frame);
    observer.disconnect(); resizeObserver.disconnect();
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerleave", leave);
    stage.removeEventListener("pointerdown", tap);
    document.removeEventListener("visibilitychange", sync);
    reduced.removeEventListener("change", sync);
  };
}
