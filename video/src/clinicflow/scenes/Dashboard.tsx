/** المشهد الثالث — لوحة التحكم شغّالة قدّام المشاهد */

import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AppWindow, Card, WINDOW_HEIGHT, WINDOW_WIDTH } from "../AppWindow";
import { Icon, type IconName } from "../Icon";
import { Reveal, useCountUp, useEnter } from "../motion";
import { ar, theme } from "../theme";

/** تصغير نافذة التطبيق عشان تسيب مكان للعنوان فوقها */
const SCALE = 0.84;

const STATS: {
  icon: IconName;
  value: number;
  label: string;
  tone: string;
  soft: string;
}[] = [
  {
    icon: "calendar",
    value: 12,
    label: "مواعيد النهاردة",
    tone: theme.info,
    soft: theme.infoSoft,
  },
  {
    icon: "clipboard",
    value: 4,
    label: "في انتظار الكشف",
    tone: theme.warn,
    soft: theme.warnSoft,
  },
  {
    icon: "users",
    value: 248,
    label: "إجمالي المرضى",
    tone: theme.brand,
    soft: theme.brandSoft,
  },
  {
    icon: "stethoscope",
    value: 6,
    label: "أطباء نشطين",
    tone: theme.ok,
    soft: theme.okSoft,
  },
];

const ROWS = [
  { time: "09:00 ص", name: "منى عبد الرحمن", why: "متابعة ضغط", doc: "د. هالة سمير", status: "خلصت", tone: theme.ok },
  { time: "09:30 ص", name: "أحمد فؤاد", why: "كشف أول مرة", doc: "د. كريم منصور", status: "دخل دلوقتي", tone: theme.info },
  { time: "10:15 ص", name: "سارة الشناوي", why: "تحاليل متابعة", doc: "د. هالة سمير", status: "في الانتظار", tone: theme.warn },
  { time: "11:00 ص", name: "محمود عزّت", why: "استشارة", doc: "د. ياسر عادل", status: "محجوز", tone: theme.text2 },
  { time: "11:45 ص", name: "نادية مصطفى", why: "متابعة سكر", doc: "د. كريم منصور", status: "محجوز", tone: theme.text2 },
  { time: "12:30 م", name: "يوسف الحداد", why: "كشف أول مرة", doc: "د. ياسر عادل", status: "محجوز", tone: theme.text2 },
];

const WEEK = [
  { day: "سبت", count: 7 },
  { day: "حد", count: 11 },
  { day: "اتنين", count: 9 },
  { day: "تلات", count: 14 },
  { day: "أربع", count: 8 },
  { day: "خميس", count: 15 },
  { day: "جمعة", count: 12 },
];

const StatCard: React.FC<{
  stat: (typeof STATS)[number];
  delay: number;
}> = ({ stat, delay }) => {
  const t = useEnter(delay, 20);
  const n = useCountUp(stat.value, { delay: delay + 4, duration: 30 });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "15px 17px",
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        opacity: t,
        transform: `translateY(${(1 - t) * 16}px)`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: stat.soft,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={stat.icon} size={22} color={stat.tone} />
      </div>
      <div>
        <div style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.15 }}>
          {ar(Math.round(n))}
        </div>
        <div style={{ fontSize: 12.5, color: theme.text2 }}>{stat.label}</div>
      </div>
    </div>
  );
};

const Bar: React.FC<{
  item: (typeof WEEK)[number];
  max: number;
  delay: number;
}> = ({ item, max, delay }) => {
  const t = useEnter(delay, 24);
  const height = (item.count / max) * 100 * t;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        height: "100%",
      }}
    >
      <span style={{ fontSize: 11.5, color: theme.text2, opacity: t }}>
        {ar(item.count)}
      </span>
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            width: "100%",
            height: `${height}%`,
            borderRadius: "6px 6px 3px 3px",
            background: `linear-gradient(180deg, ${theme.brand}, ${theme.brandDark})`,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: theme.text3 }}>{item.day}</span>
    </div>
  );
};

