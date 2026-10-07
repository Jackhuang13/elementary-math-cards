/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MathProblem, ColumnData, GameMode, DigitCount, OperationType } from '../engine/types';
import { buildAdditionReplaySteps, buildSubtractionReplaySteps } from './solverReplay';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PLACE_NAMES = ['個位', '十位', '百位', '千位', '萬位'];

/**
 * Creates a basic addition problem with single carry (單次進位加法，奠定信心)
 */
export function generateBasicAdditionProblem(id: string, digitCount: DigitCount = 3): MathProblem {
  // For 2 digits, carryCol is strictly 0 (ones digit) so tens doesn't overflow to hundreds
  const carryCol = digitCount === 2 ? 0 : randInt(0, Math.min(digitCount - 1, 1));
  const digitsA: number[] = [];
  const digitsB: number[] = [];

  for (let i = 0; i < digitCount; i++) {
    if (i === carryCol) {
      // Produces carry
      const a = randInt(5, 9);
      const b = randInt(10 - a, 9);
      digitsA.push(a);
      digitsB.push(b);
    } else {
      // Does not produce carry
      const maxA = 4;
      const a = randInt(1, maxA);
      const b = randInt(1, 8 - a);
      digitsA.push(a);
      digitsB.push(b);
    }
  }

  // Calculate actual sum
  let carry = 0;
  const columns: ColumnData[] = [];
  let operandA = 0;
  let operandB = 0;

  for (let i = 0; i < digitCount; i++) {
    const a = digitsA[i];
    const b = digitsB[i];
    operandA += a * Math.pow(10, i);
    operandB += b * Math.pow(10, i);

    const sum = a + b + carry;
    const producesCarry = sum >= 10;
    const ansDigit = sum % 10;

    columns.push({
      placeName: PLACE_NAMES[i] || `${i}位`,
      placePower: i,
      digitA: a,
      digitB: b,
      requiresCarryIn: carry > 0,
      producesCarryOut: producesCarry,
      userCarryMarked: false,
      requiresBorrow: false,
      isBorrowedFrom: false,
      isZeroPassThrough: false,
      userBorrowCrossed: false,
      userReceivedBorrow: false,
      userAnswerDigit: '',
      correctAnswerDigit: ansDigit,
      isUnlocked: true,
      isCompleted: false,
    });

    carry = producesCarry ? 1 : 0;
  }

  // If final carry overflows
  if (carry > 0) {
    columns.push({
      placeName: PLACE_NAMES[digitCount] || `${digitCount}位`,
      placePower: digitCount,
      digitA: 0,
      digitB: 0,
      isOverflowColumn: true,
      requiresCarryIn: true,
      producesCarryOut: false,
      userCarryMarked: false,
      requiresBorrow: false,
      isBorrowedFrom: false,
      isZeroPassThrough: false,
      userBorrowCrossed: false,
      userReceivedBorrow: false,
      userAnswerDigit: '',
      correctAnswerDigit: carry,
      isUnlocked: true,
      isCompleted: false,
    });
  }

  const result = operandA + operandB;
  const title = `普通直式加法（${PLACE_NAMES[carryCol]}單次進位）`;

  const problem: MathProblem = {
    id,
    type: 'add',
    operandA,
    operandB,
    result,
    title,
    difficultyTag: '普通直式加法（單次進位）',
    digitCount,
    columns,
    activeColumnIndex: 0,
    isSolved: false,
    replaySteps: [],
  };

  problem.replaySteps = buildAdditionReplaySteps({
    operandA,
    operandB,
    columns,
  });

  return problem;
}

/**
 * Creates a basic subtraction problem with single borrow (單次借位減法，步驟清楚)
 */
