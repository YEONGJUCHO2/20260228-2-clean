import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyQuote, getMissions, getMissionProgress, getFarewellItems, getWishlistItems, getRankings, addMission, deleteMission } from '../utils/storage';
import { getSmithReaction as getReaction } from '../utils/smithAI';
import './Home.css';

export default function Home() {
    const navigate = useNavigate();
    const [quote, setQuote] = useState('');
    const [missions, setMissions] = useState([]);
    const [farewellItems, setFarewellItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [showAddMission, setShowAddMission] = useState(false);
    const [newMissionTitle, setNewMissionTitle] = useState('');
    const [newMissionTarget, setNewMissionTarget] = useState('3');
    const [newMissionCategory, setNewMissionCategory] = useState('전체');

    useEffect(() => {
        setQuote(getDailyQuote());
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
    };

    const handleDeleteMission = (id) => {
        deleteMission(id);
        setMissions(getMissions());
    };

    return (
        <div className="page home-page">
            {/* 상단 명언 배너 */}
            <div className="quote-banner animate-fade-in">
                <span className="quote-icon">💬</span>
                <p className="quote-text">{quote}</p>
            </div>

            {/* 스미스 인사 */}
            <div className="smith-greeting animate-fade-in-up">
                <div className="smith-avatar-home">
                    <span className="smith-face">{reaction.emoji}</span>
                    <div className="smith-goggles">🔧</div>
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
                    <button className="add-mission-toggle" onClick={() => setShowAddMission(!showAddMission)}>
                        {showAddMission ? '취소' : '+ 직접 추가'}
                    </button>
                </div>

                {/* 미션 추가 폼 */}
                {showAddMission && (
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

                {/* 미션 리스트 (줄글 형태) */}
                <div className="mission-list card">
                    {missions.map(mission => {
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
                                    {mission.source === 'user' && (
                                        <button className="mission-delete-btn" onClick={() => handleDeleteMission(mission.id)} title="삭제">✕</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {missions.length === 0 && (
                        <p className="mission-empty">미션이 없어요. 위의 '직접 추가' 버튼으로 만들어보세요!</p>
                    )}
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
                            const mockNames = ['검은색 마우스', '노트북 충전기', '두꺼운 전공서적', '사용감 있는 텀블러', '파란색 머그컵', '낡은 지갑'];
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
