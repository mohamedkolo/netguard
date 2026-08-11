/** المشهد الأخير — ابدأ دلوقتي */

import type React from "react";
import { AbsoluteFill } from "remotion";
import { BrandLockup } from "../Brand";
import { Icon, type IconName } from "../Icon";
import { Reveal } from "../motion";
import { theme } from "../theme";

const EXTRAS: { icon: IconName; text: string }[] = [
  { icon: "moon", text: "وضع ليلي" },
  { icon: "phone", text: "شغّال على الموبايل" },
  { icon: "bolt", text: "من غير نت" },
  { icon: "check", text: "مجاني ومفتوح" },
];

export const Outro: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
      }}
    >
      <Reveal delay={2} from="scale">
        <BrandLockup size={112} subtitle="منصة إدارة العيادات" />
      </Reveal>

      <Reveal delay={16} from="bottom" distance={26}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px 40px",
            borderRadius: 20,
            background: theme.surface,
            border: `1px solid ${theme.brand}55`,
            boxShadow: `0 0 60px ${theme.brand}22, 0 24px 60px rgba(0,0,0,.5)`,
          }}
        >
          <Icon name="download" size={30} color={theme.brand} />
          <span style={{ fontSize: 34, fontWeight: 700, color: theme.text }}>
            افتح
            <code
              style={{
                direction: "ltr",
                display: "inline-block",
                margin: "0 10px",
                padding: "4px 14px",
                borderRadius: 10,
                background: theme.bgDeep,
                color: theme.brand,
                fontSize: 29,
                fontFamily: "monospace",
              }}
            >
              clinicflow-standalone.html
            </code>
            وابدأ
          </span>
        </div>
      </Reveal>

      <div style={{ display: "flex", gap: 18, marginTop: 4 }}>
        {EXTRAS.map((e, i) => (
          <Reveal key={e.text} delay={30 + i * 6} from="bottom" distance={18}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 20px",
                borderRadius: 99,
                border: `1px solid ${theme.border}`,
                background: `${theme.surface}aa`,
                color: theme.text2,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              <Icon name={e.icon} size={19} color={theme.brand} />
              {e.text}
            </div>
          </Reveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};
