import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useStore } from '@/store/useStore';
import BriefingPage from '@/pages/BriefingPage';
import ImportPage from '@/pages/ImportPage';
import ContactsPage from '@/pages/ContactsPage';
import WatchlistsPage from '@/pages/WatchlistsPage';
import SignalsPage from '@/pages/SignalsPage';
import EnrichmentPage from '@/pages/EnrichmentPage';
import CampagnesPage from '@/pages/CampagnesPage';
import HubSpotPage from '@/pages/HubSpotPage';
import SetupPage from '@/pages/SetupPage';
import ConfigPage from '@/pages/ConfigPage';
import HandleidingPage from '@/pages/HandleidingPage';
import KalibratiePage from '@/pages/KalibratiePage';
import NotFound from '@/pages/NotFound';

  const initialize = useStore((s) => s.initialize);
  const isLoading = useStore((s) => s.isLoading);
  const isInitialized = useStore((s) => s.isInitialized);
  const lastError = useStore((s) => s.lastError);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Data laden vanuit Supabase...</p>
        </div>
      </div>
    );
  }

  if (lastError && !isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm text-destructive font-medium">Kon geen verbinding maken met de database</p>
          <p className="text-xs text-muted-foreground">{lastError}</p>
          <button onClick={() => initialize()} className="text-xs text-primary hover:underline">Opnieuw proberen</button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<BriefingPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/contacten" element={<ContactsPage />} />
          <Route path="/watchlists" element={<WatchlistsPage />} />
          <Route path="/signalen" element={<SignalsPage />} />
          <Route path="/enrichment" element={<EnrichmentPage />} />
          <Route path="/kalibratie" element={<KalibratiePage />} />
          <Route path="/campagnes" element={<CampagnesPage />} />
          <Route path="/hubspot" element={<HubSpotPage />} />
          <Route path="/settings/setup" element={<SetupPage />} />
          <Route path="/settings/config" element={<ConfigPage />} />
          <Route path="/handleiding" element={<HandleidingPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
