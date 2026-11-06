import { format } from "date-fns";
import WidgetCard from "../components/WidgetCard";
import { useNow } from "../lib/useNow";
import type { WidgetProps } from "./types";

export default function ClockWidget({ widget }: WidgetProps) {
  const now = useNow(true);
  const d = new Date(now);
  const sec = d.getSeconds();
  const min = d.getMinutes() + sec / 60;
  const hour = (d.getHours() % 12) + min / 60;

  const hand = (deg: number, len: number, w: number, color: string) => (
    <line x1="50" y1="50" x2="50" y2={50 - len} stroke={color} strokeWidth={w} strokeLinecap="round" transform={`rotate(${deg} 50 50)`} />
  );

  return (
    <WidgetCard widgetId={widget.id} title="Analog Clock">
      <svg viewBox="0 0 100 100" className="mx-auto w-44 max-w-full drop-shadow-md" role="img" aria-label={`Time ${format(d, "h:mm a")}`}>
        <circle cx="50" cy="50" r="48" fill="white" />
        {Array.from({ length: 12 }, (_, i) => {
          const n = i === 0 ? 12 : i;
          const a = (n * 30 * Math.PI) / 180;
          return (
            <text key={n} x={50 + 38 * Math.sin(a)} y={50 - 38 * Math.cos(a)} fontSize="9" fontWeight="600" textAnchor="middle" dominantBaseline="central" fill="#4b4553">
              {n}
            </text>
          );
        })}
        {hand(hour * 30, 24, 3.2, "#2b2b2b")}
        {hand(min * 6, 34, 2.4, "#2b2b2b")}
        {hand(sec * 6, 38, 1, "#d33")}
        <circle cx="50" cy="50" r="2" fill="#d33" />
      </svg>
      <p className="mt-2 text-center text-sm tabular-nums text-ink/70">{format(d, "hh:mm:ss a")}</p>
    </WidgetCard>
  );
}
