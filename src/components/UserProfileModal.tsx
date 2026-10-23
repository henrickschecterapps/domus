import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import {
  X,
  User,
  Camera,
  Smartphone,
  CreditCard,
  Home,
  Volume2,
  VolumeX,
  Vibrate,
  Sparkles,
  Check,
  Copy,
  Flame,
  Award,
} from 'lucide-react';
import { Button } from './untitled/Button';
import { Badge } from './untitled/Badge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string; // If provided by admin, edits that user; otherwise currentUser
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
}) => {
  const {
    currentUser,
    members,
    rooms,
    updateMemberProfile,
    showToast,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
  } = useApp();

  const memberToEdit = targetUserId
    ? members.find((m) => m.userId === targetUserId) || currentUser
    : currentUser;

  const [displayName, setDisplayName] = useState(memberToEdit?.displayName || '');
  const [email, setEmail] = useState(memberToEdit?.email || '');
  const [phone, setPhone] = useState(memberToEdit?.phone || '');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>(
    (memberToEdit?.pixKeyType as any) || 'email'
  );
  const [pixKey, setPixKey] = useState(memberToEdit?.pixKey || '');
  const [assignedRoomId, setAssignedRoomId] = useState(memberToEdit?.assignedRoomId || '');
  const [avatarUrl, setAvatarUrl] = useState(memberToEdit?.avatarUrl || '');
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    if (isOpen && memberToEdit) {
      setDisplayName(memberToEdit.displayName || '');
      setEmail(memberToEdit.email || '');
      setPhone(memberToEdit.phone || '');
      setPixKeyType((memberToEdit.pixKeyType as any) || 'email');
      setPixKey(memberToEdit.pixKey || '');
      setAssignedRoomId(memberToEdit.assignedRoomId || '');
      setAvatarUrl(memberToEdit.avatarUrl || '');
    }
  }, [isOpen, targetUserId, memberToEdit?.userId, memberToEdit?.displayName, memberToEdit?.avatarUrl]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 2MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatarUrl(base64);
        showToast('Foto carregada com sucesso!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast('O nome não pode ficar em branco.', 'warning');
      return;
    }

    updateMemberProfile(memberToEdit.userId, {
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      pixKeyType,
      pixKey: pixKey.trim(),
      assignedRoomId: assignedRoomId || undefined,
      avatarUrl,
    });

    onClose();
  };

  const copyPixKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    showToast('Chave Pix copiada!', 'success');
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-u-xl border border-sand-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-100 dark:border-gray-800 bg-sand-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-u-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-gray-900 dark:text-white">
                {targetUserId && targetUserId !== currentUser.userId
                  ? `Editar Perfil de ${memberToEdit.displayName}`
                  : 'Meu Perfil & Preferências'}
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Chave PIX para reembolsos, foto, contatos e preferências
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar and Preset Selection */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-sand-50/60 dark:bg-gray-800/40 border border-sand-200/60 dark:border-gray-800">
            <div className="relative group flex-shrink-0">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-u-md"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-gray-950/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Carregar nova foto"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-semibold">Alterar</span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2 min-w-0 flex-1 text-center sm:text-left">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Escolha um avatar ou envie sua foto:
              </span>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === url
                        ? 'border-brand-500 scale-110 shadow-u-xs'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gamification Stats Banner */}
          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-brand-50/80 via-white to-sand-50/60 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 border border-brand-100 dark:border-gray-800 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-brand-600 dark:text-brand-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-sm font-bold">{memberToEdit.weeklyXP}</span>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">XP da Semana</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-warning-600 dark:text-warning-400">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-sm font-bold">{memberToEdit.streakDays || 1}d</span>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Sequência</span>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                <Award className="w-3.5 h-3.5" />
                <span className="text-sm font-bold">{memberToEdit.totalXP}</span>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">XP Total</span>
            </div>
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nome de Exibição *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Henrique"
                className="w-full px-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: seuemail@dominio.com"
                className="w-full px-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Quarto / Cômodo Principal
              </label>
              <div className="relative">
                <Home className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <select
                  value={assignedRoomId}
                  onChange={(e) => setAssignedRoomId(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-sand-50/50 dark:bg-gray-800/80 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                >
                  <option value="">Não especificado</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Chave PIX */}
          <div className="p-4 rounded-2xl bg-sand-50/50 dark:bg-gray-800/40 border border-sand-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Chave PIX para Reembolsos
                </span>
              </div>
              <Badge variant="brand" size="sm">Acerto em 1-Clique</Badge>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Quando alguém for te pagar no acerto de contas, o app exibirá essa chave com botão de copiar automático.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2 relative">
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={
                    pixKeyType === 'cpf'
                      ? '000.000.000-00'
                      : pixKeyType === 'phone'
                      ? '(11) 99999-9999'
                      : pixKeyType === 'email'
                      ? 'chave@email.com'
                      : 'Chave aleatória EVP'
                  }
                  className="w-full pl-3.5 pr-9 py-2 rounded-xl bg-white dark:bg-gray-800 border border-sand-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                {pixKey && (
                  <button
                    type="button"
                    onClick={copyPixKey}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-brand-600 transition-colors"
                    title="Copiar Chave Pix"
                  >
                    {copiedPix ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sensory Preferences (Only for Current User) */}
          {(!targetUserId || targetUserId === currentUser.userId) && (
            <div className="p-4 rounded-2xl bg-sand-50/50 dark:bg-gray-800/40 border border-sand-200 dark:border-gray-700 space-y-3">
              <span className="text-xs font-bold text-gray-900 dark:text-white block">
                Experiência Sensorial & Feedback
              </span>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Efeitos Sonoros Sutis
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Sons suaves acústicos ao concluir tarefas e compras.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                      soundEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Vibração Háptica no Celular
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Resposta tátil agradável ao tocar em botões de ação.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVibrationEnabled(!vibrationEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                      vibrationEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        vibrationEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-100 dark:border-gray-800">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
