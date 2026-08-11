/**
 * نسخة وهمية من واجهة ClinicFlow — نفس التخطيط الحقيقي:
 * قائمة جانبية على اليمين (RTL)، شريط علوي، ومحتوى.
 *
 * المقاسات هنا بالبكسل زي التطبيق الأصلي، والمشهد بيكبّرها بـ transform.
 */

import type React from "react";
import { Icon, type IconName } from "./Icon";
import { theme } from "./theme";

export const WINDOW_WIDTH = 1400;
export const WINDOW_HEIGHT = 830;

export const NAV: { icon: IconName; label: string }[] = [
  { icon: "grid", label: "لوحة التحكم" },
  { icon: "calendar", label: "المواعيد" },
  { icon: "users", label: "المرضى" },
  { icon: "clipboard", label: "السجلات الطبية" },
  { icon: "stethoscope", label: "الأطباء" },
  { icon: "receipt", label: "الفواتير" },
  { icon: "chart", label: "التقارير" },
  { icon: "gear", label: "الإعدادات" },
];

const TitleBar: React.FC = () => (
  <div
    style={{
      height: 46,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 18px",
      background: theme.surface2,
      borderBottom: `1px solid ${theme.border}`,
    }}
  >
    <div style={{ display: "flex", gap: 8 }}>
      {["#f87171", "#fbbf24", "#4ade80"].map((c) => (
        <span
          key={c}
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: c,
            opacity: 0.8,
          }}
        />
      ))}
    </div>

    {/* شريط العنوان — بيوضّح إن ده متصفح عادي وملف واحد */}
    <div
      style={{
        flex: 1,
        maxWidth: 460,
        margin: "0 auto",
        height: 26,
        borderRadius: 99,
        background: theme.bgDeep,
        border: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        color: theme.text3,
        fontSize: 12.5,
        direction: "ltr",
      }}
    >
      <Icon name="lock" size={11} color={theme.ok} strokeWidth={2.4} />
      clinicflow-standalone.html
    </div>

    <div style={{ width: 60 }} />
  </div>
);

const Sidebar: React.FC<{ active: string }> = ({ active }) => (
  <aside
    style={{
      width: 232,
      flexShrink: 0,
      background: theme.surface,
      borderInlineEnd: `1px solid ${theme.border}`,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "17px 16px",
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: theme.brandSoft,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name="pulse" size={20} color={theme.brand} strokeWidth={2.2} />
      </div>
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontSize: 16, fontWeight: 700, direction: "ltr" }}>
          ClinicFlow
        </div>
        <div style={{ fontSize: 11.5, color: theme.text2 }}>عيادة النور</div>
      </div>
    </div>

    <nav
      style={{
        padding: "11px 9px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {NAV.map((item) => {
        const isActive = item.label === active;
        return (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "9px 11px",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? theme.brand : theme.text2,
              background: isActive ? theme.brandSoft : "transparent",
            }}
          >
            <Icon
              name={item.icon}
              size={17}
              color={isActive ? theme.brand : theme.text3}
            />
            {item.label}
          </div>
        );
      })}
    </nav>

    <div
      style={{
        marginTop: "auto",
        padding: "12px 14px",
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11.5,
        color: theme.text3,
      }}
    >
      <Icon name="moon" size={14} color={theme.text3} />
      البيانات محفوظة على جهازك
    </div>
  </aside>
);

export const AppWindow: React.FC<{
  active: string;
  title: string;
  action?: string;
  children: React.ReactNode;
}> = ({ active, title, action, children }) => (
  <div
    style={{
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      borderRadius: 16,
      overflow: "hidden",
      background: theme.bg,
      border: `1px solid ${theme.border}`,
      boxShadow: "0 40px 120px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.03)",
      display: "flex",
      flexDirection: "column",
      direction: "rtl",
      fontFamily: theme.font,
      color: theme.text,
    }}
  >
    <TitleBar />

    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <Sidebar active={active} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 58,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.surface,
          }}
        >
          <h1 style={{ fontSize: 19, fontWeight: 700 }}>{title}</h1>
          {action ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.bgDeep,
                background: theme.brand,
                padding: "7px 15px",
                borderRadius: 9,
              }}
            >
              {action}
            </span>
          ) : null}
        </header>

        <div style={{ flex: 1, padding: 20, minHeight: 0 }}>{children}</div>
      </div>
    </div>
  </div>
);

/** كارت أبيض بحدّ — نفس .card في التطبيق */
export const Card: React.FC<{
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ title, children, style }) => (
  <div
    style={{
      background: theme.surface,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      ...style,
    }}
  >
    {title ? (
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${theme.border}`,
          fontSize: 14.5,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
    ) : null}
    <div style={{ padding: 16, flex: 1, minHeight: 0 }}>{children}</div>
  </div>
);
