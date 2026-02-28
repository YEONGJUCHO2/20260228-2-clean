import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Farewell.css';

export default function Farewell() {
    const location = useLocation();
    const navigate = useNavigate();
    const item = location.state?.item;
    const [phase, setPhase] = useState(0); // 0: appear, 1: dissolve, 2: message, 3: done

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 1500),
            setTimeout(() => setPhase(2), 3500),
            setTimeout(() => setPhase(3), 5500),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    if (!item) {
        return (
            <div className="page farewell-page">
                <div className="farewell-empty">
                    <p>작별할 물건이 없어요</p>
                    <button onClick={() => navigate('/')}>홈으로</button>
                </div>
            </div>
        );
    }

    // 파티클 생성
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
        size: 4 + Math.random() * 8,
        type: ['✨', '🌸', '⭐', '💫'][Math.floor(Math.random() * 4)],
    }));

    return (
        <div className="farewell-page-full">
            {/* 파티클 배경 */}
            <div className="particles">
                {particles.map(p => (
                    <span
                        key={p.id}
                        className={`particle ${phase >= 1 ? 'active' : ''}`}
                        style={{
                            left: `${p.left}%`,
                            animationDelay: `${p.delay}s`,
                            animationDuration: `${p.duration}s`,
                            fontSize: `${p.size}px`,
                        }}
                    >
                        {p.type}
                    </span>
                ))}
            </div>

            {/* 물건 카드 */}
            <div className={`farewell-item-card ${phase >= 1 ? 'dissolving' : ''}`}>
                <div className="farewell-item-icon">
                    {item.category === 'clothing' ? '👕' :
                        item.category === 'books' ? '📚' :
                            item.category === 'electronics' ? '📱' :
                                item.category === 'accessories' ? '🧸' :
                                    item.category === 'memories' ? '💌' :
                                        item.category === 'kitchen' ? '🍳' : '📦'}
                </div>
                <p className="farewell-item-name">{item.name}</p>
            </div>

            {/* 작별 메시지 */}
            <div className={`farewell-message ${phase >= 2 ? 'visible' : ''}`}>
                <p className="farewell-text">잘 가, 고마웠어.</p>
                <p className="farewell-sub">{item.farewellMessage}</p>
            </div>

            {/* 스미스 */}
            <div className={`farewell-smith ${phase >= 2 ? 'visible' : ''}`}>
                <span className="smith-farewell-face">🥲</span>
                <span className="smith-wave">👋</span>
            </div>

            {/* 완료 버튼 */}
            <div className={`farewell-actions ${phase >= 3 ? 'visible' : ''}`}>
                <button className="farewell-done-btn" onClick={() => navigate('/')}>
                    홈으로 돌아가기
                </button>
                <button className="farewell-archive-btn" onClick={() => navigate('/archive')}>
                    추억 보관함 보기 📦
                </button>
            </div>
        </div>
    );
}
