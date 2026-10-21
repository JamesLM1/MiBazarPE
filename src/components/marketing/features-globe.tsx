"use client";
import { Localized } from "./localized";


import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export function CobeGlobe({ ...props }: React.ComponentProps<"canvas">) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		let globe: ReturnType<typeof createGlobe> | null = null;
		let rafId = 0;
		let removeMotionListener = () => {};
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		let phi = 0;

		const init = () => {
			const side = canvas.offsetWidth;
			if (side === 0 || globe) {
				return;
			}

			const dpr = Math.min(window.devicePixelRatio || 1, 2);

			globe = createGlobe(canvas, {
				devicePixelRatio: dpr,
				width: side,
				height: side,
				phi: 0,
				theta: 0,
				dark: 1,
				diffuse: 1.2,
				mapSamples: 16_000,
				mapBrightness: 6,
				baseColor: [0.3, 0.3, 0.3],
				markerColor: [0, 0.4, 1],
				glowColor: [1, 1, 1],
				markers: [
					{ location: [-12.0464, -77.0428], size: 0.015 },
				],
			});

			const loop = () => {
				globe?.update({ phi });
				if (!reducedMotion.matches) {
					phi += 0.003;
					rafId = requestAnimationFrame(loop);
				}
			};
			loop();
			const onMotionChange = () => { cancelAnimationFrame(rafId); loop(); };
			reducedMotion.addEventListener("change", onMotionChange);
			removeMotionListener = () => reducedMotion.removeEventListener("change", onMotionChange);
		};

		let ro: ResizeObserver | null = null;

		if (canvas.offsetWidth > 0) {
			init();
		} else {
			ro = new ResizeObserver((entries) => {
				if (
					entries[0]?.contentRect.width &&
					entries[0]?.contentRect.width > 0
				) {
					ro?.disconnect();
					ro = null;
					init();
				}
			});
			ro.observe(canvas);
		}

		return () => {
			removeMotionListener();
			ro?.disconnect();
			cancelAnimationFrame(rafId);
			globe?.destroy();
		};
	}, []);

	return (
		<Localized><canvas
			ref={canvasRef}
			aria-hidden="true"
			style={{ width: 512, height: 512, aspectRatio: 1 }}
			{...props}
		/></Localized>
	);
}
