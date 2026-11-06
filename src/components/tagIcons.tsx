import type { ReactNode } from "react";

const p = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Icon key -> SVG body (24x24). Tags store only the key, so adding an icon is one line here.
export const TAG_ICONS: Record<string, ReactNode> = {
  tag: <path {...p} d="M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01" />,
  dumbbell: <path {...p} d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />,
  laptop: <path {...p} d="M5 6h14v9H5zM2 19h20" />,
  code: <path {...p} d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14" />,
  school: <path {...p} d="M3 10l9-6 9 6M5 10v9h14v-9M10 19v-5h4v5" />,
  book: <path {...p} d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5M8 7h7" />,
  music: <path {...p} d="M9 18V5l11-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" />,
  home: <path {...p} d="M3 11l9-8 9 8M5 10v10h14V10" />,
  heart: <path {...p} d="M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z" />,
  star: <path {...p} d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  palette: <path {...p} d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 003-3c0-5-4-11-8-11zM7.5 11h.01M10 7h.01M15 7h.01" />,
  coffee: <path {...p} d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 10h2a2 2 0 010 4h-2M7 2v3M11 2v3" />,
};

export const ICON_KEYS = Object.keys(TAG_ICONS);
