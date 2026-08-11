/**
 * علامة ClinicFlow — المربّع المدوّر بخط النبض جواه.
 * بيتكرّر في مشهد البداية والنهاية وفي شريط التطبيق الوهمي.
 */

import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Icon } from "./Icon";
import { theme } from "./theme";

export const BrandMark: React.FC<{ size?: number; glow?: boolean }> = ({
  size = 96,
  glow = true,
}) => {
  const frame = useCurrentFrame();

  // نبضة خفيفة كل ثانيتين — إشارة إنه نظام "شغّال"
  const pulse = Math.sin((frame / 60) * Math.PI * 2) * 0.5 + 0.5;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        display: "grid",
        placeItems: "center",
        background: `linear-gradient(150deg, ${theme.brand} 0%, ${theme.brandDark} 100%)`,
        boxShadow: glow
          ? `0 0 ${28 + pulse * 26}px ${theme.brand}66, 0 18px 44px rgba(0,0,0,.5)`
          : "0 8px 22px rgba(0,0,0,.4)",
      }}
    >
      <Icon
        name="pulse"
        size={size * 0.56}
        color={theme.bgDeep}
        strokeWidth={2.4}
      />
    </div>
  );
};

export const BrandLockup: React.FC<{
  size?: number;
  subtitle?: string;
}> = ({ size = 96, subtitle = "منصة إدارة العيادات" }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.28,
      }}
    >
      <BrandMark size={size} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontSize: size * 0.72,
            fontWeight: 800,
            letterSpacing: "-.02em",
            color: theme.text,
            direction: "ltr",
            lineHeight: 1.1,
          }}
        >
          ClinicFlow
        </div>
        <div
          style={{
            fontSize: size * 0.27,
            fontWeight: 500,
            color: theme.text2,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
};

/** شريط رفيع بيتملي — بيدّي إحساس بالتقدّم تحت العناوين */
export const Underline: React.FC<{
  width: number;
  delay?: number;
  duration?: number;
}> = ({ width, delay = 0, duration = 30 }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: width * grow,
        height: 5,
        borderRadius: 99,
        background: `linear-gradient(90deg, ${theme.brand}, ${theme.info})`,
      }}
    />
  );
};
