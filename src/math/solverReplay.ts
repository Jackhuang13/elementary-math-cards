/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MathProblem, ColumnData, ReplayStep, OperationType } from '../engine/types';

/**
 * Builds the structured replay steps for an addition problem.
 */
export function buildAdditionReplaySteps(problem: {
  operandA: number;
  operandB: number;
  columns: ColumnData[];
}): ReplayStep[] {
  const steps: ReplayStep[] = [];
  let stepCounter = 1;
  const cols = problem.columns;

  let carryIn = 0;
  for (let colIdx = 0; colIdx < cols.length; colIdx++) {
    const col = cols[colIdx];
    const placeName = col.placeName;
    const a = col.digitA;
    const b = col.digitB;
    const isOverflow = Boolean(col.isOverflowColumn || (colIdx === cols.length - 1 && a === 0 && b === 0 && carryIn > 0));

    if (isOverflow) {
      // Direct carry drop into highest place
      steps.push({
        stepIndex: stepCounter++,
        columnIndex: colIdx,
        title: `【${placeName}】寫下進位`,
        description: `${placeName}沒有其他數字，直接把進位的 ${carryIn} 寫下來！`,
        highlightColumns: [colIdx],
        actionType: 'write_answer',
        mathFormula: `進位的 ${carryIn} ➔ 寫下 ${carryIn}`,
        targetSlot: 'answer',
        targetValue: carryIn,
      });
      continue;
    }

    // 1. Focus column
    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `算算【${placeName}】`,
      description: `先來算【${placeName}】！`,
      highlightColumns: [colIdx],
      actionType: 'focus',
      mathFormula: carryIn > 0 ? `${a} + ${b} + (進位 ${carryIn})` : `${a} + ${b}`,
    });

    const sum = a + b + carryIn;
    const ansDigit = sum % 10;
    const carryOut = Math.floor(sum / 10);

    // 2. Mark carry if any
    if (carryOut > 0) {
      const nextColName = cols[colIdx + 1]?.placeName || '左邊';
      steps.push({
        stepIndex: stepCounter++,
        columnIndex: colIdx,
        title: `${placeName}滿 10 進 1！`,
        description: `${placeName}相加是 ${sum}，滿 10 囉！向左邊【${nextColName}】進 1，記「＋1」。`,
        highlightColumns: [colIdx, colIdx + 1],
        actionType: 'carry_mark',
        mathFormula: `${sum} ≥ 10  ➔ 向${nextColName}進 1`,
        targetSlot: 'carry',
        targetValue: 1,
      });
    }

    // 3. Write answer digit
    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `寫下【${placeName}】答案`,
      description: `【${placeName}】留下個位數 ${ansDigit}，寫在答案格子裡。`,
      highlightColumns: [colIdx],
      actionType: 'write_answer',
      mathFormula: `${placeName} 答案：${ansDigit}`,
      targetSlot: 'answer',
      targetValue: ansDigit,
    });

    carryIn = carryOut;
  }

  return steps;
}

/**
 * Builds the structured replay steps for a subtraction problem,
 * handling single-borrow, consecutive-borrow, and borrow across zero (遇0跨位連續借位).
 */
export function buildSubtractionReplaySteps(problem: {
  operandA: number;
  operandB: number;
  columns: ColumnData[];
}): ReplayStep[] {
  const steps: ReplayStep[] = [];
  let stepCounter = 1;
  const cols = problem.columns;

  // Clone current digits for simulation
  const currentA = cols.map(c => c.digitA);

  for (let colIdx = 0; colIdx < cols.length; colIdx++) {
    const col = cols[colIdx];
    const placeName = col.placeName;
    const a = currentA[colIdx];
    const b = col.digitB;

    // 1. Focus column
    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `算算【${placeName}】`,
      description: `看【${placeName}】：${a} 比 ${b} 小，不夠減！`,
      highlightColumns: [colIdx],
      actionType: 'focus',
      mathFormula: `${a} - ${b}`,
    });

    // Need borrow?
    if (a < b) {
      // Find the first column to the left that has a digit > 0
      let donorIdx = colIdx + 1;
      while (donorIdx < currentA.length && currentA[donorIdx] === 0) {
        donorIdx++;
      }

      if (donorIdx < currentA.length) {
        // Step-by-step unrolling borrow from donorIdx down to colIdx
        for (let k = donorIdx; k > colIdx; k--) {
          const donorColName = cols[k].placeName;
          const receiverColName = cols[k - 1].placeName;
          const oldVal = currentA[k];
          currentA[k] -= 1;
          const newVal = currentA[k];

          // Scratch donor
          steps.push({
            stepIndex: stepCounter++,
            columnIndex: k,
            title: `向【${donorColName}】借位！`,
            description: `不夠減！向【${donorColName}】借 1，把 ${oldVal} 劃掉改寫成 ${newVal}！`,
            highlightColumns: [k, k - 1],
            actionType: 'borrow_scratch',
            mathFormula: `【${donorColName}】${oldVal} ➔ 劃掉變 ${newVal}`,
            targetSlot: 'digitA_scratch',
            targetValue: newVal,
          });

          // Receiver gets 10
          currentA[k - 1] += 10;
          const receivedVal = currentA[k - 1];

          steps.push({
            stepIndex: stepCounter++,
            columnIndex: k - 1,
            title: `【${receiverColName}】得到 10！`,
            description: `借到了 10！上方記「＋10」，現在有 ${receivedVal} 囉！`,
            highlightColumns: [k - 1],
            actionType: 'borrow_receive',
            mathFormula: `【${receiverColName}】得到 10 ➔ 現有 ${receivedVal}`,
            targetSlot: 'borrow_mark',
            targetValue: 10,
          });
        }
      }
    }

    // Now currentA[colIdx] is >= b
    const finalA = currentA[colIdx];
    const diff = finalA - b;

    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `【${placeName}】相減`,
      description: `現在算式是 ${finalA} - ${b} = ${diff}！`,
      highlightColumns: [colIdx],
      actionType: 'calc',
      mathFormula: `${finalA} - ${b} = ${diff}`,
    });

    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `寫下【${placeName}】答案`,
      description: `把答案 ${diff} 寫在【${placeName}】格子裡！`,
      highlightColumns: [colIdx],
      actionType: 'write_answer',
      mathFormula: `${placeName} 答案：${diff}`,
      targetSlot: 'answer',
      targetValue: diff,
    });
  }

  return steps;
}
