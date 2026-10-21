"use client";
import { useEffect, useRef, useState } from "react";
import { saveBaziWorkspace } from "@/features/bazi/persistence-actions";
import { cleanWorkspace } from "@/features/bazi/workspace-model";
import type { BaziBootstrap, BaziStoredWorkspace } from "@/features/bazi/types";

export function useBaziPersistence(data: BaziBootstrap, workspace: BaziStoredWorkspace, busy: boolean) {
  const payload = JSON.stringify(cleanWorkspace(workspace));
  const confirmed = useRef(JSON.stringify(data.saved));
  const version = useRef(data.savedVersion);
  const inFlight = useRef(false);
  const blocked = useRef(Boolean(data.persistenceError));
  const [status, setStatus] = useState(!data.accessible ? "Selecciona o vincula un negocio para guardar conversaciones." : data.persistenceError ?? "Historial guardado en tu cuenta");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (busy || blocked.current || !data.accessible || inFlight.current || payload === confirmed.current) return;
    const timer = setTimeout(async () => {
      inFlight.current = true;
      setStatus("Guardando historial…");
      try {
        const result = await saveBaziWorkspace(data.scope, version.current, JSON.parse(payload));
        if (typeof result.version === "number") { version.current = result.version; confirmed.current = payload; setStatus("Historial guardado en tu cuenta"); }
        else { blocked.current = true; setStatus(result.error ?? "No pudimos guardar. Vuelve a intentar."); }
      } catch { blocked.current = true; setStatus("Sin conexión: los últimos cambios siguen solo en esta pantalla."); }
      finally { inFlight.current = false; setTick(value => value + 1); }
    }, 0);
    return () => { clearTimeout(timer); };
  }, [payload, data.scope, data.accessible, busy, tick]);
  return { status, retry: () => { if (!data.persistenceError) blocked.current = false; setTick(value => value + 1); } };
}
