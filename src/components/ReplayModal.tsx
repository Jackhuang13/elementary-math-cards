/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { MathProblem, ReplayStep } from '../engine/types';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, X, Film, CheckCircle } from 'lucide-react';
import { soundManager } from '../engine/SoundManager';

interface ReplayModalProps {
  problem: MathProblem | null;
  onClose: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({ problem, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Animated refs
  const focusBoxRef = useRef<HTMLDivElement>(null);
  const formulaBoxRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const scratchLineRef = useRef<HTMLDivElement>(null);

  if (!problem) return null;

  const steps = problem.replaySteps;
  const currentStep: ReplayStep | undefined = steps[currentStepIndex];

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStepIndex < steps.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 2400);
    } else if (isPlaying && currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length]);

  // Anime.js trigger on step change
  useEffect(() => {
    if (!currentStep) return;

    // 1. Highlight pulse on focus box
    if (focusBoxRef.current) {
      animate(focusBoxRef.current, {
        scale: [0.94, 1.05, 1],
        opacity: [0.6, 1],
        duration: 500,
        ease: 'outBack',
      });
    }

    // 2. Math formula slide-in
    if (formulaBoxRef.current) {
      animate(formulaBoxRef.current, {
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 400,
        ease: 'outCubic',
      });
    }

    // 3. Float in badge for carry or borrow
    if (badgeRef.current && (currentStep.actionType === 'carry_mark' || currentStep.actionType === 'borrow_receive')) {
      animate(badgeRef.current, {
        translateY: [-24, 0],
        scale: [0.5, 1.2, 1],
        duration: 550,
        ease: 'outElastic(1, 0.6)',
      });
    }

    // 4. Scratch strike-through animation
    if (scratchLineRef.current && currentStep.actionType === 'borrow_scratch') {
      animate(scratchLineRef.current, {
        scaleX: [0, 1],
        duration: 350,
        ease: 'outQuad',
      });
      soundManager.playScratch();
    } else if (currentStep.actionType === 'carry_mark') {
      soundManager.playCarryMark();
    } else if (currentStep.actionType === 'write_answer') {
      soundManager.playChime();
    } else {
      soundManager.playPop();
    }
  }, [currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
  };

  // Replay state reconstruction up to current step
  const renderedState = () => {
    const cols = problem.columns.map((col) => ({
      ...col,
      scratched: false,
      modifiedA: undefined as number | undefined,
      carryMarked: false,
      receivedBorrow: false,
      answerDigit: '',
    }));

    for (let i = 0; i <= currentStepIndex; i++) {
      const s = steps[i];
      const c = cols[s.columnIndex];
      if (!c) continue;

      if (s.actionType === 'carry_mark') {
        // Next column receives carry
        const nextCol = cols[s.columnIndex + 1];
        if (nextCol) nextCol.carryMarked = true;
      }
      if (s.actionType === 'borrow_scratch') {
        c.scratched = true;
        c.modifiedA = Number(s.targetValue);
      }
      if (s.actionType === 'borrow_receive') {
        c.receivedBorrow = true;
      }
      if (s.actionType === 'write_answer') {
        c.answerDigit = String(s.targetValue);
      }
    }

    return cols;
  };

  const activeColumns = renderedState();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in font-['Bpmf_Huninn']">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-amber-300 max-h-[92vh] font-['Bpmf_Huninn']">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 sm:px-5 py-2.5 sm:py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
            <h3 className="font-bold text-base sm:text-lg">🎬 直式解題小老師</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* Step Info & Mascot Banner */}
        <div className="bg-amber-50 px-4 sm:px-5 py-2 sm:py-2.5 border-b border-amber-200">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-0.5">
            <span>步驟 {currentStepIndex + 1} / {steps.length}</span>
            <span className="bg-amber-200 px-2 py-0.5 rounded-full text-[11px]">
              {currentStep?.title || '解題過程'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
            {currentStep?.description}
          </p>
        </div>

        {/* Animated Notebook Viewport */}
        <div className="p-3 sm:p-5 flex-1 flex flex-col items-center justify-center bg-radial from-amber-50/50 via-white to-slate-50 min-h-[220px] overflow-y-auto">
          {/* Math Card Display */}
          <div className="relative w-full max-w-[340px] bg-amber-50/30 border-2 border-dashed border-amber-200 rounded-2xl p-4 shadow-inner">
            {/* Column Headers */}
            <div className="flex justify-end gap-3 mb-2 px-6">
              {activeColumns.slice().reverse().map((col, idx) => {
                const actualIdx = activeColumns.length - 1 - idx;
                const isTarget = currentStep?.highlightColumns.includes(actualIdx);
                return (
                  <div
                    key={`header-${actualIdx}`}
                    className={`w-14 text-center text-xs font-bold ${
                      isTarget ? 'text-amber-600 scale-110' : 'text-slate-400'
                    } transition-all`}
                  >
                    {col.placeName}
                  </div>
                );
              })}
            </div>

            {/* Carry Row */}
            {problem.type === 'add' && (
              <div className="flex justify-end gap-3 mb-1 px-6 h-7 items-center">
                {activeColumns.slice().reverse().map((col, idx) => {
                  const actualIdx = activeColumns.length - 1 - idx;
                  const isCurrentTarget = currentStep?.targetSlot === 'carry' && currentStep.columnIndex + 1 === actualIdx;
                  return (
                    <div key={`carry-${actualIdx}`} className="w-14 flex justify-center">
                      {col.carryMarked && (
                        <div
                          ref={isCurrentTarget ? badgeRef : null}
                          className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow-md border border-amber-500"
                        >
                          +1
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top Operand (A) & Borrow row */}
            <div className="flex justify-end gap-3 px-6 relative items-center">
              {/* Operator */}
              <div className="absolute left-4 text-2xl font-black text-slate-700">
                {problem.type === 'add' ? '+' : '−'}
              </div>

              {activeColumns.slice().reverse().map((col, idx) => {
                const actualIdx = activeColumns.length - 1 - idx;
                const isFocused = currentStep?.highlightColumns.includes(actualIdx);
                const isScratching = currentStep?.actionType === 'borrow_scratch' && currentStep.columnIndex === actualIdx;
                const isReceiving = currentStep?.actionType === 'borrow_receive' && currentStep.columnIndex === actualIdx;
                const isColOverflow = Boolean(
                  col.placePower >= problem.digitCount && col.digitA === 0 && col.digitB === 0
                );

                return (
                  <div key={`opA-${actualIdx}`} className="w-14 flex flex-col items-center relative">
                    {/* Borrowed +10 badge */}
                    {col.receivedBorrow && (
                      <div
                        ref={isReceiving ? badgeRef : null}
                        className="text-[11px] font-black bg-sky-500 text-white px-1.5 py-0.5 rounded-full mb-1 shadow-sm"
                      >
                        +10
                      </div>
                    )}

                    {/* Modified number if crossed */}
                    {col.scratched && col.modifiedA !== undefined && (
                      <span className="text-xs font-black text-rose-600 -mb-1 animate-in zoom-in">
                        {col.modifiedA}
                      </span>
                    )}

                    {/* Main Digit A */}
                    <div className="relative text-3xl font-black text-slate-800">
                      <span>{isColOverflow ? '' : col.digitA}</span>
                      {col.scratched && (
                        <div
                          ref={isScratching ? scratchLineRef : null}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="w-8 h-1 bg-rose-500 rotate-45 rounded-full origin-center" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Operand (B) */}
            <div className="flex justify-end gap-3 px-6 mt-1 mb-2 items-center">
              {activeColumns.slice().reverse().map((col, idx) => {
                const actualIdx = activeColumns.length - 1 - idx;
                const isColOverflow = Boolean(
                  col.placePower >= problem.digitCount && col.digitA === 0 && col.digitB === 0
                );
                return (
                  <div key={`opB-${actualIdx}`} className="w-14 text-center text-3xl font-black text-slate-700">
                    {isColOverflow ? '' : col.digitB}
                  </div>
                );
              })}
            </div>

            {/* Equals Line */}
            <div className="w-full h-1 bg-slate-800 rounded-full my-1.5" />

            {/* Answer Row */}
            <div className="flex justify-end gap-3 px-6 py-1 items-center">
              {activeColumns.slice().reverse().map((col, idx) => {
                const actualIdx = activeColumns.length - 1 - idx;
                const isWritingAnswer = currentStep?.targetSlot === 'answer' && currentStep.columnIndex === actualIdx;
                return (
                  <div
                    key={`ans-${actualIdx}`}
                    ref={isWritingAnswer ? focusBoxRef : null}
                    className={`w-14 h-12 rounded-xl flex items-center justify-center font-black text-3xl transition-all ${
                      col.answerDigit
                        ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-400'
                        : isWritingAnswer
                        ? 'bg-amber-100 border-2 border-amber-500 text-amber-700 animate-pulse'
                        : 'bg-slate-100/60 border border-slate-300 text-slate-300'
                    }`}
                  >
                    {col.answerDigit || (isWritingAnswer ? '?' : '')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Formula Banner */}
          {/* Mathematical Process Step Box */}
          {currentStep?.mathFormula && (
            <div
              ref={formulaBoxRef}
              className="mt-3 px-3 py-1.5 bg-amber-500/10 border border-amber-300 text-amber-900 rounded-xl text-center max-w-[320px] w-full"
            >
              <span className="text-[11px] font-bold text-amber-700 block mb-0.5">怎麼算呢：</span>
              <span className="text-sm sm:text-base font-bold tracking-wider text-amber-950">
                {currentStep.mathFormula}
              </span>
            </div>
          )}
        </div>

        {/* Step Progress Dots */}
        <div className="flex justify-center gap-1.5 py-1.5 bg-slate-50 border-t border-slate-200">
          {steps.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(false);
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'w-5 bg-amber-500'
                  : idx < currentStepIndex
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Controls Footer */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between font-['Bpmf_Huninn']">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer font-['Bpmf_Huninn']"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重播
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border border-slate-200 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 transition-transform active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex === steps.length - 1}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl border border-slate-200 disabled:opacity-30 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 shadow-sm shadow-emerald-500/20 cursor-pointer font-['Bpmf_Huninn']"
          >
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            我懂了！
          </button>
        </div>
      </div>
    </div>
  );
};
