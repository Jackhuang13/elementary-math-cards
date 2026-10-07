/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OperationType = 'add' | 'sub';

export type GameMode =
  | 'basic'
  | 'adv_carry'
  | 'adv_borrow'
  | 'grand_master'
  | 'mixed'
  | 'carry'
  | 'borrow';

export type DigitCount = 2 | 3 | 4;

export interface ColumnData {
  placeName: string; // '個位' | '十位' | '百位' | '千位'
  placePower: number; // 0, 1, 2, 3
  digitA: number;
  digitB: number;
  isOverflowColumn?: boolean; // is this an overflow carry column without operand digits (e.g. hundreds in 65+98)
  // For addition:
  requiresCarryIn: boolean; // did the lower column carry 1 into here?
  producesCarryOut: boolean; // does this column produce a carry to higher?
  userCarryMarked: boolean; // has user clicked the +1 carry button?
  // For subtraction:
  requiresBorrow: boolean; // digitA < digitB (taking account of any borrow out)
  isBorrowedFrom: boolean; // did a lower column borrow 1 from this digitA?
  isZeroPassThrough: boolean; // is this digit 0 which had to borrow from higher first?
  modifiedDigitA?: number; // e.g. 5 crossed out to 4; 0 crossed out to 10 then 9
  userBorrowCrossed: boolean; // has user crossed out this digit?
  userReceivedBorrow: boolean; // has this column received the +10 mark?
  
  // The user input for the answer row in this column
  userAnswerDigit: string; // '' or '0'-'9'
  correctAnswerDigit: number;
  isUnlocked: boolean; // can user type answer now?
  isCompleted: boolean;
}

export interface ReplayStep {
  stepIndex: number;
  columnIndex: number; // 0 for ones, 1 for tens, 2 for hundreds, 3 for thousands
  title: string;
  description: string;
  highlightColumns: number[];
  actionType: 'focus' | 'carry_mark' | 'borrow_scratch' | 'borrow_receive' | 'calc' | 'write_answer';
  mathFormula: string;
  targetSlot?: 'carry' | 'digitA_scratch' | 'digitA_new' | 'borrow_mark' | 'answer';
  targetValue?: string | number;
}

export interface CardEvaluation {
  stars: 0 | 1 | 2 | 3;
  isAnswerCorrect: boolean;
  isProcessCorrect: boolean;
  feedbackMessage: string;
  answerErrors: string[];
  processErrors: string[];
}

export interface MathProblem {
  id: string;
  type: OperationType;
  operandA: number;
  operandB: number;
  result: number;
  title: string;
  difficultyTag: string;
  digitCount: DigitCount;
  columns: ColumnData[]; // index 0: ones, index 1: tens, index 2: hundreds, [index 3: thousands if needed]
  activeColumnIndex: number; // current focus
  isSolved: boolean;
  evaluation?: CardEvaluation;
  replaySteps: ReplayStep[];
}

export interface CardProgress {
  cardIndex: number; // 0..3 (4 cards)
  problems: MathProblem[];
  score: number;
  stars: number; // Total stars earned across the 4 cards (0..12)
  startTime: number;
  endTime?: number;
  mistakesCount: number;
  mode: GameMode;
  digitCount: DigitCount;
}
