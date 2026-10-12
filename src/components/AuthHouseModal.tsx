import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, KeyRound, PlusCircle, Users, CheckCircle, Home, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from './untitled/Button';
import { Badge } from './untitled/Badge';

interface AuthHouseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthHouseModal: React.FC<AuthHouseModalProps> = ({ isOpen, onClose }) => {
  const { house, members, currentUser, switchUser, joinHouseWithCode, createNewHouse, showToast } = useApp();
  const [tab, setTab] = useState<'switch_user' | 'join' | 'create'>('join');

  // Form states
  const [inviteCode, setInviteCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [newHouseName, setNewHouseName] = useState('');
  const [adminName, setAdminName] = useState(currentUser.displayName || '');

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast('Informe o código de convite.', 'warning');
      return;
    }
    const success = joinHouseWithCode(inviteCode.trim(), joinName.trim() || 'Novo Residente');
    if (success) {
      setInviteCode('');
      setJoinName('');
      onClose();
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseName.trim()) {
      showToast('Digite o nome da sua residência.', 'warning');
      return;
    }
    createNewHouse(newHouseName.trim(), adminName.trim() || 'Administrador');
    setNewHouseName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-sand-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 flex items-center justify-center shadow-u-xs">
              <Home className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight font-display">
                Acesso & Gestão do Lar
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Casa atual: <span className="font-semibold text-gray-700 dark:text-gray-300">{house.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'join'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-u-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Entrar com Código</span>
            </button>
            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'create'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-u-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-success-600" />
              <span>Criar Nova Casa</span>
            </button>
            <button
              onClick={() => setTab('switch_user')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'switch_user'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-u-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span>Moradores</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {tab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 text-xs text-brand-800 dark:text-brand-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                <p>
                  Recebeu um convite de quem mora com você? Digite o código de acesso abaixo para se juntar à residência.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Código de Convite do Lar *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: DOMUS-8821"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all uppercase placeholder:normal-case placeholder:font-sans"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Código atual de teste deste lar: <strong className="font-mono text-gray-600 dark:text-gray-300">{house.inviteCode}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Seu Nome / Apelido
                </label>
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Ex: Mariana, Leo, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                  <span>Conectar ao Lar</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </form>
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-success-50/70 dark:bg-success-950/40 border border-success-200 dark:border-success-800/40 text-xs text-success-800 dark:text-success-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5" />
                <p>
                  Crie uma nova casa do zero. Você será o administrador geral e poderá convidar outros moradores pelo código exclusivo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Nome da Residência *
                </label>
                <input
                  type="text"
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                  placeholder="Ex: Apartamento 42, Casa dos Pinheiros, Apê da Vila"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Seu Nome (Administrador) *
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Ex: Henrique, Carla, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-500 dark:text-gray-400">
                A nova residência será inicializada com 4 cômodos principais (Sala, Cozinha, Quarto e Banheiro) e rotinas básicas configuradas para você começar na hora.
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                  <span>Criar Residência & Iniciar</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </form>
          )}

          {tab === 'switch_user' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selecione o morador com o qual deseja interagir no aplicativo:
              </p>
              <div className="space-y-2">
                {members.map((m) => {
                  const isCurrent = m.userId === currentUser.userId;
                  return (
                    <button
                      key={m.userId}
                      onClick={() => {
                        switchUser(m.userId);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 dark:border-brand-600 shadow-u-xs'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatarUrl}
                          alt={m.displayName}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {m.displayName}
                            </span>
                            {m.role === 'admin' ? (
                              <Badge variant="brand" size="sm">Admin</Badge>
                            ) : (
                              <Badge variant="gray" size="sm">Morador</Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            Nv. {m.level ?? 1} • {m.weeklyXP} XP nesta semana
                          </span>
                        </div>
                      </div>
                      {isCurrent && (
                        <CheckCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
