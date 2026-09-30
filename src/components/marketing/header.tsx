"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { navLinks } from "@/components/marketing/navigation";

// Adapted from Efferd header-2; retain its sticky, compact-on-scroll composition.

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 mx-auto w-full max-w-5xl border-transparent border-b lg:rounded-md lg:border lg:transition-all lg:ease-out motion-reduce:transition-none",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 lg:top-2 lg:max-w-4xl lg:shadow":
						scrolled,
				}
			)}
		>
			<nav
				aria-label="Navegación principal"
				className={cn(
					"flex h-14 w-full items-center justify-between px-4 lg:h-12 lg:transition-all lg:ease-out motion-reduce:transition-none",
					{
						"lg:px-2": scrolled,
					}
				)}
			>
				<Link
					aria-label="MiBazarPE — Inicio"
					className="shrink-0 rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring dark:hover:bg-muted/50"
					href="/#inicio"
				>
					<Image src="/brand/mibazarpe-logo.png" alt="MiBazarPE" width={2172} height={724} unoptimized className="h-auto w-24" />
				</Link>
				<div className="hidden items-center gap-2 lg:flex">
					<div className="flex items-center">
						{navLinks.map((link) => (
							<Button asChild key={link.label} size="sm" variant="ghost">
								<Link href={link.href}>{link.label}</Link>
							</Button>
						))}
					</div>
					<Button asChild size="sm" variant="outline">
						<Link href="/login" prefetch={false}>Iniciar sesión</Link>
					</Button>
					<Button asChild size="sm"><Link href="/registro" prefetch={false}>Comenzar</Link></Button>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
