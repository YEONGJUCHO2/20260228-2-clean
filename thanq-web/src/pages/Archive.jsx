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
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', onConfirm: null });
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
        setConfirmModal({
            isOpen: true,
            title: `${selectedIds.size}개의 항목을 삭제할까요? 삭제된 항목은 복구할 수 없어요.`,
            onConfirm: async () => {
                await deleteItemsCloud(currentUser, [...selectedIds]);
                await refreshItems();
                setSelectMode(false);
                setSelectedIds(new Set());
                setConfirmModal({ isOpen: false, title: '', onConfirm: null });
            }
        });
    };

    const cancelSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const currentItems = tab === 'archive' ? farewellItems : wishlistItems;

    // 미니 용량 표시 (무료 사용자용)
    const StorageBar = () => {
        if (!storageInfo.limit) return null; // Pro 또는 게스트는 미표시
        const ratio = Math.min((storageInfo.count / storageInfo.limit) * 100, 100);
        return (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
                <div style={{ marginBottom: '6px' }}>용량 [{storageInfo.count} / {storageInfo.limit}]</div>
                <div style={{ width: '80%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', margin: '0 auto', overflow: 'hidden' }}>
                    <div style={{ width: `${ratio}%`, height: '100%', background: 'linear-gradient(90deg, #4CAF50, #81C784)', transition: 'width 0.3s ease' }}></div>
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

            <div className="archive-tab-bar animate-fade-in">
                <button className={`archive-tab ${tab === 'archive' ? 'active' : ''}`} onClick={() => { setTab('archive'); cancelSelectMode(); }}>
                    추억함
                    {tab === 'archive' && <span className="tab-dot"></span>}
                </button>
                <button className={`archive-tab ${tab === 'wishlist' ? 'active' : ''}`} onClick={() => { setTab('wishlist'); cancelSelectMode(); }}>
                    보관함
                    {tab === 'wishlist' && <span className="tab-dot"></span>}
                </button>
            </div>

            {/* 저장 한도 미니 표시 */}
            <StorageBar />

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

                        <button className="detail-delete-btn" onClick={() => {
                            setConfirmModal({
                                isOpen: true,
                                title: '이 항목을 정말 삭제할까요?',
                                onConfirm: async () => {
                                    await deleteItemCloud(currentUser, selectedItem.id);
                                    setSelectedItem(null);
                                    await refreshItems();
                                    setConfirmModal({ isOpen: false, title: '', onConfirm: null });
                                }
                            });
                        }}>
                            🗑️ 삭제하기
                        </button>
                    </div>
                </div>
            )}

            {/* 커스텀 확인 모달 */}
            {confirmModal.isOpen && (
                <div className="detail-overlay" style={{ zIndex: 1000 }} onClick={() => setConfirmModal({ isOpen: false, title: '', onConfirm: null })}>
                    <div className="detail-card animate-fade-in-up" onClick={(e) => e.stopPropagation()} style={{ padding: '30px 20px', textAlign: 'center', width: '80%', maxWidth: '320px', minHeight: 'auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '25px', color: 'var(--text-primary)', wordBreak: 'keep-all', lineHeight: '1.4' }}>
                            {confirmModal.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, title: '', onConfirm: null })}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '16px', fontWeight: 'bold' }}>
                                취소
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--coral)', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
