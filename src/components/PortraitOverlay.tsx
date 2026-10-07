/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { Smartphone } from 'lucide-react';

export const PortraitOverlay: React.FC = () => {
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const phoneIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOrientation = () => {
      // Screen width > height means landscape
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    if (!isLandscape || !phoneIconRef.current) return;

    // Anime.js 90-degree rotating loop animation
    const anim = animate(phoneIconRef.current, {
      rotate: [90, 0, 90],
      scale: [1, 1.12, 1],
      duration: 2200,
      loop: true,
      ease: 'inOutQuad',
    });

    return () => {
      anim.pause();
    };
  }, [isLandscape]);

  if (!isLandscape) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 text-white text-center">
      <div
        ref={phoneIconRef}
        className="w-24 h-24 mb-8 flex items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border-2 border-amber-400/40 shadow-xl shadow-amber-500/20"
      >
        <Smartphone className="w-14 h-14" />
      </div>

      <h2 className="text-2xl font-black mb-3 tracking-wide text-amber-300">
        請轉回「直向模式」
      </h2>

      <p className="max-w-xs text-base leading-relaxed text-slate-200 font-medium">
        為了最好的直式書寫與進位／借位運算體驗，請將裝置轉回直向模式喔！
      </p>

      <div className="mt-8 flex items-center gap-2 text-xs text-amber-200/80 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
        <span>📐 國小直式數學小卡冒險</span>
      </div>
    </div>
  );
};
