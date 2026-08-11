/** المشهد الثاني — الوعد: من غير سيرفر ولا تنصيب ولا اشتراك */

import type React from "react";
import { AbsoluteFill } from "remotion";
import { Icon, type IconName } from "../Icon";
import { Reveal, useEnter } from "../motion";
import { theme } from "../theme";

const ITEMS: { icon: IconName; text: string }[] = [
  { icon: "ban", text: "من غير سيرفر" },
  { icon: "ban", text: "من غير تنصيب" },
  { icon: "ban", text: "من غير اشتراك" },
];

const Chip: React.FC<{ icon: IconName; text: string; delay: number }> = ({
  icon,
  text,
  delay,
}) => {
  const t = useEnter(delay, 22);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 32px",
        borderRadius: 18,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 18px 44px rgba(0,0,0,.4)",
        opacity: t,
        transform: `translateY(${(1 - t) * 30}px) scale(${0.9 + t * 0.1})`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: theme.danger + "1f",
        }}
      >
        <Icon name={icon} size={24} color={theme.danger} strokeWidth={2.2} />
      </div>
      <span style={{ fontSize: 34, fontWeight: 700, color: theme.text }}>
        {text}
      </span>
    </div>
  );
};

export const Pitch: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 52,
        padding: 80,
      }}
    >
      <Reveal delay={2} from="bottom" distance={28}>
        <h2
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: theme.text,
            textAlign: "center",
            letterSpacing: "-.02em",
          }}
        >
          عيادتك كلها في مكان واحد
        </h2>
      </Reveal>

      <div style={{ display: "flex", gap: 26 }}>
        {ITEMS.map((item, i) => (
          <Chip
            key={item.text}
            icon={item.icon}
            text={item.text}
            delay={18 + i * 9}
          />
        ))}
      </div>

      <Reveal delay={54} from="bottom" distance={20}>
        <p
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: theme.text2,
            textAlign: "center",
          }}
        >
          تفتح ملف واحد في المتصفح… وتبدأ شغل.
        </p>
      </Reveal>
    </AbsoluteFill>
  );
};
