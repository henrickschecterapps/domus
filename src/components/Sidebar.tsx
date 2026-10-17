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

  const xpInCurrentLevel = currentUser.totalXP % 100;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-transparent px-3.5 py-4 justify-between z-30 select-none">
      <div>
        {/* Brand & House Header */}
        <div className="flex items-center gap-3 px-2.5 py-2.5 mb-5 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] shadow-u-xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 text-white flex items-center justify-center shadow-u-glow flex-shrink-0">
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold font-display text-gray-900 dark:text-white tracking-tight truncate leading-tight">
                {house.name}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Score: <strong className="text-success-600 dark:text-success-400 font-bold font-mono">{house.houseScore}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <p className="px-3 pb-1.5 text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Workspace
          </p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ease-spring ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-u-glow font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ease-spring ${
                      isActive
                        ? 'text-white scale-110'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:scale-105'
                    }`}
                  />
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
      <div className="space-y-3 pt-3">
        {/* Theme mode segmented control */}
        <div className="flex items-center justify-between p-1 bg-white/70 dark:bg-white/[0.03] rounded-2xl border border-gray-200/70 dark:border-white/[0.06]">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 ${
              theme === 'light'
                ? 'bg-brand-600 text-white shadow-u-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Tema Claro"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="text-[11px]">Claro</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-brand-600 text-white shadow-u-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Tema Escuro"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="text-[11px]">Escuro</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 ${
              theme === 'system'
                ? 'bg-brand-600 text-white shadow-u-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Automático pelo Sistema"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="text-[11px]">Auto</span>
          </button>
        </div>

        {/* Current Resident Info & Switcher */}
        <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/[0.06] shadow-u-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-brand-500/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success-500 ring-2 ring-white dark:ring-gray-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {currentUser.displayName}
                </p>
                <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-semibold block truncate">
                  {currentUser.levelTitle || 'Residente'} • NV. {currentUser.level ?? (Math.floor(currentUser.totalXP / 100) + 1)}
                </span>
              </div>
            </div>

            {members.length > 1 && (
              <button
                onClick={() => {
                  const other = members.find((m) => m.userId !== currentUser.userId);
                  if (other) switchUser(other.userId);
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                title="Alternar residente"
              >
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Subtle XP Progress Micro-Bar */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-mono mb-1">
              <span>XP SEMANAL</span>
              <span className="text-brand-600 dark:text-brand-400 font-bold">{currentUser.weeklyXP} XP</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, xpInCurrentLevel)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};


