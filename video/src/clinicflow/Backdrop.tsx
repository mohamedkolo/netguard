/**
 * الخلفية الثابتة تحت كل المشاهد: تدرّج غامق + شبكة خفيفة
 * + هالتين لون بيتحرّكوا ببطء عشان الكادر ما يبقاش ميّت.
 */

import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

const Glow: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
}> = ({ x, y, size, color, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      opacity,
      filter: "blur(30px)",
    }}
  />
);

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();

  // دورة بطيئة جدًا — 20 ثانية للفة الكاملة
  const wobble = (offset: number, amount: number) =>
    Math.sin((frame / 600 + offset) * Math.PI * 2) * amount;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${theme.bg} 0%, ${theme.bgDeep} 100%)`,
      }}
    >
      <Glow
        x={1500 + wobble(0, 120)}
        y={200 + wobble(0.25, 70)}
        size={1150}
        color={theme.brand}
        opacity={0.17}
      />
      <Glow
        x={330 + wobble(0.5, 100)}
        y={980 + wobble(0.75, 60)}
        size={1000}
        color={theme.info}
        opacity={0.12}
      />

      {/* شبكة خفيفة تدّي إحساس بالعمق */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px),
                            linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          opacity: 0.16,
          maskImage:
            "radial-gradient(85% 70% at 50% 45%, #000 20%, transparent 100%)",
        }}
      />

      {/* تعتيم الأطراف */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,.55) 100%)",
        }}
      />

      {/* لمعة خفيفة بتعدّي في أول الفيديو */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${theme.brand}22 50%, transparent 60%)`,
          opacity: interpolate(frame, [0, 45, 90], [0, 0.55, 0], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