export function generateBasicSubtractionProblem(id: string, digitCount: DigitCount = 3): MathProblem {
  // Borrow occurs at ones column, borrowing once from tens
  const aOnes = randInt(1, 4);
  const bOnes = randInt(aOnes + 2, 9); // guaranteed needs borrow

  const digitsA: number[] = [aOnes];
  const digitsB: number[] = [bOnes];

  // Tens digit must have enough after giving 1
  const aTens = randInt(3, 8);
  const bTens = randInt(1, aTens - 1);
  digitsA.push(aTens);
  digitsB.push(bTens);

  // Higher columns (if 3 or 4 digits) have no borrow needed
  for (let i = 2; i < digitCount; i++) {
    const a = randInt(3, 8);
    const b = randInt(1, a - 1);
    digitsA.push(a);
    digitsB.push(b);
  }

  let operandA = 0;
  let operandB = 0;
  for (let i = 0; i < digitCount; i++) {
    operandA += digitsA[i] * Math.pow(10, i);
    operandB += digitsB[i] * Math.pow(10, i);
  }

  const result = operandA - operandB;

  const columns: ColumnData[] = [];
  for (let i = 0; i < digitCount; i++) {
    const a = digitsA[i];
    const b = digitsB[i];
    const isBorrowAtThisCol = i === 0;
    const isDonorCol = i === 1;

    let ansDigit: number;
    if (i === 0) {
      ansDigit = (a + 10) - b;
    } else if (i === 1) {
      ansDigit = (a - 1) - b;
    } else {
      ansDigit = a - b;
    }

    columns.push({
      placeName: PLACE_NAMES[i] || `${i}位`,
      placePower: i,
      digitA: a,
      digitB: b,
      requiresCarryIn: false,
      producesCarryOut: false,
      userCarryMarked: false,
      requiresBorrow: isBorrowAtThisCol,
      isBorrowedFrom: isDonorCol,
      isZeroPassThrough: false,
      modifiedDigitA: isDonorCol ? a - 1 : undefined,
      userBorrowCrossed: false,
      userReceivedBorrow: false,
      userAnswerDigit: '',
      correctAnswerDigit: ansDigit,
      isUnlocked: true,
      isCompleted: false,
    });
  }

  const problem: MathProblem = {
    id,
    type: 'sub',
    operandA,
    operandB,
    result,
    title: '普通直式減法（個位單次借位）',
    difficultyTag: '普通直式減法（單次借位）',
    digitCount,
    columns,
    activeColumnIndex: 0,
    isSolved: false,
    replaySteps: [],
  };

  problem.replaySteps = buildSubtractionReplaySteps({
    operandA,
    operandB,
    columns,
  });

  return problem;
}

/**
 * Creates an addition problem with consecutive carries
 */
export function generateConsecutiveCarryProblem(id: string, digitCount: DigitCount = 3): MathProblem {
  const digitsA: number[] = [];
  const digitsB: number[] = [];

  // Generate digits such that multiple columns carry consecutively
  for (let i = 0; i < digitCount; i++) {
    const a = randInt(5, 9);
    // Guarantee sum + previous carry >= 10
    const b = randInt(10 - a, 9);
    digitsA.push(a);
    digitsB.push(b);
  }

  let operandA = 0;
  let operandB = 0;
  for (let i = 0; i < digitCount; i++) {
    operandA += digitsA[i] * Math.pow(10, i);
    operandB += digitsB[i] * Math.pow(10, i);
  }

  const result = operandA + operandB;

  let carry = 0;
  const columns: ColumnData[] = [];

  for (let i = 0; i < digitCount; i++) {
    const a = digitsA[i];
    const b = digitsB[i];
    const sum = a + b + carry;
    const producesCarry = sum >= 10;
    const ansDigit = sum % 10;

    columns.push({
      placeName: PLACE_NAMES[i] || `${i}位`,
      placePower: i,
      digitA: a,
      digitB: b,
      requiresCarryIn: carry > 0,
      producesCarryOut: producesCarry,
      userCarryMarked: false,
      requiresBorrow: false,
      isBorrowedFrom: false,
      isZeroPassThrough: false,
      userBorrowCrossed: false,
      userReceivedBorrow: false,
      userAnswerDigit: '',
      correctAnswerDigit: ansDigit,
      isUnlocked: true,
      isCompleted: false,
    });

    carry = producesCarry ? 1 : 0;
  }

  if (carry > 0) {
    columns.push({
      placeName: PLACE_NAMES[digitCount] || `${digitCount}位`,
      placePower: digitCount,
      digitA: 0,
      digitB: 0,
      isOverflowColumn: true,
      requiresCarryIn: true,
      producesCarryOut: false,
      userCarryMarked: false,
      requiresBorrow: false,
      isBorrowedFrom: false,
      isZeroPassThrough: false,
      userBorrowCrossed: false,
      userReceivedBorrow: false,
      userAnswerDigit: '',
      correctAnswerDigit: carry,
      isUnlocked: true,
      isCompleted: false,
    });
  }

  const problem: MathProblem = {
    id,
    type: 'add',
    operandA,
    operandB,
    result,
    title: carry > 0 ? `${digitCount}位數連續進位（突破進位）` : `${digitCount}位數連續進位挑戰`,
    difficultyTag: '進階連續進位加法',
    digitCount,
    columns,
    activeColumnIndex: 0,
    isSolved: false,
    replaySteps: [],
  };

  problem.replaySteps = buildAdditionReplaySteps({
    operandA,
    operandB,
    columns,
  });

  return problem;
}

/**
 * Creates a subtraction problem focusing on consecutive borrow or borrowing across 0
 */
