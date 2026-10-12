import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  PlusCircle, 
  KeyRound, 
  ShieldCheck, 
  Users, 
  Cat, 
  Wallet, 
  Check, 
  AlertCircle,
  Loader2,
  LogOut
} from 'lucide-react';
import { Button } from './untitled/Button';
import { Badge } from './untitled/Badge';

export const LoginScreen: React.FC = () => {
  const { 
    house,
    authUser, 
    signInWithGoogle, 
    logout, 
    createNewHouse, 
    joinHouseWithCode, 
    bypassAuthToDemo,
    showToast 
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Onboarding state when authenticated with Google
  const [onboardingMode, setOnboardingMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [houseNameInput, setHouseNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmittingHouse, setIsSubmittingHouse] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const ok = await signInWithGoogle();
      if (!ok) {
        // error already toasted, but can also display in UI
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Falha ao autenticar com o Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNameInput.trim()) {
      showToast('Digite um nome para o seu lar.', 'warning');
      return;
    }
    setIsSubmittingHouse(true);
    try {
      await createNewHouse(houseNameInput.trim(), authUser?.displayName || 'Administrador');
    } catch (err: any) {
      showToast(err?.message || 'Erro ao criar o lar.', 'error');
    } finally {
      setIsSubmittingHouse(false);
    }
  };

  const handleJoinHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      showToast('Informe o código de convite do lar.', 'warning');
      return;
    }
    setIsSubmittingHouse(true);
    try {
      const ok = await joinHouseWithCode(
        inviteCodeInput.trim().toUpperCase(), 
        authUser?.displayName || 'Novo Morador'
      );
      if (!ok) {
        showToast('Código de convite não encontrado ou inválido.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Erro ao ingressar no lar.', 'error');
    } finally {
      setIsSubmittingHouse(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-center items-center px-4 py-8 sm:p-6 transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-sand-500/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200/80 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold shadow-u-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
            <span>Domus • Gestão Inteligente do Lar</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-gray-900 dark:text-white">
            O lar perfeito, em harmonia diária.
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Tarefas gamificadas, divisão financeira transparente, cuidados dos pets e sincronização em tempo real na nuvem.
          </p>
        </div>

        {/* Auth Box / Onboarding Box */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/90 dark:border-gray-800 p-6 sm:p-8 shadow-u-xl relative overflow-hidden backdrop-blur-md">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-error-50 dark:bg-error-950/50 border border-error-200 dark:border-error-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-error-800 dark:text-error-200">
                <p className="font-semibold">Não foi possível concluir o login</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {!authUser ? (
            /* STEP 1: LOGIN WITH GOOGLE */
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                  Acesse ou Crie seu Lar
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Entre com sua conta Google para sincronizar todos os moradores e aparelhos.
                </p>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 text-gray-800 dark:text-gray-100 font-semibold text-sm transition-all duration-200 shadow-u-sm hover:shadow-u-md active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isLoading ? 'Autenticando...' : 'Continuar com o Google'}</span>
              </button>

              {/* Features summary */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-gray-800/50 border border-sand-100 dark:border-gray-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Gamificação</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Pontos XP por tarefas concluídas e ranking semanal.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-gray-800/50 border border-sand-100 dark:border-gray-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <Cat className="w-4 h-4 text-sand-600 dark:text-sand-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Área Pet</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Rotatividade de turnos, vacinas e alertas de ração.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-gray-800/50 border border-sand-100 dark:border-gray-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Finanças</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Rateio flexível e geração de QR Code PIX direto.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sand-50/70 dark:bg-gray-800/50 border border-sand-100 dark:border-gray-800/80">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Cloud Firebase</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Backup contínuo e sincronização instantânea.
                  </p>
                </div>
              </div>

              {/* Discrete Offline Mode Option */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={bypassAuthToDemo}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition-colors"
                >
                  Entrar no Modo Demonstração Offline
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: ONBOARDING FOR AUTHENTICATED GOOGLE USER */
            <div className="space-y-6">
              {/* Google user header */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/60">
                <div className="flex items-center gap-3">
                  <img
                    src={authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.displayName || 'User')}`}
                    alt={authUser.displayName || 'Usuário'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/40"
                  />
                  <div>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Conta Google conectada</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {authUser.displayName || 'Usuário'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{authUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-error-600 dark:hover:text-error-400 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  title="Sair da Conta Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {onboardingMode === 'choose' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">
                      Configuração do Lar
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Como você gostaria de começar hoje?
                    </p>
                  </div>

                  {house && house.name && (
                    <div className="p-3.5 rounded-2xl bg-sand-50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Lar ativo neste navegador:</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {house.name} <span className="font-mono text-brand-600 dark:text-brand-400">({house.inviteCode})</span>
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          setIsSubmittingHouse(true);
                          try {
                            await joinHouseWithCode(house.inviteCode, authUser?.displayName || 'Morador');
                          } finally {
                            setIsSubmittingHouse(false);
                          }
                        }}
                        disabled={isSubmittingHouse}
                        className="flex-shrink-0 text-xs w-full sm:w-auto justify-center"
                      >
                        Vincular ao Lar Atual
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: Create */}
                    <button
                      onClick={() => setOnboardingMode('create')}
                      className="p-5 rounded-2xl border-2 border-brand-200 dark:border-brand-900/60 hover:border-brand-500 dark:hover:border-brand-500 bg-brand-50/30 dark:bg-brand-950/20 text-left transition-all duration-200 hover:shadow-u-md group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center mb-3 shadow-u-xs group-hover:scale-105 transition-transform">
                        <PlusCircle className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                        Criar Meu Lar
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Você será o <strong>Administrador</strong> e receberá um código para convidar familiares e moradores.
                      </p>
                    </button>

                    {/* Option 2: Join */}
                    <button
                      onClick={() => setOnboardingMode('join')}
                      className="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 bg-white dark:bg-gray-800/40 text-left transition-all duration-200 hover:shadow-u-md group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center mb-3 shadow-u-xs group-hover:scale-105 transition-transform">
                        <KeyRound className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                        Entrar com Convite
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Já tem um lar existente? Digite o código compartilhado pelo administrador (ex: DOMUS-XXXX).
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {onboardingMode === 'create' && (
                <form onSubmit={handleCreateHouse} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold font-display text-gray-900 dark:text-white">
                        Nome do seu Lar
                      </h2>
                      <button
                        type="button"
                        onClick={() => setOnboardingMode('choose')}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                      >
                        Voltar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Exemplos: "Apartamento 402", "Casa dos Sonhos", "Residência Garcia"
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Nome da Residência
                    </label>
                    <input
                      type="text"
                      value={houseNameInput}
                      onChange={(e) => setHouseNameInput(e.target.value)}
                      placeholder="Ex: Apartamento 502"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-sand-50 dark:bg-gray-800/60 border border-sand-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span>Você entrará com privilégios de Administrador da casa.</span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    disabled={isSubmittingHouse || !houseNameInput.trim()}
                  >
                    {isSubmittingHouse ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    <span>Criar Lar & Acessar</span>
                  </Button>
                </form>
              )}

              {onboardingMode === 'join' && (
                <form onSubmit={handleJoinHouse} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold font-display text-gray-900 dark:text-white">
                        Código de Convite
                      </h2>
                      <button
                        type="button"
                        onClick={() => setOnboardingMode('choose')}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                      >
                        Voltar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Peça ao administrador do lar o código de acesso.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Código do Lar (ex: DOMUS-XXXX)
                    </label>
                    <input
                      type="text"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                      placeholder="DOMUS-XXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm uppercase tracking-wider focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    disabled={isSubmittingHouse || !inviteCodeInput.trim()}
                  >
                    {isSubmittingHouse ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    <span>Entrar no Lar</span>
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Security and platform pledge */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
          Domus PWA • Dados seguros e criptografados no Google Firebase Cloud
        </p>
      </div>
    </div>
  );
};
