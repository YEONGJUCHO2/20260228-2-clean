import { useState, useEffect } from 'react';
import { getMissions, getMissionProgress, getUnlockedThemes, getAllThemes } from '../utils/storage';
import { getSmithReaction, generateWeeklyReport } from '../utils/smithAI';
import { getItemsCloud, getRankingsCloud } from '../utils/cloudStorage';
import { useAuth } from '../context/AuthContext';
import './Stats.css';

export default function Stats() {
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, categories: {}, wishlistCount: 0 });
    const [rankings, setRankings] = useState([]);
    const [missions, setMissions] = useState([]);
    const [themes, setThemes] = useState([]);
    const [farewellItems, setFarewellItems] = useState([]);
    const [weeklyReport, setWeeklyReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const allThemes = getAllThemes();
    const { currentUser } = useAuth();

    useEffect(() => {
        const loadRealData = async () => {
            // 미션과 테마 불러오기 (로컬 기반)
            setMissions(getMissions());
            setThemes(getUnlockedThemes().map(t => t.id));

            // 클라우드 아이템 기반으로 실제 통계 계산
            const items = await getItemsCloud(currentUser);
            const farewells = items.filter(i => i.status === 'farewell' || !i.status); // 기존 데이터 하위호환
            const wishlists = items.filter(i => i.status === 'wishlist');

            const categories = {};
            farewells.forEach(item => {
                const cat = item.category || '기타';
                categories[cat] = (categories[cat] || 0) + 1;
            });

            const thisMonth = farewells.filter(i => {
                const d = new Date(i.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length;

            setStats({
                total: farewells.length,
                thisMonth,
                categories,
                wishlistCount: wishlists.length
            });
            setFarewellItems(farewells);

            // 진짜 랭킹 불러오기
            const cloudRanks = await getRankingsCloud();
            let formattedRanks = cloudRanks.map((r, i) => ({
                rank: i + 1,
                name: r.name,
                count: r.count,
                avatar: r.avatar === '🐱' ? '🐱' : <img src={r.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />,
                isMe: currentUser && r.id === currentUser.uid
            }));

            // 내가 랭킹에 없을 경우 맨 밑에 추가 (현재 임시 로직)
            if (currentUser && currentUser.uid && !formattedRanks.some(r => r.isMe) && farewells.length > 0) {
                formattedRanks.push({
                    rank: '-',
                    name: currentUser.displayName || '나',
                    count: farewells.length,
                    avatar: currentUser.photoURL ? <img src={currentUser.photoURL} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} /> : '🐱',
                    isMe: true
                });
            }

            // 만약 랭킹 데이터가 비어있다면 목업 대신 안내메시지용 더미 리스트 또는 빈 리스트 유지
            setRankings(formattedRanks);
        };

        loadRealData();

        // 주간 리포트 생성 (가짜 통계 말고 진짜 데이터 기반)
        const loadReport = async () => {
            setReportLoading(true);
            try {
                const items = await getItemsCloud(currentUser);
                const report = await generateWeeklyReport(items);
                setWeeklyReport(report);
            } catch (e) {
                console.warn('Weekly report failed:', e);
            } finally {
                setReportLoading(false);
            }
        };
        loadReport();
    }, [currentUser]);

    const reaction = getSmithReaction(stats.total);

    const categoryNames = {
        'electronics': '전자기기', 'clothing': '의류', 'clothes': '의류',
        'books': '책', 'accessories': '소품', 'memories': '추억', 'memory': '추억',
        'kitchen': '주방용품', 'other': '기타',
        '의류': '의류', '책': '책', '전자기기': '전자기기',
        '소품': '소품', '추억': '추억', '주방용품': '주방용품', '기타': '기타',
    };

    const getCategoryIcon = (cat) => {
        const icons = {
            'clothing': '👕', 'clothes': '👕', '의류': '👕',
            'books': '📚', '책': '📚',
            'electronics': '📱', '전자기기': '📱',
            'accessories': '🧸', '소품': '🧸',
            'memories': '💌', 'memory': '💌', '추억': '💌',
            'kitchen': '🍳', '주방용품': '🍳',
            'other': '📦', '기타': '📦'
        };
        // 영문 이름 혹은 한글 이름 모두 대응
        return icons[cat] || '📦';
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
                    {rankings.length > 0 ? rankings.map(r => (
                        <div key={r.rank === '-' ? 'me' : r.rank} className={`rank-row ${r.isMe ? 'rank-me' : ''}`}>
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
                    )) : (
                        <p className="no-data-text" style={{ padding: '20px', textAlign: 'center' }}>
                            아직 랭킹 데이터가 없어요.<br />제일 먼저 정리를 시작해볼까요?
                        </p>
                    )}
                </div>
            </section>

            {/* 미션 진행 */}
            <section className="stats-section animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <h2 className="stats-section-title">🎯 미션 현황</h2>
                {missions.map(mission => {
                    const progress = getMissionProgress(mission, farewellItems);
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

            {/* 구글 애드센스 (이번 주 TOP 랭커 하단) */}
            <div style={{ margin: '32px 0', textAlign: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ins className="adsbygoogle"
                    style={{ display: 'block', width: '100%' }}
                    data-ad-client="ca-pub-6124782194336305"
                    data-ad-slot="auto"
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>
            </div>

            {/* 주간 스미스 리포트 */}
            <section className="stats-section animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="stats-section-title">📊 이번 주 스미스 리포트</h2>
                <div className="weekly-report-card card">
                    {reportLoading ? (
                        <div className="report-loading">
                            <div className="report-loading-dot"></div>
                            <p>스미스가 이번 주를 분석하고 있어...</p>
                        </div>
                    ) : weeklyReport ? (
                        <>
                            <div className="report-week-label">
                                {weeklyReport.weekStart} 주
                            </div>
                            <div className="report-stats-row">
                                <div className="report-stat-box">
                                    <span className="report-stat-emoji">{weeklyReport.emoji}</span>
                                    <span className="report-stat-num">{weeklyReport.totalSent}</span>
                                    <span className="report-stat-label">작별한 물건</span>
                                </div>
                                <div className="report-stat-box">
                                    <span className="report-stat-emoji">📦</span>
                                    <span className="report-stat-num">{weeklyReport.wishlistCount}</span>
                                    <span className="report-stat-label">추억함</span>
                                </div>
                                {weeklyReport.topCategory && (
                                    <div className="report-stat-box">
                                        <span className="report-stat-emoji">{getCategoryIcon(weeklyReport.topCategory)}</span>
                                        <span className="report-stat-num" style={{ fontSize: '14px' }}>{getCatName(weeklyReport.topCategory) || '기타'}</span>
                                        <span className="report-stat-label">많이 정리</span>
                                    </div>
                                )}
                            </div>
                            <div className="report-ai-comment">
                                <span className="report-smith-avatar">🐱</span>
                                <p>{weeklyReport.aiComment}</p>
                            </div>
                        </>
                    ) : (
                        <p className="report-empty">데이터를 불러오는 중이에요...</p>
                    )}
                </div>
            </section>


        </div>
    );
}
