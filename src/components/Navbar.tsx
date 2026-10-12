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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-bottom shadow-u-lg">
      <div className="max-w-md mx-auto px-2 flex justify-between items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 min-touch-target transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center shadow-u-xs ring-1 ring-white dark:ring-gray-900 ${
                      tab.badgeColor || 'bg-error-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
