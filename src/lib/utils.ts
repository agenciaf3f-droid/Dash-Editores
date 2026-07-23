import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Lê uma coluna jsonb de strings (`video_names`, `raw_links`, `edited_links`) e
 * cai para a coluna singular antiga (`video_name`, `raw_link`, `edited_link`)
 * quando o array está vazio — linhas criadas antes dos lotes só têm a singular.
 */
export function jsonStringList(arr: unknown, legacy: string | null | undefined): string[] {
  const items = Array.isArray(arr)
    ? arr.filter((v): v is string => typeof v === "string" && v.trim() !== "")
    : [];
  if (items.length > 0) return items;
  return legacy && legacy.trim() ? [legacy] : [];
}

/**
 * Canonical accent per video format (H S L). One fixed color per format so the
 * "Por Formato" donut, its legend/tooltip, and the table/timer badges all agree —
 * color follows the format, never its rank in the data.
 */
export const FORMAT_HSL: Record<string, [number, number, number]> = {
  VSL: [174, 72, 50],
  Criativo: [262, 60, 58],
  Ajuste: [40, 90, 55],
  IA: [340, 70, 55],
  CTAs: [200, 80, 55],
  Frank: [150, 60, 48],
  Hook: [20, 85, 58],
};

const FORMAT_FALLBACK: [number, number, number] = [174, 72, 50];

const formatHsl = (name: string) => FORMAT_HSL[name] ?? FORMAT_FALLBACK;

/** Solid brand color for a format — used for chart marks (donut cells, swatches). */
export function formatColor(name: string): string {
  const [h, s, l] = formatHsl(name);
  return `hsl(${h} ${s}% ${l}%)`;
}

/** Tinted, readable badge styling for a format (bg + border + lifted text). */
export function formatBadgeStyle(name: string): CSSProperties {
  const [h, s, l] = formatHsl(name);
  const text = Math.min(l + 14, 72);
  return {
    color: `hsl(${h} ${s}% ${text}%)`,
    backgroundColor: `hsl(${h} ${s}% ${l}% / 0.14)`,
    borderColor: `hsl(${h} ${s}% ${l}% / 0.32)`,
  };
}
