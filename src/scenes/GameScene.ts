/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scene } from '../engine/Scene';
import { GameMode, MathProblem, CardProgress, ColumnData, DigitCount, CardEvaluation } from '../engine/types';
import { generateAdventureCards } from '../math/problemGenerator';
import { MathCardSprite } from '../entities/MathCardSprite';
import { ParticleSystem } from '../entities/ParticleSystem';
import { soundManager } from '../engine/SoundManager';

export interface GameSceneSyncData {
  currentCardIndex: number;
  totalCards: number;
  currentProblem: MathProblem;
  hintMessage: string;
  isProblemSolved: boolean;
  activeColumnIndex: number;
  elapsedSeconds: number;
  score: number;
  totalStars: number;
  celebratingCard: { cardIndex: number; problem: MathProblem } | null;
}

export class GameScene extends Scene {
  public override readonly name = 'game';

  public override virtualWidth: number = 400;
  public override virtualHeight: number = 330;

  public cards: MathProblem[] = [];
  public currentCardIndex: number = 0;
  public totalCards: number = 4;
  public mode: GameMode = 'grand_master';
  public digitCount: DigitCount = 3;

  public cardSprite!: MathCardSprite;
  public particles: ParticleSystem = new ParticleSystem();

  public hintMessage: string = '';
  public startTime: number = 0;
  public score: number = 0;
  public mistakesCount: number = 0;
  public celebratingCard: { cardIndex: number; problem: MathProblem } | null = null;

  // React state sync hook
  public onStateSync?: (data: GameSceneSyncData) => void;
  public onRequestReplay?: (problem: MathProblem) => void;

  public override enter(data?: unknown): void {
    const opts = (data as { mode?: GameMode; digitCount?: DigitCount }) || {};
    this.mode = opts.mode || 'grand_master';
    this.digitCount = opts.digitCount || 3;

    this.cards = generateAdventureCards(this.mode, this.digitCount);
    this.currentCardIndex = 0;
    this.startTime = Date.now();
    this.score = 0;
    this.mistakesCount = 0;
    this.celebratingCard = null;

    const firstProblem = this.cards[0];
    this.cardSprite = new MathCardSprite(
      210,
      325,
      firstProblem,
      0,
      this.particles,
      {
        onCarryToggled: (colIdx) => this.handleCarryClick(colIdx),
        onBorrowToggled: (colIdx) => this.handleBorrowClick(colIdx),
        onColumnSelected: (colIdx) => this.setActiveColumn(colIdx),
        onStepError: (msg) => this.showStepError(msg),
      }
    );

    this.setInitialHint(firstProblem);
    this.syncState();
  }

  private setInitialHint(prob: MathProblem) {
    if (prob.type === 'add') {
      this.hintMessage = '💡 從右邊【個位】開始算，滿 10 記得按「＋1 進位」喔！';
    } else {
      const isZeroPass = prob.columns.some((c) => c.isZeroPassThrough);
      if (isZeroPass) {
        this.hintMessage = '🪄 個位不夠減且隔壁是 0，先向更高位借 10 喔！';
      } else {
        this.hintMessage = '💡 從右邊【個位】開始算，不夠減就按「借 10」向左邊借！';
      }
    }
  }

  public override update(dt: number): void {
    this.particles.update(dt);
    if (this.cardSprite) {
      this.cardSprite.update(dt);
    }
  }

  public override render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Keep card centered in virtual dimensions
    if (this.cardSprite) {
      this.cardSprite.setPosition(width / 2, height / 2);
    }

