/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Film, Star, ArrowLeft } from 'lucide-react';
import { MathProblem } from '../engine/types';
import { PWAInstallButton } from './PWAInstallButton';

interface HUDProps {
  currentCardIndex: number;
  totalCards: number;
  elapsedSeconds: number;
  score: number;
  totalStars: number;
  hintMessage: string;
  problem: MathProblem | null;
  onOpenReplay: () => void;
  onRequestHint: () => void;
  onBackToMenu: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  currentCardIndex,
  totalCards,
  elapsedSeconds,
  score,
  totalStars,
  hintMessage,
  problem,
  onOpenReplay,
  onRequestHint,
  onBackToMenu,
  isMuted,
  onToggleSound,
}) => {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-md mx-auto pt-2.5 px-3 pb-1 select-none flex flex-col gap-1.5 z-20">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-xs border border-amber-200">
        <button
          onClick={onBackToMenu}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="回主選單"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 4 Cards Progression Roadmap & Digit Count Badge */}
        <div className="flex items-center gap-1.5">
          {problem && (
            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-lg border border-amber-300">
              {problem.digitCount === 2 ? '二位數' : problem.digitCount === 4 ? '四位數' : '三位數'}
            </span>
          )}
          {Array.from({ length: totalCards }).map((_, idx) => {
            const isDone = idx < currentCardIndex;
            const isCurrent = idx === currentCardIndex;
            return (
              <div key={`hud-card-${idx}`} className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-amber-500 text-white ring-3 ring-amber-300 scale-105 shadow-sm'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                {idx < totalCards - 1 && (
                  <div
                    className={`w-2.5 h-0.5 ${
                      idx < currentCardIndex ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Stats & Tools */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-xl">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{totalStars}</span>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-xl">
            <span>{timeFormatted}</span>
          </div>

          <button
            onClick={onToggleSound}
            className="p-1 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isMuted ? '開啟音效' : '靜音'}
          >
            {isMuted ? <VolumeX className="w-4.5 h-4.5 text-rose-500" /> : <Volume2 className="w-4.5 h-4.5 text-slate-700" />}
          </button>

          <PWAInstallButton />
        </div>
      </div>

      {/* Action Row: Replay Button + Mascot Advice Bubble */}
      <div className="flex items-stretch gap-2">
        {/* Dynamic Speech Bubble */}
        <div className="flex-1 bg-amber-50/95 border border-amber-300 rounded-2xl px-3 py-1.5 shadow-xs flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 text-sm font-bold">
            🦁
          </div>
          <p className="text-xs font-bold text-amber-950 leading-tight line-clamp-2">
            {hintMessage}
          </p>
        </div>

        {/* Replay Button */}
        <button
          onClick={onOpenReplay}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-95 text-white font-black text-xs px-2.5 py-1.5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-0.5 shrink-0 transition-transform cursor-pointer"
        >
          <Film className="w-3.5 h-3.5 text-sky-100" />
          <span>解題動畫</span>
        </button>
      </div>
    </div>
  );
};
