import React from 'react';
import { Home, Sparkles, Cat, ShoppingCart, Wallet } from 'lucide-react';

export type TabType = 'dashboard' | 'cleaning' | 'pet' | 'pantry' | 'finance' | 'admin';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  urgentChoreCount: number;
  urgentPetAlert: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  urgentChoreCount,
  urgentPetAlert,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Início',
      icon: Home,
      badge: null,
    },
    {
      id: 'cleaning' as TabType,
      label: 'Limpeza',
      icon: Sparkles,
      badge: urgentChoreCount > 0 ? urgentChoreCount : null,
      badgeColor: 'bg-error-500 text-white',
    },
    {
      id: 'pet' as TabType,
      label: 'Pet',
      icon: Cat,
      badge: urgentPetAlert ? '!' : null,
      badgeColor: 'bg-warning-500 text-white',
    },
    {
      id: 'pantry' as TabType,
      label: 'Despensa',
      icon: ShoppingCart,
      badge: null,
    },
    {
      id: 'finance' as TabType,
      label: 'Finanças',
      icon: Wallet,
      badge: null,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 pointer-events-none safe-bottom">
      <nav className="pointer-events-auto max-w-md mx-auto px-2 py-1.5 rounded-full bg-gray-900/92 dark:bg-[#141726]/92 backdrop-blur-2xl border border-white/12 shadow-[0_16px_40px_-8px_rgba(9,10,15,0.65)] flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full min-touch-target transition-all duration-300 ease-spring active:scale-90 ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white font-bold shadow-u-glow flex-[1.35]'
                  : 'text-gray-400 hover:text-gray-200 font-medium flex-1'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ease-spring ${
                    isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.9]'
                  }`}
                />
                {tab.badge !== null && (
                  <span
                    className={`absolute -top-2 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow-u-xs ring-2 ring-gray-900 ${
                      tab.badgeColor || 'bg-error-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight truncate transition-all duration-200 ${
                  isActive ? 'inline-block font-bold' : 'hidden xs:inline-block text-[10px] opacity-80'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};


