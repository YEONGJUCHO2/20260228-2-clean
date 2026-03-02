import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMissions, getMissionProgress, getWishlistItems, addMission, deleteMission } from '../utils/storage';
import { getItemsCloud, getRankingsCloud } from '../utils/cloudStorage';
import { getSmithReaction as getReaction } from '../utils/smithAI';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../utils/firebase';
import { getCategoryInfo, formatDate } from '../utils/category';
import PremiumModal from '../components/PremiumModal';
import GuideModal from '../components/GuideModal';
import './Home.css';

const AI_MISSIONS = [
    { title: "안 입는 옷 3벌 비우기", category: "의류", target: 3 },
    { title: "유통기한 지난 소스 버리기", category: "주방용품", target: 2 },
    { title: "안 보는 책 1권 기부/판매", category: "책", target: 1 },
    { title: "서랍장 잡동사니 정리하기", category: "기타", target: 5 },
    { title: "1년 안 쓴 전자기기 처분", category: "전자기기", target: 1 }
];

function RankAvatar({ src }) {
    if (src === '🐱') return <span>🐱</span>;
    return <img src={src} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />;
}

export default function Home() {
    const navigate = useNavigate();
    const { currentUser, isPro, logout } = useAuth();
    const [missions, setMissions] = useState([]);
    const [farewellItems, setFarewellItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [showAddMission, setShowAddMission] = useState(false);
    const [addMissionMode, setAddMissionMode] = useState(null);
    const [newMissionTitle, setNewMissionTitle] = useState('');
    const [newMissionTarget, setNewMissionTarget] = useState('3');
    const [newMissionCategory, setNewMissionCategory] = useState('전체');
    const [isMissionExpanded, setIsMissionExpanded] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);

    useEffect(() => {
        const loadRealData = async () => {
            setMissions(getMissions());

            const [items, cloudRanks] = await Promise.all([
                getItemsCloud(currentUser),
                getRankingsCloud()
            ]);

            const farewells = [];
            const wishlists = [];
            for (const i of items) {
                if (i.status === 'farewell' || !i.status) farewells.push(i);
                else if (i.status === 'wishlist') wishlists.push(i);
            }

            setFarewellItems(farewells);
            setWishlistItems(wishlists);

            let formattedRanks = cloudRanks.map((r, i) => ({
                rank: i + 1,
                name: r.name,
                count: r.count,
                avatar: r.avatar || '🐱',
                isMe: currentUser && r.id === currentUser.uid
            }));

            if (currentUser && currentUser.uid && !formattedRanks.some(r => r.isMe) && farewells.length > 0) {
                formattedRanks.push({
                    rank: '-',
                    name: currentUser.displayName || '나',
                    count: farewells.length,
                    avatar: currentUser.photoURL || '🐱',
                    isMe: true
                });
            }
            setRankings(formattedRanks);
        };

        loadRealData();
    }, [currentUser]);

    const reaction = getReaction(farewellItems.length);
    const recentItems = [...farewellItems, ...wishlistItems].slice(0, 6);

    const handleAddMission = () => {
        if (!newMissionTitle.trim()) return;
        addMission(newMissionTitle.trim(), newMissionTarget, newMissionCategory);
        setMissions(getMissions());
        setNewMissionTitle('');
        setNewMissionTarget('3');
        setNewMissionCategory('전체');
        setShowAddMission(false);
        setAddMissionMode(null);
    };

    const handleAiRecommendation = () => {
        const randomMission = AI_MISSIONS[Math.floor(Math.random() * AI_MISSIONS.length)];
        addMission(randomMission.title, randomMission.target.toString(), randomMission.category, 'ai');
        setMissions(getMissions());
        setShowAddMission(false);
        setAddMissionMode(null);
    };

    const handleDeleteMission = (id) => {
        deleteMission(id);
        setMissions(getMissions());
    };

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("로그아웃 실패:", error);
        }
    };

    const needsLogin = !currentUser || currentUser.isAnonymous;

    // 미션 완료/전체 수 계산
    const totalMissions = missions.length;
    const completedMissions = missions.filter(m => getMissionProgress(m, farewellItems) >= m.target).length;

    return (
        <div className="page home-page">
            {/* 상단 앱 제목 및 로그인/로그아웃 버튼 */}
            <div className="home-top-header animate-fade-in">
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                    {!needsLogin && (
                        <button
                            onClick={() => setShowPremiumModal(true)}
                            style={{
                                background: isPro ? 'linear-gradient(135deg, var(--gold, #FFD700), #ffc107)' : 'var(--bg-secondary)',
                                color: isPro ? '#fff' : 'var(--text-secondary)',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                border: isPro ? 'none' : '1px solid var(--border-color)',
                                boxShadow: isPro ? '0 2px 4px rgba(255, 193, 7, 0.3)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            {isPro ? '✨ PRO' : '무료 플랜'}
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h1 className="home-app-title" style={{ margin: 0, lineHeight: 1 }}>ThanQ</h1>
                    <button
                        onClick={() => setShowGuideModal(true)}
                        style={{
                            background: 'none', border: 'none', padding: '4px', marginTop: '2px', cursor: 'pointer',
                            fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <span>💡</span> (사용 방법)
                    </button>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                    {needsLogin ? (
                        <button onClick={handleLogin} className="header-auth-btn login">로그인</button>
                    ) : (
                        <button onClick={handleLogout} className="header-auth-btn logout">로그아웃</button>
                    )}
                </div>
            </div>

            {/* 스미스 인사 (또는 사용자 프로필) */}
            <div className="smith-greeting animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <div className="smith-avatar-home">
                    <img
                        src={needsLogin ? "/smith-avatar.png" : (currentUser?.photoURL || "/smith-avatar.png")}
                        alt={needsLogin ? "스미스" : "사용자"}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                </div>
                <div className="smith-bubble" style={{ paddingRight: '80px', flex: 1 }}>
                    <div className="smith-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: needsLogin ? '2px' : '4px' }}>
                        <span style={{ fontSize: '13px', color: needsLogin ? 'var(--coral)' : 'var(--text-primary)', fontWeight: 'bold' }}>
                            {needsLogin ? '스미스' : (currentUser?.displayName || '사용자님')}
                        </span>
                    </div>

                    {!needsLogin && (
                        <div style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '10px', background: 'rgba(232, 131, 107, 0.1)', color: 'var(--coral)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                🌱 초보 정리러
                            </span>
                        </div>
                    )}
                    <p className="smith-message">{reaction.message}</p>
                </div>

                {/* 우측 보내준 물건 위젯 */}
                <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f4ece2',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '80px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#e8836b', marginBottom: '4px' }}>
                        {farewellItems.length}
                    </span>
                    <span style={{ fontSize: '11px', color: '#7a7065' }}>보내준 물건</span>
                </div>
            </div>

            {/* 1. AI 카메라 버튼을 먼저 배치 */}
            <div className="camera-cta animate-scale-in" style={{ animationDelay: '0.1s', cursor: 'pointer', marginBottom: 'var(--space-md)' }} onClick={() => document.getElementById('home-camera-upload').click()}>
                <input
                    type="file"
                    id="home-camera-upload"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            const file = e.target.files[0];
                            const imageUrl = URL.createObjectURL(file);
                            const mockNames = ['검은색 마우스', '마우스', 'LG 무선 마우스', '마우스', '스마트폰'];
                            const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
                            navigate('/chat', { state: { imageCaptured: true, imageUrl, mockName: randomName } });
                        }
                    }}
                />
                <div className="camera-cta-inner">
                    <span className="camera-cta-icon">📸</span>
                    <div className="camera-cta-text">
                        <p className="camera-cta-title">사진 찍고 스미스와 대화하기</p>
                        <p className="camera-cta-sub">물건을 찍으면 AI가 자동 인식해요</p>
                    </div>
                </div>
                <span className="camera-cta-arrow">→</span>
            </div>

            {/* 나의 미션 – 슬롯/아코디언 형태 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.2s', marginBottom: 'var(--space-md)', position: 'relative', zIndex: 10 }}>
                {/* 미션 요약 (이 부분을 누르면 열림) */}
                <div
                    className="mission-summary-bar card"
                    onClick={() => setIsMissionExpanded(!isMissionExpanded)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 className="section-title" style={{ margin: 0, fontSize: '15px' }}>🎯 나의 미션 현황</h2>
                        <span style={{ fontSize: '13px', color: 'var(--coral)', fontWeight: 'bold' }}>
                            ({completedMissions}/{totalMissions} 완료)
                        </span>
                    </div>
                    <span style={{ transform: isMissionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
                </div>

                {/* 미션 리스트 (펼쳐졌을 때만 보임) */}
                {isMissionExpanded && (
                    <div className="mission-expanded-content" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        padding: '16px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        animation: 'fadeInDown 0.3s ease-out'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button className="add-mission-toggle" onClick={() => { setShowAddMission(!showAddMission); setAddMissionMode(null); }}>
                                {showAddMission ? '취소' : '+ 추가'}
                            </button>
                        </div>

                        {/* 미션 추가 옵션 선택 or 폼 */}
                        {showAddMission && !addMissionMode && (
                            <div className="mission-add-form card animate-scale-in" style={{ display: 'flex', gap: '8px' }}>
                                <button className="mission-add-btn" style={{ flex: 1, padding: '12px 0', fontSize: '13px' }} onClick={() => setAddMissionMode('manual')}>✏️ 직접 설정</button>
                                <button className="mission-add-btn" style={{ flex: 1, backgroundColor: 'var(--soft-blue)', padding: '12px 0', fontSize: '13px' }} onClick={handleAiRecommendation}>🤖 AI 추천받기</button>
                            </div>
                        )}

                        {showAddMission && addMissionMode === 'manual' && (
                            <div className="mission-add-form card animate-scale-in">
                                <input
                                    type="text"
                                    className="mission-add-input"
                                    placeholder="미션 이름 (예: 책 5권 정리하기)"
                                    value={newMissionTitle}
                                    onChange={e => setNewMissionTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddMission()}
                                    autoFocus
                                />
                                <div className="mission-add-row">
                                    <div className="mission-add-field">
                                        <label>목표 개수</label>
                                        <input
                                            type="number"
                                            min="1" max="100"
                                            value={newMissionTarget}
                                            onChange={e => setNewMissionTarget(e.target.value)}
                                            className="mission-add-num"
                                        />
                                    </div>
                                    <div className="mission-add-field">
                                        <label>카테고리</label>
                                        <select value={newMissionCategory} onChange={e => setNewMissionCategory(e.target.value)} className="mission-add-select">
                                            <option value="전체">전체</option>
                                            <option value="의류">의류</option>
                                            <option value="책">책</option>
                                            <option value="전자기기">전자기기</option>
                                            <option value="소품">소품</option>
                                            <option value="추억">추억</option>
                                            <option value="주방용품">주방용품</option>
                                            <option value="기타">기타</option>
                                        </select>
                                    </div>
                                    <button className="mission-add-btn" onClick={handleAddMission} disabled={!newMissionTitle.trim()}>추가</button>
                                </div>
                            </div>
                        )}

                        {/* 미션 리스트 (최대 4개) */}
                        <div className="mission-list card">
                            {missions.slice(0, 4).map(mission => {
                                const progress = getMissionProgress(mission, farewellItems);
                                const percent = Math.round((progress / mission.target) * 100);
                                const done = progress >= mission.target;
                                return (
                                    <div key={mission.id} className={`mission-row ${done ? 'done' : ''}`}>
                                        <div className="mission-row-left">
                                            <span className={`mission-check ${done ? 'checked' : ''}`}>{done ? '✅' : '⬜'}</span>
                                            <div className="mission-row-info">
                                                <span className="mission-row-title">{mission.title}</span>
                                                <span className="mission-row-meta">
                                                    {mission.source === 'ai' ? '🤖 AI추천' : '✏️ 직접설정'} · {mission.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mission-row-right">
                                            <div className="mission-row-progress">
                                                <div className="progress-bar-sm">
                                                    <div className="progress-fill-sm" style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <span className="mission-row-count">{progress}/{mission.target}</span>
                                            </div>
                                            <button className="mission-delete-btn" onClick={() => handleDeleteMission(mission.id)} title="삭제">✕</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {Array.from({ length: Math.max(0, 4 - missions.slice(0, 4).length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="mission-row empty-slot" onClick={() => { setShowAddMission(true); setAddMissionMode(null); }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px 0', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>+</span>
                                        <span>새 미션 추가하기</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>




            {/* 최근 피드 */}
            {recentItems.length > 0 && (
                <section className="section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h2 className="section-title">📋 최근 활동</h2>
                    <div className="feed-scroll">
                        {recentItems.map(item => (
                            <div key={item.id} className="feed-item" onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                                <div className="feed-thumb" style={{ background: item.status === 'farewell' ? 'var(--coral-light)' : 'var(--soft-blue)' }}>
                                    {item.imageData ? (
                                        <img src={item.imageData} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        getCategoryInfo(item.category).icon
                                    )}
                                </div>
                                <p className="feed-name">{item.name}</p>
                                <span className={`feed-badge ${item.status}`}>
                                    {item.status === 'farewell' ? '보냄' : '보류'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 랭킹 보드 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <h2 className="section-title">🏆 이번 주 TOP 정리러</h2>
                <div className="ranking-list card">
                    {rankings.slice(0, 5).map(r => (
                        <div key={r.rank} className={`ranking-row ${r.isMe ? 'is-me' : ''}`}>
                            <span className="rank-num">
                                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : (r.rank === '-' ? '⭐' : `#${r.rank}`)}
                            </span>
                            <span className="rank-avatar"><RankAvatar src={r.avatar} /></span>
                            <span className="rank-name">{r.name}</span>
                            <span className="rank-count">{r.count}개</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* 상세 카드 모달 */}
            {selectedItem && (
                <div className="detail-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="detail-card animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <button className="detail-close" onClick={() => setSelectedItem(null)}>✕</button>

                        {selectedItem.imageData ? (
                            <div className="detail-photo">
                                <img src={selectedItem.imageData} alt={selectedItem.name} />
                            </div>
                        ) : (
                            <div className="detail-photo detail-photo-emoji">
                                <span>{getCategoryInfo(selectedItem.category).icon}</span>
                            </div>
                        )}

                        <div className="detail-info">
                            <h2 className="detail-name">{selectedItem.name}</h2>
                            <div className="detail-meta">
                                <span className="detail-tag">{getCategoryInfo(selectedItem.category).name}</span>
                                <span className="detail-date">{formatDate(selectedItem.createdAt)}</span>
                                <span className={`detail-status ${selectedItem.status}`}>
                                    {selectedItem.status === 'farewell' ? '👋 보내줌' : '📌 보류 중'}
                                </span>
                            </div>

                            {selectedItem.farewellMessage && (
                                <div className="detail-section-box">
                                    <p className="detail-section-label">💌 작별 메시지</p>
                                    <p className="detail-farewell-msg">"{selectedItem.farewellMessage}"</p>
                                </div>
                            )}

                            {selectedItem.chatSummary && (
                                <div className="detail-section-box">
                                    <p className="detail-section-label">🐱 스미스와의 대화</p>
                                    {selectedItem.chatSummary.split(' | ').map((msg, i) => (
                                        <p key={i} className="detail-chat-msg">"{msg}"</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 공통 모달 영역 */}
            <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
            <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
        </div>
    );
}
