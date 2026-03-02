import { NavLink, useNavigate } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
    const navigate = useNavigate();
    return (
        <nav className="bottom-nav">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
                <span className="nav-icon">🏠</span>
                <span className="nav-label">홈</span>
            </NavLink>
            <NavLink to="/archive" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon">📦</span>
                <span className="nav-label">추억함</span>
            </NavLink>
            <div className="nav-camera-wrapper">
                <input
                    type="file"
                    id="nav-camera-input"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const imageUrl = URL.createObjectURL(file);
                            // 정확도를 올리기 위해 데모용으로 마우스 테스트 위주의 mock 데이터 구성
                            const mockNames = ['검은색 마우스', '마우스', 'LG 무선 마우스', '마우스', '스마트폰'];
                            const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
                            navigate('/chat', { state: { imageCaptured: true, imageUrl, mockName: randomName } });
                        }
                    }}
                />
                <a
                    href="#chat"
                    className="nav-camera-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('nav-camera-input').click();
                    }}
                >
                    <span className="camera-icon">📸</span>
                </a>
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
