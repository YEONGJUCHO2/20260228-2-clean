import { useState, useEffect } from 'react';
import { getFarewellItems, getWishlistItems, getBadges, getAllBadgeDefs } from '../utils/storage';
import './Archive.css';

export default function Archive() {
    const [tab, setTab] = useState('archive');
    const [farewellItems, setFarewellItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState([]);
    const [badges, setBadges] = useState([]);
    const allBadges = getAllBadgeDefs();

    useEffect(() => {
        setFarewellItems(getFarewellItems());
        setWishlistItems(getWishlistItems());
        setBadges(getBadges());
    }, []);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    return (
        <div className="page archive-page">
            <h1 className="page-title animate-fade-in">📦 보관함</h1>

            {/* 탭 */}
            <div className="tab-bar animate-fade-in">
                <button className={`tab-btn ${tab === 'archive' ? 'active' : ''}`} onClick={() => setTab('archive')}>
                    추억 보관함 <span className="tab-count">{farewellItems.length}</span>
                </button>
                <button className={`tab-btn ${tab === 'wishlist' ? 'active' : ''}`} onClick={() => setTab('wishlist')}>
                    위시리스트 <span className="tab-count">{wishlistItems.length}</span>
                </button>
                <button className={`tab-btn ${tab === 'badges' ? 'active' : ''}`} onClick={() => setTab('badges')}>
                    뱃지
                </button>
            </div>

            {/* 추억 보관함 */}
            {tab === 'archive' && (
                <div className="archive-list animate-fade-in-up">
                    {farewellItems.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>아직 보내준 물건이 없어요</p>
                            <p className="empty-sub">스미스와 대화를 시작해보세요!</p>
                        </div>
                    ) : (
                        farewellItems.map((item, i) => (
                            <div key={item.id} className="archive-card card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="archive-thumb">
                                    {item.category === 'clothing' ? '👕' :
                                        item.category === 'books' ? '📚' :
                                            item.category === 'electronics' ? '📱' :
                                                item.category === 'accessories' ? '🧸' :
                                                    item.category === 'memories' ? '💌' :
                                                        item.category === 'kitchen' ? '🍳' : '📦'}
                                </div>
                                <div className="archive-info">
                                    <p className="archive-name">{item.name}</p>
                                    <p className="archive-date">{formatDate(item.createdAt)}</p>
                                    {item.farewellMessage && (
                                        <p className="archive-farewell">"{item.farewellMessage}"</p>
                                    )}
                                </div>
                                <span className="archive-theme">✨</span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 위시리스트 */}
            {tab === 'wishlist' && (
                <div className="archive-list animate-fade-in-up">
                    {wishlistItems.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">💭</span>
                            <p>보류 중인 물건이 없어요</p>
                            <p className="empty-sub">고민되는 물건은 여기서 관리해요</p>
                        </div>
                    ) : (
                        wishlistItems.map((item, i) => (
                            <div key={item.id} className="archive-card card wishlist-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="archive-thumb wishlist-thumb">
                                    {item.category === 'clothing' ? '👕' :
                                        item.category === 'books' ? '📚' : '📦'}
                                </div>
                                <div className="archive-info">
                                    <p className="archive-name">{item.name}</p>
                                    <p className="archive-date">{formatDate(item.createdAt)}</p>
                                    <p className="wishlist-hint">🐱 스미스가 나중에 다시 물어볼 거예요</p>
                                </div>
                                <span className="wishlist-icon">📌</span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 뱃지 */}
            {tab === 'badges' && (
                <div className="badges-grid animate-fade-in-up">
                    {allBadges.map(badge => {
                        const earned = badges.includes(badge.id);
                        return (
                            <div key={badge.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                                <span className="badge-icon">{earned ? badge.icon : '🔒'}</span>
                                <p className="badge-name">{badge.name}</p>
                                {earned && <span className="badge-check">✅</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
