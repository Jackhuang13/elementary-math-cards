import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';

export const PWAReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.log('[PWA] Service Worker registered:', r);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  const closePrompt = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm transition-all duration-300">
      <div className="bg-amber-500 text-white rounded-2xl p-3.5 shadow-xl border-2 border-amber-300 flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-2.5 min-w-0">
          {needRefresh ? (
            <RefreshCw className="w-5 h-5 shrink-0 animate-spin text-amber-200" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
          )}
          <div className="text-xs font-bold leading-tight truncate">
            {needRefresh ? (
              <span>發現新版本！點擊立即更新</span>
            ) : (
              <span>App 已準備就緒，支援離線遊玩！</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="px-2.5 py-1 bg-white text-amber-600 rounded-lg text-xs font-black hover:bg-amber-100 active:scale-95 transition cursor-pointer shadow-xs"
            >
              更新
            </button>
          )}
          <button
            onClick={closePrompt}
            className="p-1 rounded-lg hover:bg-amber-600/80 active:scale-95 text-white/90 transition cursor-pointer"
            aria-label="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
