import React from 'react';
import { Home, Sparkles, Cat, ShoppingCart, Wallet, Sun, Moon, Laptop, Users, ShieldCheck } from 'lucide-react';
import { TabType } from './Navbar';
import { useApp } from '../context/AppContext';
import { Badge } from './untitled/Badge';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  urgentChoreCount: number;
  urgentPetAlert: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  urgentChoreCount,
  urgentPetAlert,
}) => {
  const { house, currentUser, members, switchUser, theme, setTheme } = useApp();

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Painel Geral',
      icon: Home,
      badge: null,
    },
    {
      id: 'cleaning' as TabType,
      label: 'Limpeza & Cômodos',
      icon: Sparkles,
      badge: urgentChoreCount > 0 ? `${urgentChoreCount}` : null,
      badgeVariant: 'error' as const,
    },
    {
      id: 'pet' as TabType,
      label: 'Cuidados do Pet',
      icon: Cat,
      badge: urgentPetAlert ? 'Ação' : null,
      badgeVariant: 'warning' as const,
    },
    {
      id: 'pantry' as TabType,
      label: 'Despensa & Compras',
      icon: ShoppingCart,
      badge: null,
    },
    {
      id: 'finance' as TabType,
      label: 'Finanças & Divisão',
      icon: Wallet,
      badge: null,
    },
    {
      id: 'admin' as TabType,
      label: 'Gestão da Casa',
      icon: ShieldCheck,
      badge: currentUser.role === 'admin' ? 'Admin' : null,
      badgeVariant: 'brand' as const,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 justify-between z-30 select-none shadow-u-xs">
      <div>
        {/* Brand & House Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-5 border-b border-gray-100 dark:border-gray-800/80 pb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800/40 flex items-center justify-center shadow-u-xs">
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate leading-tight">
                {house.name}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Saúde: <strong className="text-success-600 dark:text-success-400 font-semibold">{house.houseScore}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Navegação Principal
          </p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-u-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>{tab.label}</span>
                </div>

                {tab.badge && (
                  <Badge variant={tab.badgeVariant || 'gray'} size="sm">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Theme Switcher & User Profile */}
      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {/* Theme mode segmented control */}
        <div className="flex items-center justify-between p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-white text-gray-900 shadow-u-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Tema Claro"
          >
            <Sun className="w-3.5 h-3.5 text-warning-500" />
            <span className="text-[11px]">Claro</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-gray-700 text-white shadow-u-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Tema Escuro"
          >
            <Moon className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[11px]">Escuro</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex-1 py-1 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              theme === 'system'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-u-xs font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Automático pelo Sistema"
          >
            <Laptop className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px]">Auto</span>
          </button>
        </div>

        {/* Current Resident Info & Switcher */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-9 h-9 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-800" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {currentUser.displayName}
              </p>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                {currentUser.levelTitle || 'Residente'} • Nv. {currentUser.level ?? (Math.floor(currentUser.totalXP / 100) + 1)}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const other = members.find((m) => m.userId !== currentUser.userId);
              if (other) switchUser(other.userId);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Alternar residente"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
