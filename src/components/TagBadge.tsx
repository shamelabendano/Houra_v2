import { TAG_ICONS } from "./tagIcons";

const UNTAGGED_COLOR = "#a8a3b0";

interface Props {
  color?: string;
  icon?: string;
  size?: number;
}

/** Rounded 3D-ish square driven entirely by tag data. */
export default function TagBadge({ color = UNTAGGED_COLOR, icon, size = 36 }: Props) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[10px] text-white"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 3px 0 color-mix(in srgb, ${color} 70%, black)`,
      }}
    >
      {icon && TAG_ICONS[icon] && (
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55}>
          {TAG_ICONS[icon]}
        </svg>
      )}
    </span>
  );
}
