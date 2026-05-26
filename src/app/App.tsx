import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './ThemeContext';
import Screen1GhostLogin from './components/Screen1GhostLogin';
import Screen2Wallet from './components/Screen2Wallet';
import Screen3Search from './components/Screen3Search';
import Screen4Detail from './components/Screen4Detail';
import Screen5CreatePassword from './components/Screen5CreatePassword';
import Screen6Panel from './components/Screen6Panel';
import Screen7Alerts from './components/Screen7Alerts';
import Screen8Profile from './components/Screen8Profile';
import InstallBanner from './components/InstallBanner';
import ChatBot from './components/ChatBot';

function AppContent() {
  const { theme } = useTheme();
  const location  = useLocation();
  const isDark    = theme === 'dark';
  const showChat  = location.pathname !== '/';

  return (
    <div style={{
      width:'100vw', height:'100vh', overflow:'hidden',
      fontFamily:'Inter, Arial, sans-serif', position:'relative',
      maxWidth:480, margin:'0 auto',
      background: isDark ? '#0F172A' : '#FFFFFF',
      color:       isDark ? '#F1F5F9' : '#111827',
      transition: 'background 0.3s, color 0.3s',
    }}>
      <Routes>
        <Route path="/"        element={<Screen1GhostLogin />} />
        <Route path="/vault"   element={<Screen2Wallet />} />
        <Route path="/search"  element={<Screen3Search />} />
        <Route path="/detail"  element={<Screen4Detail />} />
        <Route path="/new"     element={<Screen5CreatePassword />} />
        <Route path="/panel"   element={<Screen6Panel />} />
        <Route path="/alerts"  element={<Screen7Alerts />} />
        <Route path="/profile" element={<Screen8Profile />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
      {showChat && <ChatBot />}
      <InstallBanner />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}
