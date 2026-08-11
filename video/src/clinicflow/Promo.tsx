/**
 * الفيديو الترويجي لـ ClinicFlow.
 *
 * كل مشهد Sequence مستقل، والمشاهد بتتداخل شوية فريمات
 * عشان الانتقال يبقى تلاشي ناعم مش قطع.
 */

import type React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import "./fonts";
import { Backdrop } from "./Backdrop";
import { Scene } from "./motion";
import { theme } from "./theme";
import { Dashboard } from "./scenes/Dashboard";
import { Features } from "./scenes/Features";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { Pitch } from "./scenes/Pitch";
import { Printing } from "./scenes/Printing";
import { Privacy } from "./scenes/Privacy";

/** عدد الفريمات اللي كل مشهد بيتداخل فيها مع اللي بعده */
const OVERLAP = 12;

const SCENES: { name: string; duration: number; Component: React.FC }[] = [
  { name: "intro", duration: 120, Component: Intro },
  { name: "pitch", duration: 140, Component: Pitch },
  { name: "dashboard", duration: 240, Component: Dashboard },
  { name: "features", duration: 205, Component: Features },
  { name: "printing", duration: 225, Component: Printing },
  { name: "privacy", duration: 180, Component: Privacy },
  { name: "outro", duration: 180, Component: Outro },
];

const starts: number[] = [];
let cursor = 0;
for (const scene of SCENES) {
  starts.push(cursor);
  cursor += scene.duration - OVERLAP;
}

export const PROMO_DURATION = cursor + OVERLAP;

export const Promo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bgDeep,
        fontFamily: theme.font,
        color: theme.text,
        direction: "rtl",
      }}
    >
      <Backdrop />

      {SCENES.map((scene, i) => (
        <Sequence
          key={scene.name}
          name={scene.name}
          from={starts[i]}
          durationInFrames={scene.duration}
        >
          <Scene
            durationInFrames={scene.duration}
            fadeIn={i === 0 ? 18 : 14}
            fadeOut={i === SCENES.length - 1 ? 26 : 16}
          >
            <scene.Component />
          </Scene>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
