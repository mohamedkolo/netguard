/**
 * خط Cairo — نفس خط التطبيق.
 *
 * الملفات متحمّلة جوه public/fonts عشان الرندر يشتغل من غير نت
 * ويطلع نفس النتيجة بالظبط في كل مرة. الملفين دول متغيّرين (variable)
 * فبيغطّوا كل الأوزان من 200 لـ 1000.
 */

import { continueRender, delayRender, staticFile } from "remotion";

export const ARABIC_RANGE =
  "U+0600-06FF, U+0750-077F, U+0870-088E, U+08A0-08FF, U+200C-200E, U+2010-2011, U+FB50-FDFF, U+FE70-FEFF";

const handle = delayRender("تحميل خط Cairo");

const register = async () => {
  // اللاتيني الأول من غير نطاق محدد، والعربي بعده بنطاقه —
  // الأخير هو اللي بيكسب في الحروف المشتركة، فالعربي بياخد أولوية.
  const latin = new FontFace(
    "Cairo",
    `url(${staticFile("fonts/cairo-latin.woff2")}) format('woff2')`,
    { weight: "200 1000", display: "block" },
  );
  const arabic = new FontFace(
    "Cairo",
    `url(${staticFile("fonts/cairo-arabic.woff2")}) format('woff2')`,
    { weight: "200 1000", display: "block", unicodeRange: ARABIC_RANGE },
  );

  await Promise.all([latin.load(), arabic.load()]);
  document.fonts.add(latin);
  document.fonts.add(arabic);
};

register()
  .then(() => continueRender(handle))
  .catch((err: unknown) => {
    // من غير الخط الفيديو هيبقى بخط بديل — أحسن من إن الرندر يقف خالص.
    console.error("فشل تحميل خط Cairo:", err);
    continueRender(handle);
  });
