import { useState, useEffect } from 'react';
import { getStats, getRankings, getMissions, getMissionProgress, getUnlockedThemes, getAllThemes } from '../utils/storage';
import { getSmithReaction } from '../utils/smithAI';
import './Stats.css';

export default function Stats() {
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, categories: {}, wishlistCount: 0 });
    const [rankings, setRankings] = useState([]);
    const [missions, setMissions] = useState([]);
    const [themes, setThemes] = useState([]);
    const allThemes = getAllThemes();

    useEffect(() => {
        setStats(getStats());
        setRankings(getRankings());
        setMissions(getMissions());
        setThemes(getUnlockedThemes().map(t => t.id));
    }, []);

    const reaction = getSmithReaction(stats.total);
    const categoryColors = {
        '의류': '#E8836B', '책': '#7BA7CC', '전자기기': '#5ABAB7',
        '소품': '#D4A853', '추억': '#C084FC', '주방용품': '#F59E0B', '기타': '#A09890'
    };

    const totalCat = Object.values(stats.categories).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="page stats-page">
            <h1 className="page-title animate-fade-in">📊 나의 정리 리포트</h1>

            {/* 요약 카드 */}
            <div className="stats-summary animate-fade-in-up">
                <div className="stat-box main">
                    <span className="stat-num">{stats.total}</span>
                    <span className="stat-label">총 보내준 물건</span>
                </div>
                <div className="stat-box">
                    <span className="stat-num">{stats.thisMonth}</span>
                    <span className="stat-label">이번 달</span>
                </div>
                <div className="stat-box">
                    <span className="stat-num">{stats.wishlistCount}</span>
                    <span className="stat-label">보류 중</span>
                </div>
            </div>

            {/* 스미스 리액션 */}
            <div className="smith-reaction card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="reaction-face">{reaction.emoji}</span>
                <div>
                    <p className="reaction-msg">{reaction.message}</p>
                    <p className="reaction-sub">스미스의 한마디</p>
                </div>
            </div>

            {/* 카테고리 분석 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="section-title">📈 카테고리별 분석</h2>
                <div className="card category-chart">
                    {Object.entries(stats.categories).length === 0 ? (
                        <p className="no-data">아직 데이터가 없어요. 물건을 보내주면 여기에 분석이 나와요!</p>
                    ) : (
                        <>
                            <div className="pie-visual">
                                {Object.entries(stats.categories).map(([cat, count], i) => {
                                    const percent = Math.round((count / totalCat) * 100);
                                    return (
                                        <div key={cat} className="pie-bar-row">
                                            <span className="pie-label">{cat}</span>
                                            <div className="pie-bar-track">
                                                <div
                                                    className="pie-bar-fill"
                                                    style={{
                                                        width: `${percent}%`,
                                                        background: categoryColors[cat] || '#A09890',
                                                        animationDelay: `${i * 0.1}s`
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="pie-percent">{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="chart-summary">
                                이번 달 {stats.thisMonth}개 보내줬어요!
                                {Object.entries(stats.categories).length > 0 &&
                                    ` ${Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0][0]}이(가) 가장 많아요.`
                                }
                            </p>
                        </>
                    )}
                </div>
            </section>

            {/* 미션 진행 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="section-title">🎯 미션 진행 현황</h2>
                {missions.map(mission => {
                    const progress = getMissionProgress(mission);
                    const percent = Math.round((progress / mission.target) * 100);
                    const done = progress >= mission.target;
                    return (
                        <div key={mission.id} className={`mission-stat-card card ${done ? 'done' : ''}`}>
                            <div className="mission-stat-header">
                                <span>{mission.icon} {mission.title}</span>
                                {done && <span className="mission-complete">✅ 완료!</span>}
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                            </div>
                            <p className="progress-text">{progress}/{mission.target}</p>
                        </div>
                    );
                })}
            </section>

            {/* 작별 애니메이션 테마 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <h2 className="section-title">🎨 작별 테마 컬렉션</h2>
                <div className="themes-grid">
                    {allThemes.map(theme => {
                        const unlocked = themes.includes(theme.id);
                        return (
                            <div key={theme.id} className={`theme-card ${unlocked ? 'unlocked' : 'locked'} ${theme.premium ? 'premium' : ''}`}>
                                <span className="theme-icon">{unlocked || theme.premium ? theme.icon : '🔒'}</span>
                                <span className="theme-name">{theme.name}</span>
                                {theme.premium && <span className="premium-tag">PRO</span>}
                                {!theme.premium && !unlocked && (
                                    <span className="theme-req">{theme.minCount}개 필요</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 주간 랭킹 */}
            <section className="section animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <h2 className="section-title">🏆 이번 주 랭킹</h2>
                <div className="card ranking-section">
                    {rankings.map(r => (
                        <div key={r.rank} className={`ranking-row ${r.isMe ? 'is-me' : ''}`}>
                            <span className="rank-medal">
                                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                            </span>
                            <span className="rank-avatar">{r.avatar}</span>
                            <span className="rank-name">{r.name}</span>
                            <span className="rank-score">{r.count}개</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
