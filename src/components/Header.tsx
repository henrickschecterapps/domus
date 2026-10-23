import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Home, Copy, Check, ShieldCheck, Sun, Moon, Laptop, Users, Sparkles, User, LogOut, Smartphone } from 'lucide-react';
import { Badge } from './untitled/Badge';

import { AuthHouseModal } from './AuthHouseModal';
import { UserProfileModal } from './UserProfileModal';
import { InstallAppModal } from './InstallAppModal';
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
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

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
    <header className="sticky top-0 z-30 u-glass border-b border-gray-200/80 dark:border-gray-800/80 px-4 sm:px-8 py-3 safe-top w-full transition-all">
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between gap-2">
        {/* House Info & Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="md:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 text-white flex items-center justify-center shadow-u-glow flex-shrink-0">
            <Home className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm xs:text-base sm:text-lg font-extrabold font-display text-gray-900 dark:text-white tracking-tight leading-none truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
                {house.name}
              </h1>
              {isFirebaseConnected ? (
                <Badge variant="success" size="sm" dot title="Sincronização em Nuvem Firebase Firestore Ativa">
                  <span className="hidden xs:inline">Nuvem Ativa</span>
                </Badge>
              ) : (
                <Badge variant="brand" size="sm" dot title="Modo Local-First (Offline)">
                  <span className="hidden xs:inline">Local-First</span>
                </Badge>
              )}
            </div>
            <button
              onClick={copyInvite}
              className="group inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mt-1"
              title="Copiar código de convite da casa"
            >
              <span>Convite:</span>
              <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-gray-100/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/60 group-hover:text-brand-700 dark:group-hover:text-brand-300 border border-gray-200/60 dark:border-gray-700/60 transition-colors">
                {house.inviteCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success-600 animate-u-scale" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-500 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Tools & Resident Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Explicit Claro / Escuro Dual Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-100/70 dark:bg-gray-900/90 shadow-u-xs">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                !isDarkActive
                  ? 'bg-white text-brand-700 dark:bg-brand-900/40 dark:text-brand-200 font-semibold shadow-u-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Ativar Modo Claro"
            >
              <Sun className={`w-3.5 h-3.5 ${!isDarkActive ? 'text-warning-500' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">Claro</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                isDarkActive
                  ? 'bg-gray-800 text-gray-100 shadow-u-xs font-semibold'
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
              className="w-9 h-9 rounded-xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 text-gray-500 hover:text-brand-600 hover:border-brand-300 dark:text-gray-400 dark:hover:text-brand-400 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-u-xs"
              title="Gestão da Casa & Acesso (Admin)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* User & Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 pl-3 bg-white dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700/60 border border-gray-200/80 dark:border-gray-700/80 hover:border-brand-300/60 dark:hover:border-brand-700/60 rounded-xl transition-all duration-200 active:scale-95 shadow-u-xs h-9"
            >
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[100px] truncate leading-tight">
                  {currentUser.displayName}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold">
                  {currentUser.role === 'admin' ? 'Admin' : 'Morador'}
                </span>
              </div>
              <div className="relative">
                <img
                  src={currentUser.avatarUrl || authUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.displayName)}`}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-brand-500/30"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-500 ring-1 ring-white dark:ring-gray-900" />
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/90 dark:border-gray-800 rounded-2xl shadow-u-xl py-2 z-50 animate-u-scale">
                  {/* User Info Header */}
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Perfil do Usuário</p>
                      <span className="text-[10px] font-mono font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/70 px-2 py-0.5 rounded-full border border-brand-200/50 dark:border-brand-800/50">
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

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setIsInstallModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50/70 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Instalar App no Celular</span>
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
              </>
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

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </header>
  );
};
