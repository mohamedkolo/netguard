/**
 * ألوان الفيديو الترويجي — مأخوذة من الوضع الليلي في css/styles.css
 * عشان الفيديو يبقى بنفس هوية التطبيق بالظبط.
 */

export const theme = {
  bg: "#0b111c",
  bgDeep: "#060a12",
  surface: "#151e2d",
  surface2: "#1b2536",
  border: "#263349",

  text: "#e8eef7",
  text2: "#9aabc2",
  text3: "#6b7f99",

  brand: "#2ec4ac",
  brandDark: "#12a189",
  brandSoft: "#12312d",

  info: "#60a5fa",
  infoSoft: "#16263f",
  ok: "#4ade80",
  okSoft: "#12301f",
  warn: "#fbbf24",
  warnSoft: "#332512",
  danger: "#f87171",

  font: "'Cairo', system-ui, sans-serif",
} as const;

/** أرقام عربية-هندية زي ما بيعرضها التطبيق بلغة ar-EG */
export const ar = (value: string | number): string =>
  String(value).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] as string);
