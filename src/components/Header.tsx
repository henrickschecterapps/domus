import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Home, Copy, Check, ShieldCheck, Sun, Moon, Laptop, Users, Sparkles, User, LogOut } from 'lucide-react';
import { Badge } from './untitled/Badge';

import { AuthHouseModal } from './AuthHouseModal';
import { UserProfileModal } from './UserProfileModal';
import { TabType } from './Navbar';

interface HeaderProps {
  onNavigateTab?: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab }) => {
  const { 
    house, 
    currentUser, 
    members, 
    switchUser, 
    authUser, 
    logout, 
    showToast, 
    theme, 
    setTheme, 
    isFirebaseConnected 
  } = useApp();
  const [copied, setCopied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
              {isFirebaseConnected ? (
                <Badge variant="success" size="sm" dot title="Sincronização em Nuvem Firebase Firestore Ativa">
                  Nuvem Ativa
                </Badge>
              ) : (
                <Badge variant="brand" size="sm" dot title="Modo Local-First (Offline)">
                  Local-First
                </Badge>
              )}
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

          {/* User & Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 pl-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-lg transition-all active:scale-95 shadow-u-xs h-9"
            >
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 max-w-[100px] truncate leading-tight">
                  {currentUser.displayName}
                </span>
                <span className="text-[9px] text-brand-600 dark:text-brand-400 font-medium">
                  {currentUser.role === 'admin' ? 'Admin' : 'Morador'}
                </span>
              </div>
              <div className="relative">
                <img
                  src={currentUser.avatarUrl || authUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.displayName)}`}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-500/30"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success-500 ring-1 ring-white dark:ring-gray-900" />
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-u-xl py-2 z-50 animate-u-scale">
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Perfil do Usuário</p>
                    <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded-full border border-brand-200/50 dark:border-brand-800/50">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Morador'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {currentUser.displayName}
                  </p>
                  {authUser?.email && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {authUser.email}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Nv. {currentUser.level ?? 1} • {currentUser.weeklyXP} XP nesta semana
                  </p>
                </div>

                {/* Moradores da Residência */}
                {members.length > 1 && (
                  <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                      Alternar Morador
                    </p>
                    <div className="space-y-0.5">
                      {members.map((member) => (
                        <button
                          key={member.userId}
                          onClick={() => {
                            switchUser(member.userId);
                            setShowUserMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            member.userId === currentUser.userId
                              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={member.avatarUrl}
                              alt={member.displayName}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            />
                            <span className="truncate">{member.displayName}</span>
                          </div>
                          {member.userId === currentUser.userId && (
                            <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions & Links */}
                <div className="pt-1 px-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Meu Perfil & Chave PIX</span>
                  </button>

                  {onNavigateTab && (
                    <button
                      onClick={() => {
                        onNavigateTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Home className="w-4 h-4 text-gray-500" />
                    <span>Trocar / Criar Lar</span>
                  </button>

                  <div className="pt-1 my-1 border-t border-gray-100 dark:border-gray-800" />

                  {/* Sign out button */}
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta Google</span>
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

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
