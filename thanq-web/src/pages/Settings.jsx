import { useState, useRef, useEffect } from 'react';
import { getStats, getSettings, updateSettings, exportAllData, importData, resetAllData } from '../utils/storage';
import { useAuth } from '../context/AuthContext';
import { logoutUser, db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import './Settings.css';

export default function Settings() {
    const [isPro, setIsPro] = useState(() => JSON.parse(localStorage.getItem('thanq_settings') || '{}').isPro || false);
    const [planType, setPlanType] = useState('monthly'); // 'monthly' | 'annual'
    const [settings, setSettings] = useState(getSettings());
    const [toast, setToast] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [paypalLoaded, setPaypalLoaded] = useState(false);
    const [paypalError, setPaypalError] = useState(false);
    const fileInputRef = useRef(null);
    const paypalBtnRef = useRef(null);
    const stats = getStats();
    const { currentUser } = useAuth();

    // PayPal Live 설정
    const PAYPAL_CLIENT_ID = 'AeehIL4XSLMOMO9da5Plo-Y7CfwJTdzvuvbrYJc01GvtM_kZEGPcxPJ5HQ2BXFv-qf-s9rWPvELRE6SH';
    const PLAN_IDS = {
        monthly: 'P-5X789781L2920905ANGSB3YY',
        annual: 'P-2PJ08834P8666533GNGSB3YY',
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    // PayPal SDK 로드 + 버튼 렌더
    useEffect(() => {
        if (isPro) return;
        let rendered = false;

        const loadAndRender = () => {
            if (!window.paypal || rendered) return;
            rendered = true;
            if (paypalBtnRef.current) paypalBtnRef.current.innerHTML = '';

            try {
                window.paypal.Buttons({
                    style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'subscribe' },
                    createSubscription: (data, actions) => {
                        return actions.subscription.create({ plan_id: PLAN_IDS[planType] });
                    },
                    onApprove: async (data) => {
                        const subId = data.subscriptionID;
                        // localStorage 저장
                        const s = JSON.parse(localStorage.getItem('thanq_settings') || '{}');
                        s.isPro = true;
                        s.planType = planType;
                        s.subscriptionId = subId;
                        localStorage.setItem('thanq_settings', JSON.stringify(s));
                        // Firestore 저장 (로그인 유저만)
                        if (currentUser && !currentUser.isAnonymous) {
                            try {
                                await setDoc(doc(db, 'users', currentUser.uid, 'subscription', 'info'), {
                                    isPro: true,
                                    planType,
                                    subscriptionId: subId,
                                    activatedAt: new Date().toISOString(),
                                });
                            } catch (e) { console.warn('Firestore 구독 저장 실패', e); }
                        }
                        setIsPro(true);
                        showToast('🎉 ThanQ Pro 구독 완료! 환영해요!');
                    },
                    onError: (err) => {
                        console.error('PayPal Error:', err);
                        showToast('❌ 결제 중 오류가 발생했어요. 다시 시도해주세요.');
                    },
                }).render(paypalBtnRef.current);
                setPaypalLoaded(true);
            } catch (e) {
                console.warn('PayPal render error:', e);
                setPaypalError(true);
            }
        };

        // SDK 이미 로드됐으면 바로 렌더
        if (window.paypal) {
            loadAndRender();
            return;
        }

        // SDK 동적 로드
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
        script.async = true;
        script.onload = loadAndRender;
        script.onerror = () => setPaypalError(true);
        document.head.appendChild(script);

        return () => { rendered = true; }; // 클린업
    }, [isPro, planType]);

    // 다크모드 토글
    const toggleDarkMode = () => {
        const next = updateSettings({ darkMode: !settings.darkMode });
        setSettings(next);
        showToast(next.darkMode ? '🌙 다크 모드 활성화' : '☀️ 라이트 모드 활성화');
    };

    // 언어 변경
    const cycleLanguage = () => {
        const langs = ['ko', 'en', 'ja'];
        const labels = { ko: '한국어', en: 'English', ja: '日本語' };
        const idx = langs.indexOf(settings.language);
        const nextLang = langs[(idx + 1) % langs.length];
        const next = updateSettings({ language: nextLang });
        setSettings(next);
        showToast(`🌍 언어: ${labels[nextLang]}`);
    };



    // 데이터 백업 (JSON 다운로드)
    const handleBackup = () => {
        exportAllData();
        showToast('☁️ 백업 파일이 다운로드되었습니다');
    };

    // 데이터 내보내기 (CSV-style)
    const handleExportCSV = () => {
        const items = JSON.parse(localStorage.getItem('thanq_items') || '[]');
        if (items.length === 0) {
            showToast('📤 내보낼 데이터가 없습니다');
            return;
        }
        let csv = '이름,카테고리,상태,날짜\n';
        items.forEach(i => {
            csv += `${i.name},${i.category},${i.status === 'farewell' ? '보냄' : '보류'},${i.createdAt?.slice(0, 10) || ''}\n`;
        });
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thanq_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📤 CSV 파일이 다운로드되었습니다');
    };

    // 데이터 복원
    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const ok = importData(ev.target.result);
            showToast(ok ? '✅ 데이터가 복원되었습니다. 새로고침합니다...' : '❌ 파일 형식이 올바르지 않습니다');
            if (ok) setTimeout(() => window.location.reload(), 1500);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // 전체 초기화
    const handleReset = () => {
        resetAllData();
        showToast('🗑️ 모든 데이터가 초기화되었습니다. 새로고침합니다...');
        setShowResetConfirm(false);
        setTimeout(() => window.location.reload(), 1500);
    };

    const handleLogout = async () => {
        const result = await logoutUser();
        if (!result.success) {
            showToast('로그아웃에 실패했습니다.');
        }
    };

    const langLabel = { ko: '한국어', en: 'English', ja: '日本語' }[settings.language] || '한국어';

    return (
        <div className="page settings-page">
            <h1 className="page-title animate-fade-in">⚙️ 설정</h1>

            {/* 토스트 */}
            {toast && <div className="settings-toast animate-scale-in">{toast}</div>}

            {/* 프로필 */}
            <div className="profile-card card animate-fade-in-up">
                <div className="profile-avatar">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="profile" className="profile-img" />
                    ) : (
                        <img src="/smith-avatar.png" alt="Smith" className="profile-img" />
                    )}
                </div>
                <div className="profile-info">
                    <p className="profile-name">{currentUser?.displayName || 'ThanQ 사용자'}</p>
                    <p className="profile-plan" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentUser?.email}</p>
                    <p className="profile-plan">{isPro ? '🌟 ThanQ Pro 멤버' : '무료 플랜'}</p>
                </div>
                <div className="profile-stat">
                    <span className="profile-count">{stats.total}</span>
                    <span className="profile-label">보내준 물건</span>
                </div>
            </div>

            {/* ThanQ Pro 구독 */}
            {!isPro && (
                <div className="pro-card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="pro-header">
                        <h2 className="pro-title">✨ ThanQ Pro</h2>
                        <p className="pro-subtitle">정리의 모든 것을 프리미엄으로</p>
                    </div>

                    {/* 플랜 선택 토글 */}
                    <div className="plan-toggle">
                        <button
                            className={`plan-btn ${planType === 'monthly' ? 'active' : ''}`}
                            onClick={() => setPlanType('monthly')}
                        >
                            월간
                        </button>
                        <button
                            className={`plan-btn ${planType === 'annual' ? 'active' : ''}`}
                            onClick={() => setPlanType('annual')}
                        >
                            연간 <span className="plan-save-badge">30% 절약</span>
                        </button>
                    </div>

                    <div className="pro-features">
                        <div className="pro-feature">
                            <span className="pro-icon">☁️</span>
                            <div>
                                <p className="feature-title">무제한 클라우드 저장</p>
                                <p className="feature-desc">어느 기기에서든 동기화 (무료: 10개 한도)</p>
                            </div>
                        </div>
                        <div className="pro-feature">
                            <span className="pro-icon">💬</span>
                            <div>
                                <p className="feature-title">무제한 AI 분석</p>
                                <p className="feature-desc">스미스와 횟수 제한 없이 (무료: 하루 10회)</p>
                            </div>
                        </div>
                        <div className="pro-feature">
                            <span className="pro-icon">🎨</span>
                            <div>
                                <p className="feature-title">프리미엄 작별 테마</p>
                                <p className="feature-desc">🔥 불꽃놀이, 🦋 나비, 🌌 오로라</p>
                            </div>
                        </div>

                    </div>

                    <div className="pro-pricing">
                        <div className="price-tag">
                            {planType === 'monthly' ? (
                                <>
                                    <span className="price-amount">$2.99</span>
                                    <span className="price-period">/월</span>
                                </>
                            ) : (
                                <>
                                    <span className="price-amount">$24.99</span>
                                    <span className="price-period">/년</span>
                                    <span className="price-monthly-eq"> ($2.08/월)</span>
                                </>
                            )}
                        </div>

                        {/* PayPal 결제 버튼 */}
                        <div className="paypal-btn-wrapper">
                            <div ref={paypalBtnRef} id="paypal-subscription-btn"></div>
                            {!paypalLoaded && !paypalError && (
                                <div className="paypal-loading">
                                    <div className="paypal-loading-spinner"></div>
                                    <span>결제 버튼 불러오는 중...</span>
                                </div>
                            )}
                            {paypalError && (
                                <button className="pro-subscribe-btn" onClick={() => showToast('⚠️ 네트워크 오류. 인터넷 연결을 확인해주세요.')}>
                                    {planType === 'monthly' ? '월간 Pro 시작하기' : '연간 Pro 시작하기'}
                                </button>
                            )}
                        </div>
                        <p className="pro-trial">7일 무료 체험 · 언제든 취소 가능</p>
                    </div>
                </div>
            )}

            {isPro && (
                <div className="pro-active-card card animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <span className="pro-active-icon">🌟</span>
                    <p className="pro-active-title">ThanQ Pro 활성화됨</p>
                    <p className="pro-active-sub">모든 프리미엄 기능을 사용할 수 있어요!</p>
                </div>
            )}

            {/* 일반 설정 */}
            <div className="settings-menu animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="menu-group">
                    <h3 className="menu-title">일반</h3>

                    {/* 다크모드 토글 */}
                    <button className="menu-item" onClick={toggleDarkMode}>
                        <span>{settings.darkMode ? '☀️' : '🌙'}</span>
                        <span className="menu-item-label">{settings.darkMode ? '라이트 모드' : '다크 모드'}</span>
                        <div className={`toggle-switch ${settings.darkMode ? 'on' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </button>

                    {/* 언어 설정 */}
                    <button className="menu-item" onClick={cycleLanguage}>
                        <span>🌍</span>
                        <span className="menu-item-label">언어 설정</span>
                        <span className="menu-value">{langLabel}</span>
                    </button>
                </div>



                {/* 데이터 관리 */}
                <div className="menu-group">
                    <h3 className="menu-title">데이터</h3>

                    <button className="menu-item" onClick={handleBackup}>
                        <span>☁️</span>
                        <span className="menu-item-label">데이터 백업 (JSON)</span>
                        <span className="menu-arrow">↓</span>
                    </button>

                    <button className="menu-item" onClick={handleExportCSV}>
                        <span>📤</span>
                        <span className="menu-item-label">데이터 내보내기 (CSV)</span>
                        <span className="menu-arrow">↓</span>
                    </button>

                    <button className="menu-item" onClick={() => fileInputRef.current?.click()}>
                        <span>📥</span>
                        <span className="menu-item-label">백업에서 복원</span>
                        <span className="menu-arrow">↑</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleRestore}
                    />

                    <button className="menu-item danger" onClick={() => setShowResetConfirm(true)}>
                        <span>🗑️</span>
                        <span className="menu-item-label">전체 데이터 초기화</span>
                        <span className="menu-arrow">⚠️</span>
                    </button>
                </div>

                {/* 지원 */}
                <div className="menu-group">
                    <h3 className="menu-title">지원</h3>

                    <button className="menu-item" onClick={() => setShowHelp(!showHelp)}>
                        <span>❓</span>
                        <span className="menu-item-label">도움말</span>
                        <span className="menu-arrow">{showHelp ? '▼' : '›'}</span>
                    </button>

                    {showHelp && (
                        <div className="help-panel animate-scale-in">
                            <div className="help-item">
                                <strong>📸 물건 촬영</strong>
                                <p>홈에서 카메라 버튼을 눌러 물건 이름을 입력하고 스미스와 대화하세요.</p>
                            </div>
                            <div className="help-item">
                                <strong>🎯 미션</strong>
                                <p>AI 추천 미션 또는 직접 미션을 설정하세요. 홈에서 '직접 추가' 버튼을 누르면 됩니다.</p>
                            </div>
                            <div className="help-item">
                                <strong>📦 추억함</strong>
                                <p>보내준 물건은 '추억함'에, 보류한 물건은 '보관함'에 저장됩니다.</p>
                            </div>
                            <div className="help-item">
                                <strong>☁️ 백업</strong>
                                <p>데이터는 기기에 저장됩니다. 설정에서 JSON 백업 후 다른 기기에서 복원하세요.</p>
                            </div>
                        </div>
                    )}

                    <button className="menu-item" onClick={() => { window.open('mailto:support@thanq.app'); showToast('📧 메일 앱이 열립니다'); }}>
                        <span>📧</span>
                        <span className="menu-item-label">문의하기</span>
                        <span className="menu-arrow">›</span>
                    </button>

                    <button className="menu-item" onClick={() => showToast('⭐ 감사합니다! (앱스토어 연동 예정)')}>
                        <span>⭐</span>
                        <span className="menu-item-label">앱 평가하기</span>
                        <span className="menu-arrow">›</span>
                    </button>

                    <button className="menu-item danger" onClick={handleLogout} style={{ marginTop: '10px' }}>
                        <span>👋</span>
                        <span className="menu-item-label">로그아웃</span>
                        <span className="menu-arrow">›</span>
                    </button>
                </div>
            </div>

            {/* 초기화 확인 모달 */}
            {showResetConfirm && (
                <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
                    <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
                        <span className="modal-icon">⚠️</span>
                        <h3>전체 데이터 초기화</h3>
                        <p>모든 물건, 미션, 뱃지, 설정이 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.</p>
                        <div className="modal-btns">
                            <button className="modal-btn cancel" onClick={() => setShowResetConfirm(false)}>취소</button>
                            <button className="modal-btn danger" onClick={handleReset}>초기화</button>
                        </div>
                    </div>
                </div>
            )}

            <p className="version-text">ThanQ v1.0.0 · Made with 🐱</p>
        </div>
    );
}
