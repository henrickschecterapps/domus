import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { chores, pets } = useApp();

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
      <ToastContainer />

      {/* iPadOS / macOS Desktop Sidebar (visible on md+) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        urgentChoreCount={urgentChoreCount}
        urgentPetAlert={urgentPetAlert}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onNavigateTab={setActiveTab} />

        <main className="flex-1 w-full px-4 sm:px-8 xl:px-10 pt-4 pb-20 md:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'cleaning' && <CleaningView />}
          {activeTab === 'pet' && <PetView />}
          {activeTab === 'pantry' && <PantryShoppingView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'admin' && <AdminView />}
        </main>
      </div>

      {/* iOS Mobile Bottom Navigation Bar (visible only on mobile) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        urgentChoreCount={urgentChoreCount}
        urgentPetAlert={urgentPetAlert}
      />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { authUser, isAuthLoading, isOfflineDemo, members } = useApp();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-sand-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-u-md animate-pulse mb-3">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Carregando Domus...</p>
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
