import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800/90 text-amber-300 text-xs font-bold shadow-lg backdrop-blur-xs border border-stone-700 animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>離線模式 (離線暢玩中)</span>
    </div>
  );
};
