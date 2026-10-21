"use client";

import { motion, useReducedMotion } from "motion/react";
import { useWorkspaceMotion } from "./workspace-appearance";

export function SelectionPill({ group }: { group: string }) {
  const reduceSystem = useReducedMotion();
  const reduceWorkspace = useWorkspaceMotion();
  return <motion.span aria-hidden="true" data-workspace-pill layoutId={`workspace-selection-${group}`} transition={{ type: "spring", duration: reduceSystem || reduceWorkspace ? 0 : .3, bounce: 0 }} style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", border: "1px solid var(--ws-rim)", background: "var(--ws-active)", boxShadow: "var(--ws-active-shadow)", pointerEvents: "none" }} />;
}
