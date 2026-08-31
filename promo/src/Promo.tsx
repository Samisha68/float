import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Poppins';
import {Mark} from './Mark';

const {fontFamily} = loadFont('normal', {weights: ['700']});

/**
 * Float promo — 10s trailer.
 * All timings in SECONDS. Change a number, the cut changes.
 *
 * Source clips are 688x464 @ 6.04s WITH audio. They are LETTERBOXED rather
 * than cropped: filling a 1080 square would crop ~33% of the width and
 * upscale 2.3x. Black bars keep the full frame and read as cinematic.
 */
export const TIMING = {
  clipA: [0.6, 4.6] as const,
  clipB: [5.0, 8.6] as const,
  logo: [9.3, 10.0] as const,
};

/** float1 = deep and still (opener). float2 = the rise (closer). */
const CLIPS = {
  a: {src: 'float1.mp4', trimFrom: 1.0},
  b: {src: 'float2.mp4', trimFrom: 2.2},
};

const SOURCE_ASPECT = 688 / 464;

const GRADE = 'grayscale(1) contrast(1.16) brightness(0.76)';
const BLUE_VEIL = 'rgba(3, 19, 41, 0.40)';

/**
 * Letterboxed, graded shot. Audio from the source plays, fading with the
 * picture so the cuts never pop. The corner vignette buries the Grok
 * watermark — that corner is already near black, so it reads as falloff.
 */
const Shot: React.FC<{
  src: string;
  trimBefore: number;
  durationInFrames: number;
  fadeIn: number;
  fadeOut: number;
}> = ({src, trimBefore, durationInFrames, fadeIn, fadeOut}) => {
  const {width} = useVideoConfig();
  const videoHeight = width / SOURCE_ASPECT;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          position: 'relative',
          width,
          height: videoHeight,
          overflow: 'hidden',
        }}
      >
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={trimBefore}
          volume={(f) =>
            interpolate(
              f,
              [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
              [0, 1, 1, 0],
              {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
            )
          }
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: GRADE,
          }}
        />
        <AbsoluteFill style={{backgroundColor: BLUE_VEIL}} />
        {/* kills the watermark */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse 42% 62% at 100% 100%, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.9) 34%, rgba(0,0,0,0) 72%)',
          }}
        />
        {/* general edge falloff */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse 78% 84% at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const EdgeFade: React.FC<{
  durationInFrames: number;
  fadeIn: number;
  fadeOut: number;
  children: React.ReactNode;
}> = ({durationInFrames, fadeIn, fadeOut, children}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

/** End card: mark over the wordmark. The name is the only text in the film. */
const Logo: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const opacity = interpolate(frame, [0, durationInFrames * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: width * 0.045,
        opacity,
      }}
    >
      <Mark width={width * 0.3} />
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: width * 0.135,
          letterSpacing: width * -0.0045,
          color: '#FFFFFF',
          lineHeight: 1,
        }}
      >
        float
      </div>
    </AbsoluteFill>
  );
};

export const Promo: React.FC = () => {
  const {fps} = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);

  const aFrom = f(TIMING.clipA[0]);
  const aDur = f(TIMING.clipA[1]) - aFrom;
  const bFrom = f(TIMING.clipB[0]);
  const bDur = f(TIMING.clipB[1]) - bFrom;
  const lFrom = f(TIMING.logo[0]);
  const lDur = f(TIMING.logo[1]) - lFrom;

  return (
    <AbsoluteFill style={{backgroundColor: '#000000'}}>
      <Sequence from={aFrom} durationInFrames={aDur}>
        <EdgeFade durationInFrames={aDur} fadeIn={f(0.7)} fadeOut={f(0.4)}>
          <Shot
            src={CLIPS.a.src}
            trimBefore={f(CLIPS.a.trimFrom)}
            durationInFrames={aDur}
            fadeIn={f(0.7)}
            fadeOut={f(0.4)}
          />
        </EdgeFade>
      </Sequence>

      <Sequence from={bFrom} durationInFrames={bDur}>
        <EdgeFade durationInFrames={bDur} fadeIn={f(0.35)} fadeOut={f(0.45)}>
          <Shot
            src={CLIPS.b.src}
            trimBefore={f(CLIPS.b.trimFrom)}
            durationInFrames={bDur}
            fadeIn={f(0.35)}
            fadeOut={f(0.45)}
          />
        </EdgeFade>
      </Sequence>

      <Sequence from={lFrom} durationInFrames={lDur}>
        <Logo durationInFrames={lDur} />
      </Sequence>
    </AbsoluteFill>
  );
};