const Row: React.FC<{ row: (typeof ROWS)[number]; delay: number }> = ({
  row,
  delay,
}) => {
  const t = useEnter(delay, 18);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "78px 1fr 120px 96px",
        alignItems: "center",
        gap: 10,
        padding: "11px 4px",
        borderBottom: `1px solid ${theme.border}`,
        opacity: t,
        transform: `translateX(${(1 - t) * 22}px)`,
      }}
    >
      <span style={{ fontSize: 13, color: theme.text2, fontWeight: 600 }}>
        {ar(row.time)}
      </span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{row.name}</div>
        <div style={{ fontSize: 11.5, color: theme.text3 }}>{row.why}</div>
      </div>
      <span style={{ fontSize: 13, color: theme.text2 }}>{row.doc}</span>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: row.tone,
          background: `${row.tone}1f`,
          padding: "4px 9px",
          borderRadius: 99,
          textAlign: "center",
        }}
      >
        {row.status}
      </span>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const max = Math.max(...WEEK.map((w) => w.count));

  const revenue = useCountUp(18450, { delay: 40, duration: 40 });
  const due = useCountUp(3200, { delay: 46, duration: 40 });

  // النافذة بتستوي من ميلان بسيط — لمسة بتدّي عمق
  const settle = useEnter(0, 40);
  const tilt = (1 - settle) * 7;
  const drift = interpolate(frame, [0, 220], [0, -14]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Reveal delay={6} from="top" distance={22} style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: theme.text,
            textAlign: "center",
          }}
        >
          كل حال العيادة في شاشة واحدة
        </div>
      </Reveal>

      {/* الغلاف بياخد المقاس بعد التصغير عشان النافذة تفضل في نص الكادر */}
      <div
        style={{
          position: "relative",
          width: WINDOW_WIDTH * SCALE,
          height: WINDOW_HEIGHT * SCALE,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: `perspective(2400px) translateY(${drift}px) rotateY(${tilt}deg) rotateX(${tilt * 0.35}deg)`,
            }}
          >
            <AppWindow active="لوحة التحكم" title="لوحة التحكم" action="حجز موعد">
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", gap: 14 }}>
              {STATS.map((s, i) => (
                <StatCard key={s.label} stat={s} delay={14 + i * 5} />
              ))}
            </div>

            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1.55fr 1fr",
                gap: 16,
                minHeight: 0,
              }}
            >
              <Card title="مواعيد النهاردة — الخميس ١٢ يونيو">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "78px 1fr 120px 96px",
                      gap: 10,
                      padding: "0 4px 9px",
                      borderBottom: `1px solid ${theme.border}`,
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: theme.text3,
                    }}
                  >
                    <span>الوقت</span>
                    <span>المريض</span>
                    <span>الطبيب</span>
                    <span style={{ textAlign: "center" }}>الحالة</span>
                  </div>
                  {ROWS.map((r, i) => (
                    <Row key={r.name} row={r} delay={40 + i * 7} />
                  ))}
                </div>
              </Card>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  minHeight: 0,
                }}
              >
                <Card title="الحساب">
                  <div style={{ display: "grid", gap: 13 }}>
                    <div>
                      <div style={{ fontSize: 12, color: theme.text2 }}>
                        محصّل الشهر ده
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color: theme.ok,
                        }}
                      >
                        {ar(Math.round(revenue).toLocaleString("en-US"))} ج.م
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: theme.text2 }}>
                        مستحقات لسه متحصّلتش
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color: theme.warn,
                        }}
                      >
                        {ar(Math.round(due).toLocaleString("en-US"))} ج.م
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="المواعيد آخر ٧ أيام" style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 9, height: "100%" }}>
                    {WEEK.map((w, i) => (
                      <Bar key={w.day} item={w} max={max} delay={62 + i * 4} />
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
            </AppWindow>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
