import { useState, useEffect, useRef } from 'react';
import { getBadges, getAllBadgeDefs } from '../utils/storage';
import { getItemsCloud, deleteItemCloud, deleteItemsCloud, getStorageInfo, FREE_USER_ITEM_LIMIT } from '../utils/cloudStorage';
import { useAuth } from '../context/AuthContext';
import './Archive.css';

const CATEGORY_NAMES = {
    'electronics': '전자기기', 'clothing': '의류', 'clothes': '의류',
    'books': '책', 'accessories': '소품', 'memories': '추억', 'memory': '추억',
    'kitchen': '주방용품', 'other': '기타',
};

const getCategoryIcon = (cat) => {
    const icons = { clothing: '👕', clothes: '👕', books: '📚', electronics: '📱', accessories: '🧸', memories: '💌', memory: '💌', kitchen: '🍳' };
    return icons[cat] || '📦';
};

const getCustomBadgeIcon = (id, defaultIcon) => {
    if (id === 'first_farewell') return '👣';
    if (id === 'farewell_master') return '✨';
    if (id === 'earth_friend') return '🌱';
    return defaultIcon;
};

const getCatName = (cat) => CATEGORY_NAMES[cat] || cat;

export default function Archive() {
    const { currentUser } = useAuth();
    const [tab, setTab] = useState('archive');
    const [allItems, setAllItems] = useState([]);
    const [badges, setBadges] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [storageInfo, setStorageInfo] = useState({ count: 0, limit: null, tier: 'guest' });
    const [loading, setLoading] = useState(true);
    const longPressTimer = useRef(null);
    const allBadges = getAllBadgeDefs();

    const farewellItems = allItems.filter(i => i.status === 'farewell');
    const wishlistItems = allItems.filter(i => i.status === 'wishlist');

    const refreshItems = async () => {
        setLoading(true);
        try {
            const items = await getItemsCloud(currentUser);
            setAllItems(items);
            setBadges(getBadges());
            const info = await getStorageInfo(currentUser);
            setStorageInfo(info);
        } catch (e) {
            console.error('아이템 로드 실패:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refreshItems(); }, [currentUser]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    };

    const handlePressStart = (item) => {
        longPressTimer.current = setTimeout(() => {
            setSelectMode(true);
            setSelectedIds(new Set([item.id]));
        }, 600);
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const handleItemClick = (item) => {
        if (selectMode) {
            const newSet = new Set(selectedIds);
            if (newSet.has(item.id)) newSet.delete(item.id);
            else newSet.add(item.id);
            setSelectedIds(newSet);
            if (newSet.size === 0) setSelectMode(false);
        } else {
            setSelectedItem(item);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`${selectedIds.size}개 항목을 삭제할까요?`)) {
            await deleteItemsCloud(currentUser, [...selectedIds]);
            await refreshItems();
            setSelectMode(false);
            setSelectedIds(new Set());
        }
    };

    const cancelSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const currentItems = tab === 'archive' ? farewellItems : wishlistItems;

    // 저장 한도 UI
    const StorageBar = () => {
        if (!storageInfo.limit) return null; // Pro 또는 게스트는 미표시
        const pct = Math.min((storageInfo.count / storageInfo.limit) * 100, 100);
        const nearLimit = storageInfo.count >= storageInfo.limit - 2;
        return (
            <div className={`storage-bar-wrap animate-fade-in ${nearLimit ? 'near-limit' : ''}`}>
                <div className="storage-bar-info">
                    <span>☁️ 보관함</span>
                    <span className="storage-bar-count">
                        {storageInfo.count} / {storageInfo.limit}개
                        {nearLimit && <span className="storage-bar-warn"> · Pro로 무제한 이용 🌟</span>}
                    </span>
                </div>
                <div className="storage-bar-track">
                    <div className="storage-bar-fill" style={{ width: `${pct}%`, background: nearLimit ? 'var(--coral)' : 'var(--teal)' }} />
                </div>
            </div>
        );
    };

    return (
        <div className="page archive-page">
            <header className="archive-header animate-fade-in">
                <button className="header-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <h1 className="page-title">나의 기록</h1>
                <button className="header-icon-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>
            </header>

            {/* 저장 한도 바 */}
            <StorageBar />

            {/* 탭 */}
            <div className="archive-tab-bar animate-fade-in">
                <button className={`archive-tab ${tab === 'archive' ? 'active' : ''}`} onClick={() => { setTab('archive'); cancelSelectMode(); }}>
                    보관함
                    {tab === 'archive' && <span className="tab-dot"></span>}
                </button>
                <button className={`archive-tab ${tab === 'wishlist' ? 'active' : ''}`} onClick={() => { setTab('wishlist'); cancelSelectMode(); }}>
                    위시리스트
                    {tab === 'wishlist' && <span className="tab-dot"></span>}
                </button>
            </div>

            {/* 요약 텍스트 */}
            {(tab === 'archive' || tab === 'wishlist') && (
                <div className="archive-summary-text animate-fade-in-up">
                    {tab === 'archive'
                        ? <>지금까지 <strong>{farewellItems.length}개</strong>의 물건과<br /><strong>작별했어요</strong></>
                        : <>현재 <strong>{wishlistItems.length}개</strong>의 물건을<br /><strong>고민하고 있어요</strong></>
                    }
                </div>
            )}

            {/* 다중 선택 모드 바 */}
            {selectMode && (
                <div className="select-mode-bar animate-fade-in">
                    <button className="select-cancel-btn" onClick={cancelSelectMode}>✕ 취소</button>
                    <span className="select-count">{selectedIds.size}개 선택</span>
                    <button className="select-delete-btn" onClick={handleDeleteSelected}>🗑️ 삭제</button>
                </div>
            )}

            {/* 뱃지 가로 목록 */}
            {(tab === 'archive' || tab === 'wishlist') && (
                <div className="badges-row animate-fade-in-up">
                    {allBadges.slice(0, 4).map((badge, idx) => {
                        const earned = badges.includes(badge.id);
                        const colors = ['bg-orange', 'bg-yellow', 'bg-green', 'bg-gray'];
                        const colorClass = earned ? colors[idx % 4] : 'bg-gray';
                        const displayIcon = getCustomBadgeIcon(badge.id, badge.icon);
                        return (
                            <div key={badge.id} className={`badge-mini ${earned ? 'earned' : 'locked'}`}>
                                <span className={`badge-mini-icon ${colorClass}`}>{earned ? displayIcon : '🔒'}</span>
                                <span className="badge-mini-name">{badge.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 포토 그리드 */}
            {(tab === 'archive' || tab === 'wishlist') && (
                <div className="photo-grid animate-fade-in-up">
                    {loading ? (
                        <div className="empty-state">
                            <span className="empty-icon" style={{ animation: 'pulse 1s infinite' }}>☁️</span>
                            <p>불러오는 중...</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">{tab === 'archive' ? '📭' : '💭'}</span>
                            <p>{tab === 'archive' ? '아직 보내준 물건이 없어요' : '보류 중인 물건이 없어요'}</p>
                            <p className="empty-sub">{tab === 'archive' ? '스미스와 대화를 시작해보세요!' : '고민되는 물건은 여기서 관리해요'}</p>
                        </div>
                    ) : (
                        <>
                            {!selectMode && currentItems.length > 0 && (
                                <p className="long-press-hint">💡 꾹 눌러서 다중 선택</p>
                            )}
                            <div className="photo-grid-inner">
                                {currentItems.map((item, i) => (
                                    <div
                                        key={item.id}
                                        className={`photo-card ${selectMode && selectedIds.has(item.id) ? 'selected-card' : ''}`}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                        onClick={() => handleItemClick(item)}
                                        onMouseDown={() => handlePressStart(item)}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={() => handlePressStart(item)}
                                        onTouchEnd={handlePressEnd}
                                    >
                                        {selectMode && (
                                            <div className="select-check-badge">
                                                {selectedIds.has(item.id) ? '✅' : '⬜'}
                                            </div>
                                        )}

                                        <div className="photo-card-img-wrapper">
                                            <div className="photo-card-img">
                                                {item.imageData ? (
                                                    <img src={item.imageData} alt={item.name} />
                                                ) : (
                                                    <div className="photo-card-emoji">
                                                        <span>{getCategoryIcon(item.category)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="photo-card-cat-badge">
                                                {getCategoryIcon(item.category)}
                                            </span>
                                        </div>

                                        <div className="photo-card-info">
                                            <span className="photo-card-date">{formatDate(item.createdAt)}</span>
                                            <p className="photo-card-name">{item.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

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
                                <span>{getCategoryIcon(selectedItem.category)}</span>
                            </div>
                        )}

                        <div className="detail-info">
                            <h2 className="detail-name">{selectedItem.name}</h2>
                            <div className="detail-meta">
                                <span className="detail-tag">{getCatName(selectedItem.category)}</span>
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

                        <button className="detail-delete-btn" onClick={async () => {
                            if (window.confirm('정말 삭제할까요?')) {
                                await deleteItemCloud(currentUser, selectedItem.id);
                                setSelectedItem(null);
                                await refreshItems();
                            }
                        }}>
                            🗑️ 삭제하기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
