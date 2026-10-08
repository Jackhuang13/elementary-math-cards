/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './engine/GameEngine';
import { MenuScene } from './scenes/MenuScene';
import { GameScene, GameSceneSyncData } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { soundManager } from './engine/SoundManager';
import { PortraitOverlay } from './components/PortraitOverlay';
import { HUD } from './components/HUD';
import { KidKeypad } from './components/KidKeypad';
import { ReplayModal } from './components/ReplayModal';
import { CardCompletionModal } from './components/CardCompletionModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAReloadPrompt } from './components/PWAReloadPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MathProblem } from './engine/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [activeSceneName, setActiveSceneName] = useState<string>('menu');
  const [gameState, setGameState] = useState<GameSceneSyncData | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);
  const [replayProblem, setReplayProblem] = useState<MathProblem | null>(null);

  // Track window.visualViewport to ensure mobile device scaling and keyboards never distort canvas
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    return typeof window !== 'undefined'
      ? (window.visualViewport?.height ?? window.innerHeight)
      : 700;
  });

  // Calculate synchronized CSS aspect-ratio based on the active scene's virtual dimensions
  const activeAspectRatio = activeSceneName === 'game' ? '400 / 330' : '400 / 520';

  // Initialize Game Engine and Scenes
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    const menuScene = new MenuScene();
    const gameScene = new GameScene();
    const resultScene = new ResultScene();

    // Scene manager synchronization
    engine.sceneManager.registerScene(menuScene);
    engine.sceneManager.registerScene(gameScene);
    engine.sceneManager.registerScene(resultScene);

    engine.sceneManager.onSceneChange = (name: string) => {
      setActiveSceneName(name);
    };

    // State sync hook from GameScene to React HUD & Keypad
    gameScene.onStateSync = (data: GameSceneSyncData) => {
      setGameState({ ...data });
    };

    gameScene.onRequestReplay = (problem: MathProblem) => {
      setReplayProblem(problem);
    };

    // Start in Menu scene
    engine.sceneManager.changeScene('menu');
    engine.start();

    // Wait for custom fonts to load so canvas text renders with Bpmf Huninn
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        engine.resize();
      });
    }

    // Visual Viewport & Window Resize Handler for mobile devices
    const handleViewportResize = () => {
      if (typeof window !== 'undefined') {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        setViewportHeight(vh);
      }
      engine.resize();
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }
    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('orientationchange', handleViewportResize);

    return () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('orientationchange', handleViewportResize);
      engine.stop();
    };
  }, []);

  // Ensure canvas resizes immediately with synchronized aspect ratio when active scene changes
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      engineRef.current?.resize();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeSceneName, activeAspectRatio, viewportHeight]);

  // Keyboard shortcut support (0..9, Backspace, Enter for Check)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeSceneName !== 'game' || !engineRef.current || replayProblem) return;

      const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
      if (!gameScene) return;

      if (e.key >= '0' && e.key <= '9') {
        gameScene.inputDigit(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        gameScene.deleteDigit();
      } else if (e.key === 'Enter') {
        gameScene.checkAndSubmitAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSceneName, replayProblem]);

  const handleInputDigit = useCallback((digit: string) => {
    if (!engineRef.current) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (gameScene) {
      gameScene.inputDigit(digit);
    }
  }, []);

  const handleDeleteDigit = useCallback(() => {
    if (!engineRef.current) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (gameScene) {
      gameScene.deleteDigit();
    }
  }, []);

  const handleMarkCarry = useCallback(() => {
    if (!engineRef.current || !gameState?.currentProblem) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (gameScene) {
      const activeIdx = gameState.currentProblem.activeColumnIndex;
      // Mark carry for the column that receives it (to the left)
      const targetColIdx = Math.min(gameState.currentProblem.columns.length - 1, activeIdx + 1);
      gameScene.handleCarryClick(targetColIdx);
    }
  }, [gameState]);

  const handleMarkBorrow = useCallback(() => {
    if (!engineRef.current || !gameState?.currentProblem) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (gameScene) {
      gameScene.triggerSmartBorrow();
    }
  }, [gameState]);

  const handleClearMarks = useCallback(() => {
    if (!engineRef.current) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (gameScene) {
      gameScene.clearMarksAndAnswers();
    }
  }, []);

  const handleCheckAnswer = useCallback(() => {
    if (!engineRef.current) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (gameScene) {
      gameScene.checkAndSubmitAnswer();
    }
  }, []);

  const handleRequestHint = useCallback(() => {
    if (!engineRef.current || !gameState?.currentProblem) return;
    const gameScene = engineRef.current.sceneManager.getScene('game') as GameScene | undefined;
    if (!gameScene) return;

    const prob = gameState.currentProblem;
    const col = prob.columns[prob.activeColumnIndex];
    if (!col) return;

    if (prob.type === 'add') {
      const sum = col.digitA + col.digitB + (col.userCarryMarked ? 1 : 0);
      const isOverflow = Boolean(col.isOverflowColumn || (col.placePower >= prob.digitCount && col.digitA === 0 && col.digitB === 0));

      if (isOverflow) {
        gameScene.hintMessage = `💡 提示：【${col.placeName}】沒有其他數字，直接把進位的 1 寫下來！`;
      } else if (sum >= 10 && !col.userCarryMarked) {
        gameScene.hintMessage = `💡 提示：${col.digitA} + ${col.digitB} = ${col.digitA + col.digitB}，滿 10 囉！記得按「＋1 進位」！`;
      } else {
        gameScene.hintMessage = `💡 提示：【${col.placeName}】${col.digitA} + ${col.digitB}${col.userCarryMarked ? ' + 1' : ''} = ${sum}，答案寫 ${sum % 10} 喔！`;
      }
    } else {
      if (col.requiresBorrow && !col.userReceivedBorrow) {
        if (col.isZeroPassThrough) {
          gameScene.hintMessage = `🪄 提示：中間是 0，先向更高位借 10，再借給個位！`;
        } else {
          gameScene.hintMessage = `💡 提示：${col.digitA} 不夠減 ${col.digitB}，按「借 10」向左邊借！`;
        }
      } else {
        const minuend = col.userReceivedBorrow ? col.digitA + 10 : col.digitA;
        gameScene.hintMessage = `💡 提示：現在是 ${minuend} - ${col.digitB} = ${col.correctAnswerDigit}，填上答案吧！`;
      }
    }
    gameScene.syncState();
  }, [gameState]);

  const handleToggleSound = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleBackToMenu = useCallback(() => {
    if (!engineRef.current) return;
    soundManager.playPop();
    engineRef.current.sceneManager.changeScene('menu');
  }, []);

  const handleOpenReplay = useCallback(() => {
    if (gameState?.currentProblem) {
      setReplayProblem(gameState.currentProblem);
    }
  }, [gameState]);

  // Determine if active column requires carry or borrow alert
  const currentActiveCol = gameState?.currentProblem?.columns[gameState?.activeColumnIndex ?? 0];
  const needsCarryAlert = Boolean(
    gameState?.currentProblem?.type === 'add' &&
    currentActiveCol &&
    currentActiveCol.producesCarryOut &&
    !gameState.currentProblem.columns[gameState.activeColumnIndex + 1]?.userCarryMarked
  );

  const needsBorrowAlert = Boolean(
    gameState?.currentProblem?.type === 'sub' &&
    currentActiveCol &&
    currentActiveCol.requiresBorrow &&
    !currentActiveCol.userReceivedBorrow
  );

  return (
    <div
      style={{
        height: `${viewportHeight}px`,
        maxHeight: `${viewportHeight}px`,
      }}
      className="relative w-screen overflow-hidden bg-amber-50 flex flex-col items-center justify-between font-sans select-none"
    >
      {/* Strict Portrait Orientation Overlay with animejs rotation animation */}
      <PortraitOverlay />

      {/* PWA Service Worker Update Prompt (registerType: prompt) */}
      <PWAReloadPrompt />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Menu & Result Top Install Button */}
      {activeSceneName !== 'game' && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <PWAInstallButton />
        </div>
      )}

      {/* Top HUD (visible during game scene) */}
      {activeSceneName === 'game' && gameState && (
        <HUD
          currentCardIndex={gameState.currentCardIndex}
          totalCards={gameState.totalCards}
          elapsedSeconds={gameState.elapsedSeconds}
          score={gameState.score}
          totalStars={gameState.totalStars}
          hintMessage={gameState.hintMessage}
          problem={gameState.currentProblem}
          onOpenReplay={handleOpenReplay}
          onRequestHint={handleRequestHint}
          onBackToMenu={handleBackToMenu}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Core HTML5 Canvas 2D Viewport: Uniform aspect-ratio scaling without squishing */}
      <div
        className={`relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden ${
          activeSceneName === 'game' ? 'max-w-md px-1 py-0.5' : 'max-w-md w-full h-full p-0'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none cursor-pointer w-full h-full max-w-full max-h-full"
        />
      </div>

      {/* Kid-friendly On-Screen Keypad with Check Answer (visible during game scene) */}
      {activeSceneName === 'game' && gameState && (
        <KidKeypad
          onInputDigit={handleInputDigit}
          onDeleteDigit={handleDeleteDigit}
          onMarkCarry={handleMarkCarry}
          onMarkBorrow={handleMarkBorrow}
          onRequestHint={handleRequestHint}
          onCheckAnswer={handleCheckAnswer}
          onClearMarks={handleClearMarks}
          problemType={gameState.currentProblem?.type || 'add'}
          needsCarryAlert={needsCarryAlert}
          needsBorrowAlert={needsBorrowAlert}
        />
      )}

      {/* Anime.js Step-by-Step Replay Modal */}
      {replayProblem && (
        <ReplayModal
          problem={replayProblem}
          onClose={() => setReplayProblem(null)}
        />
      )}

      {/* Mini Card Completion Celebration Modal with 3-Star Pedagogical Evaluation */}
      {gameState?.celebratingCard && (
        <CardCompletionModal
          cardIndex={gameState.celebratingCard.cardIndex}
          totalCards={gameState.totalCards}
          problem={gameState.celebratingCard.problem}
          onProceed={() => {
            const gameScene = engineRef.current?.sceneManager.getScene('game') as GameScene | undefined;
            if (gameScene) {
              gameScene.proceedToNextCard();
            }
          }}
          onRetry={() => {
            const gameScene = engineRef.current?.sceneManager.getScene('game') as GameScene | undefined;
            if (gameScene) {
              gameScene.retryCurrentCard();
            }
          }}
          onOpenReplay={() => {
            if (gameState.celebratingCard) {
              setReplayProblem(gameState.celebratingCard.problem);
            }
          }}
        />
      )}
    </div>
  );
}
