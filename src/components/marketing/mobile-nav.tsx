"use client";
import { Localized } from "./localized";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/ui/portal";
import { navLinks } from "@/components/marketing/navigation";
import { XIcon, MenuIcon } from "lucide-react";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const menuRef = React.useRef<HTMLDivElement>(null);
	const close = React.useCallback(() => {
		setOpen(false);
		triggerRef.current?.focus();
	}, []);

	React.useEffect(() => {
		if (!open) return;
		const desktop = window.matchMedia("(min-width: 1024px)");
		const onResize = () => { if (desktop.matches) setOpen(false); };
		const main = document.querySelector("main");
		const wasInert = main?.inert;
		if (main) main.inert = true;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") { event.preventDefault(); close(); }
			if (event.key !== "Tab") return;
			const links = menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]");
			const last = links?.[links.length - 1];
			if (event.shiftKey && document.activeElement === triggerRef.current) {
				event.preventDefault(); last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault(); triggerRef.current?.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		desktop.addEventListener("change", onResize);
		return () => {
			if (main) main.inert = wasInert ?? false;
			document.removeEventListener("keydown", onKeyDown);
			desktop.removeEventListener("change", onResize);
		};
	}, [open, close]);

	return (
		<Localized><div className="lg:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label={open ? "Cerrar menú" : "Abrir menú"}
				ref={triggerRef}
				className="lg:hidden"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<XIcon className="size-4.5" />
				) : (
					<MenuIcon className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-14 lg:hidden" id="mobile-menu">
					<PortalBackdrop />
					<div
						ref={menuRef}
						role="navigation"
						aria-label="Navegación móvil"
						onClick={(event) => { if (event.target === event.currentTarget) close(); }}
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in motion-reduce:animate-none",
							"size-full overflow-y-auto p-4"
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="grid gap-y-2">
							{navLinks.map((link) => (
								<Button
									asChild
									className="justify-start"
									key={link.label}
									variant="ghost"
								>
									<Link href={link.href} onClick={close}>{link.label}</Link>
								</Button>
							))}
						</div>
						<div className="mt-12 flex flex-col gap-2">
							<Button asChild className="w-full" variant="outline">
								<Link href="/login" prefetch={false} onClick={close}>Iniciar sesión</Link>
							</Button>
							<Button asChild className="w-full"><Link href="/registro" prefetch={false} onClick={close}>Comenzar</Link></Button>
						</div>
					</div>
				</Portal>
			)}
		</div></Localized>
	);
}
