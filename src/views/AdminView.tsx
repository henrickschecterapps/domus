import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Users,
  Home,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Sparkles,
  Sliders,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  Trees,
  Tv,
  Briefcase,
  Flame,
  Globe,
  KeyRound,
  ExternalLink,
  Cloud,
  Database,
  Info,
  Wifi,
  Phone,
  MessageCircle,
  Gift,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../components/untitled/Button';
import { Badge } from '../components/untitled/Badge';
import { AuthHouseModal } from '../components/AuthHouseModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { EmergencyContact, HouseReward } from '../types';

// Clean vector SVG QR code representation for the invite code
const InviteQRCode: React.FC<{ code: string }> = ({ code }) => {
  return (
    <div className="relative p-3.5 bg-white rounded-2xl border border-sand-200 dark:border-gray-700 shadow-u-sm inline-flex flex-col items-center">
      <svg
        viewBox="0 0 120 120"
        className="w-28 h-28 text-gray-900"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Corner 1 */}
        <rect x="10" y="10" width="30" height="30" rx="4" fill="currentColor" />
        <rect x="16" y="16" width="18" height="18" rx="2" fill="white" />
        <rect x="20" y="20" width="10" height="10" rx="1" fill="currentColor" />
        {/* Corner 2 */}
        <rect x="80" y="10" width="30" height="30" rx="4" fill="currentColor" />
        <rect x="86" y="16" width="18" height="18" rx="2" fill="white" />
        <rect x="90" y="20" width="10" height="10" rx="1" fill="currentColor" />
        {/* Corner 3 */}
        <rect x="10" y="80" width="30" height="30" rx="4" fill="currentColor" />
        <rect x="16" y="86" width="18" height="18" rx="2" fill="white" />
        <rect x="20" y="90" width="10" height="10" rx="1" fill="currentColor" />
        {/* Center / Data patterns */}
        <rect x="50" y="15" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="62" y="15" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="50" y="27" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="15" y="50" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="27" y="50" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="15" y="62" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="50" y="50" width="20" height="20" rx="2" fill="#C25E34" />
        <circle cx="60" cy="60" r="4" fill="white" />
        <rect x="80" y="50" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="95" y="55" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="85" y="70" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="50" y="80" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="62" y="90" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="50" y="100" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="85" y="95" width="8" height="8" rx="1" fill="currentColor" />
        <rect x="98" y="85" width="8" height="8" rx="1" fill="currentColor" />
      </svg>
      <span className="mt-2 text-[10px] font-mono font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
        {code}
      </span>
    </div>
  );
};

// Available room icons
const ROOM_ICONS: Record<string, React.ElementType> = {
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  Trees,
  Tv,
  Briefcase,
  Flame,
  Home,
};

