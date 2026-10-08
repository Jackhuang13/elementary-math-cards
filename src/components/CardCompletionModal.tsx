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
    if (stars === 3) return '🏆 太棒了！全部答對！';
    if (stars === 2) return '⭐️⭐️ 答對了！很厲害喔！';
    if (stars === 1) return '⭐️ 加油！再試一次會更棒！';
    return '💪 再接再厲！';
  };

  const getHeaderGradient = () => {
    if (stars === 3) return 'from-amber-400 to-orange-400';
    if (stars === 2) return 'from-sky-400 to-blue-500';
    if (stars === 1) return 'from-teal-400 to-emerald-500';
    return 'from-slate-400 to-slate-500';
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 select-none font-bpmf">
      <div
        ref={modalBoxRef}
        className="w-[94%] max-w-[390px] bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300 flex flex-col items-center text-center p-4 sm:p-5 relative font-bpmf"
      >
        {/* Top Celebration Ribbon / Badge */}
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr ${getHeaderGradient()} flex items-center justify-center text-white shadow-lg mb-2 border-2 border-white`}
        >
          {stars === 3 ? (
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-50" />
          ) : (
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          )}
        </div>

        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full mb-1 tracking-zhuyin font-bpmf">
          {problem.difficultyTag}
        </span>

        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 tracking-zhuyin font-bpmf">
          第 {cardIndex + 1} / {totalCards} 卡 · {getStarTitle()}
        </h3>

        {/* 3 Stars Display */}
        <div ref={starsContainerRef} className="flex items-center justify-center gap-2.5 my-2">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <div
                key={`star-${starIdx}`}
                className={`star-badge w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform ${
                  isEarned
                    ? 'bg-amber-400 text-white shadow-amber-400/40 ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-300 border border-slate-200'
                }`}
              >
                <Star
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${
                    isEarned ? 'fill-white text-white drop-shadow' : 'text-slate-300'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Detailed Review Checklist */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5 mb-2.5 sm:mb-3 text-left text-xs sm:text-sm space-y-1.5 font-bpmf">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600 tracking-zhuyin">答案：</span>
            {evaluation?.isAnswerCorrect ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs tracking-zhuyin">
                <CheckCircle2 className="w-3.5 h-3.5" /> 全部正確
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-xs tracking-zhuyin">
                <AlertCircle className="w-3.5 h-3.5" /> 答案有誤
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-600 tracking-zhuyin">進位／借位：</span>
            {evaluation?.isProcessCorrect ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs tracking-zhuyin">
                <CheckCircle2 className="w-3.5 h-3.5" /> 標記正確
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-xs tracking-zhuyin">
                <AlertCircle className="w-3.5 h-3.5" /> 記得標記喔
              </span>
            )}
          </div>

          <div className="pt-1.5 border-t border-slate-200 text-slate-700 font-medium leading-relaxed text-xs sm:text-sm tracking-zhuyin">
            {evaluation?.feedbackMessage}
          </div>
        </div>

        {/* Math Formula Card */}
        <div className="w-full bg-amber-50/80 border border-amber-200 rounded-2xl py-2 px-3.5 mb-3 flex items-center justify-between font-bpmf">
          <span className="text-xs sm:text-sm font-bold text-amber-800 tracking-zhuyin">正確算式：</span>
          <div className="text-base sm:text-lg font-bold text-slate-800 tracking-wider">
            {problem.operandA} {problem.type === 'add' ? '+' : '−'} {problem.operandB} ={' '}
            <span className="text-emerald-600 underline decoration-emerald-400 decoration-2">
              {problem.result}
            </span>
          </div>
        </div>

        {/* Interactive Action Buttons */}
        <div className="w-full flex flex-col gap-2 font-bpmf">
          {/* Proceed Button */}
          <button
            onClick={onProceed}
            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-bold text-base sm:text-lg rounded-2xl shadow-md shadow-orange-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer font-bpmf tracking-zhuyin"
          >
            <span>{isFinalCard ? '🏆 看冒險成績' : '➡️ 挑戰下一題'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Secondary Options */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRetry}
              className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1 border border-slate-200 transition-all cursor-pointer font-bpmf tracking-zhuyin"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>{stars === 3 ? '再練一次' : '再挑戰拿3星'}</span>
            </button>

            <button
              onClick={onOpenReplay}
              className="py-2.5 px-2 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1 border border-indigo-200 transition-all cursor-pointer font-bpmf tracking-zhuyin"
            >
              <Film className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>看解題過程</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
