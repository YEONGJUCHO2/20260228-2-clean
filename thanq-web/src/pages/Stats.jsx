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

    const categoryNames = {
        'electronics': '전자기기', 'clothing': '의류', 'clothes': '의류',
        'books': '책', 'accessories': '소품', 'memories': '추억', 'memory': '추억',
        'kitchen': '주방용품', 'other': '기타',
        '의류': '의류', '책': '책', '전자기기': '전자기기',
        '소품': '소품', '추억': '추억', '주방용품': '주방용품', '기타': '기타',
    };
    const categoryColors = {
        '의류': '#E8836B', '책': '#7BA7CC', '전자기기': '#5ABAB7',
        '소품': '#D4A853', '추억': '#C084FC', '주방용품': '#F59E0B', '기타': '#A09890',
        'electronics': '#5ABAB7', 'clothing': '#E8836B', 'clothes': '#E8836B',
        'books': '#7BA7CC', 'accessories': '#D4A853', 'memories': '#C084FC', 'memory': '#C084FC',
        'kitchen': '#F59E0B', 'other': '#A09890',
    };
    const getCatName = (cat) => categoryNames[cat] || cat;
    const totalCat = Object.values(stats.categories).reduce((a, b) => a + b, 0) || 1;
    const catEntries = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);

    // 도넛 차트 계산
    const donutSegments = (() => {
        let offset = 0;
        return catEntries.map(([cat, count]) => {
            const percent = (count / totalCat) * 100;
            const segment = { cat, count, percent, offset, color: categoryColors[cat] || '#A09890' };
            offset += percent;
            return segment;
        });
    })();

    return (
        <div className="page stats-page-new">
            <h1 className="stats-title animate-fade-in">나의 정리 통계</h1>

            {/* 도넛 차트 카드 */}
            <div className="stats-donut-card card animate-fade-in-up">
                <div className="donut-container">
                    <svg viewBox="0 0 120 120" className="donut-svg">
                        {catEntries.length > 0 ? (
                            donutSegments.map((seg, i) => {
                                const circumference = 2 * Math.PI * 48;
                                const dashLength = (seg.percent / 100) * circumference;
                                const dashOffset = -(seg.offset / 100) * circumference;
                                return (
                                    <circle
                                        key={seg.cat}
                                        cx="60" cy="60" r="48"
                                        fill="none"
                                        stroke={seg.color}
                                        strokeWidth="14"
                                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                                        strokeDashoffset={dashOffset}
                                        style={{ transition: 'all 0.8s ease', animationDelay: `${i * 0.1}s` }}
                                    />
                                );
                            })
                        ) : (
                            <circle cx="60" cy="60" r="48" fill="none" stroke="#eee" strokeWidth="14" />
                        )}
                    </svg>
                    <div className="donut-center">
                        <span className="donut-number">{stats.total}</span>
                        <span className="donut-label">ITEMS OUT</span>
                    </div>
                </div>

                {/* 카테고리 범례 */}
                <div className="donut-legend">
                    {catEntries.length > 0 ? catEntries.map(([cat, count]) => (
                        <div key={cat} className="legend-item">
                            <span className="legend-dot" style={{ background: categoryColors[cat] || '#A09890' }}></span>
                            <span className="legend-name">{getCatName(cat)}</span>
                            <span className="legend-percent">{Math.round((count / totalCat) * 100)}%</span>
                        </div>
                    )) : (
                        <p className="no-data-text">물건을 보내주면 여기에 분석이 나타나요!</p>
                    )}
                </div>
            </div>

            {/* 이번 주 TOP 랭커 */}
            <section className="stats-section animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <h2 className="stats-section-title">이번 주 TOP 랭커</h2>
                <div className="ranking-card card">
                    {rankings.map(r => (
                        <div key={r.rank} className={`rank-row ${r.isMe ? 'rank-me' : ''}`}>
                            <span className="rank-num">
                                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                            </span>
                            <span className="rank-avatar">{r.avatar}</span>
                            <div className="rank-info">
                                <span className="rank-name">{r.name}</span>
                                {r.isMe && <span className="rank-me-badge">⭐</span>}
                            </div>
                            <div className="rank-score-box">
                                <span className="rank-score-num">{r.count}</span>
                                <span className="rank-score-unit">pts</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 미션 진행 */}
            <section className="stats-section animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <h2 className="stats-section-title">🎯 미션 현황</h2>
                {missions.map(mission => {
                    const progress = getMissionProgress(mission);
                    const percent = Math.min(Math.round((progress / mission.target) * 100), 100);
                    const done = progress >= mission.target;
                    return (
                        <div key={mission.id} className={`mission-row card ${done ? 'mission-done' : ''}`}>
                            <div className="mission-row-header">
                                <span>{mission.title}</span>
                                {done && <span className="mission-complete-tag">✅ 완료!</span>}
                            </div>
                            <div className="mission-progress-bar">
                                <div className="mission-progress-fill" style={{ width: `${percent}%` }}></div>
                            </div>
                            <p className="mission-progress-text">{progress}/{mission.target}</p>
                        </div>
                    );
                })}
            </section>

            {/* ThanQ Pro 배너 */}
            <div className="pro-banner animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
                <span className="pro-badge">PRO ACCESS</span>
                <h3 className="pro-title">ThanQ Pro</h3>
                <ul className="pro-features">
                    <li>✅ 무제한 AI 상담 채팅</li>
                    <li>✅ 프리미엄 작별 테마</li>
                    <li>✅ 광고 없는 순수한 경험</li>
                </ul>
                <button className="pro-subscribe-btn">Subscribe for $4.99/mo</button>
                <p className="pro-note">Cancel anytime. Terms & Privacy apply.</p>
            </div>
        </div>
    );
}
