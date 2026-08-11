/** المشهد الرابع — الأقسام الثمانية */

import type React from "react";
import { AbsoluteFill } from "remotion";
import { Underline } from "../Brand";
import { Icon, type IconName } from "../Icon";
import { Reveal, useEnter } from "../motion";
import { theme } from "../theme";

const FEATURES: {
  icon: IconName;
  title: string;
  desc: string;
  tone: string;
}[] = [
  { icon: "grid", title: "لوحة التحكم", desc: "مواعيد النهاردة والمحصّل في نظرة", tone: theme.brand },
  { icon: "calendar", title: "المواعيد", desc: "حجز وتعديل ومنع تعارض الأطباء", tone: theme.info },
  { icon: "users", title: "المرضى", desc: "ملف كامل لكل مريض وسجله", tone: theme.brand },
  { icon: "clipboard", title: "السجلات الطبية", desc: "أعراض وتشخيص وروشتة لكل زيارة", tone: theme.info },
  { icon: "stethoscope", title: "الأطباء", desc: "تخصصات وأسعار كشف ومواعيد عمل", tone: theme.ok },
  { icon: "receipt", title: "الفواتير", desc: "بنود متعددة وخصم ودفع جزئي", tone: theme.warn },
  { icon: "chart", title: "التقارير", desc: "ملخص أي فترة ماليًا وطبيًا", tone: theme.ok },
  { icon: "gear", title: "الإعدادات", desc: "بيانات العيادة والنسخ الاحتياطية", tone: theme.text2 },
];

const FeatureCard: React.FC<{
  feature: (typeof FEATURES)[number];
  delay: number;
}> = ({ feature, delay }) => {
  const t = useEnter(delay, 22);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "26px 24px",
        borderRadius: 20,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 20px 48px rgba(0,0,0,.35)",
        opacity: t,
        transform: `translateY(${(1 - t) * 34}px) scale(${0.93 + t * 0.07})`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 15,
          display: "grid",
          placeItems: "center",
          background: `${feature.tone}1f`,
        }}
      >
        <Icon name={feature.icon} size={28} color={feature.tone} />
      </div>
      <div>
        <div style={{ fontSize: 27, fontWeight: 700, color: theme.text }}>
          {feature.title}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: theme.text2,
            lineHeight: 1.5,
          }}
        >
          {feature.desc}
        </div>
      </div>
    </div>
  );
};

export const Features: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "0 96px",
        gap: 44,
      }}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
        <Reveal delay={2} from="bottom" distance={24}>
          <h2
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: theme.text,
              letterSpacing: "-.02em",
            }}
          >
            كل اللي العيادة محتاجاه
          </h2>
        </Reveal>
        <Underline width={200} delay={14} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 22,
          width: "100%",
          maxWidth: 1660,
        }}
      >
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={20 + i * 6} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