export function generateBorrowProblem(
  id: string,
  forceZeroPassThrough = false,
  digitCount: DigitCount = 3
): MathProblem {
  const digitsA: number[] = [];
  const digitsB: number[] = [];

  const hasZeroTrap = (forceZeroPassThrough || Math.random() > 0.45) && digitCount >= 3;

  if (hasZeroTrap) {
    // Zero trap in tens column
    const aOnes = randInt(1, 4);
    const bOnes = randInt(aOnes + 2, 9);
    digitsA.push(aOnes);
    digitsB.push(bOnes);

    // Tens is 0
    digitsA.push(0);
    digitsB.push(randInt(3, 8));

    // Hundreds
    const aHundreds = randInt(4, 8);
    const bHundreds = randInt(1, aHundreds - 2);
    digitsA.push(aHundreds);
    digitsB.push(bHundreds);

    // Thousands if digitCount === 4
    if (digitCount === 4) {
      const aThou = randInt(3, 7);
      const bThou = randInt(1, aThou - 1);
      digitsA.push(aThou);
      digitsB.push(bThou);
    }
  } else {
    // Consecutive non-zero borrow
    for (let i = 0; i < digitCount; i++) {
      if (i < digitCount - 1) {
        // Needs borrow
        const a = randInt(1, 4);
        const b = randInt(a + 2, 8);
        digitsA.push(a);
        digitsB.push(b);
      } else {
        // Highest column donates
        const a = randInt(5, 9);
        const b = randInt(1, a - 2);
        digitsA.push(a);
        digitsB.push(b);
      }
    }
  }

  let operandA = 0;
  let operandB = 0;
  for (let i = 0; i < digitCount; i++) {
    operandA += digitsA[i] * Math.pow(10, i);
    operandB += digitsB[i] * Math.pow(10, i);
  }

  const result = operandA - operandB;

  // Simulate digits and borrows
  const curA = [...digitsA];
  const columns: ColumnData[] = [];

  for (let i = 0; i < digitCount; i++) {
    const origA = digitsA[i];
    const b = digitsB[i];
    const a = curA[i];

    let reqBorrow = false;
    let modifiedA: number | undefined = undefined;

    if (a < b) {
      reqBorrow = true;
      // Borrow cascade from higher
      let donor = i + 1;
      while (donor < curA.length && curA[donor] === 0) {
        donor++;
      }
      if (donor < curA.length) {
        for (let k = donor; k > i; k--) {
          curA[k] -= 1;
          curA[k - 1] += 10;
        }
      }
    }

    const finalA = curA[i];
    const ansDigit = finalA - b;

    columns.push({
      placeName: PLACE_NAMES[i] || `${i}位`,
      placePower: i,
      digitA: origA,
      digitB: b,
      requiresCarryIn: false,
      producesCarryOut: false,
      userCarryMarked: false,
      requiresBorrow: origA < b || reqBorrow,
      isBorrowedFrom: i > 0 && digitsA[i - 1] < digitsB[i - 1],
      isZeroPassThrough: origA === 0,
      modifiedDigitA: origA !== finalA ? (finalA > 10 ? finalA - 10 : finalA) : undefined,
      userBorrowCrossed: false,
      userReceivedBorrow: false,
      userAnswerDigit: '',
      correctAnswerDigit: ansDigit,
      isUnlocked: true,
      isCompleted: false,
    });
  }

  const title = hasZeroTrap
    ? `${digitCount}位數遇 0 跨位連續借位`
    : `${digitCount}位數連續退位（借位）專攻`;

  const problem: MathProblem = {
    id,
    type: 'sub',
    operandA,
    operandB,
    result,
    title,
    difficultyTag: hasZeroTrap ? '遇 0 跨位連續借位' : '進階連續借位減法',
    digitCount,
    columns,
    activeColumnIndex: 0,
    isSolved: false,
    replaySteps: [],
  };

  problem.replaySteps = buildSubtractionReplaySteps({
    operandA,
    operandB,
    columns,
  });

  return problem;
}

/**
 * Generates an adventure set of 4 cards based on selected mode and digit count
 */
export function generateAdventureCards(
  mode: GameMode = 'grand_master',
  digitCount: DigitCount = 3
): MathProblem[] {
  const cards: MathProblem[] = [];

  if (mode === 'basic') {
    // 4 basic cards (single carry & single borrow)
    cards.push(generateBasicAdditionProblem('card-1', digitCount));
    cards.push(generateBasicSubtractionProblem('card-2', digitCount));
    cards.push(generateBasicAdditionProblem('card-3', digitCount));
    cards.push(generateBasicSubtractionProblem('card-4', digitCount));
  } else if (mode === 'adv_carry' || mode === 'carry') {
    // 4 advanced consecutive carry cards
    for (let i = 0; i < 4; i++) {
      cards.push(generateConsecutiveCarryProblem(`card-${i + 1}`, digitCount));
    }
  } else if (mode === 'adv_borrow' || mode === 'borrow') {
    // 4 advanced consecutive borrow cards
    cards.push(generateBorrowProblem('card-1', true, digitCount));
    cards.push(generateBorrowProblem('card-2', false, digitCount));
    cards.push(generateBorrowProblem('card-3', true, digitCount));
    cards.push(generateBorrowProblem('card-4', false, digitCount));
  } else {
    // 'grand_master' or 'mixed': Tiered progression
    cards.push(generateBasicAdditionProblem('card-1', digitCount));
    cards.push(generateBasicSubtractionProblem('card-2', digitCount));
    cards.push(generateConsecutiveCarryProblem('card-3', digitCount));
    cards.push(generateBorrowProblem('card-4', true, digitCount));
  }

  return cards;
}
