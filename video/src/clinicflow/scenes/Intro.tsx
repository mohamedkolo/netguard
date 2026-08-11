/** المشهد الأول — العلامة والاسم */

import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrandMark } from "../Brand";
import { Icon } from "../Icon";
import { Reveal, useEnter } from "../motion";
import { theme } from "../theme";

const Ring: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [delay, delay + 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        width: 200 + t * 460,
        height: 200 + t * 460,
        borderRadius: "50%",
        border: `2px solid ${theme.brand}`,
        opacity: (1 - t) * 0.45,
      }}
    />
  );
};

export const Intro: React.FC = () => {
  const mark = useEnter(4, 32);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 38,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Ring delay={16} />
        <Ring delay={44} />
        <div
          style={{
            transform: `scale(${0.55 + mark * 0.45}) rotate(${(1 - mark) * -14}deg)`,
            opacity: mark,
          }}
        >
          <BrandMark size={150} />
        </div>
      </div>

      <div style={{ textAlign: "center", display: "grid", gap: 14 }}>
        <Reveal delay={22} from="bottom" distance={26}>
          <div
            style={{
              fontSize: 108,
              fontWeight: 800,
              letterSpacing: "-.03em",
              direction: "ltr",
              lineHeight: 1,
              background: `linear-gradient(180deg, ${theme.text} 30%, ${theme.text2} 100%)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            ClinicFlow
          </div>
        </Reveal>

        <Reveal delay={34} from="bottom" distance={20}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: theme.text2,
            }}
          >
            منصة إدارة العيادات — بالعربي
          </div>
        </Reveal>
      </div>

      <Reveal delay={48} from="bottom" distance={16}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 22px",
            borderRadius: 99,
            border: `1px solid ${theme.border}`,
            background: `${theme.surface}cc`,
            color: theme.text2,
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <Icon name="bolt" size={20} color={theme.brand} />
          بيشتغل في المتصفح على طول
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};
