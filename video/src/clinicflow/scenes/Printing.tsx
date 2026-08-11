/** المشهد الخامس — الطباعة: روشتة وفاتورة بعربي مظبوط */

import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { Reveal, useEnter } from "../motion";
import { ar, theme } from "../theme";

const PAPER = "#ffffff";
const INK = "#16202e";
const INK_2 = "#64748b";
const RULE = "#e3e8f0";

const Line: React.FC<{ children: React.ReactNode; delay: number }> = ({
  children,
  delay,
}) => {
  const t = useEnter(delay, 16);
  return (
    <div
      style={{
        opacity: t,
        transform: `translateY(${(1 - t) * 10}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Prescription: React.FC = () => {
  const frame = useCurrentFrame();

  // الورقة بتطلع من الطابعة — قصّ من تحت لفوق
  const out = interpolate(frame, [8, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 620,
        background: PAPER,
        color: INK,
        borderRadius: 8,
        padding: "34px 38px",
        boxShadow: "0 40px 90px rgba(0,0,0,.55)",
        fontSize: 17,
        lineHeight: 1.75,
        clipPath: `inset(0 0 ${(1 - out) * 100}% 0)`,
        transform: `translateY(${(1 - out) * 30}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: `2px solid ${RULE}`,
          paddingBottom: 14,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>عيادة النور</div>
          <div style={{ fontSize: 15, color: INK_2 }}>
            د. هالة سمير — أخصائي باطنة
          </div>
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "#e6f7f4",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Icon name="pulse" size={24} color="#0e9f8b" strokeWidth={2.2} />
        </div>
      </div>

      <Line delay={28}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
          }}
        >
          <span>
            <b>المريض:</b> منى عبد الرحمن
          </span>
          <span style={{ color: INK_2 }}>{ar("12 / 6 / 2025")}</span>
        </div>
      </Line>

      <Line delay={34}>
        <div style={{ fontSize: 16, marginBottom: 14 }}>
          <b>التشخيص:</b> ارتفاع بسيط في الضغط
        </div>
      </Line>

      <Line delay={40}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
          الروشتة
        </div>
      </Line>

      {[
        "كونكور ٥ مجم — قرص صباحًا — ٣٠ يوم",
        "أسبرين ٧٥ مجم — قرص بعد الغدا — ٣٠ يوم",
        "صورة دم كاملة بعد أسبوعين",
      ].map((item, i) => (
        <Line key={item} delay={46 + i * 7}>
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "5px 0",
              borderBottom: `1px solid ${RULE}`,
            }}
          >
            <span style={{ color: "#0e9f8b", fontWeight: 800 }}>
              {ar(i + 1)}.
            </span>
            <span>{item}</span>
          </div>
        </Line>
      ))}

      <Line delay={70}>
        <div
          style={{
            marginTop: 22,
            textAlign: "left",
            color: INK_2,
            fontSize: 15,
          }}
        >
          توقيع الطبيب
          <div
            style={{
              width: 150,
              borderTop: `1px solid ${RULE}`,
              marginTop: 26,
              marginInlineStart: "auto",
            }}
          />
        </div>
      </Line>
    </div>
  );
};

export const Printing: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 96,
        padding: "0 110px",
      }}
    >
      <Prescription />

      <div style={{ display: "grid", gap: 26, maxWidth: 620 }}>
        <Reveal delay={4} from="end" distance={36}>
          <h2
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: theme.text,
              lineHeight: 1.25,
              letterSpacing: "-.02em",
            }}
          >
            روشتة وفاتورة
            <br />
            جاهزة للطباعة
          </h2>
        </Reveal>

        <Reveal delay={18} from="end" distance={30}>
          <p style={{ fontSize: 28, color: theme.text2, lineHeight: 1.7 }}>
            العربي والكتابة من اليمين لليسار بيتطبعوا مظبوط ١٠٠٪ — من غير حروف
            مقطّعة ولا مقلوبة.
          </p>
        </Reveal>

        {[
          { icon: "printer" as const, text: "طباعة الروشتة بتوقيع الطبيب" },
          { icon: "receipt" as const, text: "طباعة الفاتورة وملف المريض" },
          { icon: "download" as const, text: "أو احفظها PDF من نافذة الطباعة" },
        ].map((item, i) => (
          <Reveal key={item.text} delay={30 + i * 8} from="end" distance={24}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 25,
                color: theme.text,
                fontWeight: 500,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: theme.brandSoft,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={item.icon} size={24} color={theme.brand} />
              </div>
              {item.text}
            </div>
          </Reveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};
