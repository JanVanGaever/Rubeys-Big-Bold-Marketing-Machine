import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import AppLayout from '@/components/AppLayout';
import BriefingPage from '@/pages/BriefingPage';
import ImportPage from '@/pages/ImportPage';
import ContactsPage from '@/pages/ContactsPage';
import ContactDetailPage from '@/pages/ContactDetailPage';
import OrganizationsPage from '@/pages/OrganizationsPage';
import SignalsPage from '@/pages/SignalsPage';
import EnrichmentPage from '@/pages/EnrichmentPage';
import LemlistPage from '@/pages/LemlistPage';
import HubSpotPage from '@/pages/HubSpotPage';
import SettingsPage from '@/pages/SettingsPage';
import GuidePage from '@/pages/GuidePage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<BriefingPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/enrichment" element={<EnrichmentPage />} />
            <Route path="/lemlist" element={<LemlistPage />} />
            <Route path="/hubspot" element={<HubSpotPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
