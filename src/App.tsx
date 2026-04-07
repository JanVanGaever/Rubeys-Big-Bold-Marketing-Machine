import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BriefingPage from '@/pages/BriefingPage';
import ContactsPage from '@/pages/ContactsPage';
import WatchlistsPage from '@/pages/WatchlistsPage';
import SignalsPage from '@/pages/SignalsPage';
import CampagnesPage from '@/pages/CampagnesPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<BriefingPage />} />
          <Route path="/contacten" element={<ContactsPage />} />
          <Route path="/watchlists" element={<WatchlistsPage />} />
          <Route path="/signalen" element={<SignalsPage />} />
          <Route path="/campagnes" element={<CampagnesPage />} />
          <Route path="/instellingen" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
