import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { getTheme } from './theme/theme';

// Layout & Pages
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cities from './pages/Cities';
import CityDetails from './pages/CityDetails';
import SocialAccounts from './pages/SocialAccounts';
import Targets from './pages/Targets';
import Reports from './pages/Reports';

// Route guard checking for existing local token
function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  // Read mode preference from local storage
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const toggleDarkMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Secure Workspace Layout Shell */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout darkMode={mode === 'dark'} toggleDarkMode={toggleDarkMode} />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cities" element={<Cities />} />
            <Route path="cities/:id" element={<CityDetails />} />
            <Route path="accounts" element={<SocialAccounts />} />
            <Route path="targets" element={<Targets />} />
            <Route path="reports" element={<Reports />} />
            
            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
