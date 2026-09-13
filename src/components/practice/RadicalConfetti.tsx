import { memo, useMemo } from "react";
import { motion } from "framer-motion";

const RADICALS = ["亻", "木", "水", "火", "口", "心", "手", "女", "日", "月", "山", "田", "讠", "纟", "辶", "宀"];
const COLORS = ["#C8442C", "#3E7C5B", "#C99A3C", "#26221B"];

interface Piece {
  glyph: string;
  left: number; // %
  delay: number; // s
  size: number; // px
  color: string;
  drift: number; // px x drift
  rotate: number;
}

/** Falling-radicals confetti (12 pieces, 1.2s) fired on quiz completion. */
function RadicalConfetti() {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        glyph: RADICALS[i % RADICALS.length],
        left: 6 + ((i * 89) % 88),
        delay: (i % 6) * 0.06,
        size: 16 + ((i * 37) % 14),
        color: COLORS[i % COLORS.length],
        drift: ((i * 53) % 60) - 30,
        rotate: ((i * 71) % 120) - 60,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-3xl">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: "110%", x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 1.2, delay: p.delay, ease: "easeIn" }}
          className="font-cjk absolute top-0 font-bold"
          style={{ left: `${p.left}%`, fontSize: p.size, color: p.color }}
        >
          {p.glyph}
        </motion.span>
      ))}
    </div>
  );
}

export default memo(RadicalConfetti);
