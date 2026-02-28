import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMissions, getMissionProgress, getFarewellItems, getWishlistItems, getRankings, addMission, deleteMission } from '../utils/storage';
import { getSmithReaction as getReaction } from '../utils/smithAI';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [missions, setMissions] = useState([]);
    const [farewellItems, setFarewellItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [showAddMission, setShowAddMission] = useState(false);
    const [addMissionMode, setAddMissionMode] = useState(null); // null, 'manual', 'ai'
    const [newMissionTitle, setNewMissionTitle] = useState('');
    const [newMissionTarget, setNewMissionTarget] = useState('3');
    const [newMissionCategory, setNewMissionCategory] = useState('전체');

    useEffect(() => {
        setMissions(getMissions());
        setFarewellItems(getFarewellItems());
        setWishlistItems(getWishlistItems());
        setRankings(getRankings());
    }, []);

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
        const aiMissions = [
            { title: "안 입는 옷 3벌 비우기", category: "의류", target: 3 },
            { title: "유통기한 지난 소스 버리기", category: "주방용품", target: 2 },
            { title: "안 보는 책 1권 기부/판매", category: "책", target: 1 },
            { title: "서랍장 잡동사니 정리하기", category: "기타", target: 5 },
            { title: "1년 안 쓴 전자기기 처분", category: "전자기기", target: 1 }
        ];
        const randomMission = aiMissions[Math.floor(Math.random() * aiMissions.length)];
        addMission(randomMission.title, randomMission.target.toString(), randomMission.category, 'ai');
        setMissions(getMissions());
        setShowAddMission(false);
        setAddMissionMode(null);
    };

    const handleDeleteMission = (id) => {
        deleteMission(id);
        setMissions(getMissions());
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
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'mission', message: '🎯 오늘의 미션을 확인해보세요!', time: '방금 전', read: false },
        { id: 2, type: 'tip', message: '💡 안 쓰는 물건을 정리하면 마음도 가벼워져요', time: '1시간 전', read: false },
        { id: 3, type: 'smith', message: '🐱 스미스가 기다리고 있어요! 대화해볼까요?', time: '3시간 전', read: true },
        { id: 4, type: 'badge', message: '🏆 첫 걸음 뱃지를 획득했어요!', time: '어제', read: true },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="page home-page">
            {/* 상단 앱 제목 및 로그인/로그아웃 버튼 */}
            <div className="home-top-header animate-fade-in">
                <div style={{ flex: 1 }}></div>
                <h1 className="home-app-title">ThanQ</h1>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                    {/* 알림 벨 */}
                    <button className="notif-bell-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        🔔
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                    </button>
                    {needsLogin ? (
                        <button onClick={() => navigate('/login')} className="header-auth-btn login">로그인</button>
                    ) : (
                        <button onClick={handleLogout} className="header-auth-btn logout">로그아웃</button>
                    )}
                </div>
            </div>

            {/* 알림 패널 */}
            {showNotifications && (
                <>
                    <div className="notif-overlay" onClick={() => setShowNotifications(false)}></div>
                    <div className="notif-panel animate-fade-in-up">
                        <div className="notif-panel-header">
                            <h3 className="notif-panel-title">알림</h3>
                            {unreadCount > 0 && (
                                <button className="notif-read-all" onClick={markAllRead}>모두 읽음</button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <p className="notif-empty">알림이 없습니다</p>
                        ) : (
                            <div className="notif-list">
                                {notifications.map(n => (
                                    <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}
                                        onClick={() => {
                                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                                        }}
                                    >
                                        <p className="notif-msg">{n.message}</p>
                                        <span className="notif-time">{n.time}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 스미스 인사 */}
            <div className="smith-greeting animate-fade-in-up">
                <div className="smith-avatar-home">
                    <img src="/smith-avatar.png" alt="스미스" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
                <div className="smith-bubble">
                    <p className="smith-name">스미스</p>
                    <p className="smith-message">{reaction.message}</p>
                    <p className="smith-sub">보내준 물건: <strong>{farewellItems.length}개</strong></p>
                </div>
            </div>

            {/* 나의 미션 – 줄글 리스트 형태 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="section-header">
                    <h2 className="section-title">🎯 나의 미션</h2>
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
                        const progress = getMissionProgress(mission);
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
            </section>


            {/* AI 카메라 버튼 */}
            <div className="camera-cta animate-scale-in" style={{ animationDelay: '0.2s', cursor: 'pointer' }} onClick={() => document.getElementById('home-camera-upload').click()}>
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

            {/* 최근 피드 */}
            {recentItems.length > 0 && (
                <section className="section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <h2 className="section-title">📋 최근 활동</h2>
                    <div className="feed-scroll">
                        {recentItems.map(item => (
                            <div key={item.id} className="feed-item">
                                <div className="feed-thumb" style={{ background: item.status === 'farewell' ? 'var(--coral-light)' : 'var(--soft-blue)' }}>
                                    {item.status === 'farewell' ? '💨' : '📦'}
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
                                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                            </span>
                            <span className="rank-avatar">{r.avatar}</span>
                            <span className="rank-name">{r.name}</span>
                            <span className="rank-count">{r.count}개</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
