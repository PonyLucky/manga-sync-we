import { HashRouter, Routes, Route } from 'react-router-dom';
import { ApiProvider, ToastProvider, ThemeProvider } from '@/context';
import { Library, MangaDetails, Settings } from '@/views';

export function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <ApiProvider>
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/manga/:id" element={<MangaDetails />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </ApiProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
