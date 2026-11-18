import type { ComponentProps } from "react";

// The Tile V: a white V on an ink blue tile, the same as app/icon.svg.
export function Logo(props: Readonly<ComponentProps<"svg">>) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label="Vellicor" {...props}>
      <rect width="100" height="100" rx="24" fill="#1E3A8A" />
      <polyline
        points="29,31 50,71 71,31"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
