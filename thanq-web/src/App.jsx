import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Farewell from './pages/Farewell';
import Archive from './pages/Archive';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import { applyThemeOnLoad } from './utils/storage';
import './App.css';

function App() {
  useEffect(() => { applyThemeOnLoad(); }, []);
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/farewell" element={<Farewell />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
