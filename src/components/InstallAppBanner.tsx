import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { InstallAppModal } from './InstallAppModal';

export const InstallAppBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Check if user dismissed banner this session
    const dismissed = sessionStorage.getItem('domus_pwa_banner_dismissed');
    if (dismissed === 'true') {
      return;
    }

    // Capture Chrome/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On mobile devices (iOS or Android), show after a brief delay if not standalone
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('domus_pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-5 left-4 right-4 md:left-auto md:right-5 md:max-w-md z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-brand-200 dark:border-brand-900/70 p-3.5 rounded-2xl shadow-u-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-u-xs">
            <Smartphone className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                Instalar App no Celular
              </h4>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              Acesso em 1 clique na tela inicial sem barra de URL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-u-xs active:scale-95 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Fechar banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <InstallAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setShowBanner(false)}
      />
    </>
  );
};
