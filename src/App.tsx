import { HashRouter, Routes, Route } from 'react-router-dom';
import { ApiProvider, ToastProvider } from '@/context';
import { Library, MangaDetails, Settings } from '@/views';

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <ApiProvider>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/manga/:id" element={<MangaDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ApiProvider>
      </ToastProvider>
    </HashRouter>
  );
}
