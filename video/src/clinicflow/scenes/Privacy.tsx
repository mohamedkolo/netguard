/** المشهد السادس — الخصوصية: البيانات مش بتسيب الجهاز */

import { Fragment } from "react";
import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Icon } from "../Icon";
import { Reveal, useEnter } from "../motion";
import { theme } from "../theme";

const Shield: React.FC = () => {
  const t = useEnter(2, 30);
  const frame = useCurrentFrame();
  const halo = Math.sin((frame / 55) * Math.PI * 2) * 0.5 + 0.5;

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: 240,
        height: 240,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.brand}55 0%, transparent 68%)`,
          opacity: 0.5 + halo * 0.5,
          transform: `scale(${0.9 + halo * 0.14})`,
        }}
      />
      <div
        style={{
          opacity: t,
          transform: `scale(${0.65 + t * 0.35})`,
        }}
      >
        <Icon name="shield" size={170} color={theme.brand} strokeWidth={1.3} />
      </div>
    </div>
  );
};

/**
 * البيانات بتحاول تخرج بره وبترتد على حدود الجهاز.
 * كل النقط بترتد على نفس نصف القطر، وفيه دايرة متقطّعة على نفس المسافة
 * عشان الحدّ يبقى واضح إنه سور مش صدفة.
 */
const BARRIER = 186;
const CYCLE = 74;
const PARTICLES = [-58, -20, 18, 56, 122, 200, 238, 320];

const Blocked: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <>
      {/* سور الجهاز */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: BARRIER * 2,
          height: BARRIER * 2,
          marginTop: -BARRIER,
          marginLeft: -BARRIER,
          borderRadius: "50%",
          border: `2px dashed ${theme.brand}55`,
          transform: `rotate(${frame * 0.14}deg)`,
        }}
      />

      {PARTICLES.map((deg, i) => {
        const p = (((frame / CYCLE + i * 0.13) % 1) + 1) % 1;
        const radius = interpolate(p, [0, 0.5, 1], [58, BARRIER - 12, 58]);
        const angle = (deg * Math.PI) / 180;
        const fade = interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
        const hit = interpolate(p, [0.4, 0.5, 0.66], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const color = p > 0.5 ? theme.danger : theme.info;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          // Fragment مش div: أي عنصر عادي هنا بيتحسب صف في الـ grid
          // وبيزحزح الدرع عن نص الدايرة.
          <Fragment key={deg}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 11,
                height: 11,
                marginTop: -5.5,
                marginLeft: -5.5,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 16px ${color}`,
                opacity: fade * 0.9,
                transform: `translate(${x}px, ${y}px)`,
              }}
            />
            {/* موجة صغيرة في لحظة الارتداد على السور */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 34,
                height: 34,
                marginTop: -17,
                marginLeft: -17,
                borderRadius: "50%",
                border: `2px solid ${theme.danger}`,
                opacity: hit * 0.7,
                transform: `translate(${Math.cos(angle) * BARRIER}px, ${Math.sin(angle) * BARRIER}px) scale(${0.5 + hit * 1.2})`,
              }}
            />
          </Fragment>
        );
      })}
    </>
  );
};

export const Privacy: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        padding: "0 120px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: BARRIER * 2 + 24,
          height: BARRIER * 2 + 24,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Blocked />
        <Shield />
      </div>

      <Reveal delay={20} from="bottom" distance={26}>
        <h2
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: theme.text,
            textAlign: "center",
            letterSpacing: "-.02em",
          }}
        >
          بيانات المرضى مش بتخرج من الجهاز
        </h2>
      </Reveal>

      <Reveal delay={30} from="bottom" distance={20}>
        <p
          style={{
            fontSize: 29,
            color: theme.text2,
            textAlign: "center",
            maxWidth: 1100,
            lineHeight: 1.7,
          }}
        >
          كل حاجة متخزّنة جوه المتصفح على جهازك — مفيش سيرفر بيشوفها ولا حساب
          تعمله.
        </p>
      </Reveal>

      <Reveal delay={42} from="bottom" distance={18}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 8,
            padding: "13px 24px",
            borderRadius: 99,
            background: theme.warnSoft,
            border: `1px solid ${theme.warn}44`,
            color: theme.warn,
            fontSize: 23,
            fontWeight: 600,
          }}
        >
          <Icon name="download" size={22} color={theme.warn} />
          وعشان كده: نسخة احتياطية بضغطة زرار، وتقدر ترجّعها في أي وقت
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};