    // Canvas background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Warm classroom wood / notebook top border
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, width, 8);

    // Render Math Card Sprite
    if (this.cardSprite) {
      this.cardSprite.render(ctx);
    }

    // Render Particles (floating numbers, sparkles, stars)
    this.particles.render(ctx);
  }

  public override onPointerDown(px: number, py: number): boolean | void {
    if (!this.cardSprite || this.celebratingCard) return;

    // Delegate to card sprite local coordinates
    const localX = px - this.cardSprite.x;
    const localY = py - this.cardSprite.y;

    if (this.cardSprite.hitTest(px, py)) {
      const handled = this.cardSprite.handlePointerDown(localX, localY);
      if (handled) return true;
    }
  }

  public setActiveColumn(colIdx: number) {
    const prob = this.getCurrentProblem();
    if (!prob || colIdx < 0 || colIdx >= prob.columns.length) return;

    prob.activeColumnIndex = colIdx;
    soundManager.playPop();
    this.syncState();
  }

  /**
   * Free Toggle of Carry (+1) on any column
   */
  public handleCarryClick(colIdx: number) {
    const prob = this.getCurrentProblem();
    if (!prob || prob.type !== 'add' || this.celebratingCard) return;

    const col = prob.columns[colIdx];
    if (!col) return;

    // Toggle Carry state
    col.userCarryMarked = !col.userCarryMarked;

    if (col.userCarryMarked) {
      soundManager.playCarryMark();
      const cx = this.cardSprite.x + this.cardSprite.getColumnX(colIdx);
      const cy = this.cardSprite.y + this.cardSprite.getCarryRowY();
      this.particles.emitFloatingText(cx, cy, '+1', '#f59e0b', 24);
      this.particles.emitSparkles(cx, cy, 8, ['#f59e0b', '#fbbf24']);
      this.hintMessage = `✨ 已在【${col.placeName}】標記＋1 進位！`;
    } else {
      soundManager.playPop();
      this.hintMessage = `🔄 已取消【${col.placeName}】的＋1 進位標記。`;
    }

    this.syncState();
  }

  /**
   * Borrow Handling with Full Undo & Consecutive Borrow Fix
   * Clicking a digit toggles borrow on / off cleanly!
   */
  public handleBorrowClick(targetColIdx: number) {
    const prob = this.getCurrentProblem();
    if (!prob || prob.type !== 'sub' || this.celebratingCard) return;

    const targetCol = prob.columns[targetColIdx];
    if (!targetCol) return;

    // 1. UNDO / CLEAR CHECK:
    // If target column already has userBorrowCrossed, UNDO it!
    if (targetCol.userBorrowCrossed) {
      targetCol.userBorrowCrossed = false;
      targetCol.modifiedDigitA = undefined;
      // Also unmark receiver column to the right if present
      const rIdx = targetColIdx - 1;
      if (rIdx >= 0 && prob.columns[rIdx]) {
        prob.columns[rIdx].userReceivedBorrow = false;
        if (prob.columns[rIdx].digitA === 0) {
          prob.columns[rIdx].modifiedDigitA = undefined;
        }
      }
      this.cardSprite.clearScratches(targetColIdx);
      soundManager.playPop();
      this.hintMessage = `🔄 已取消【${targetCol.placeName}】的借位劃線！`;
      this.syncState();
      return;
    }

    // If target column received borrow (+10) and user clicks it, allow cancelling!
    if (targetCol.userReceivedBorrow) {
      targetCol.userReceivedBorrow = false;
      if (targetCol.digitA === 0) {
        targetCol.modifiedDigitA = undefined;
      }
      // Also uncross donor to the left if it donated to here
      const donorIdx = targetColIdx + 1;
      if (donorIdx < prob.columns.length && prob.columns[donorIdx]) {
        prob.columns[donorIdx].userBorrowCrossed = false;
        prob.columns[donorIdx].modifiedDigitA = undefined;
        this.cardSprite.clearScratches(donorIdx);
      }
      soundManager.playPop();
      this.hintMessage = `🔄 已取消【${targetCol.placeName}】的＋10 借位標記！`;
      this.syncState();
      return;
    }

    // 2. Column 0 (the ones digit) cannot donate to any lower column (there is no column to the right)
    if (targetColIdx === 0) {
      soundManager.playPop();
      this.hintMessage = `💡 這是【個位】喔！個位不夠減時，請點擊左邊隔壁數字向它借 10！`;
      this.syncState();
      return;
    }

    // 3. Handle 遇 0 跨位借位 (If target column is 0 and has not received 10 yet)
    if (targetCol.digitA === 0 && targetCol.modifiedDigitA !== 10) {
      // Find higher non-zero column
      let higherIdx = targetColIdx + 1;
      while (higherIdx < prob.columns.length && prob.columns[higherIdx].digitA === 0) {
        higherIdx++;
      }
      const higherColName = higherIdx < prob.columns.length ? prob.columns[higherIdx].placeName : '更高位';
      soundManager.playError();
      this.cardSprite.triggerShake(10, 0.4);
      this.hintMessage = `⚠️ 【${targetCol.placeName}】是 0，沒有東西可借！請先點擊左邊的【${higherColName}】借位！`;
      this.syncState();
      return;
    }

    // 4. EXECUTE BORROW
    soundManager.playScratch();
    targetCol.userBorrowCrossed = true;
    this.cardSprite.triggerScratchAnimation(targetColIdx);

    // Calculate modified value for targetCol
    if (targetCol.modifiedDigitA === 10) {
      // Tens had received 10 from hundreds, now gives 1 to ones -> becomes 9
      targetCol.modifiedDigitA = 9;
      targetCol.userReceivedBorrow = false;
    } else {
      targetCol.modifiedDigitA = targetCol.digitA - 1;
    }

    // Receiver column to the right gets 10
    const receiverColIdx = targetColIdx - 1;
    if (receiverColIdx >= 0 && prob.columns[receiverColIdx]) {
      const receiver = prob.columns[receiverColIdx];
      receiver.userReceivedBorrow = true;

      const cx = this.cardSprite.x + this.cardSprite.getColumnX(receiverColIdx);
      const cy = this.cardSprite.y + this.cardSprite.getDigitARowY();
      this.particles.emitFloatingText(cx, cy, '+10', '#0284c7', 24);
      this.particles.emitSparkles(cx, cy, 10, ['#0284c7', '#38bdf8']);

      if (receiver.digitA === 0 && receiverColIdx > 0) {
        // Zero pass through intermediate step: 0 got 10!
        receiver.modifiedDigitA = 10;
        this.hintMessage = `🪄 【${targetCol.placeName}】借給【${receiver.placeName}】10，現在【${receiver.placeName}】有 10 了！點擊【${receiver.placeName}】借給個位吧！`;
      } else {
        const curA = receiver.digitA;
        const total = curA + 10;
        this.hintMessage = `✨ 【${receiver.placeName}】成功借到 10（現有 ${total}）！現在夠減了，算算看是多少？`;
      }
    }

    this.syncState();
  }

  /**
   * Smart Borrow helper button on Keypad
   */
  public triggerSmartBorrow() {
    const prob = this.getCurrentProblem();
    if (!prob || prob.type !== 'sub' || this.celebratingCard) return;

    const activeColIdx = prob.activeColumnIndex;
    const activeCol = prob.columns[activeColIdx];
    if (!activeCol) return;

    // If active column already has received borrow, toggle or confirm
    if (activeCol.userReceivedBorrow) {
      this.handleBorrowClick(activeColIdx);
      return;
    }

    // Find donor to the left
    const neighborIdx = activeColIdx + 1;
    if (neighborIdx >= prob.columns.length) {
      this.showStepError('已經是最高位，無法再向左借位囉！');
      return;
    }

    const neighbor = prob.columns[neighborIdx];
    // If neighbor is 0 and has not received 10, borrow from higher donor first
    if (neighbor.digitA === 0 && neighbor.modifiedDigitA !== 10) {
      let donorIdx = neighborIdx + 1;
      while (donorIdx < prob.columns.length && prob.columns[donorIdx].digitA === 0) {
        donorIdx++;
      }
      if (donorIdx < prob.columns.length) {
        this.handleBorrowClick(donorIdx);
        return;
      }
    }

    this.handleBorrowClick(neighborIdx);
  }

  /**
   * Free Input: User can type ANY digit freely without artificial locks!
   */
  public inputDigit(digitChar: string) {
    const prob = this.getCurrentProblem();
    if (!prob || this.celebratingCard) return;

    const activeColIdx = prob.activeColumnIndex;
    const col = prob.columns[activeColIdx];
    if (!col) return;

    // Set user answer digit freely
    col.userAnswerDigit = digitChar;
    soundManager.playPop();

    // Move focus to next column to the left for seamless typing (right to left writing flow)
    if (activeColIdx + 1 < prob.columns.length) {
      prob.activeColumnIndex = activeColIdx + 1;
    }

    this.syncState();
  }

  /**
   * Delete / Backspace digit
   */
  public deleteDigit() {
    const prob = this.getCurrentProblem();
    if (!prob || this.celebratingCard) return;

    const col = prob.columns[prob.activeColumnIndex];
    if (!col) return;

    if (col.userAnswerDigit !== '') {
      col.userAnswerDigit = '';
      soundManager.playPop();
    } else {
      // If current box is already empty, move focus to the right (towards ones)
      if (prob.activeColumnIndex > 0) {
        prob.activeColumnIndex--;
        soundManager.playPop();
      }
    }

    this.syncState();
  }

  /**
   * Clear All Marks & Answers on current problem
   */
  public clearMarksAndAnswers() {
    const prob = this.getCurrentProblem();
    if (!prob || this.celebratingCard) return;

    for (const c of prob.columns) {
      c.userAnswerDigit = '';
      c.userCarryMarked = false;
      c.userBorrowCrossed = false;
      c.userReceivedBorrow = false;
      c.modifiedDigitA = undefined;
      c.isCompleted = false;
    }

    this.cardSprite.clearScratches();
    soundManager.playPop();
    this.hintMessage = '🔄 已清除所有答案與標記，可以重新填寫運算囉！';
    this.syncState();
  }

  /**
   * Submit & Check Answer with Three-Star Pedagogical Evaluation:
   * ⭐️⭐️⭐️ (3 Stars): All Answers Correct AND All Carry/Borrow Process Correct (完全正確)
   * ⭐️⭐️ (2 Stars): All Answers Correct, but Carry/Borrow marks incomplete (答案正確，標記缺漏)
   * ⭐️ (1 Star): Answers Wrong, but Carry/Borrow concepts completely correct (觀念正確，計算粗心)
   * 0 Stars: Both Answers and Process Wrong (全錯，再接再厲)
   */
  public checkAndSubmitAnswer() {
    const prob = this.getCurrentProblem();
    if (!prob || this.celebratingCard) return;

    // Check if any column is empty
    const emptyCols = prob.columns.filter((c) => c.userAnswerDigit === '');
    if (emptyCols.length > 0) {
      soundManager.playError();
      this.cardSprite.triggerShake(8, 0.35);
      this.hintMessage = `⚠️ 還有【${emptyCols.map((c) => c.placeName).join('、')}】尚未填寫答案喔！`;
      this.syncState();
      return;
    }

    // 1. Answer Digit Correctness
    const answerErrors: string[] = [];
    let isAnswerCorrect = true;

    for (let i = 0; i < prob.columns.length; i++) {
      const c = prob.columns[i];
      const userVal = parseInt(c.userAnswerDigit, 10);
      if (userVal !== c.correctAnswerDigit) {
        isAnswerCorrect = false;
        answerErrors.push(`【${c.placeName}】應為 ${c.correctAnswerDigit}，填寫了 ${c.userAnswerDigit}`);
      }
    }

    // 2. Process (Carry / Borrow) Correctness
    const processErrors: string[] = [];
    let isProcessCorrect = true;

    if (prob.type === 'add') {
      for (let i = 0; i < prob.columns.length; i++) {
        const c = prob.columns[i];
        if (c.requiresCarryIn && !c.userCarryMarked) {
          // For overflow column without addends (e.g. hundreds in 65+98), directly writing 1 in answer box is completely acceptable
          if (c.isOverflowColumn && c.userAnswerDigit === String(c.correctAnswerDigit)) {
            // Acceptable direct answer entry
          } else {
            isProcessCorrect = false;
            processErrors.push(`【${c.placeName}】上方缺少「＋1」進位標記`);
          }
        } else if (!c.requiresCarryIn && c.userCarryMarked) {
          isProcessCorrect = false;
          processErrors.push(`【${c.placeName}】上方不需要進位，多點了「＋1」`);
        }
      }
    } else {
      for (let i = 0; i < prob.columns.length; i++) {
        const c = prob.columns[i];
        if (c.requiresBorrow && !c.userReceivedBorrow) {
          isProcessCorrect = false;
          processErrors.push(`【${c.placeName}】不夠減，未做「＋10」借位標記`);
        }
        if (c.isBorrowedFrom && !c.userBorrowCrossed) {
          isProcessCorrect = false;
          processErrors.push(`【${c.placeName}】被借出後未做劃線退位標記`);
        }
      }
    }

    // 3. Determine Stars and Feedback
    let stars: 0 | 1 | 2 | 3 = 0;
    let feedback = '';

    if (isAnswerCorrect && isProcessCorrect) {
      stars = 3;
      feedback = '🏆 滿分大師！答案與進位/借位標記全部正確，榮獲 3 顆星！';
      this.score += 100;
      soundManager.playFanfare();
      this.cardSprite.triggerCompletionStamp();
    } else if (isAnswerCorrect && !isProcessCorrect) {
      stars = 2;
      feedback = '⭐️⭐️ 答案完全正確，真厲害！但進位/借位標記有些缺漏，養成做標記的好習慣會更穩喔！';
      this.score += 75;
      soundManager.playChime();
    } else if (!isAnswerCorrect && isProcessCorrect) {
      stars = 1;
      feedback = '⭐️ 進位/借位觀念完全正確！只是最後加減計算粗心了點，再算一次一定能拿 3 星！';
      this.score += 50;
      soundManager.playChime();
    } else {
      stars = 0;
      feedback = '💪 答案與標記都需要加強喔！別氣餒，點擊『看解題動畫』看看小精靈怎麼算吧！';
      this.score += 20;
      soundManager.playError();
      this.cardSprite.triggerShake(12, 0.4);
    }

    // Mark completion states
    for (const c of prob.columns) {
      c.isCompleted = true;
    }

    const evaluation: CardEvaluation = {
      stars,
      isAnswerCorrect,
      isProcessCorrect,
      feedbackMessage: feedback,
      answerErrors,
      processErrors,
    };

    prob.evaluation = evaluation;
    prob.isSolved = true;

    // Show celebration modal
    this.celebratingCard = { cardIndex: this.currentCardIndex, problem: prob };
    this.hintMessage = feedback;
    this.syncState();
  }

  /**
   * Retry current card for a higher score / 3 stars
   */
  public retryCurrentCard() {
    const prob = this.getCurrentProblem();
    if (!prob) return;

    for (const c of prob.columns) {
      c.userAnswerDigit = '';
      c.userCarryMarked = false;
      c.userBorrowCrossed = false;
      c.userReceivedBorrow = false;
      c.modifiedDigitA = undefined;
      c.isCompleted = false;
    }

    prob.evaluation = undefined;
    prob.isSolved = false;
    prob.activeColumnIndex = 0;

    this.cardSprite.clearScratches();
    this.celebratingCard = null;
    this.setInitialHint(prob);
    soundManager.playPop();
    this.syncState();
  }

  public showStepError(msg: string) {
    soundManager.playError();
    this.cardSprite.triggerShake(14, 0.45);
    this.mistakesCount++;
    this.hintMessage = msg;
    this.syncState();
  }

  public proceedToNextCard() {
    this.celebratingCard = null;
    this.syncState();

    if (this.currentCardIndex + 1 < this.totalCards) {
      this.cardSprite.triggerSlideOut(() => {
        this.currentCardIndex++;
        const nextProblem = this.cards[this.currentCardIndex];
        this.cardSprite.setProblem(nextProblem, this.currentCardIndex);
        this.setInitialHint(nextProblem);
        this.cardSprite.triggerSlideIn();
        this.syncState();
      });
    } else {
      // All 4 cards completed! Switch to ResultScene
      const totalStars = this.cards.reduce((sum, p) => sum + (p.evaluation?.stars ?? 0), 0);
      const progress: CardProgress = {
        cardIndex: 4,
        problems: this.cards,
        score: this.score,
        stars: totalStars,
        startTime: this.startTime,
        endTime: Date.now(),
        mistakesCount: this.mistakesCount,
        mode: this.mode,
        digitCount: this.digitCount,
      };
      this.manager.changeScene('result', progress);
    }
  }

  public getCurrentProblem(): MathProblem {
    return this.cards[this.currentCardIndex];
  }

  public syncState() {
    if (this.onStateSync && this.cardSprite) {
      const prob = this.getCurrentProblem();
      const totalStars = this.cards.reduce((sum, p) => sum + (p.evaluation?.stars ?? 0), 0);
      this.onStateSync({
        currentCardIndex: this.currentCardIndex,
        totalCards: this.totalCards,
        currentProblem: prob,
        hintMessage: this.hintMessage,
        isProblemSolved: prob?.isSolved ?? false,
        activeColumnIndex: prob?.activeColumnIndex ?? 0,
        elapsedSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        score: this.score,
        totalStars,
        celebratingCard: this.celebratingCard,
      });
    }
  }
}
