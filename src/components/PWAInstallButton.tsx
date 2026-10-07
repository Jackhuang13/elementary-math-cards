import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'badge' | 'button';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'badge',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress when already installed in standalone mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'button') {
      return (
        <button
          onClick={install}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-sm shadow-md transition-all duration-200 cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 animate-bounce" />
          <span>安裝小卡冒險 App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        title="安裝直式數學冒險 App"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 hover:bg-amber-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-all duration-150 cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>安裝 App</span>
      </button>
    );
  }

  // iOS Safari flow (Apple WebKit does not trigger beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="加入主畫面"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 hover:bg-amber-600 text-white font-bold text-xs shadow-sm active:scale-95 transition-all duration-150 cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>加到主畫面</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-amber-50 border-4 border-amber-300 p-6 shadow-2xl relative text-stone-800">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-amber-200 hover:bg-amber-300 text-stone-700 transition cursor-pointer"
                aria-label="關閉"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-4">
                <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-2">
                  <Download className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-amber-900">加到 iPhone / iPad 主畫面</h3>
                <p className="text-xs text-amber-700 mt-1">
                  安裝後可享受全螢幕冒險、直式直覺計算與離線暢玩！
                </p>
              </div>

              <div className="space-y-3 bg-white/80 rounded-2xl p-4 border border-amber-200 text-xs text-stone-700 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    點擊 Safari 底部工具列的 <Share2 className="w-4 h-4 inline text-blue-600 mx-0.5" /> <strong>「分享」</strong> 按鈕。
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    在清單中往下滑動，選擇 <PlusSquare className="w-4 h-4 inline text-stone-700 mx-0.5" /> <strong>「加入主畫面」</strong>。
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    點擊右上角的 <strong>「新增」</strong>，即可完成安裝！
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md transition cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
