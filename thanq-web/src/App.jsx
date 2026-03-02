import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Farewell from './pages/Farewell';
import Archive from './pages/Archive';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { applyThemeOnLoad } from './utils/storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MainLayout() {
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/farewell" element={<ProtectedRoute><Farewell /></ProtectedRoute>} />
        <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function App() {
  useEffect(() => {
    applyThemeOnLoad();

    // 카카오 인앱 브라우저 감지 및 외부 브라우저 전환 시도
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.match(/kakaotalk/i)) {
      alert('원활한 사용을 위해 기본 브라우저(Safari/Chrome)로 이동합니다.');
      location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
    }
  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
