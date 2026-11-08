// The Houra hourglass mark, drawn inline so it scales and needs no asset file.
export default function HourglassLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 40 56" fill="none" aria-hidden="true">
      <path d="M8 4h24M8 52h24" stroke="#1f3a52" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M10 4c0 14 8 16 8 24s-8 10-8 24M30 4c0 14-8 16-8 24s8 10 8 24"
        stroke="#1f3a52"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M13 9h14c-1 7-5 9-7 12-2-3-6-5-7-12z" fill="#38bdf8" />
      <path d="M20 31c3 3 6 6 7 16H13c1-10 4-13 7-16z" fill="#38bdf8" />
    </svg>
  );
}
