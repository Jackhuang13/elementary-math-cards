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
        title: `【${placeName}】落下進位`,
        description: `${placeName}無其他加數，直接將進位來的 ${carryIn} 落下填入答案欄！`,
        highlightColumns: [colIdx],
        actionType: 'write_answer',
        mathFormula: `進位 ${carryIn} ➔ 填寫 ${carryIn}`,
        targetSlot: 'answer',
        targetValue: carryIn,
      });
      continue;
    }

    // 1. Focus column
    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `計算【${placeName}】`,
      description: `首先聚焦在${placeName}進行計算。`,
      highlightColumns: [colIdx],
      actionType: 'focus',
      mathFormula: carryIn > 0 ? `${a} + ${b} + (進位 ${carryIn})` : `${a} + ${b}`,
    });

    const sum = a + b + carryIn;
    const ansDigit = sum % 10;
    const carryOut = Math.floor(sum / 10);

    // 2. Mark carry if any
    if (carryOut > 0) {
      const nextColName = cols[colIdx + 1]?.placeName || '下一位';
      steps.push({
        stepIndex: stepCounter++,
        columnIndex: colIdx,
        title: `${placeName}滿十進一！`,
        description: `${placeName}加總為 ${sum}，滿十要向【${nextColName}】進 1！在上方標記「＋1」。`,
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
      description: `${placeName}留下的個位數是 ${ansDigit}，填入下方答案欄。`,
      highlightColumns: [colIdx],
      actionType: 'write_answer',
      mathFormula: `${placeName} 答案寫入：${ansDigit}`,
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
      title: `計算【${placeName}】`,
      description: `觀察${placeName}：被減數為 ${a}，減數為 ${b}。`,
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
        // Example: donor is hundreds (index 2), col is ones (index 0).
        // Hundreds (5) becomes 4, gives 10 to tens (index 1), so tens (0) becomes 10.
        // Then tens (10) becomes 9, gives 10 to ones (index 0), so ones becomes a + 10.
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
            description: `${receiverColName}不夠減，向【${donorColName}】借 1。將 ${oldVal} 劃掉改寫為 ${newVal}！`,
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
            title: `【${receiverColName}】獲得 10！`,
            description: `借到 1 個高位數相當於 10！${receiverColName}上方標記「＋10」，現在有 ${receivedVal}。`,
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
      title: `【${placeName}】相減運算`,
      description: `現在${placeName}為 ${finalA}，減去 ${b} 等於 ${diff}。`,
      highlightColumns: [colIdx],
      actionType: 'calc',
      mathFormula: `${finalA} - ${b} = ${diff}`,
    });

    steps.push({
      stepIndex: stepCounter++,
      columnIndex: colIdx,
      title: `寫下【${placeName}】答案`,
      description: `將計算結果 ${diff} 填入【${placeName}】答案欄。`,
      highlightColumns: [colIdx],
      actionType: 'write_answer',
      mathFormula: `${placeName} 答案：${diff}`,
      targetSlot: 'answer',
      targetValue: diff,
    });
  }

  return steps;
}
