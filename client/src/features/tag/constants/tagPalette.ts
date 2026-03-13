export interface TagColorPreset {
  label: string;
  value: string;
}

export const TAG_COLOR_PRESETS: TagColorPreset[] = [
  { label: "Slate", value: "#475569" },
  { label: "Blue", value: "#2563EB" },
  { label: "Sky", value: "#0284C7" },
  { label: "Cyan", value: "#0891B2" },
  { label: "Emerald", value: "#059669" },
  { label: "Lime", value: "#65A30D" },
  { label: "Amber", value: "#D97706" },
  { label: "Orange", value: "#EA580C" },
  { label: "Rose", value: "#E11D48" },
  { label: "Fuchsia", value: "#C026D3" },
];

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export function isValidHexColor(value: string | null | undefined): value is string {
  return !!value && HEX_PATTERN.test(value);
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;

  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
