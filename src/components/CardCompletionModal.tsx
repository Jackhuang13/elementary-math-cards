/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { MathProblem } from '../engine/types';
import { ArrowRight, Trophy, Star, Sparkles, RotateCcw, Film, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CardCompletionModalProps {
  cardIndex: number;
  totalCards: number;
  problem: MathProblem;
  onProceed: () => void;
  onRetry: () => void;
  onOpenReplay: () => void;
}

export const CardCompletionModal: React.FC<CardCompletionModalProps> = ({
  cardIndex,
  totalCards,
  problem,
  onProceed,
  onRetry,
  onOpenReplay,
}) => {
  const isFinalCard = cardIndex + 1 >= totalCards;
  const evaluation = problem.evaluation;
  const stars = evaluation?.stars ?? 0;

  // Animated refs
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const starsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fire celebratory confetti burst for 2 or 3 stars
    if (stars >= 2) {
      try {
        confetti({
          particleCount: stars === 3 ? 65 : 35,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {
        // Ignored
      }
    }

    // Modal pop-in animation via animejs
    if (modalBoxRef.current) {
      animate(modalBoxRef.current, {
        scale: [0.75, 1],
        opacity: [0, 1],
        duration: 450,
        ease: 'outBack(1.4)',
      });
    }

    // Stars sequential pop
    if (starsContainerRef.current) {
      const starEls = starsContainerRef.current.querySelectorAll('.star-badge');
      animate(starEls, {
        scale: [0, 1.25, 1],
        rotate: [-25, 0],
        opacity: [0, 1],
        delay: (_el: unknown, i: number = 0) => 180 + i * 160,
        duration: 450,
        ease: 'outBack(2.2)',
      });
    }
  }, [stars]);

  const getStarTitle = () => {
    if (stars === 3) return '🏆 三星完全正確！';
    if (stars === 2) return '⭐️⭐️ 二星部分正確！';
    if (stars === 1) return '⭐️ 一星觀念正確！';
    return '💪 再接再厲！';
  };

  const getHeaderGradient = () => {
    if (stars === 3) return 'from-amber-400 to-orange-400';
    if (stars === 2) return 'from-sky-400 to-blue-500';
    if (stars === 1) return 'from-teal-400 to-emerald-500';
    return 'from-slate-400 to-slate-500';
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 select-none">
      <div
        ref={modalBoxRef}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 flex flex-col items-center text-center p-5 relative"
      >
        {/* Top Celebration Ribbon / Badge */}
        <div
          className={`w-14 h-14 rounded-full bg-gradient-to-tr ${getHeaderGradient()} flex items-center justify-center text-white shadow-lg mb-2.5 border-2 border-white`}
        >
          {stars === 3 ? (
            <Trophy className="w-7 h-7 text-amber-50" />
          ) : (
            <Sparkles className="w-7 h-7 text-white" />
          )}
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full mb-1">
          {problem.difficultyTag}
        </span>

        <h3 className="text-xl font-black text-slate-800 mb-0.5">
          第 {cardIndex + 1} / {totalCards} 卡 · {getStarTitle()}
        </h3>

        {/* 3 Stars Display */}
        <div ref={starsContainerRef} className="flex items-center justify-center gap-2.5 my-2.5">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <div
                key={`star-${starIdx}`}
                className={`star-badge w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-transform ${
                  isEarned
                    ? 'bg-amber-400 text-white shadow-amber-400/40 ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-300 border border-slate-200'
                }`}
              >
                <Star
                  className={`w-6 h-6 ${
                    isEarned ? 'fill-white text-white drop-shadow' : 'text-slate-300'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Detailed Review Checklist */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600">答案計算結果：</span>
            {evaluation?.isAnswerCorrect ? (
              <span className="inline-flex items-center gap-1 font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> 全部正確
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5" /> 答案有誤
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600">進位／借位標記：</span>
            {evaluation?.isProcessCorrect ? (
              <span className="inline-flex items-center gap-1 font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> 標記精準
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" /> 標記缺漏
              </span>
            )}
          </div>

          <div className="pt-1.5 border-t border-slate-200 text-slate-700 font-medium leading-relaxed">
            {evaluation?.feedbackMessage}
          </div>
        </div>

        {/* Math Formula Card */}
        <div className="w-full bg-amber-50/80 border border-amber-200 rounded-2xl py-2 px-3 mb-4 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-800">標準算式：</span>
          <div className="text-lg font-black text-slate-800 tracking-wider">
            {problem.operandA} {problem.type === 'add' ? '+' : '−'} {problem.operandB} ={' '}
            <span className="text-emerald-600 underline decoration-emerald-400 decoration-2">
              {problem.result}
            </span>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {/* Proceed Button */}
          <button
            onClick={onProceed}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-black text-base rounded-2xl shadow-lg shadow-orange-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{isFinalCard ? '🏆 查看冒險總結算' : '➡️ 挑戰下一張小卡'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Secondary Options: Retry for 3 stars or Watch Replay */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRetry}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>{stars === 3 ? '再練一次' : '再挑戰拿3星'}</span>
            </button>

            <button
              onClick={onOpenReplay}
              className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-indigo-200 transition-all cursor-pointer"
            >
              <Film className="w-3.5 h-3.5 text-indigo-600" />
              <span>看解題動畫</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
