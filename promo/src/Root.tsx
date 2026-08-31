import React from 'react';
import {Composition} from 'remotion';
import {Promo} from './Promo';

// 1080x1080 square — takes the most vertical space in the X feed.
// A 9:16 cut for Reels/TikTok is registered below the main one.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="PromoVertical"
        component={Promo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
