"use client";
import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from "react";
import { useLandingPreferences } from "./landing-preferences";

const textAttributes = ["aria-label", "title", "placeholder", "alt"] as const;
/** Translate the React tree, never the live DOM. Existing handlers, refs and keys survive. */
export function Localized({ children }: { children: ReactNode }) {
  const { t } = useLandingPreferences();
  function visit(nodes: ReactNode): ReactNode {
    function item(node: ReactNode): ReactNode {
      if (typeof node === "string") return t(node);
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<Record<string, unknown>>;
      if (element.props["data-no-translate"] || element.type === Localized) return element;
      const props: Record<string, unknown> = {};
      for (const attribute of textAttributes) if (typeof element.props[attribute] === "string") props[attribute] = t(element.props[attribute] as string);
      if (element.props.children !== undefined) props.children = visit(element.props.children as ReactNode);
      return cloneElement(element, props);
    }
    // Radix asChild needs its single element to remain a single element.
    return Array.isArray(nodes) ? Children.map(nodes, item) : item(nodes);
  }
  return <>{visit(children)}</>;
}
