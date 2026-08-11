/**
 * أيقونات SVG مرسومة بالإيد بدل الإيموچي.
 *
 * الإيموچي بيتغيّر شكله من نظام لنظام وساعات مش بيتظبط في الرندر،
 * فالخطوط دي بتضمن إن الفيديو يطلع بنفس الشكل في أي مكان.
 * كلها على شبكة 24×24 بنفس سُمك الخط.
 */

import type React from "react";

export type IconName =
  | "pulse"
  | "grid"
  | "calendar"
  | "users"
  | "clipboard"
  | "stethoscope"
  | "receipt"
  | "chart"
  | "gear"
  | "shield"
  | "printer"
  | "moon"
  | "phone"
  | "lock"
  | "check"
  | "download"
  | "bolt"
  | "ban";

const paths: Record<IconName, React.ReactNode> = {
  // خط النبض — علامة التطبيق
  pulse: <path d="M2 12h4.2l2.6-7 4.4 14 2.8-7H22" />,
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3 10.5h18" />
      <path d="M7.5 14.5h3M13.5 14.5h3M7.5 18h3" />
    </>
  ),
  users: (
    <>
      <circle cx="9.5" cy="8" r="3.6" />
      <path d="M3 20.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.8 5.2a3.6 3.6 0 0 1 0 6.6" />
      <path d="M18.4 15.1c1.8.9 2.6 2.5 2.6 5.4" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="2" width="6" height="4" rx="1.4" />
      <path d="M8.5 11h7M8.5 15h7M8.5 18h4" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5.5 2.5v5a4 4 0 0 0 8 0v-5" />
      <path d="M4 2.5h3M12 2.5h3" />
      <path d="M9.5 11.5v3a5 5 0 0 0 10 0v-1.2" />
      <circle cx="19.5" cy="10.5" r="2.2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2Z" />
      <path d="M9.5 8h5M9.5 12h5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <path d="M6.5 21v-6M12 21V6.5M17.5 21v-9.5" />
    </>
  ),
  // مؤشرات ضبط — أوضح من الترس في المقاسات الصغيرة
  gear: (
    <>
      <path d="M3 7.5h9.5M17 7.5h4M3 16.5h4M11.5 16.5h9.5" />
      <circle cx="14.8" cy="7.5" r="2.4" />
      <circle cx="9.2" cy="16.5" r="2.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4.5 5.6v6c0 4.9 3.1 8.8 7.5 10.4 4.4-1.6 7.5-5.5 7.5-10.4v-6L12 2.5Z" />
      <path d="m8.8 12.2 2.3 2.3 4.1-4.4" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8.5v-6h10v6" />
      <path d="M7 17.5H5.5a2.5 2.5 0 0 1-2.5-2.5v-4a2.5 2.5 0 0 1 2.5-2.5h13a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5H17" />
      <rect x="7" y="13.5" width="10" height="8" rx="1.5" />
    </>
  ),
  moon: <path d="M20.5 14.8A8.7 8.7 0 0 1 9.2 3.5a8.7 8.7 0 1 0 11.3 11.3Z" />,
  phone: (
    <>
      <rect x="6.5" y="2" width="11" height="20" rx="2.8" />
      <path d="M10.8 18.5h2.4" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11.5" rx="2.8" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v3" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  download: (
    <>
      <path d="M12 3v11.5M12 14.5 16.2 10M12 14.5 7.8 10" />
      <path d="M4 19.5h16" />
    </>
  ),
  bolt: <path d="M13.5 2 4 13.5h6.5L9.5 22 19 10.5h-6.5L13.5 2Z" />,
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </>
  ),
};

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}> = ({ name, size = 24, color = "currentColor", strokeWidth = 1.8 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
    >
      {paths[name]}
    </svg>
  );
};