export const AdminView: React.FC = () => {
  const {
    house,
    currentUser,
    members,
    rooms,
    chores,
    updateHouseDetails,
    regenerateInviteCode,
    addMember,
    updateMemberRole,
    removeMember,
    addRoom,
    updateRoom,
    deleteRoom,
    exportHouseData,
    importHouseData,
    showToast,
    isFirebaseConnected,
    syncToCloudNow,
    updateWifiDetails,
    addEmergencyContact,
    deleteEmergencyContact,
    addHouseReward,
    claimHouseReward,
    deleteHouseReward,
  } = useApp();

  // House identity form state
  const [houseName, setHouseName] = useState(house.name);
  const [houseAddress, setHouseAddress] = useState(house.address || '');
  const [weeklyGoalXP, setWeeklyGoalXP] = useState(house.weeklyGoalXP || 500);
  const [rulesNotes, setRulesNotes] = useState(house.rulesNotes || '');

  // Wi-Fi form state
  const [wifiSsid, setWifiSsid] = useState(house.wifiSsid || '');
  const [wifiPassword, setWifiPassword] = useState(house.wifiPassword || '');
  const [copiedWifiPass, setCopiedWifiPass] = useState(false);
  const [showWifiPass, setShowWifiPass] = useState(false);

  useEffect(() => {
    setHouseName(house.name);
    setHouseAddress(house.address || '');
    setWeeklyGoalXP(house.weeklyGoalXP || 500);
    setRulesNotes(house.rulesNotes || '');
    setWifiSsid(house.wifiSsid || '');
    setWifiPassword(house.wifiPassword || '');
  }, [house.id, house.name, house.address, house.weeklyGoalXP, house.rulesNotes, house.wifiSsid, house.wifiPassword]);

  // UI modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // Emergency Contact Modal
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactCategory, setContactCategory] = useState<EmergencyContact['category']>('portaria');
  const [contactPhone, setContactPhone] = useState('');
  const [contactNotes, setContactNotes] = useState('');

  // Rewards Modal
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardXP, setRewardXP] = useState(300);

  // Forms
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomIconInput, setRoomIconInput] = useState('Home');

  // Copy feedback
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [showFirebaseEnvHelp, setShowFirebaseEnvHelp] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser.role === 'admin';

  const handleForceSync = async () => {
    setIsSyncingCloud(true);
    try {
      await syncToCloudNow();
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const copyEnvSample = () => {
    const envSample = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:abcdef123456`;
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    showToast('Variáveis .env copiadas para a área de transferência!', 'success');
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleSaveHouseDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateHouseDetails({
      name: houseName.trim() || 'Minha Casa',
      address: houseAddress.trim(),
      weeklyGoalXP,
      rulesNotes,
    });
  };

  const handleSaveWifi = (e: React.FormEvent) => {
    e.preventDefault();
    updateWifiDetails(wifiSsid.trim(), wifiPassword);
  };

  const handleCopyWifiPass = () => {
    if (!house.wifiPassword) return;
    navigator.clipboard.writeText(house.wifiPassword);
    setCopiedWifiPass(true);
    showToast('Senha do Wi-Fi copiada!', 'success');
    setTimeout(() => setCopiedWifiPass(false), 2000);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) {
      showToast('Preencha nome e telefone.', 'warning');
      return;
    }
    addEmergencyContact({
      name: contactName.trim(),
      category: contactCategory,
      phone: contactPhone.trim(),
      notes: contactNotes.trim() || undefined,
    });
    setContactName('');
    setContactPhone('');
    setContactNotes('');
    setIsAddContactOpen(false);
  };

  const handleAddRewardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim()) {
      showToast('Preencha o título do prêmio.', 'warning');
      return;
    }
    addHouseReward({
      title: rewardTitle.trim(),
      description: rewardDesc.trim() || '',
      requiredXP: rewardXP,
    });
    setRewardTitle('');
    setRewardDesc('');
    setRewardXP(300);
    setIsAddRewardOpen(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(house.inviteCode);
    setCodeCopied(true);
    showToast('Código copiado para a área de transferência!', 'success');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?invite=${house.inviteCode}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    showToast('Link de convite copiado!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      showToast('Digite o nome do morador.', 'warning');
      return;
    }
    addMember(newMemberName.trim(), newMemberRole, undefined, newMemberEmail.trim());
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('member');
    setIsAddMemberOpen(false);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNameInput.trim()) {
      showToast('Digite o nome do cômodo.', 'warning');
      return;
    }
    if (editingRoomId) {
      updateRoom(editingRoomId, roomNameInput.trim(), roomIconInput);
      setEditingRoomId(null);
    } else {
      addRoom(roomNameInput.trim(), roomIconInput);
    }
    setRoomNameInput('');
    setRoomIconInput('Home');
    setIsAddRoomOpen(false);
  };

  const handleExport = () => {
    const jsonStr = exportHouseData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = house.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `domus_${safeName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importHouseData(content);
        if (!res.success) {
          showToast(res.message || 'Erro ao carregar arquivo.', 'error');
        }
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-200 max-w-6xl mx-auto">
      {/* Top Banner & Context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-sand-100/80 via-white to-brand-50/40 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-800/60 border border-sand-200/80 dark:border-gray-800 shadow-u-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 text-white shadow-u-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold font-display text-gray-900 dark:text-white tracking-tight">
              Gestão da Casa & Acesso
            </h1>
            {isAdmin ? (
              <Badge variant="brand" size="sm">Você é Administrador</Badge>
            ) : (
              <Badge variant="gray" size="sm">Acesso de Morador</Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Administre moradores, convites exclusivos, novos cômodos, rotinas e backups de dados.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Trocar / Criar Lar</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: House Identity & Invite Code (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section: Identidade do Lar */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Identidade do Lar
                </h2>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Configurações Gerais</span>
            </div>

            <form onSubmit={handleSaveHouseDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Residência
                </label>
                <input
                  type="text"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  placeholder="Ex: Apartamento 42"
                  className="w-full px-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Endereço ou Bairro (opcional)
                </label>
                <input
                  type="text"
                  value={houseAddress}
                  onChange={(e) => setHouseAddress(e.target.value)}
                  placeholder="Ex: Pinheiros, São Paulo - SP"
                  className="w-full px-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  disabled={!isAdmin}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-gray-400">
                  Criado em: {new Date(house.createdAt).toLocaleDateString('pt-BR')}
                </p>
                {isAdmin && (
                  <Button type="submit" variant="primary" size="sm">
                    Salvar Alterações
                  </Button>
                )}
              </div>
            </form>
          </section>

          {/* Section: Convite & QR Code */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Código de Convite & QR Code
                </h2>
              </div>
              <Badge variant="brand" size="sm">Seguro</Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <InviteQRCode code={house.inviteCode} />

              <div className="flex-1 space-y-3.5 text-center sm:text-left">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Código de entrada exclusivo
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-wider text-gray-900 dark:text-white mt-0.5">
                    {house.inviteCode}
                  </p>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Envie este código ou o link direto para novos moradores entrarem na mesma casa e sincronizarem rotinas.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{codeCopied ? 'Copiado!' : 'Copiar Código'}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5"
                  >
                    {linkCopied ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    <span>{linkCopied ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      onClick={() => regenerateInviteCode()}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900"
                      title="Gerar um novo código e invalidar o anterior"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerar</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Metas & Regras de Convivência */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Metas da Casa & Regras de Convivência
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Meta Coletiva Semanal de XP
                  </label>
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    {weeklyGoalXP} XP / semana
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={weeklyGoalXP}
                  onChange={(e) => setWeeklyGoalXP(Number(e.target.value))}
                  className="w-full accent-brand-600"
                  disabled={!isAdmin}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Incentiva a cooperação de todos os moradores em tarefas e cuidados diários.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Anotações & Regras do Lar
                </label>
                <textarea
                  rows={3}
                  value={rulesNotes}
                  onChange={(e) => setRulesNotes(e.target.value)}
                  placeholder="Ex: Horário de silêncio após 22h; Tirar lixo às terças e quintas; Alimentos na despensa superior são compartilhados."
                  className="w-full px-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                  disabled={!isAdmin}
                />
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateHouseDetails({ weeklyGoalXP, rulesNotes })}
                  >
                    Salvar Metas
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Section: Wi-Fi da Residência */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Wi-Fi da Residência
                </h2>
              </div>
              <Badge variant="brand" size="sm">Acesso Rápido</Badge>
            </div>

            <form onSubmit={handleSaveWifi} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Rede (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Ex: Domus_5G_Home"
                    className="w-full px-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    disabled={!isAdmin}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Senha da Rede
                  </label>
                  <div className="relative">
                    <input
                      type={showWifiPass ? 'text' : 'password'}
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Senha do roteador"
                      className="w-full pl-3.5 pr-20 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                      disabled={!isAdmin}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowWifiPass(!showWifiPass)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title={showWifiPass ? 'Ocultar' : 'Mostrar'}
                      >
                        {showWifiPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyWifiPass}
                        className="p-1 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
                        title="Copiar senha"
                      >
                        {copiedWifiPass ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {house.wifiSsid && (
                <div className="p-3 bg-sand-50 dark:bg-gray-800/50 rounded-xl border border-sand-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{house.wifiSsid}</p>
                      <p className="text-[10px] text-gray-500">Pronto para conectar visitas e moradores</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyWifiPass}
                    className="text-xs py-1"
                  >
                    {copiedWifiPass ? <Check className="w-3.5 h-3.5 text-success-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    <span>{copiedWifiPass ? 'Copiada!' : 'Copiar Senha'}</span>
                  </Button>
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end pt-1">
                  <Button variant="primary" size="sm" type="submit">
                    Salvar Wi-Fi
                  </Button>
                </div>
              )}
            </form>
          </section>

          {/* Section: Contatos de Emergência & Prestadores */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Contatos Úteis & Emergência ({house.emergencyContacts?.length || 0})
                </h2>
              </div>
              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddContactOpen(true)}
                  className="flex items-center gap-1 text-xs py-1 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Contato</span>
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Acesso em 1 clique para todos os moradores ligarem para portaria, síndico ou chamarem prestadores via WhatsApp.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(house.emergencyContacts || []).map((contact) => (
                <div
                  key={contact.id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-sand-50/40 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {contact.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-sand-200/60 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {contact.category}
                      </span>
                    </div>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-mono font-medium mt-0.5">
                      {contact.phone}
                    </p>
                    {contact.notes && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {contact.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                      className="p-1.5 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                      title="Ligar"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-success-600 hover:text-success-700 rounded-lg hover:bg-success-50 dark:hover:bg-success-950/40 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => deleteEmergencyContact(contact.id)}
                        className="p-1.5 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                        title="Remover contato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Recompensas do Lar (Gamificação Real) */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Recompensas & Mimos da Casa ({house.rewards?.length || 0})
                </h2>
              </div>
              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddRewardOpen(true)}
                  className="flex items-center gap-1 text-xs py-1 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Prêmio</span>
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Incentive a harmonia: troque XP acumulado por folga de louça, escolha da pizza ou regalias decididas pelo lar!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(house.rewards || []).map((reward) => {
                const canClaim = currentUser.totalXP >= reward.requiredXP;
                return (
                  <div
                    key={reward.id}
                    className="p-3.5 rounded-xl border border-sand-200/80 dark:border-gray-800 bg-sand-50/30 dark:bg-gray-800/40 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                          {reward.title}
                        </h4>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex-shrink-0">
                          {reward.requiredXP} XP
                        </span>
                      </div>
                      {reward.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          {reward.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        variant={canClaim ? 'primary' : 'secondary'}
                        size="sm"
                        disabled={!canClaim}
                        onClick={() => claimHouseReward(reward.id, currentUser.userId)}
                        className="text-xs py-1 px-2.5"
                      >
                        {canClaim ? 'Resgatar' : `Faltam ${reward.requiredXP - currentUser.totalXP} XP`}
                      </Button>

                      {isAdmin && (
                        <button
                          onClick={() => deleteHouseReward(reward.id)}
                          className="p-1 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                          title="Remover recompensa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Moradores, Cômodos & Backup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section: Moradores & Permissões */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Moradores ({members.length})
                </h2>
              </div>

              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="flex items-center gap-1 text-xs py-1 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              )}
            </div>

            <div className="space-y-2.5">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-sand-50/40 dark:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.displayName}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {member.displayName}
                        </p>
                        {member.userId === currentUser.userId && (
                          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">(Você)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {member.role === 'admin' ? 'Administrador' : member.role === 'member' ? 'Residente' : 'Convidado'} • {member.totalXP} XP
                        </p>
                        {member.pixKey && (
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            PIX
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingMemberId(member.userId);
                        setIsEditProfileModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                      title="Editar perfil e chave PIX"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.userId, e.target.value as any)}
                        className="text-[11px] font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Morador</option>
                        <option value="guest">Convidado</option>
                      </select>
                    )}

                    {isAdmin && members.length > 1 && (
                      <button
                        onClick={() => removeMember(member.userId)}
                        className="p-1 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                        title="Remover morador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Gestão de Cômodos */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Cômodos ({rooms.length})
                </h2>
              </div>

              {isAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingRoomId(null);
                    setRoomNameInput('');
                    setRoomIconInput('Home');
                    setIsAddRoomOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs py-1 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Cômodo</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rooms.map((room) => {
                const IconComponent = (room.icon && ROOM_ICONS[room.icon]) ? ROOM_ICONS[room.icon] : Home;
                const roomChoresCount = chores.filter((c) => c.roomId === room.id).length;

                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-sand-50/30 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {room.name}
                        </p>
                        <span className="text-[10px] text-gray-400">
                          {roomChoresCount} {roomChoresCount === 1 ? 'tarefa' : 'tarefas'}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingRoomId(room.id);
                            setRoomNameInput(room.name);
                            setRoomIconInput(room.icon || 'Home');
                            setIsAddRoomOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors"
                          title="Editar cômodo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          className="p-1 text-gray-400 hover:text-error-600 rounded-lg hover:bg-error-50 dark:hover:bg-error-950/40 transition-colors"
                          title="Excluir cômodo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: Sincronização em Nuvem (Firebase Firestore) */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Nuvem & Sincronização em Tempo Real
                </h2>
              </div>
              {isFirebaseConnected ? (
                <Badge variant="success" size="sm" dot>Firestore Conectado</Badge>
              ) : (
                <Badge variant="warning" size="sm" dot>Modo Local-First</Badge>
              )}
            </div>

            {isFirebaseConnected ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  O Google Cloud Firestore está ativo e sincronizando alterações instantaneamente com todos os moradores conectados a este lar.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleForceSync}
                    disabled={isSyncingCloud}
                    className="flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Sincronizando...' : 'Forçar Sincronização Agora'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Seus dados estão salvos com rapidez no armazenamento local deste dispositivo. Para sincronizar em tempo real com os celulares de outros moradores no Vercel, configure as 6 variáveis do Firebase.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFirebaseEnvHelp(!showFirebaseEnvHelp)}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Info className="w-3.5 h-3.5 text-brand-600" />
                    <span>{showFirebaseEnvHelp ? 'Ocultar Guia do Firebase' : 'Como Conectar o Firebase (Guia Rápido)'}</span>
                  </Button>
                </div>

                {showFirebaseEnvHelp && (
                  <div className="p-3.5 rounded-xl bg-sand-50/70 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                        Variáveis de Ambiente Necessárias:
                      </span>
                      <button
                        onClick={copyEnvSample}
                        className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {copiedEnv ? <Check className="w-3 h-3 text-success-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedEnv ? 'Copiado!' : 'Copiar .env'}</span>
                      </button>
                    </div>

                    <pre className="text-[10px] font-mono bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 overflow-x-auto select-all">
{`VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:abcdef123456`}
                    </pre>

                    <ol className="text-[11px] text-gray-600 dark:text-gray-400 list-decimal list-inside space-y-1">
                      <li>Crie um projeto gratuito no Firebase Console.</li>
                      <li>Ative o Cloud Firestore e aplique o arquivo <code className="font-mono text-[10px] bg-sand-100 dark:bg-gray-700 px-1 py-0.5 rounded">firestore.rules</code>.</li>
                      <li>Copie essas 6 chaves nas <strong>Environment Variables</strong> do seu projeto no Vercel.</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section: Backup Local em Arquivo JSON */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-sand-200 dark:border-gray-800 shadow-u-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-bold font-display text-gray-900 dark:text-white tracking-tight">
                  Backup Local em Arquivo JSON
                </h2>
              </div>
              <Badge variant="gray" size="sm">JSON Seguro</Badge>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Exporte seus dados locais para backup seguro em JSON ou restaure em qualquer navegador ou celular.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                className="flex-1 justify-center flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Exportar Dados (.json)</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 justify-center flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-success-600" />
                <span>Restaurar (.json)</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Modal: Adicionar Morador */}
      {isAddMemberOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              Adicionar Morador
            </h3>
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Morador *
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ex: Beatriz, Thiago, etc."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="morador@exemplo.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Permissão
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none font-semibold"
                >
                  <option value="member">Morador (Participa de tarefas, despesas e pet)</option>
                  <option value="admin">Administrador (Controle total da casa)</option>
                  <option value="guest">Convidado (Somente visualização)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setIsAddMemberOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Morador
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Adicionar/Editar Cômodo */}
      {isAddRoomOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              {editingRoomId ? 'Editar Cômodo' : 'Novo Cômodo'}
            </h3>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Cômodo *
                </label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  placeholder="Ex: Varanda Gourmet, Escritório, Lavanderia"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Escolha um Ícone
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(ROOM_ICONS).map(([key, Icon]) => {
                    const isSelected = roomIconInput === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setRoomIconInput(key)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shadow-u-xs'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setIsAddRoomOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingRoomId ? 'Salvar Cômodo' : 'Criar Cômodo'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Global Auth / Switch House Modal */}
      <AuthHouseModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Modal: Editar Perfil / Morador */}
      <UserProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => {
          setIsEditProfileModalOpen(false);
          setEditingMemberId(null);
        }}
        targetUserId={editingMemberId || undefined}
      />

      {/* Modal: Adicionar Contato de Emergência */}
      {isAddContactOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              Novo Contato Útil ou Emergência
            </h3>
            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Contato ou Prestador *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Portaria 24h, Encanador José, Síndico"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  >
                    <option value="portaria">Portaria</option>
                    <option value="sindico">Síndico / Admin</option>
                    <option value="encanador">Encanador</option>
                    <option value="eletricista">Eletricista</option>
                    <option value="chaveiro">Chaveiro</option>
                    <option value="bombeiros">Bombeiros (193)</option>
                    <option value="policia">Polícia (190)</option>
                    <option value="outro">Outro Prestador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Observações ou Horários (opcional)
                </label>
                <input
                  type="text"
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Ex: Atende 24h, ramal 101"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setIsAddContactOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Contato
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Adicionar Recompensa do Lar */}
      {isAddRewardOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-u-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
              Nova Recompensa do Lar
            </h3>
            <p className="text-xs text-gray-500">
              Crie um incentivo que os moradores podem resgatar ao acumularem pontuação em tarefas e cuidados da casa.
            </p>
            <form onSubmit={handleAddRewardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Título da Recompensa *
                </label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="Ex: Folga da Louça na Sexta, Escolhe a Pizza, etc."
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  placeholder="Ex: Não precisa lavar louça nem limpar a bancada por um dia inteiro"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Custo em Pontos (XP)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={rewardXP}
                  onChange={(e) => setRewardXP(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setIsAddRewardOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Salvar Recompensa
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
