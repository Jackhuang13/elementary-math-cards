/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Delete, Lightbulb, Sparkles, ArrowDownToLine, Check, RotateCcw } from 'lucide-react';
import { OperationType } from '../engine/types';

interface KidKeypadProps {
  onInputDigit: (digit: string) => void;
  onDeleteDigit: () => void;
  onMarkCarry: () => void;
  onMarkBorrow: () => void;
  onRequestHint: () => void;
  onCheckAnswer: () => void;
  onClearMarks: () => void;
  problemType: OperationType;
  needsCarryAlert: boolean;
  needsBorrowAlert: boolean;
}

export const KidKeypad: React.FC<KidKeypadProps> = ({
  onInputDigit,
  onDeleteDigit,
  onMarkCarry,
  onMarkBorrow,
  onRequestHint,
  onCheckAnswer,
  onClearMarks,
  problemType,
  needsCarryAlert,
  needsBorrowAlert,
}) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="w-full max-w-md mx-auto px-2 sm:px-3 pb-1.5 sm:pb-3 select-none z-20 font-['Bpmf_Huninn']">
      {/* Quick Action Bar (進位 / 借位 / 清除 / 提示) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
        {problemType === 'add' ? (
          <button
            onClick={onMarkCarry}
            className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer font-['Bpmf_Huninn'] ${
              needsCarryAlert
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>＋1 進位</span>
          </button>
        ) : (
          <button
            onClick={onMarkBorrow}
            className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer font-['Bpmf_Huninn'] ${
              needsBorrowAlert
                ? 'bg-sky-500 hover:bg-sky-600 text-white ring-2 ring-sky-300'
                : 'bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>借 10</span>
          </button>
        )}

        <button
          onClick={onClearMarks}
          className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-2xl font-bold text-xs sm:text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer font-['Bpmf_Huninn']"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>清除</span>
        </button>

        <button
          onClick={onRequestHint}
          className="py-1.5 sm:py-2 px-1 sm:px-2 rounded-2xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer font-['Bpmf_Huninn']"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>小提示</span>
        </button>
      </div>

      {/* Number Buttons Grid with Big Submit Answer */}
      <div className="bg-white/95 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1 sm:gap-1.5 font-['Bpmf_Huninn']">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {digits.slice(0, 5).map((d) => (
            <button
              key={`num-${d}`}
              onClick={() => onInputDigit(d)}
              className="h-9 sm:h-11 bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-90 text-slate-800 font-bold text-lg sm:text-xl rounded-xl shadow-xs flex items-center justify-center transition-transform cursor-pointer font-['Bpmf_Huninn']"
            >
              {d}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {digits.slice(5, 9).map((d) => (
            <button
              key={`num-${d}`}
              onClick={() => onInputDigit(d)}
              className="h-9 sm:h-11 bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-90 text-slate-800 font-bold text-lg sm:text-xl rounded-xl shadow-xs flex items-center justify-center transition-transform cursor-pointer font-['Bpmf_Huninn']"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => onInputDigit('0')}
            className="h-9 sm:h-11 bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-90 text-slate-800 font-bold text-lg sm:text-xl rounded-xl shadow-xs flex items-center justify-center transition-transform cursor-pointer font-['Bpmf_Huninn']"
          >
            0
          </button>
        </div>

        {/* Bottom row: Delete and Submit Check */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-0.5">
          <button
            onClick={onDeleteDigit}
            className="col-span-1 h-9 sm:h-11 bg-slate-100 hover:bg-slate-200 border border-slate-300 active:scale-90 text-slate-700 font-bold rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform cursor-pointer font-['Bpmf_Huninn']"
            title="刪除"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            <span className="text-xs">刪除</span>
          </button>

          <button
            onClick={onCheckAnswer}
            className="col-span-3 h-9 sm:h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-sm sm:text-base rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer font-['Bpmf_Huninn']"
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>檢查答案 ⭐️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
