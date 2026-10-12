import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Home, Copy, Check, RotateCcw, ShieldCheck, Sun, Moon, Laptop, Users, Sparkles } from 'lucide-react';
import { Badge } from './untitled/Badge';

import { AuthHouseModal } from './AuthHouseModal';
import { TabType } from './Navbar';

interface HeaderProps {
  onNavigateTab?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab }) => {
  const { house, currentUser, members, switchUser, resetAllToSeed, showToast, theme, setTheme } = useApp();
  const [copied, setCopied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const copyInvite = () => {
    navigator.clipboard.writeText(house.inviteCode);
    setCopied(true);
    showToast('Código de convite copiado!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const isDarkActive =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const nextMode = isDarkActive ? 'light' : 'dark';
    setTheme(nextMode);
    showToast(`Modo ${nextMode === 'light' ? 'Claro' : 'Escuro'} ativado`, 'info');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 py-3 safe-top w-full transition-colors">
      <div className="w-full flex items-center justify-between">
        {/* House Info & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-u-xs">
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight leading-none">
                {house.name}
              </h1>
              <Badge variant="brand" size="sm" dot>
                Online
              </Badge>
            </div>
            <button
              onClick={copyInvite}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mt-1"
              title="Copiar código de convite da casa"
            >
              <span>Convite: <span className="font-mono font-medium text-gray-700 dark:text-gray-300">{house.inviteCode}</span></span>
              {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Tools & Resident Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Explicit Claro / Escuro Dual Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-u-xs">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                !isDarkActive
                  ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200 font-semibold shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Ativar Modo Claro"
            >
              <Sun className={`w-3.5 h-3.5 ${!isDarkActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isDarkActive
                  ? 'bg-gray-800 text-gray-100 shadow-xs font-semibold'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Ativar Modo Escuro"
            >
              <Moon className={`w-3.5 h-3.5 ${isDarkActive ? 'text-brand-400' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">Escuro</span>
            </button>
          </div>

          {/* Admin shortcut button */}
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('admin')}
              className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 flex items-center justify-center transition-all active:scale-95 shadow-u-xs"
              title="Gestão da Casa & Acesso (Admin)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Reset seed button */}
          <button
            onClick={resetAllToSeed}
            className="w-9 h-9 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-u-xs"
            title="Restaurar dados padrão de demonstração"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Resident Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 pl-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-lg transition-all active:scale-95 shadow-u-xs h-9"
            >
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 max-w-[90px] truncate">
                {currentUser.displayName}
              </span>
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-500/30"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success-500 ring-1 ring-white dark:ring-gray-900" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-u-lg py-2 z-50 animate-u-scale">
                <div className="px-3.5 py-2 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">Trocar Morador Ativo</p>
                    <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded">
                      Demo
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Pontos de XP e ações serão atribuídos a ele.
                  </p>
                </div>

                <div className="p-1 space-y-0.5">
                  {members.map((member) => (
                    <button
                      key={member.userId}
                      onClick={() => {
                        switchUser(member.userId);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        member.userId === currentUser.userId
                          ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={member.avatarUrl}
                          alt={member.displayName}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="text-left truncate">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{member.displayName}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Nv. {member.level ?? (Math.floor(member.totalXP / 100) + 1)} • {member.weeklyXP} XP
                          </p>
                        </div>
                      </div>
                      {member.userId === currentUser.userId && (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 mt-1 border-t border-gray-100 dark:border-gray-800 px-1 space-y-0.5">
                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onNavigateTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <span>Gestão da Casa (Admin)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4 text-gray-500" />
                    <span>Trocar / Criar Lar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthHouseModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};
