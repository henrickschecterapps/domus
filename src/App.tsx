import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './views/DashboardView';
import { CleaningView } from './views/CleaningView';
import { PetView } from './views/PetView';
import { PantryShoppingView } from './views/PantryShoppingView';
import { FinanceView } from './views/FinanceView';
import { AdminView } from './views/AdminView';
import { calculateChoreUrgency } from './utils/cleaningMath';

import { LoginScreen } from './components/LoginScreen';
import { InstallAppBanner } from './components/InstallAppBanner';
import { Home } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [scrollProgress, setScrollProgress] = useState(0);
  const { chores, pets } = useApp();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 40) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const now = Date.now();
  const urgentChoreCount = chores.filter((c) => {
    const { urgencyRatio } = calculateChoreUrgency(c, now);
    return urgencyRatio > 1.0;
  }).length;

  const urgentPetAlert = pets.some((p) => {
    if (p.species === 'cat' && p.litterBox) {
      return Math.floor((now - p.litterBox.lastScoopedAt) / (3600 * 1000)) >= 24;
    }
    if (p.species === 'dog' && p.walks) {
      return p.walks.walksToday === 0;
    }
    return false;
  });

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row font-sans transition-colors duration-200 selection:bg-brand-500/20">
      {/* Top Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-brand-500 via-violet-500 to-emerald-400 transition-all duration-150 ease-out shadow-u-glow"
          style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 1 ? 1 : 0 }}
        />
      </div>

      {/* Multi-Layer Ambient Ultraviolet & Emerald Lighting + Film Grain */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-36 right-[6%] w-[500px] h-[500px] rounded-full bg-brand-500/[0.07] dark:bg-brand-500/[0.11] blur-[120px] animate-float-slow" />
        <div className="absolute top-[40%] left-[12%] w-[440px] h-[440px] rounded-full bg-violet-500/[0.05] dark:bg-violet-500/[0.08] blur-[120px]" />
        <div className="absolute bottom-[-12%] right-[25%] w-[380px] h-[380px] rounded-full bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] blur-[110px]" />
        <div className="absolute inset-0 bg-noise-overlay opacity-60 dark:opacity-80" />
      </div>

      <ToastContainer />

      {/* Desktop Sleek Sidebar (Linear / Arc style, visible on md+) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        urgentChoreCount={urgentChoreCount}
        urgentPetAlert={urgentPetAlert}
      />

      {/* Main Content Area — Elevated "App Frame" Canvas on Desktop */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-screen md:min-h-[calc(100vh-16px)] md:my-2 md:mr-2 md:rounded-[28px] bg-gray-50/90 dark:bg-[#0D0F18]/90 md:border md:border-gray-200/80 md:dark:border-white/[0.07] md:shadow-u-xl overflow-x-hidden">
        <Header onNavigateTab={handleTabChange} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-7 xl:px-9 pt-5 pb-28 md:pb-10">
          <div key={activeTab} className="animate-view-enter">
            {activeTab === 'dashboard' && (
              <DashboardView onNavigateTab={(tab) => handleTabChange(tab)} />
            )}
            {activeTab === 'cleaning' && <CleaningView />}
            {activeTab === 'pet' && <PetView />}
            {activeTab === 'pantry' && <PantryShoppingView />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'admin' && <AdminView />}
          </div>
        </main>
      </div>

      {/* Mobile Floating Pill Dock (visible only on mobile) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        urgentChoreCount={urgentChoreCount}
        urgentPetAlert={urgentPetAlert}
      />

      {/* PWA Install Banner (mobile / browser) */}
      <InstallAppBanner />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { authUser, isAuthLoading, isOfflineDemo, members } = useApp();

  if (isAuthLoading) {
    return (
      <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="pointer-events-none absolute w-80 h-80 rounded-full bg-brand-500/20 blur-3xl animate-pulse" />
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 text-white flex items-center justify-center shadow-u-glow-lg mb-4 animate-bounce">
            <Home className="w-8 h-8 stroke-[2.2]" />
          </div>
          <p className="text-lg font-extrabold font-display tracking-tight text-gray-900 dark:text-white">
            Domus
          </p>
          <p className="text-xs font-mono uppercase tracking-widest text-brand-600 dark:text-brand-400 mt-1">
            Sincronizando Hub...
          </p>
        </div>
      </div>
    );
  }

  const isUserAssociatedWithHouse = Boolean(
    authUser &&
      members.some(
        (m) =>
          m.userId === authUser.uid ||
          (authUser.email && m.email && m.email.toLowerCase() === authUser.email.toLowerCase())
      )
  );

  if (!isOfflineDemo && (!authUser || !isUserAssociatedWithHouse)) {
    return <LoginScreen />;
  }

  return <MainLayout />;
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

