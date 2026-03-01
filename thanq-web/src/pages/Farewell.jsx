import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { isProUser } from '../utils/cloudStorage';
import './Farewell.css';

export default function Farewell() {
    const location = useLocation();
    const navigate = useNavigate();
    const item = location.state?.item;
    const [phase, setPhase] = useState(0);
    const [sharing, setSharing] = useState(false);
    const [theme, setTheme] = useState('default'); // default | aurora | fireworks | butterfly
    const cardRef = useRef(null);
    const isPro = isProUser();

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

    // 테마별 파티클 아이콘
    const getThemeParticles = () => {
        switch (theme) {
            case 'aurora': return ['🌌', '✨', '☄️', '⭐'];
            case 'fireworks': return ['🎆', '🎇', '✨', '🌟'];
            case 'butterfly': return ['🦋', '🌸', '🍃', '✨'];
            default: return ['✨', '🌸', '⭐', '💫'];
        }
    };

    // 파티클 생성 - 테마에 따라 재생성하기 위해 useMemo로 감싸거나 바로 생성 (여기선 상태에 따라 재랜더링되므로 바로 생성)
    const particleIcons = getThemeParticles();
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
        size: 4 + Math.random() * 8,
        type: particleIcons[Math.floor(Math.random() * particleIcons.length)],
    }));

    const getCategoryIcon = (cat) => {
        const icons = { clothing: '👕', books: '📚', electronics: '📱', accessories: '🧸', memories: '💌', kitchen: '🍳' };
        return icons[cat] || '📦';
    };

    // 작별 카드 이미지 저장/공유
    const handleShareCard = async () => {
        if (!cardRef.current || sharing) return;
        setSharing(true);
        try {
            // 테마별 배경색 직접 지정하여 캔버스에 그리기 (html2canvas가 css 배경을 정확히 못잡는 경우 대비)
            const bgColors = {
                default: '#1A1A2E',
                aurora: '#0f2027',
                fireworks: '#1f1c2c',
                butterfly: '#ffd194'
            };

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: bgColors[theme] || '#1A1A2E',
                scale: 2, // 고해상도
                useCORS: true,
                logging: false,
            });

            const imageData = canvas.toDataURL('image/png');
            const fileName = `thanq_${item.name}_작별카드.png`;

            // Web Share API 지원 시 공유, 아니면 다운로드
            if (navigator.share && navigator.canShare) {
                const blob = await (await fetch(imageData)).blob();
                const file = new File([blob], fileName, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `${item.name}와(과) 작별했어요`,
                        text: '🌸 ThanQ로 감성적인 작별 인사를 남겼어요',
                        files: [file],
                    });
                    return;
                }
            }
            // 폴백: 다운로드
            const a = document.createElement('a');
            a.href = imageData;
            a.download = fileName;
            a.click();
        } catch (e) {
            console.error('카드 저장 실패:', e);
            alert('이미지 저장에 실패했어요. 다시 시도해주세요.');
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className={`farewell-page-full theme-${theme}`}>
            {/* 파티클 배경 */}
            <div className={`particles theme-${theme}`}>
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

            {/* 캡처 대상 카드 영역 */}
            <div ref={cardRef} className={`farewell-share-card theme-bg-${theme}`}>
                {/* 물건 카드 */}
                <div className={`farewell-item-card ${phase >= 1 ? 'dissolving' : ''}`}>
                    <div className="farewell-item-icon" style={item.imageData ? { padding: 0, overflow: 'hidden' } : {}}>
                        {item.imageData ? (
                            <img src={item.imageData} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' }} />
                        ) : (
                            getCategoryIcon(item.category)
                        )}
                    </div>
                    <p className="farewell-item-name">{item.name}</p>
                </div>

                {/* 작별 메시지 */}
                <div className={`farewell-message ${phase >= 2 ? 'visible' : ''}`}>
                    <p className="farewell-text">잘 가, 고마웠어.</p>
                    <p className="farewell-sub">{item.farewellMessage}</p>
                </div>

                {/* ThanQ 워터마크 */}
                {phase >= 2 && (
                    <div className="farewell-watermark">
                        🐱 ThanQ
                    </div>
                )}
            </div>

            {/* 완료 버튼 (테마 선택 추가) */}
            <div className={`farewell-actions ${phase >= 3 ? 'visible' : ''}`}>
                {isPro && (
                    <div className="farewell-theme-selector">
                        <button className={`theme-btn ${theme === 'default' ? 'active' : ''}`} onClick={() => setTheme('default')}>기본</button>
                        <button className={`theme-btn ${theme === 'aurora' ? 'active' : ''}`} onClick={() => setTheme('aurora')}>🌌 오로라</button>
                        <button className={`theme-btn ${theme === 'fireworks' ? 'active' : ''}`} onClick={() => setTheme('fireworks')}>🎆 불꽃놀이</button>
                        <button className={`theme-btn ${theme === 'butterfly' ? 'active' : ''}`} onClick={() => setTheme('butterfly')}>🦋 나비</button>
                    </div>
                )}
                <button
                    className="farewell-share-btn"
                    onClick={handleShareCard}
                    disabled={sharing}
                >
                    {sharing ? '저장 중...' : '📸 카드로 저장하기'}
                </button>
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
