import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Download, 
  Share, 
  PlusSquare, 
  Smartphone, 
  CheckCircle2, 
  X, 
  HelpCircle,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from './untitled/Button';
import { Badge } from './untitled/Badge';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallSuccess?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/.test(ua);

    if (isIOS) {
      setActivePlatform('ios');
    } else if (isAndroid) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }
  }, []);

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

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          if (onInstallSuccess) onInstallSuccess();
          onClose();
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
      <div 
        className="w-full max-w-md max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-u-xl p-5 sm:p-6 relative text-gray-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center shadow-u-sm flex-shrink-0">
            <Smartphone className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display text-gray-900 dark:text-white">
                Instalar o Domus
              </h2>
              <Badge variant="brand" size="sm">App PWA</Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Tenha acesso rápido direto da tela inicial do celular
            </p>
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
              activePlatform === 'android'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-u-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Android
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
              activePlatform === 'ios'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-u-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            iPhone (iOS)
          </button>
          <button
            type="button"
            onClick={() => setActivePlatform('desktop')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
              activePlatform === 'desktop'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-u-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Computador
          </button>
        </div>

        {/* Platform Content: Android */}
        {activePlatform === 'android' && (
          <div className="space-y-4">
            {deferredPrompt ? (
              <div className="space-y-3 p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-center">
                <Sparkles className="w-7 h-7 text-brand-600 dark:text-brand-400 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-brand-900 dark:text-brand-200">
                    Instalação automática pronta!
                  </h4>
                  <p className="text-[11px] text-brand-700 dark:text-brand-300 mt-1">
                    Toque no botão abaixo para adicionar o ícone do Domus na sua tela inicial em 1 clique.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNativeInstall}
                  disabled={isInstalling}
                  icon={Download}
                  className="w-full justify-center text-xs"
                >
                  {isInstalling ? 'Instalando...' : 'Instalar Agora no Celular'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  No navegador <strong>Google Chrome</strong> ou <strong>Samsung Internet</strong>:
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Toque em <strong>Instalar</strong>. O Domus abrirá como aplicativo independente em tela cheia!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Platform Content: iOS */}
        {activePlatform === 'ios' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              No navegador <strong>Safari</strong> do seu iPhone ou iPad:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">1. Toque em Compartilhar</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Toque no ícone de quadrado com seta para cima na barra inferior do Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">2. Adicionar à Tela de Início</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <div className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">3. Confirmar</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O app fica na sua tela inicial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Platform Content: Desktop */}
        {activePlatform === 'desktop' && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              No <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> ou <strong>Brave</strong>:
            </p>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Olhe para a <strong>barra de endereço</strong> no topo do navegador (à direita da URL).
                </p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Clique no ícone de <strong>computador com seta para baixo (⊕)</strong> ou nos 3 pontinhos &gt; <strong>"Instalar Domus..."</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Advantages footer */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Funciona offline
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Sem barra de URL
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Mais rápido
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};
