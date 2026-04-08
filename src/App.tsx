import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
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
import NotFound from '@/pages/NotFound';

export default function App() {
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
