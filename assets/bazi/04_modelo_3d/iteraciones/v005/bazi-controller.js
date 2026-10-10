// Works with Three.js AnimationMixer and with React Three Fiber's useFrame.
// New requests blend from the actual current weights, including interrupted blends.
export function createBaziController(THREE, mixer, clips, { reducedMotion = false, transition = 0.32 } = {}) {
  const catalogue = new Map(clips.map(clip => [clip.name, clip]));
  let actions = [], blend = null, current = null, serial = 0, paused = false, disposed = false;
  function setGesture(name = 'Idle', { immediate = false, repeat = false } = {}) {
    if (disposed || !catalogue.has(name)) return false;
    if (current === name && !repeat) return true;
    const source = catalogue.get(name), clip = source.clone();
    clip.name = `${name}__${++serial}`;
    const action = mixer.clipAction(clip);
    action.setLoop(name === 'Idle' || name === 'Walking' ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = true; action.enabled = true;
    action.setEffectiveWeight(0).play();
    if (reducedMotion) { action.time = name === 'Idle' ? 0 : Math.min(source.duration, 1.15); action.paused = true; }
    const previous = actions.map(item => ({ ...item, startWeight: item.weight }));
    const next = { action, clip, weight: immediate || !actions.length ? 1 : 0, startWeight: 0 };
    if (immediate || !actions.length) {
      for (const item of actions) { item.action.stop(); mixer.uncacheAction(item.clip); }
      actions = [next]; blend = null;
    } else { actions = [...previous, next]; blend = { time: 0, duration: reducedMotion ? 0.12 : transition, next }; }
    current = name; applyWeights(); return true;
  }
  function applyWeights() { for (const item of actions) item.action.setEffectiveWeight(item.weight); }
  function update(dt) {
    if (disposed || paused) return;
    dt = Math.min(Math.max(dt, 0), 0.06);
    if (blend) {
      blend.time += dt;
      const t = Math.min(1, blend.time / blend.duration), ease = t * t * (3 - 2 * t);
      for (const item of actions) item.weight = item === blend.next ? ease : item.startWeight * (1 - ease);
      if (t === 1) {
        const next = blend.next;
        for (const item of actions) if (item !== next) { item.action.stop(); mixer.uncacheAction(item.clip); }
        actions = [next]; blend = null;
      }
      applyWeights();
    }
    mixer.update(dt);
  }
  function seek(progress) {
    const item = actions.at(-1); if (!item) return;
    if (blend) { setGesture(current, { immediate: true, repeat: true }); }
    const target = actions.at(-1); target.action.time = target.clip.duration * Math.max(0, Math.min(1, progress));
    mixer.update(0);
  }
  setGesture('Idle', { immediate: true });
  return {
    setGesture, update, seek,
    emailFocus: () => setGesture('Email'),
    passwordFocus: ({ coverEyes = false } = {}) => setGesture(coverEyes ? 'CoverEyes' : 'Password'),
    blur: () => setGesture('Idle'),
    success: () => setGesture('Celebrando'),
    error: () => setGesture('Preocupado'),
    setPaused(value) { paused = !!value; },
    setReducedMotion(value) { reducedMotion = !!value; setGesture(current, { repeat: true }); },
    getState: () => ({ gesture: current, transitioning: !!blend, paused, weights: actions.map(a => a.weight), time: actions.at(-1)?.action.time ?? 0, duration: actions.at(-1)?.clip.duration ?? 0 }),
    dispose() { if (disposed) return; disposed = true; for (const item of actions) { item.action.stop(); mixer.uncacheAction(item.clip); } actions = []; }
  };
}
