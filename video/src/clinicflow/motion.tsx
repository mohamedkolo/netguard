/**
 * أدوات الحركة المشتركة بين كل المشاهد.
 */

import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** نابض داخل (0 ← 1) بيبدأ بعد `delay` فريم */
export const useEnter = (delay = 0, durationInFrames = 26): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    durationInFrames,
    config: { damping: 200, mass: 0.7 },
  });
};

type From = "bottom" | "top" | "start" | "end" | "scale" | "fade";

/** ظهور عنصر بحركة نابضة — الأساس اللي كل النصوص والكروت بتستخدمه */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  from?: From;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, from = "bottom", distance = 34, style }) => {
  const t = useEnter(delay);
  const shift = (1 - t) * distance;

  const transform =
    from === "bottom"
      ? `translateY(${shift}px)`
      : from === "top"
        ? `translateY(${-shift}px)`
        : // في RTL الاتجاه مقلوب: "start" يعني من ناحية اليمين
          from === "start"
          ? `translateX(${shift}px)`
          : from === "end"
            ? `translateX(${-shift}px)`
            : from === "scale"
              ? `scale(${0.86 + t * 0.14})`
              : "none";

  return (
    <div style={{ ...style, opacity: t, transform, willChange: "transform" }}>
      {children}
    </div>
  );
};

/**
 * غلاف المشهد: تلاشي عند الدخول والخروج مع زووم بسيط،
 * عشان الانتقالات تبقى ناعمة من غير قطع مفاجئ.
 */
export const Scene: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
  fadeIn?: number;
  fadeOut?: number;
}> = ({ children, durationInFrames, fadeIn = 14, fadeOut = 16 }) => {
  const frame = useCurrentFrame();

  const opacity = Math.min(
    interpolate(frame, [0, fadeIn], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }),
    interpolate(
      frame,
      [durationInFrames - fadeOut, durationInFrames],
      [1, 0],
      { extrapolateLeft: "clamp", easing: Easing.in(Easing.quad) },
    ),
  );

  const scale = interpolate(frame, [0, durationInFrames], [1.012, 1.045], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

/** رقم بيعدّ لحد قيمته — للإحصائيات في مشهد لوحة التحكم */
export const useCountUp = (
  to: number,
  { delay = 0, duration = 34 }: { delay?: number; duration?: number } = {},
): number => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
};
