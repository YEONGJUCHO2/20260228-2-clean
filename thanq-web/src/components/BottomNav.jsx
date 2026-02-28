import { NavLink } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                <span className="nav-icon">🏠</span>
                <span className="nav-label">홈</span>
            </NavLink>
            <NavLink to="/archive" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📦</span>
                <span className="nav-label">보관함</span>
            </NavLink>
            <div className="nav-camera-wrapper">
                <NavLink to="/chat" className="nav-camera-btn">
                    <span className="camera-icon">📸</span>
                </NavLink>
            </div>
            <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📊</span>
                <span className="nav-label">통계</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">⚙️</span>
                <span className="nav-label">설정</span>
            </NavLink>
        </nav>
    );
}
